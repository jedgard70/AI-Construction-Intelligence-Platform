import type { NextApiRequest, NextApiResponse } from 'next'
import { AUTONOMOUS_BACKLOG, getApprovalRequiredActions, getNextAutonomousBlock } from '../../../lib/autonomous/model'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const nextBlock = getNextAutonomousBlock()
  const approvalActions = getApprovalRequiredActions()

  return res.status(200).json({
    orchestrator: {
      mode: 'guided',
      autoExecuteDestructive: false,
      autoDeploy: false,
      autoMigrate: false,
    },
    nextBlock,
    backlog: AUTONOMOUS_BACKLOG,
    risks: AUTONOMOUS_BACKLOG.map(item => ({
      id: item.id,
      title: item.title,
      risk: item.risk,
      approvalRequired: item.approvalRequired,
    })),
    actionsRequiringApproval: approvalActions,
  })
}
