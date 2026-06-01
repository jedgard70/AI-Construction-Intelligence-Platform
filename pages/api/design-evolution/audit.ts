import type { NextApiRequest, NextApiResponse } from 'next'
import { DESIGN_AUDIT_ITEMS, buildDesignAuditSummary } from '../../../lib/design-evolution/audit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({
    engine: {
      name: 'Design Evolution Engine',
      mode: 'advisory',
      autoApplyGlobalLayout: false,
    },
    summary: buildDesignAuditSummary(),
    recommendations: DESIGN_AUDIT_ITEMS,
  })
}
