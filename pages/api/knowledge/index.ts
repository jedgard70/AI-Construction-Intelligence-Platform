/**
 * POST /api/knowledge/index
 *
 * Ingest documents into the knowledge store.
 * 1. Semantic chunking (max 1200 tokens, sentence-boundary aware)
 * 2. Gemini text-embedding-004 embeddings (768-dim)
 * 3. Store in-memory + route to Pinecone/Qdrant if configured
 *
 * DELETE /api/knowledge/index?docId=xxx — remove a document
 * GET  /api/knowledge/index            — stats
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import {
  semanticChunk,
  embedText,
  storeChunks,
  deleteDoc,
  storeStats,
  pineconeUpsert,
  qdrantUpsert,
  detectBackend,
} from '../../../lib/knowledge-store'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ ...storeStats(), backend: detectBackend() })
  }

  if (req.method === 'DELETE') {
    const docId = req.query.docId as string
    if (!docId) return res.status(400).json({ error: 'docId é obrigatório' })
    const deleted = deleteDoc(docId)
    return res.status(200).json({ deleted, docId })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { documents } = req.body as {
    documents: Array<{
      docId: string
      text: string
      metadata?: Record<string, unknown>
    }>
  }

  if (!Array.isArray(documents) || !documents.length) {
    return res.status(400).json({ error: 'documents array é obrigatório' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  const results: Array<{ docId: string; chunks: number; embedded: boolean; error?: string }> = []

  for (const doc of documents) {
    if (!doc.docId || !doc.text) {
      results.push({ docId: doc.docId ?? 'unknown', chunks: 0, embedded: false, error: 'docId e text são obrigatórios' })
      continue
    }

    try {
      // 1. Semantic chunking
      const chunks = semanticChunk(doc.text, doc.docId, doc.metadata ?? {})

      // 2. Embed each chunk (batched, with fallback if API key missing)
      let embedded = false
      if (apiKey) {
        for (const chunk of chunks) {
          try {
            chunk.embedding = await embedText(chunk.text, apiKey)
            embedded = true
          } catch {
            // Continue without embedding — keyword search still works
          }
        }
      }

      // 3. Store
      storeChunks(chunks)

      // 4. Route to external vector DB if configured
      const backend = detectBackend()
      if (backend === 'pinecone') await pineconeUpsert(chunks).catch(() => {})
      if (backend === 'qdrant') await qdrantUpsert(chunks).catch(() => {})

      results.push({ docId: doc.docId, chunks: chunks.length, embedded })
    } catch (err: unknown) {
      results.push({
        docId: doc.docId,
        chunks: 0,
        embedded: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return res.status(200).json({
    indexed: results,
    stats: storeStats(),
    backend: detectBackend(),
    indexedAt: new Date().toISOString(),
  })
}
