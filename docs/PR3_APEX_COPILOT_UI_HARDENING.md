# PR3 — Apex Copilot UI Hardening

Branch: `feature/help-ai-copilot-ui-hardening`

## Objetivo
Endurecer o frontend do ApexCopilot para enviar apenas contexto mínimo ao backend, mantendo governança e role/seat enforcement exclusivamente no servidor.

## Arquivos alterados
- `components/ApexCopilot.tsx`

## O que foi removido do cliente
- Removido `SYSTEM` prompt hardcoded completo do frontend.

## Payload enviado ao backend
O cliente passou a enviar somente:
- `model`
- `max_tokens`
- `messages` com:
  - `Modo`
  - `Pagina atual`
  - `Pergunta`

Sem envio de governança extensa, permissões, role ou contexto sensível.

## Responsabilidade mantida no backend
- Montagem de `systemPrompt`
- Governança Apex
- Role/seat enforcement
- Bloqueios de segurança

## Melhorias de UX/erro
- Mensagem clara para falta de conexão.
- Mensagem clara para API indisponível/erro server-side.
- Tratamento de resposta vazia/inválida.
- Botão flutuante e experiência geral mantidos.

## Validações
- `npm run build -- --webpack`
- Rotas: `/dashboard`, `/mission-control`, `/crm/revenue`
- Perguntas no Help AI:
  - “Como está a plataforma?”
  - “Crie um clone novo da plataforma”
  - “Onde fica o ebook?”

## Riscos
- Dependência da disponibilidade do backend `/api/chat`.
- Em ambientes com chave Anthropic inválida, respostas funcionais podem falhar por autenticação externa.

## Pendências
- Opcional: padronizar códigos de erro do backend para mapeamento visual mais rico no frontend.
