/**
 * POST /api/infrastructure/edge-sync
 *
 * Edge Computing Layer — recebe payloads compactados do canteiro (nós de borda)
 * e os persiste no Cloud Core para processamento posterior.
 *
 * Workloads suportados:
 *   drone_point_cloud_compilation | real_time_iot_filtering | local_clash_detection_cache
 *
 * Protocolo: compressão sem perdas + envio assíncrono do JSON processado.
 */

const VALID_WORKLOADS = [
  'drone_point_cloud_compilation',
  'real_time_iot_filtering',
  'local_clash_detection_cache',
]

function validate(body) {
  const errors = []
  if (!body.edge_node_id) errors.push('edge_node_id é obrigatório')
  if (!body.project_id) errors.push('project_id é obrigatório')
  if (!body.workload_type || !VALID_WORKLOADS.includes(body.workload_type)) {
    errors.push(`workload_type inválido. Use: ${VALID_WORKLOADS.join(', ')}`)
  }
  if (!body.payload || typeof body.payload !== 'object') {
    errors.push('payload (objeto com dados do workload) é obrigatório')
  }
  if (typeof body.compressed !== 'boolean') {
    errors.push('compressed (boolean) é obrigatório')
  }
  return errors
}

function buildSyncRecord(body) {
  return {
    sync_id: `SYNC-${Date.now()}`,
    edge_node_id: body.edge_node_id,
    project_id: body.project_id,
    workload_type: body.workload_type,
    compressed: body.compressed,
    payload_size_bytes: JSON.stringify(body.payload).length,
    payload: body.payload,
    received_at: new Date().toISOString(),
    sync_status: 'queued_for_cloud_core',
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const errors = validate(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ status: 'validation_error', errors })
  }

  const record = buildSyncRecord(req.body)

  // Forward to cloud core webhook if configured
  const cloudCoreUrl = process.env.CLOUD_CORE_SYNC_URL
  let forwardResult = { skipped: true, reason: 'CLOUD_CORE_SYNC_URL não configurada' }

  if (cloudCoreUrl) {
    try {
      const resp = await fetch(cloudCoreUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
      forwardResult = { ok: resp.ok, status: resp.status }
    } catch (err) {
      forwardResult = { ok: false, error: err.message }
    }
  }

  return res.status(201).json({
    status: 'success',
    message: `Payload de ${req.body.workload_type} recebido do nó ${req.body.edge_node_id}`,
    sync_record: record,
    cloud_core_forward: forwardResult,
  })
}
