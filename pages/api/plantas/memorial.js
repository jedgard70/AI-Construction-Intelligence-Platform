/**
 * POST /api/plantas/memorial
 *
 * Gera o Memorial Descritivo técnico de uma planta baixa a partir dos
 * achados IA e dados dos ambientes. Usa Claude (Haiku por padrão para
 * velocidade) e retorna o texto formatado.
 *
 * Body esperado:
 * {
 *   folha:    string   — ex: "A-201"
 *   projeto:  string   — ex: "Vista Tower · Pavimento 04"
 *   escala:   string   — ex: "1:100"
 *   rev:      string   — ex: "Rev 04 · 18 Mai 26"
 *   rooms:    Array<{ id, name, area }>
 *   findings: Array<{ id, cat, sev, title, body, ref, room, status }>
 * }
 */

import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada.' })
  }

  const { folha = 'A-201', projeto = '', escala = '1:100', rev = '', rooms = [], findings = [] } = req.body

  // Construção do prompt técnico
  const sevLabel = s => s === 'high' ? 'ALTA' : s === 'med' ? 'MÉDIA' : 'BAIXA'
  const catLabel = c => ({
    code: 'Conformidade de Código',
    clash: 'Conflito BIM',
    missing: 'Dado Ausente',
    accessibility: 'Acessibilidade',
    dimension: 'Dimensão',
  })[c] || c

  const roomsSummary = rooms.map(r => `  • ${r.id} — ${r.name}: ${r.area}`).join('\n')
  const findingsSummary = findings.map(f =>
    `  [${f.id}] ${catLabel(f.cat)} · Sev. ${sevLabel(f.sev)} · ${f.room}\n` +
    `    Título: ${f.title}\n` +
    `    Detalhe: ${f.body}\n` +
    `    Referência: ${f.ref} · Status: ${f.status}`
  ).join('\n\n')

  const highCount = findings.filter(f => f.sev === 'high').length
  const medCount = findings.filter(f => f.sev === 'med').length
  const lowCount = findings.filter(f => f.sev === 'low').length
  const avgConf = findings.length
    ? (findings.reduce((a, f) => a + f.conf, 0) / findings.length * 100).toFixed(0)
    : 0

  const systemPrompt = `Você é um engenheiro civil especialista em coordenação BIM e revisão de projetos.
Redija memoriais descritivos técnicos profissionais em português do Brasil.
Seja preciso, objetivo e use terminologia técnica da ABNT.
Estruture o texto com seções numeradas. Nunca invente dados não fornecidos.`

  const userPrompt = `Gere o MEMORIAL DESCRITIVO completo para a planta baixa abaixo.

DADOS DA FOLHA:
  Folha: ${folha}  |  Projeto: ${projeto}  |  Escala: ${escala}  |  ${rev}

RESUMO DE AMBIENTES:
${roomsSummary}

ACHADOS DA ANÁLISE BIM (${findings.length} total — ${highCount} alta, ${medCount} média, ${lowCount} baixa sev.):
  Confiança média IA: ${avgConf}%

${findingsSummary}

ESTRUTURA DO MEMORIAL DESCRITIVO (use exatamente estas seções):

1. OBJETO
   Descreva o escopo da revisão e o objetivo do documento.

2. DADOS DO PROJETO
   Liste as informações técnicas da folha (número, escala, revisão, projeto).

3. DESCRIÇÃO DOS AMBIENTES
   Descreva cada ambiente com área, função e características principais.

4. ACHADOS DA ANÁLISE BIM
   4.1. Achados Críticos (Alta Severidade) — discuta cada um com referência normativa.
   4.2. Achados de Média Severidade — descreva o impacto e ação recomendada.
   4.3. Achados de Baixa Severidade — mencione brevemente.

5. ANÁLISE NORMATIVA
   Cite as normas relevantes (NBR 9077, NBR 9050, etc.) e o grau de conformidade atual.

6. RECOMENDAÇÕES E PRÓXIMOS PASSOS
   Liste ações prioritárias em ordem de urgência com prazo sugerido.

7. CONCLUSÃO
   Parecer técnico final sobre a planta.

Rascunhe um memorial completo, formal e profissional. Máximo 800 palavras.`

  try {
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: process.env.MEMORIAL_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const memorial = response.content?.[0]?.text || ''

    // Rastrear custo
    const usage = response.usage
    if (usage) {
      try {
        const { recordApiCall } = await import('../../../lib/observability')
        await recordApiCall({
          endpoint: '/api/plantas/memorial',
          model: response.model,
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          userId: req.headers['x-user-id'] || 'anonymous',
          taskType: 'memorial_descritivo',
        })
      } catch (_) { /* observability não bloqueia */ }
    }

    return res.status(200).json({
      memorial,
      model: response.model,
      tokens: usage,
      folha,
      projeto,
    })

  } catch (err) {
    console.error('[memorial] Erro:', err?.message || err)
    const msg = err?.message || 'Erro interno ao gerar memorial.'
    return res.status(500).json({ error: msg })
  }
}
