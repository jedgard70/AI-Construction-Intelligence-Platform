/**
 * POST /api/juridico/assinatura/enviar
 *
 * Envia contrato para assinatura digital via Lumin.
 * Suporta assinatura simultânea (SAME_TIME) ou em ordem sequencial (ORDER).
 *
 * Body:
 * {
 *   contract_id:   string,
 *   project_id:    string,
 *   title:         string,
 *   document_url:  string   — URL pública do PDF do contrato
 *   signers: [
 *     { name, email, group? }   — group obrigatório se signing_type = ORDER
 *   ],
 *   viewers?:      [{ name, email }],
 *   signing_type?: "SAME_TIME" | "ORDER"   (default: SAME_TIME)
 *   expires_in_days?: number               (default: 30)
 * }
 */

const LUMIN_API = process.env.LUMIN_API_URL || 'https://api.lumin.com'
const LUMIN_KEY = process.env.LUMIN_API_KEY

function validate(body) {
  const errors = []
  if (!body.contract_id) errors.push('contract_id é obrigatório')
  if (!body.project_id) errors.push('project_id é obrigatório')
  if (!body.title) errors.push('title é obrigatório')
  if (!body.document_url) errors.push('document_url (URL pública do PDF) é obrigatório')

  if (!Array.isArray(body.signers) || body.signers.length === 0) {
    errors.push('signers deve ser array com ao menos 1 assinante')
  } else {
    body.signers.forEach((s, i) => {
      if (!s.name) errors.push(`signers[${i}].name é obrigatório`)
      if (!s.email) errors.push(`signers[${i}].email é obrigatório`)
      if (body.signing_type === 'ORDER' && !s.group) {
        errors.push(`signers[${i}].group é obrigatório quando signing_type = ORDER`)
      }
    })
  }

  if (body.signing_type && !['SAME_TIME', 'ORDER'].includes(body.signing_type)) {
    errors.push('signing_type inválido. Use: SAME_TIME, ORDER')
  }

  if (body.expires_in_days !== undefined) {
    if (typeof body.expires_in_days !== 'number' || body.expires_in_days < 1) {
      errors.push('expires_in_days deve ser número >= 1')
    }
  }

  return errors
}

async function sendToLumin(body) {
  const expiresInDays = body.expires_in_days ?? 30
  const signingType = body.signing_type ?? 'SAME_TIME'

  const payload = {
    signature_request_title: body.title,
    file_url: body.document_url,
    signers: body.signers.map(s => ({
      name: s.name,
      email_address: s.email,
      ...(signingType === 'ORDER' && s.group ? { group: s.group } : {}),
    })),
    signing_type: signingType,
    expires_at: { days_from_now: expiresInDays },
    ...(body.viewers?.length ? {
      viewers: body.viewers.map(v => ({ name: v.name, email_address: v.email })),
    } : {}),
    custom_email: {
      title: body.title,
      subject_name: `Assinatura requerida — Projeto ${body.project_id}`,
    },
  }

  if (!LUMIN_KEY) {
    return {
      simulated: true,
      signature_request_id: `SIM-SR-${Date.now()}`,
      status: 'pending',
      title: payload.signature_request_title,
      signing_url: null,
      message: 'LUMIN_API_KEY não configurada — requisição simulada',
    }
  }

  const resp = await fetch(`${LUMIN_API}/v1/signature-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LUMIN_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Lumin API error ${resp.status}: ${err}`)
  }

  return resp.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ status: 'validation_error', errors })
  }

  try {
    const luminResult = await sendToLumin(req.body)

    return res.status(201).json({
      status: 'success',
      contract_id: req.body.contract_id,
      project_id: req.body.project_id,
      signing_type: req.body.signing_type ?? 'SAME_TIME',
      signers_count: req.body.signers.length,
      sent_at: new Date().toISOString(),
      lumin: luminResult,
    })
  } catch (err) {
    return res.status(502).json({
      status: 'error',
      message: err.message,
    })
  }
}
