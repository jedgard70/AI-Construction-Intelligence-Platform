/**
 * GET    /api/prompts              — list all prompt keys + active versions
 * GET    /api/prompts?key=xxx      — list all versions for a key
 * POST   /api/prompts              — register new prompt version
 * PATCH  /api/prompts              — rollback to a specific version
 * GET    /api/prompts?action=report — optimization report
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import {
  registerPrompt,
  getActivePrompt,
  listPromptVersions,
  listAllPromptKeys,
  rollback,
  getOptimizationReport,
  scorePromptPerformance,
} from '../../../lib/prompt-governor'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { key, action } = req.query

  if (req.method === 'GET') {
    if (action === 'report') {
      return res.status(200).json(getOptimizationReport())
    }

    if (key) {
      const versions = listPromptVersions(key as string)
      const active = getActivePrompt(key as string)
      return res.status(200).json({
        promptKey: key,
        activeVersion: active?.version,
        versions: versions.map(v => ({
          ...v,
          performanceScore: scorePromptPerformance(v),
        })),
      })
    }

    const keys = listAllPromptKeys()
    return res.status(200).json({
      prompts: keys.map(k => {
        const active = getActivePrompt(k)
        return {
          promptKey: k,
          activeVersion: active?.version,
          uses: active?.metrics.uses ?? 0,
          successRate: active?.metrics.successRate ?? 0,
          hallucinationRate: active?.metrics.hallucinationRate ?? 0,
        }
      }),
    })
  }

  if (req.method === 'POST') {
    const { promptKey, content, description, systemContent, version, author, tags } = req.body
    if (!promptKey || !content || !description) {
      return res.status(400).json({ error: 'promptKey, content e description são obrigatórios' })
    }
    const pv = registerPrompt(promptKey, content, description, { systemContent, version, author, tags, setActive: true })
    return res.status(201).json(pv)
  }

  if (req.method === 'PATCH') {
    const { promptKey, toVersion } = req.body
    if (!promptKey || !toVersion) {
      return res.status(400).json({ error: 'promptKey e toVersion são obrigatórios' })
    }
    const rolled = rollback(promptKey, toVersion)
    if (!rolled) return res.status(404).json({ error: 'Versão não encontrada' })
    return res.status(200).json({ rolledBack: true, ...rolled })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
