# PR C2A — APIs CRM

Data: 2026-05-31  
Base: `origin/main` (após PR C1)

## APIs criadas

1. `pages/api/crm/_auth.ts`
2. `pages/api/crm/opportunities/index.ts`
3. `pages/api/crm/opportunities/[id].ts`
4. `pages/api/crm/pipeline-stages.ts`
5. `pages/api/crm/services.ts`
6. `pages/api/crm/opportunity-services.ts`
7. `pages/api/crm/proposals/index.ts`
8. `pages/api/crm/proposals/[id].ts`
9. `pages/api/crm/contracts.ts`
10. `pages/api/crm/contracts/[id].ts`

## Contrato padrão de resposta

Formato unificado:

- `success: boolean`
- `data: any | null`
- `error: { code, message, details? } | null`
- `pagination` quando endpoint de listagem

## Autenticação

- Todas as rotas exigem Bearer token.
- Sem token ou token inválido: `401`.
- Validação do usuário via `supabase.auth.getUser(token)` usando client com `anon key` + Authorization header.
- `service role` disponível apenas server-side no helper, sem exposição ao browser.

## Tabelas utilizadas

- `pipeline_stages`
- `opportunities`
- `services_catalog`
- `opportunity_services`
- `proposals`
- `proposal_items`
- `contracts`
- `contract_items`

## Operações por endpoint

### `pipeline-stages`
- `GET`: lista estágios (ativos por padrão).

### `opportunities`
- `GET /index`: lista com paginação e filtros.
- `POST /index`: cria opportunity.
- `GET /[id]`: detalhe.
- `PATCH|PUT /[id]`: atualiza campos permitidos.
- `DELETE /[id]`: soft-delete via status `lost`.

### `services`
- `GET`: lista services do catálogo (ativos por padrão), com paginação e filtros.

### `opportunity-services`
- `GET`: lista por `opportunity_id`.
- `POST`: adiciona/atualiza serviço na opportunity (`upsert` por `opportunity_id,service_id`).
- `DELETE`: remove por `id` ou por `(opportunity_id,service_id)`.

### `proposals`
- `GET /index`: lista propostas.
- `POST /index`: cria proposta e replica itens de `opportunity_services` para `proposal_items`.
- `GET /[id]`: detalhe + itens.
- `PATCH|PUT /[id]`: atualiza proposta.
- `PATCH|PUT /[id]` com `create_new_version=true`: cria versão nova e clona itens.

### `contracts`
- `GET /contracts`: lista contratos.
- `POST /contracts`: cria contrato a partir de proposal `approved` e clona itens para `contract_items`.
- `GET /contracts/[id]`: detalhe + itens.
- `PATCH|PUT /contracts/[id]`: atualiza status/assinatura/campos permitidos.

## Validações executadas

1. Build:
- `npm run build -- --webpack` ✅

2. Smoke sem token:
- `/api/crm/opportunities` -> `401`
- `/api/crm/services` -> `401`
- `/api/crm/proposals` -> `401`
- `/api/crm/contracts` -> `401`

3. Escopo de diff:
- apenas arquivos permitidos do PR C2A.

## Riscos (RLS / ENV)

1. RLS pode bloquear `insert/update` em dados sem ownership adequado (`owner_user_id`, `created_by`).
2. Se `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` faltarem no ambiente server, as rotas retornam erro explícito de configuração.
3. Algumas operações de clone (proposal->items / contract->items) dependem de permissões RLS coerentes em todas as tabelas relacionadas.

## Pendências para PR C2B (UI)

1. Implementar telas:
- `/crm/services`
- `/crm/proposals`
- `/crm/proposals/new`
- `/crm/contracts`
- `/crm/contracts/new`

2. Conectar UI ao contrato de resposta (`success/data/error/pagination`).
3. Testes E2E autenticados dos fluxos comerciais completos.

