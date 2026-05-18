/**
 * POST /api/juridico/due-diligence/relatorio
 *
 * Gera relatório automático de due diligence jurídica e financeira
 * para investidores em projetos de construção/imobiliário.
 *
 * Analisa:
 *   - situação jurídica da empresa e do projeto
 *   - regularidade fiscal e trabalhista
 *   - riscos contratuais e passivos ocultos
 *   - conformidade documental
 *   - recomendação de investimento
 */

const PROJECT_STAGES = [
  'pre_lancamento',
  'lancamento',
  'em_construcao',
  'concluido',
  'retrofit',
]

function validate(body) {
  const errors = []
  if (!body.project_id) errors.push('project_id é obrigatório')
  if (!body.investor_id) errors.push('investor_id é obrigatório')
  if (!body.project_stage || !PROJECT_STAGES.includes(body.project_stage)) {
    errors.push(`project_stage inválido. Use: ${PROJECT_STAGES.join(', ')}`)
  }
  if (!body.project_data || typeof body.project_data !== 'object') {
    errors.push('project_data (objeto com dados do projeto) é obrigatório')
  }
  return errors
}

function buildPrompt(body) {
  return `Você é o Investment_Analyst_AI com função de due diligence jurídica da AI Construction Intelligence Platform.

Gere um relatório completo de due diligence para um investidor considerando os dados abaixo.

Retorne JSON com estrutura exata:
{
  "headline": "string — título executivo do relatório",
  "data_relatorio": "string",
  "situacao_juridica": {
    "status": "regular|irregular|pendente",
    "certidoes": [
      { "tipo": "string", "situacao": "ok|pendente|negativa", "observacao": "string" }
    ],
    "litigios_identificados": ["string"],
    "passivos_ocultos_estimados": "string"
  },
  "regularidade_fiscal_trabalhista": {
    "status": "regular|irregular|pendente",
    "pontos_atencao": ["string"]
  },
  "analise_documental": {
    "documentos_ok": ["string"],
    "documentos_pendentes": ["string"],
    "documentos_criticos_ausentes": ["string"]
  },
  "riscos_identificados": [
    {
      "risco": "string",
      "categoria": "juridico|financeiro|tecnico|ambiental|trabalhista",
      "probabilidade": "alta|media|baixa",
      "impacto": "alto|medio|baixo",
      "mitigacao": "string"
    }
  ],
  "indicadores_financeiros": {
    "vgv_estimado": "string",
    "roi_projetado": "string",
    "cap_rate": "string",
    "payback_estimado": "string"
  },
  "score_due_diligence": 0,
  "rating": "A|B|C|D",
  "recomendacao": "investir|investir_com_ressalvas|aguardar_regularizacao|nao_investir",
  "condicoes_para_investimento": ["string"],
  "proximos_passos": ["string"]
}

score_due_diligence: 0-100.
rating: A (excelente), B (bom), C (atenção), D (alto risco).

PROJETO: ${body.project_id}
ETAPA: ${body.project_stage}
INVESTIDOR: ${body.investor_id}

DADOS DO PROJETO:
${JSON.stringify(body.project_data, null, 2)}`
}

async function generateWithAI(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: buildPrompt(body) }],
      }),
    })
    const data = await resp.json()
    const text = data?.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

function fallbackReport(body) {
  return {
    headline: `Due Diligence — ${body.project_id} (análise IA indisponível)`,
    data_relatorio: new Date().toISOString(),
    situacao_juridica: {
      status: 'pendente',
      certidoes: [],
      litigios_identificados: [],
      passivos_ocultos_estimados: 'indisponível',
    },
    regularidade_fiscal_trabalhista: {
      status: 'pendente',
      pontos_atencao: ['Configure ANTHROPIC_API_KEY para análise automática'],
    },
    analise_documental: {
      documentos_ok: [],
      documentos_pendentes: [],
      documentos_criticos_ausentes: ['Análise indisponível'],
    },
    riscos_identificados: [],
    indicadores_financeiros: {
      vgv_estimado: body.project_data?.vgv ?? 'não informado',
      roi_projetado: body.project_data?.expected_roi ? `${body.project_data.expected_roi}%` : 'não informado',
      cap_rate: 'não calculado',
      payback_estimado: 'não calculado',
    },
    score_due_diligence: 0,
    rating: 'C',
    recomendacao: 'aguardar_regularizacao',
    condicoes_para_investimento: ['Configure ANTHROPIC_API_KEY para gerar análise completa'],
    proximos_passos: ['Configurar variáveis de ambiente', 'Reprocessar due diligence'],
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

  const report = (await generateWithAI(req.body)) ?? fallbackReport(req.body)

  return res.status(200).json({
    status: 'success',
    agent: 'Investment_Analyst_AI',
    report_id: `DD-${Date.now()}`,
    project_id: req.body.project_id,
    investor_id: req.body.investor_id,
    project_stage: req.body.project_stage,
    generated_at: new Date().toISOString(),
    report,
  })
}
