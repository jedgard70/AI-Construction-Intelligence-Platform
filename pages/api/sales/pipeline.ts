import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { trigger, project_id, assets } = req.body

  // Log the campaign launch (production would integrate CRM/email)
  console.log('[Sales Pipeline] Campaign launched:', { trigger, project_id, assets })

  // Simulate async campaign dispatch
  await new Promise(r => setTimeout(r, 200))

  return res.status(200).json({
    ok: true,
    message: 'Campaign dispatched successfully',
    trigger,
    project_id,
    channels: ['email', 'whatsapp', 'linkedin'],
    estimated_reach: 1200,
    launched_at: new Date().toISOString(),
  })
}
