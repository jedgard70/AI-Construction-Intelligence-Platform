# PR1 — Backend Prompt Governance

Branch: `feature/help-ai-backend-prompt-governance`

## Objetivo
Mover governanca do Help AI para o backend, montando o `systemPrompt` em `pages/api/chat.js` a partir de `docs/copilot_knowledge/*`.

## Escopo aplicado
- `pages/api/chat.js`
- `docs/copilot_knowledge/APEX_COPILOT_SYSTEM_CONTEXT.md`
- `docs/copilot_knowledge/governance.md`
- `docs/copilot_knowledge/folder-structure.md`
- `docs/copilot_knowledge/permissions.md`
- `docs/copilot_knowledge/platform-status.md`

## Implementado
1. Leitura server-side dos arquivos de governanca.
2. Montagem de prompt base no backend (`policySystem`).
3. Fallback seguro se docs faltarem.
4. Bloqueio explicito para orientacao de clone novo da plataforma.
5. Regra de workspace oficial no retorno de bloqueio.
6. Compatibilidade com `promptKey` preservada (prompt versionado entra como complemento).
7. `inlineSystem` do cliente vira contexto adicional, nao dependencia.

## Nao alterado
- CRM/Revenue
- migrations/schema Supabase
- UX global
- AgentWindow/Mission Control
- package.json/package-lock

## Testes previstos
- build: `npm run build -- --webpack`
- pergunta: "Como esta a plataforma?"
- pergunta: "Crie um clone novo da plataforma"
- pergunta: "Onde fica o ebook?"
- fallback com ausencia de docs (sem quebrar API)
