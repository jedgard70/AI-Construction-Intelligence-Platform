# PACOTE MASTER 002-S3 — IMPLEMENTACAO

Data: 2026-05-30
Workspace oficial: `D:\AI-constr\AI-Construction-Intelligence-Platform`

## Objetivo

Implementar o Proposal Engine conforme plano aprovado (`PACOTE_MASTER_002_S3_PROPOSAL_ENGINE_PLANO.md`).

## Entregas

### 1. Banco

Migration criada:

- `supabase/migrations/20260530_master002_s3_proposal_engine.sql`

Estruturas implementadas:

- `public.proposals`
- `public.proposal_items`

Recursos aplicados:

- chaves e relacionamentos com `opportunities`, `services_catalog`, `opportunity_services`
- campos de versionamento (`version_number`, `parent_proposal_id`)
- campos de validade (`issued_at`, `valid_until`)
- campo de rastreio PDF (`pdf_path`)
- RLS e policies em `proposals` e `proposal_items`

### 2. APIs

Implementadas:

- `pages/api/crm/proposals/index.ts`
- `pages/api/crm/proposals/[id].ts`

Funcionalidades:

- `GET /api/crm/proposals`
- `POST /api/crm/proposals`
- `GET /api/crm/proposals/[id]`
- `PATCH /api/crm/proposals/[id]` com ações:
  - `set_status` (`draft|sent|viewed|approved|rejected|expired`)
  - `create_version` (`v1 -> v2 -> vN`)
  - `generate_pdf` (gera, armazena e retorna signed URL)

### 3. UI

Implementadas:

- `pages/crm/proposals/index.tsx` (`/crm/proposals`)
- `pages/crm/proposals/new.tsx` (`/crm/proposals/new`)

Fluxo entregue:

Opportunity -> gerar proposta -> gerar PDF -> alterar status -> versionar proposta.

### 4. PDF

Estratégia implementada:

- geração server-side de PDF simples;
- upload para bucket privado `project-files`;
- caminho versionado: `proposals/{proposal_id}/v{version}/proposal.pdf`;
- retorno de signed URL para download controlado.

### 5. Versionamento

Implementado:

- controle de `version_number`;
- vínculo com proposta origem em `parent_proposal_id`;
- nova versão cria novo registro e clona `proposal_items`.

### 6. Status comerciais

Implementado suporte para:

- `draft`
- `sent`
- `viewed`
- `approved`
- `rejected`
- `expired`

### 7. Integrações

Base utilizada exclusivamente:

- `opportunities`
- `services_catalog`
- `opportunity_services`
- `clients`

## Evidências

### Build

- `npm run build` executado com sucesso.
- rotas confirmadas no output:
  - `/api/crm/proposals`
  - `/api/crm/proposals/[id]`
  - `/crm/proposals`
  - `/crm/proposals/new`

### Banco

- existência confirmada via `to_regclass`:
  - `proposals`
  - `proposal_items`
- policies RLS ativas:
  - `proposals_select_scoped`
  - `proposals_insert_scoped`
  - `proposals_update_scoped`
  - `proposal_items_select_scoped`
  - `proposal_items_write_scoped`

## Riscos remanescentes

1. Validação E2E autenticada completa depende de janela sem rate-limit de auth para criação/login de usuários QA.
2. Pendência legada de versionamento de migration `20260529*` permanece fora do escopo S3.
3. PDF atual é formato técnico simples (suficiente para fluxo); versão visual premium pode ser evolução posterior.

## Checklist S3

- [x] Banco (`proposals`, `proposal_items`)
- [x] APIs (`/api/crm/proposals`, `/api/crm/proposals/[id]`)
- [x] UI (`/crm/proposals`, `/crm/proposals/new`)
- [x] PDF (geração + storage + signed URL)
- [x] Versionamento (`v1`, `v2`, `vN`)
- [x] Status comerciais
- [x] Integrações base exigidas
- [x] Build validado
