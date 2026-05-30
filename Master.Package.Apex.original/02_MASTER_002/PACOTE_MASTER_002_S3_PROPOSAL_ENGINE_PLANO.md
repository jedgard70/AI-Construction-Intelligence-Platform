# PACOTE MASTER 002-S3 — PROPOSAL ENGINE (PLANO TECNICO RESUMIDO)

Data: 2026-05-30
Status: **PRONTO PARA IMPLEMENTACAO** (revisao executiva concluida)

Base obrigatoria utilizada (exclusiva):

- `opportunities`
- `services_catalog`
- `opportunity_services`
- `clients`

## 1. Banco

Diretriz:

1. Reaproveitar `public.proposals` (prevista no schema 002-A).
2. Nao criar novas tabelas fora do 002-A.
3. Ler composicao comercial somente de `opportunity_services` + `services_catalog` + `opportunities` + `clients`.

Campos operacionais obrigatorios em `proposals` (sem retrabalho estrutural):

- `opportunity_id`
- `title`
- `proposal_type`
- `status`
- `total_value`
- `currency_code`
- `valid_until`
- `metadata`

Campos logicos obrigatorios no fluxo (via `metadata` nesta fase de plano):

- `issued_at` (timestamp de emissao)
- `version_number` (int incremental)
- `parent_proposal_id` (origem da revisao, quando aplicavel)
- `proposal_code` (codigo unico legivel)
- `pdf_versions` (historico de PDFs por versao)
- `commercial_events` (timeline de `sent/viewed/approved/rejected/expired`)

## 2. APIs

Superficie proposta (incremental em `/api/crm`):

1. `GET /api/crm/proposals?opportunity_id=`
2. `POST /api/crm/proposals`
3. `PATCH /api/crm/proposals/:id`
4. `POST /api/crm/proposals/:id/generate-pdf`
5. `POST /api/crm/proposals/:id/version`
6. `POST /api/crm/proposals/:id/mark-viewed`
7. `POST /api/crm/proposals/:id/approve`
8. `POST /api/crm/proposals/:id/reject`
9. `POST /api/crm/proposals/:id/expire`

Contratos de negocio:

- `POST /api/crm/proposals` consolida itens de `opportunity_services` e calcula `total_value`.
- `generate-pdf` gera snapshot imutavel da versao corrente.
- `version` cria nova revisao mantendo trilha completa (v1..vN).
- transicoes de status seguem maquina comercial definida abaixo.

## 3. Telas

1. `/crm/proposals`
- lista por oportunidade/cliente/status/validade.

2. `/crm/proposals/[id]`
- editor da proposta com:
  - dados da oportunidade
  - dados do cliente
  - itens da composicao (`opportunity_services`)
  - validade
  - historico de versoes
  - historico de PDFs

3. CTA em `/crm/services` e fluxo comercial:
- "Gerar Proposta" a partir da oportunidade ativa.

## 4. Integracoes

1. `opportunities`
- origem do contexto comercial e ownership.

2. `opportunity_services` + `services_catalog`
- origem dos itens, moeda e precificacao.

3. `clients`
- dados comerciais/identificacao do cliente.

4. Integracao futura com Contract Engine (sem retrabalho):
- evento `approved` habilita transicao `Proposal -> Contract`.
- `metadata.contract_handoff` prepara payload de conversao.

5. Integracao futura com Revenue Engine (sem retrabalho):
- `approved/rejected/expired` alimenta metrica de conversao.
- `total_value`, `currency_code`, `market_region`, `proposal_type` alimentam indicadores de receita.

## 5. Criterios de aceite

1. Usuario cria proposta a partir de oportunidade existente.
2. Proposta herda automaticamente multiplos servicos vinculados.
3. `total_value` da proposta reflete soma dos `line_total` dos servicos.
4. Proposta suporta versoes sequenciais `v1`, `v2`, `v3` ... `vN`.
5. Cada versao preserva historico (sem sobrescrita destrutiva).
6. PDF e gerado, armazenado, baixavel e versionado por revisao.
7. Codigo unico de proposta e gerado e rastreavel.
8. Tratamento de expiracao comercial ocorre por `valid_until`.

## 6. Dependencias

1. S2 operacional (`services_catalog` + `opportunity_services`).
2. RLS de `proposals` aplicada no padrao owner/projeto/elevado.
3. Token QA autenticado para teste E2E comercial.
4. Fluxo de storage privado habilitado para PDFs versionados.

## 7. Estrategia PDF

1. Geracao automatica server-side via `generate-pdf`.
2. Armazenamento em bucket privado (`project-files`) com caminho versionado:
- `projects/{project_id}/proposals/{proposal_id}/v{version_number}/proposal.pdf`
3. Download somente por signed URL.
4. Versionamento de PDF:
- cada revisao gera novo artefato (nao sobrescreve versao anterior).
- trilha salva em `metadata.pdf_versions[]` com:
  - `version_number`
  - `storage_path`
  - `signed_url_last_generated_at`
  - `checksum/hash` (quando disponivel)

## 8. Estrategia de versionamento

### 8.1 Regras de versao

- versao inicial: `version_number = 1` (`v1`)
- revisoes: `version_number = version_number + 1` (`v2`, `v3` ... `vN`)
- proposta revisada referencia origem via `parent_proposal_id`

### 8.2 Historico completo

- historico preservado por novos registros (append-only logico)
- nenhuma versao enviada/aprovada e sobrescrita
- timeline consolidada em `metadata.commercial_events`

### 8.3 Codigo unico da proposta

Padrao suportado:

- `PROP-2026-0001`
- `PROP-USA-0001`

Regra:

- `proposal_code` unico por proposta/versionamento rastreavel.
- unicidade garantida no fluxo de criacao (checagem server-side + retry em colisao).

## 9. Tipos de proposta (obrigatorios)

Suporte validado para:

- `engineering`
- `documentation`
- `bim`
- `render`
- `video`
- `marketing`
- `consulting`
- `platform_subscription`
- `ebook`

## 10. Status comerciais (obrigatorios)

Suporte validado para:

- `draft`
- `sent`
- `viewed`
- `approved`
- `rejected`
- `expired`

Transicoes recomendadas:

- `draft -> sent`
- `sent -> viewed`
- `viewed -> approved|rejected`
- `sent|viewed -> expired` (por data/rotina)

## 11. Validade e expiracao

Campos de controle:

- `issued_at` (metadata nesta fase)
- `valid_until`

Regras:

1. proposta nasce com `issued_at` e `valid_until`.
2. se `now() > valid_until` e status ainda comercial aberto, transita para `expired`.
3. aprovacao apos expiracao exige nova versao.

## Revisao executiva — Resultado oficial

Todos os itens obrigatorios foram contemplados neste plano.

**STATUS: PRONTO PARA IMPLEMENTACAO**

## Fora de escopo desta etapa

- implementar codigo
- gerar SQL
- alterar escopo
