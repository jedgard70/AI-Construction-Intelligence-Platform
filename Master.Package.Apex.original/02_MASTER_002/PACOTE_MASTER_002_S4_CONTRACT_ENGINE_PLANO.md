# PACOTE MASTER 002-S4 — CONTRACT ENGINE (PLANEJAMENTO TECNICO)

Data: 2026-05-30
Status: **PRONTO PARA IMPLEMENTACAO** (revisao executiva concluida)

Base obrigatoria utilizada (exclusiva):

- `proposals`
- `proposal_items`
- `opportunities`
- `clients`
- `projects`

## 1. Banco

Diretriz de nao duplicacao:

1. Reaproveitar a base comercial existente (`proposals`, `proposal_items`) como origem juridico-comercial.
2. Criar camada de contratos desacoplada, mas referenciada por `proposal_id` e contexto de `opportunity/client/project`.
3. Nao recriar dados de cliente/projeto em tabela nova; somente chaves de referencia.

Modelo alvo (planejamento):

- `contracts`
  - `id`
  - `proposal_id` (FK -> proposals.id)
  - `opportunity_id` (FK -> opportunities.id)
  - `client_id` (FK -> clients.id)
  - `project_id` (FK -> projects.id, nullable ate ativacao)
  - `contract_code` (unico)
  - `title`
  - `status` (`draft|sent|signed|active|completed|cancelled`)
  - `version_number`
  - `parent_contract_id` (FK self, nullable)
  - `signed_at` (nullable)  // Revenue: signed_date
  - `effective_start_date` (nullable)  // Revenue: start_date
  - `effective_end_date` (nullable)
  - `total_value`  // Revenue: contract_value
  - `currency_code`  // Revenue: currency
  - `terms_markdown` (snapshot textual)
  - `metadata` (timeline, assinatura, auditoria, change_log)
  - `created_by`
  - `created_at`
  - `updated_at`

- `contract_items`
  - `id`
  - `contract_id` (FK -> contracts.id)
  - `proposal_item_id` (FK -> proposal_items.id)
  - `service_code`
  - `service_name`
  - `quantity`
  - `unit`
  - `unit_price`
  - `currency_code`
  - `discount_pct`
  - `line_total`
  - `metadata`

## 2. APIs

Superficie proposta em `/api/crm/contracts`:

1. `GET /api/crm/contracts?status=&client_id=&project_id=&proposal_id=`
2. `POST /api/crm/contracts` (origem: **proposal obrigatoriamente approved**)
3. `GET /api/crm/contracts/[id]`
4. `PATCH /api/crm/contracts/[id]` (somente `draft/sent`)
5. `POST /api/crm/contracts/[id]/send`
6. `POST /api/crm/contracts/[id]/mark-signed`
7. `POST /api/crm/contracts/[id]/activate`
8. `POST /api/crm/contracts/[id]/complete`
9. `POST /api/crm/contracts/[id]/cancel`
10. `POST /api/crm/contracts/[id]/generate-pdf`
11. `POST /api/crm/contracts/[id]/version`
12. `POST /api/crm/contracts/[id]/signed-url`

Regra central:

- contrato nasce de proposta existente com status `approved` (bloqueio de criacao fora dessa condicao).
- `contract_items` sao snapshot de `proposal_items` no momento de criacao.

## 3. Telas

1. `/crm/contracts`
- lista de contratos por status, cliente, projeto, proposta, validade.

2. `/crm/contracts/new?proposal_id=`
- wizard de geracao a partir de proposta `approved`.
- preenche itens e valores automaticamente.

3. `/crm/contracts/[id]`
- detalhes, termos, historico de versoes, status e PDFs.
- acoes: enviar, marcar assinado, ativar projeto, concluir, cancelar.

4. Integracao visual em `/crm/proposals/[id]`
- CTA: "Converter em Contrato" quando proposta `approved`.

## 4. Integracoes

1. `proposals`
- origem formal do contrato e versionamento comercial.

2. `proposal_items`
- origem dos itens contratuais (snapshot para `contract_items`).

3. `opportunities`
- continuidade do pipeline ate fechamento contratual.

4. `clients`
- parte contratante e contexto documental.

5. `projects`
- ativacao do projeto apos assinatura e status `active`.

Fluxo alvo:

`Proposal (approved) -> Contract -> Signed -> Project Activation`

## 5. Status de contrato

Status obrigatorios:

- `draft`
- `sent`
- `signed`
- `active`
- `completed`
- `cancelled`

