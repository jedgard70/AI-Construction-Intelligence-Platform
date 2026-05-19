export const config = { api: { bodyParser: { sizeLimit: '4mb' } } }

const EXTRACT_PROMPT = `Analise esta conversa e extraia informações estruturadas para a memória do assistente.
Retorne SOMENTE JSON válido, sem markdown, sem explicação.

Estrutura esperada:
{
  "facts": ["fato objetivo sobre o usuário, empresa ou projeto (máx 15 palavras cada)"],
  "skills": ["nome curto de skill/tópico discutido (2-4 palavras)"],
  "preferences": {"key": "value"},
  "summary": "resumo da conversa em 1 frase"
}

Regras:
- facts: máximo 5 fatos novos e úteis (role, empresa, projetos, preferências técnicas, etc.)
- skills: máximo 6 skills/tópicos abordados (ex: "Cálculo EVM", "Norma NR-18", "Clash Detection BIM")
- preferences: apenas se o usuário demonstrou preferências claras (idioma, unidades, nível técnico)
- summary: 1 frase descrevendo o tema principal
- Se não há fatos relevantes, retorne arrays/objetos vazios`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key não configurada' })

  const { messages } = req.body
  if (!messages?.length) return res.status(400).json({ error: 'Mensagens obrigatórias' })

  // Converte mensagens para texto (ignora blocos de imagem)
  const transcript = messages.map(m => {
    const role = m.role === 'user' ? 'Usuário' : 'Assistente'
    const text = Array.isArray(m.content)
      ? m.content.filter(b => b.type === 'text').map(b => b.text).join(' ')
      : (typeof m.content === 'string' ? m.content : '')
    return text.trim() ? `${role}: ${text.trim()}` : null
  }).filter(Boolean).join('\n')

  if (transcript.length < 80) return res.status(200).json({ facts:[], skills:[], preferences:{}, summary:'' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `${EXTRACT_PROMPT}\n\nCONVERSA:\n${transcript.slice(0, 4000)}`
        }]
      })
    })

    const data = await response.json()
    const text = data?.content?.[0]?.text || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    const extracted = JSON.parse(clean)
    return res.status(200).json(extracted)
  } catch {
    return res.status(200).json({ facts:[], skills:[], preferences:{}, summary:'' })
  }
}
