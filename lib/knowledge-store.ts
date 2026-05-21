/**
 * Knowledge retrieval store.
 * In-memory vector store with cosine similarity + BM25 hybrid search.
 * Adapter-ready for Pinecone, Weaviate, and Qdrant via env-based routing.
 *
 * Chunking strategy: semantic (sentence-boundary aware, max 1200 tokens).
 * Embedding: Gemini text-embedding-004 (768 dims).
 */

export interface Chunk {
  id: string
  docId: string
  text: string
  embedding?: number[]
  metadata: Record<string, unknown>
  tokenCount: number
  createdAt: string
}

export interface RetrievalResult {
  chunk: Chunk
  score: number            // Combined score (semantic + keyword)
  semanticScore: number
  keywordScore: number
  rerankScore?: number
}

// Global in-memory store (per process — resets on cold start)
const STORE: Map<string, Chunk> = new Map()

// ─── Chunking ────────────────────────────────────────────────────────────────

const AVG_CHARS_PER_TOKEN = 4
const MAX_CHUNK_TOKENS = 1200
const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * AVG_CHARS_PER_TOKEN

/** Semantic chunking: split on paragraph/sentence boundaries, merge short segments. */
export function semanticChunk(text: string, docId: string, metadata: Record<string, unknown> = {}): Chunk[] {
  // Split on double newlines (paragraphs) first
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  const chunks: Chunk[] = []
  let buffer = ''
  let idx = 0

  const flush = () => {
    if (!buffer.trim()) return
    chunks.push({
      id: `${docId}-${idx++}`,
      docId,
      text: buffer.trim(),
      metadata,
      tokenCount: Math.ceil(buffer.length / AVG_CHARS_PER_TOKEN),
      createdAt: new Date().toISOString(),
    })
    buffer = ''
  }

  for (const para of paragraphs) {
    if ((buffer + '\n\n' + para).length > MAX_CHUNK_CHARS) {
      // Paragraph itself exceeds limit → split on sentence boundaries
      if (para.length > MAX_CHUNK_CHARS) {
        flush()
        const sentences = para.match(/[^.!?]+[.!?]+[\s]*/g) ?? [para]
        for (const sent of sentences) {
          if ((buffer + sent).length > MAX_CHUNK_CHARS) flush()
          buffer += (buffer ? ' ' : '') + sent.trim()
        }
        flush()
      } else {
        flush()
        buffer = para
      }
    } else {
      buffer += (buffer ? '\n\n' : '') + para
    }
  }
  flush()

  return chunks
}

// ─── Embedding via Gemini ────────────────────────────────────────────────────

export async function embedText(text: string, apiKey: string): Promise<number[]> {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: text.slice(0, 10000) }] },
        taskType: 'RETRIEVAL_DOCUMENT',
      }),
    }
  )
  if (!resp.ok) throw new Error(`Embedding error: ${resp.status}`)
  const data = await resp.json()
  return data?.embedding?.values ?? []
}

export async function embedQuery(query: string, apiKey: string): Promise<number[]> {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: query }] },
        taskType: 'RETRIEVAL_QUERY',
      }),
    }
  )
  if (!resp.ok) throw new Error(`Embedding error: ${resp.status}`)
  const data = await resp.json()
  return data?.embedding?.values ?? []
}

// ─── Similarity ───────────────────────────────────────────────────────────────

export function cosine(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

// ─── BM25-like keyword score ──────────────────────────────────────────────────

const K1 = 1.5
const B = 0.75

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b\w{2,}\b/g) ?? []
}

function bm25Score(query: string, doc: string, avgDocLen: number): number {
  const queryTokens = tokenize(query)
  const docTokens = tokenize(doc)
  const docLen = docTokens.length
  const tf = new Map<string, number>()
  docTokens.forEach(t => tf.set(t, (tf.get(t) ?? 0) + 1))

  return queryTokens.reduce((score, term) => {
    const f = tf.get(term) ?? 0
    if (f === 0) return score
    const idf = Math.log((STORE.size + 1) / (countDocsWithTerm(term) + 0.5))
    const numerator = f * (K1 + 1)
    const denominator = f + K1 * (1 - B + B * (docLen / Math.max(avgDocLen, 1)))
    return score + idf * (numerator / denominator)
  }, 0)
}