Transicoes planejadas:

1. `draft -> sent`
2. `sent -> signed|cancelled`
3. `signed -> active`
4. `active -> completed|cancelled`
5. `draft -> cancelled`

## 6. Estrategia PDF

1. Geracao server-side por versao (`generate-pdf`).
2. Armazenamento em bucket privado (`project-files`).
3. Caminho padrao:
- `projects/{project_id}/contracts/{contract_id}/v{version_number}/contract.pdf`
4. Download somente por signed URL.
5. Historico por versao em `metadata.pdf_versions[]`.

## 7. Estrategia de versionamento

Regras:

1. Versao inicial: `version_number = 1`.
2. Revisao cria novo registro (`v2..vN`) com `parent_contract_id`.
3. Versoes assinadas nao sao sobrescritas.
4. `contract_code` unico e rastreavel (ex.: `CTR-2026-0001`, `CTR-USA-0001`).
5. Historico de alteracoes em `metadata.change_log[]` com autor, timestamp, campo alterado e motivo.

## 8. Estrategia de assinatura futura

Preparacao estrutural (sem implementar provider agora):

1. Modo `manual`: uso de `mark-signed` com trilha de auditoria.
2. Modo `electronic`: provider de assinatura eletrônica (ex.: Clicksign).
3. Modo `digital`: assinatura digital certificada (ex.: ICP-Brasil) via provider compatível.
4. `metadata.signature_mode` (`manual|electronic|digital`).
5. `metadata.signature_provider` (ex.: docusign, clicksign, adobe, icp_bridge).
6. `metadata.signature_envelope_id`.
7. `metadata.signature_events[]` (sent, viewed, signed, declined).
8. endpoint futuro de webhook para reconciliacao de status.

## 9. Criterios de aceite

1. Usuario converte proposta `approved` em contrato sem redigitar itens.
2. Contrato herda itens e valores de `proposal_items`.
3. PDF contratual e gerado e armazenado em bucket privado.
4. Signed URL libera download seguro temporario.
5. Status evolui conforme maquina definida.
6. Ao atingir `signed`, fluxo permite `active` com vinculacao de projeto.
7. Versionamento suporta `v1..vN` com historico completo.
8. Codigo unico de contrato garantido e rastreavel.
9. Campos minimos para Revenue Engine presentes (`contract_value`, `currency`, `signed_date`, `start_date` via mapeamento canonico).

## 10. Dependencias

1. Proposal Engine (S3) estavel e com versionamento operacional.
2. Storage privado (`project-files`) habilitado para PDFs.
3. RLS alinhada ao padrao CRM (owner/admin/perfil autorizado).
4. Definicao de criterio de ativacao de projeto em `projects`.
5. Ponto de extensao para assinatura eletrônica/digital futura.
6. Definicao do contrato de integracao com Revenue Engine (sem retrabalho estrutural).

## 11. Ordem de implantacao (quando autorizado)

1. Banco (migrations de `contracts` + `contract_items` + RLS).
2. APIs base (`list/create/get/update/status`) com bloqueio de origem em `proposal approved`.
3. PDF + signed URL.
4. Versionamento contratual + change log.
5. UI (`/crm/contracts`, `/crm/contracts/new`, `/crm/contracts/[id]`).
6. Integracao com proposta (CTA de conversao).
7. Integracao com ativacao de projeto.
8. Preparacao de webhook de assinatura (stub, sem provider acoplado).
9. Contrato de dados com Revenue Engine e testes E2E do fluxo completo.

## Integracao futura com Revenue Engine (sem retrabalho)

Mapeamento canonico:

- `contracts.total_value` -> `revenue.contract_value`
- `contracts.currency_code` -> `revenue.currency`
- `contracts.signed_at` -> `revenue.signed_date`
- `contracts.effective_start_date` -> `revenue.start_date`
- `contracts.contract_code` -> `revenue.contract_reference`
- `contracts.status` -> `revenue.contract_status`

Eventos de handoff:

1. `signed` gera evento de fechamento comercial.
2. `active` habilita reconhecimento operacional de receita.
3. `completed/cancelled` atualiza ciclo de vida financeiro.

## Revisao executiva — Resultado oficial

Todos os itens obrigatorios foram contemplados nesta revisao.

**STATUS: PRONTO PARA IMPLEMENTACAO**

## Fora de escopo desta etapa

- Implementar codigo
- Gerar SQL
- Criar migrations
- Integrar provider real de assinatura
