# PR C2B — UI CRM

Data: 2026-05-31  
Base: `origin/main` (após PR C2A)

## Escopo implementado

1. `pages/crm/services.tsx`
2. `pages/crm/proposals/index.tsx`
3. `pages/crm/proposals/new.tsx`
4. `pages/crm/contracts/index.tsx`
5. `pages/crm/contracts/new.tsx`

## Regras atendidas

- Sem alteração de APIs.
- Sem migrations.
- Sem alterações em Revenue Engine.
- Sem alterações em Foundation.
- Sem alterações em `package.json`/lock.
- Sem uso de `tmp_*`, `supabase/.temp/`, `recovery` ou `Master.Package.Apex.original`.

## Integrações API usadas

- `GET /api/crm/services`
- `GET /api/crm/proposals`
- `POST /api/crm/proposals`
- `GET /api/crm/contracts`
- `POST /api/crm/contracts`

## Comportamento de segurança/erro

- As telas exigem Bearer token informado manualmente pelo usuário.
- Sem token: não finge sucesso; mostra erro explícito na UI.
- Falha de API: exibe mensagem de erro explícita.
- Sem dados fake mascarando resultado real.

## Compatibilidade visual

- Layout simples e consistente com páginas internas existentes.
- Navegação entre telas CRM via links diretos.

## Validações

1. Build:
- `npm run build -- --webpack` ✅

2. Smoke de rotas:
- `/crm/services` ✅
- `/crm/proposals` ✅
- `/crm/proposals/new` ✅
- `/crm/contracts` ✅
- `/crm/contracts/new` ✅

## Riscos / pendências

1. UX ainda depende de token manual; pode evoluir para sessão automática no fluxo autenticado da plataforma.
2. Sem E2E autenticado completo neste PR (recomendado no próximo ciclo).
3. Ajustes finos de experiência podem ser feitos depois sem alterar contrato das APIs.

