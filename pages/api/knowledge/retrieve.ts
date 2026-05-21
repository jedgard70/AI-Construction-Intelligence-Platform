/**
 * POST /api/knowledge/retrieve
 *
 * Semantic + hybrid search over indexed documents.
 * 1. Embed query (Gemini text-embedding-004)
 * 2. Semantic search (cosine similarity)
 * 3. BM25 keyword scoring (hybrid)
 * 4. LLM reranking (optional, via Claude Haiku)
 *
 * Request body:
 *   query         string  — search query
 *   topK?         number  — results to return (default 5)
 *   rerank?       boolean — enable LLM reranking (slower, more accurate)
 *   semanticWeight? 0–1   — default 0.7
 *   filterDocIds? string[] — restrict to specific documents
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import {
  embedQuery,
  retrieve,
  getDocChunks,
  storeStats,
} from '../../../lib/knowledge-store'
import type { RetrievalResult } from '../../../lib/knowledge-store'
import { getActivePrompt, interpolate } from '../../../lib/prompt-governor'

export const config = { api: { bodyParser: { sizeLimit: '512kb' } } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    query,
    topK = 5,
    rerank = false,
    semanticWeight = 0.7,
    filterDocIds,
  } = req.body as {
    query: string
    topK?: number
    rerank?: boolean
    semanticWeight?: number
    filterDocIds?: string[]
  }

  if (!query?.trim()) return res.status(400).json({ error: 'query é obrigatória' })

  const stats = storeStats()
  if (stats.chunks === 0) {
    return res.status(200).json({ results: [], query, message: 'Nenhum documento indexado ainda.' })
  }

  const apiKey = process.env.GEMINI_API_KEY

  // 1. Embed query (graceful degradation: keyword-only if no API key)
  let queryEmbedding: number[] = []
  if (apiKey) {
    try {
      queryEmbedding = await embedQuery(query, apiKey)
    } catch {
      // Fall back to keyword-only search
    }
  }

  // 2 + 3. Semantic + hybrid retrieval
  const results = await retrieve(query, queryEmbedding, {
    topK: rerank ? topK * 3 : topK,
    semanticWeight: queryEmbedding.length > 0 ? semanticWeight : 0,
    keywordWeight: queryEmbedding.length > 0 ? (1 - semanticWeight) : 1,
    minScore: 0.05,
    filterDocIds,
  })

  // 4. Optional LLM reranking
  let finalResults = results
  if (rerank && results.length > 0 && process.env.ANTHROPIC_API_KEY) {
    finalResults = await rerankWithLLM(query, results, topK)
  } else {
    finalResults = results.slice(0, topK)
  }

  return res.status(200).json({
    results: finalResults.map(r => ({
      id: r.chunk.id,
      docId: r.chunk.docId,
      text: r.chunk.text,
      metadata: r.chunk.metadata,
      score: r.rerankScore ?? r.score,
      semanticScore: r.semanticScore,
      keywordScore: r.keywordScore,
      rerankScore: r.rerankScore,
    })),
    query,
    topK: finalResults.length,
    rerankApplied: rerank && !!process.env.ANTHROPIC_API_KEY,
    mode: queryEmbedding.length > 0 ? 'hybrid' : 'keyword_only',
    retrievedAt: new Date().toISOString(),
  })
}

// ─── LLM Reranking ────────────────────────────────────────────────────────────

async function rerankWithLLM(
  query: string,
  results: RetrievalResult[],
  topK: number
): Promise<RetrievalResult[]> {
  const promptTemplate = getActivePrompt('knowledge_rerank')
  const chunksText = results
    .map((r, i) => `[${i}] id="${r.chunk.id}"\n${r.chunk.text.slice(0, 400)}`)
    .join('\n\n---\n\n')

  const prompt = promptTemplate
    ? interpolate(promptTemplate.content, { query, chunks: chunksText })
    : `Rate relevance (0-1) of each chunk for query: "${query}"\n\n${chunksText}\n\nReturn JSON: {"rankings":[{"id":"...","relevance":0.0}]}`

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await resp.json()
    const text = data?.content?.[0]?.text ?? ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as {
      rankings: Array<{ id: string; relevance: number }>
    }

    // Merge rerank scores back
    const scoreMap = new Map(parsed.rankings.map(r => [r.id, r.relevance]))
    return results
      .map(r => ({ ...r, rerankScore: scoreMap.get(r.chunk.id) ?? r.score }))
      .sort((a, b) => (b.rerankScore ?? 0) - (a.rerankScore ?? 0))
      .slice(0, topK)
  } catch {
    return results.slice(0, topK)
  }
}
