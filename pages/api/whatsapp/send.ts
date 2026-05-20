import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { to, leadName, leadValue, leadEtapa, message } = req.body

  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    // Fallback: return whatsapp:// link for manual sending
    const text = encodeURIComponent(
      message || `*Apex Global — Lead Qualificado*\n\n👤 *${leadName}*\n💰 ${leadValue}\n📊 Etapa: ${leadEtapa}\n\nEntrar em contato para avançar no pipeline.`
    )
    const phone = to?.replace(/\D/g, '')
    return res.status(200).json({
      success: false,
      fallback: true,
      whatsappUrl: phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`,
      message: 'WHATSAPP_ACCESS_TOKEN not configured — use manual link'
    })
  }

  // Real WhatsApp Cloud API
  const body = {
    messaging_product: 'whatsapp',
    to: to?.replace(/\D/g, ''),
    type: 'text',
    text: {
      body: message || `*Apex Global — Lead Qualificado*\n\n👤 *${leadName}*\n💰 ${leadValue}\n📊 Etapa: ${leadEtapa}\n\nEntrar em contato para avançar no pipeline.`
    }
  }

  try {
    const resp = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    const data = await resp.json()
    if (!resp.ok) return res.status(resp.status).json({ error: data })
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
