/**
 * GET /api/juridico/assinatura/status?signature_request_id=SR-xxx
 *
 * Consulta o status de uma requisição de assinatura no Lumin.
 */

const LUMIN_API = process.env.LUMIN_API_URL || 'https://api.lumin.com'
const LUMIN_KEY = process.env.LUMIN_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { signature_request_id } = req.query
  if (!signature_request_id) {
    return res.status(400).json({ status: 'validation_error', errors: ['signature_request_id é obrigatório'] })
  }

  if (!LUMIN_KEY) {
    return res.status(200).json({
      status: 'success',
      simulated: true,
      signature_request_id,
      lumin_status: 'pending',
      message: 'LUMIN_API_KEY não configurada — status simulado',
    })
  }

  try {
    const resp = await fetch(`${LUMIN_API}/v1/signature-requests/${signature_request_id}`, {
      headers: { Authorization: `Bearer ${LUMIN_KEY}` },
    })

    if (!resp.ok) {
      const err = await resp.text()
      return res.status(resp.status).json({ status: 'error', message: err })
    }

    const data = await resp.json()
    return res.status(200).json({ status: 'success', signature_request_id, lumin: data })
  } catch (err) {
    return res.status(502).json({ status: 'error', message: err.message })
  }
}