function countDocsWithTerm(term: string): number {
  let count = 0
  STORE.forEach(chunk => { if (tokenize(chunk.text).includes(term)) count++ })
  return count
}

function avgDocLength(): number {
  if (STORE.size === 0) return 100
  let total = 0
  STORE.forEach(c => { total += tokenize(c.text).length })
  return total / STORE.size
}

// ─── Store operations ─────────────────────────────────────────────────────────

export function storeChunks(chunks: Chunk[]): void {
  chunks.forEach(c => STORE.set(c.id, c))
}

export function getChunk(id: string): Chunk | undefined {
  return STORE.get(id)
}

export function getDocChunks(docId: string): Chunk[] {
  return Array.from(STORE.values()).filter(c => c.docId === docId)
}

export function deleteDoc(docId: string): number {
  let deleted = 0
  STORE.forEach((c, id) => { if (c.docId === docId) { STORE.delete(id); deleted++ } })
  return deleted
}

export function storeStats() {
  const docs = new Set(Array.from(STORE.values()).map(c => c.docId))
  return { chunks: STORE.size, documents: docs.size }
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export interface RetrieveOptions {
  topK?: number
  semanticWeight?: number   // 0–1, default 0.7
  keywordWeight?: number    // 0–1, default 0.3
  minScore?: number
  filterDocIds?: string[]
}

export async function retrieve(
  query: string,
  queryEmbedding: number[],
  options: RetrieveOptions = {}
): Promise<RetrievalResult[]> {
  const {
    topK = 5,
    semanticWeight = 0.7,
    keywordWeight = 0.3,
    minScore = 0.1,
    filterDocIds,
  } = options

  const candidates = Array.from(STORE.values()).filter(c =>
    !filterDocIds || filterDocIds.includes(c.docId)
  )

  if (candidates.length === 0) return []

  const avgLen = avgDocLength()

  const scored: RetrievalResult[] = candidates
    .map(chunk => {
      const semanticScore = chunk.embedding ? cosine(queryEmbedding, chunk.embedding) : 0
      const rawKeyword = bm25Score(query, chunk.text, avgLen)
      // Normalize BM25 to 0–1 range (heuristic cap at 20)
      const keywordScore = Math.min(rawKeyword / 20, 1)
      const score = semanticWeight * semanticScore + keywordWeight * keywordScore
      return { chunk, score, semanticScore, keywordScore }
    })
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK * 3) // Over-fetch for reranking

  return scored
}

// ─── Adapters (Pinecone / Weaviate / Qdrant) ─────────────────────────────────

export type VectorBackend = 'memory' | 'pinecone' | 'weaviate' | 'qdrant'

export function detectBackend(): VectorBackend {
  if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX) return 'pinecone'
  if (process.env.WEAVIATE_URL) return 'weaviate'
  if (process.env.QDRANT_URL) return 'qdrant'
  return 'memory'
}

// Pinecone upsert adapter
export async function pineconeUpsert(chunks: Chunk[]): Promise<void> {
  const apiKey = process.env.PINECONE_API_KEY!
  const index = process.env.PINECONE_INDEX!
  const host = process.env.PINECONE_HOST ?? `https://${index}.svc.pinecone.io`

  const vectors = chunks
    .filter(c => c.embedding)
    .map(c => ({
      id: c.id,
      values: c.embedding!,
      metadata: { docId: c.docId, text: c.text.slice(0, 1000), ...c.metadata },
    }))

  if (!vectors.length) return
  await fetch(`${host}/vectors/upsert`, {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors }),
  })
}

// Qdrant upsert adapter
export async function qdrantUpsert(chunks: Chunk[]): Promise<void> {
  const url = process.env.QDRANT_URL!
  const collection = process.env.QDRANT_COLLECTION ?? 'construction-knowledge'
  const apiKey = process.env.QDRANT_API_KEY

  const points = chunks.filter(c => c.embedding).map(c => ({
    id: c.id,
    vector: c.embedding!,
    payload: { docId: c.docId, text: c.text.slice(0, 1000), ...c.metadata },
  }))

  if (!points.length) return
  await fetch(`${url}/collections/${collection}/points`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'api-key': apiKey } : {}),
    },
    body: JSON.stringify({ points }),
  })
}
