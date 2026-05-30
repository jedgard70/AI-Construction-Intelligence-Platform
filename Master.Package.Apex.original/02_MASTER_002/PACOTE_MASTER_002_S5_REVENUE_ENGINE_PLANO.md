# PACOTE MASTER 002-S5 — REVENUE ENGINE (PLANEJAMENTO TECNICO)

Data: 2026-05-30
Status: **PRONTO PARA IMPLEMENTACAO** (revisao executiva concluida)

Base obrigatoria utilizada (exclusiva):

- `contracts`
- `contract_items`
- `proposals`
- `opportunities`
- `clients`
- `projects`

## 1. Banco

Diretriz de reaproveitamento:

1. Nao duplicar CRM/Contract/Proposal.
2. Revenue deve suportar ciclo completo: forecast pre-contrato e contratado pos-assinatura.
3. Itens financeiros detalhados reaproveitam `contract_items`.

Modelo alvo (planejamento):

- `revenues`
  - `id`
  - `contract_id` (FK -> contracts.id, nullable para forecast)
  - `proposal_id` (FK -> proposals.id, nullable)
  - `opportunity_id` (FK -> opportunities.id)
  - `client_id` (FK -> clients.id)
  - `project_id` (FK -> projects.id, nullable)
  - `revenue_code` (unico)
  - `status_financial` (`forecast|contracted|invoiced|partially_paid|paid|overdue|cancelled`)
  - `contract_value` (snapshot financeiro)
  - `currency_code` (`BRL|USD|EUR`)
  - `contract_date` (data da contratacao/assinatura)
  - `invoice_date` (nullable)
  - `due_date` (nullable)
  - `paid_at` (nullable)
  - `start_date` (nullable, inicio operacional)
  - `invoiced_value` (default 0)
  - `paid_value` (default 0)
  - `outstanding_value` (calculado)
  - `metadata` (timeline, billing provider, reconciliacao, change_log)
  - `created_by`
  - `created_at`
  - `updated_at`

- `revenue_installments`
  - `id`
  - `revenue_id` (FK -> revenues.id)
  - `installment_number`
  - `due_date`
  - `amount`
  - `currency_code` (`BRL|USD|EUR`)
  - `status` (`forecast|invoiced|partially_paid|paid|overdue|cancelled`)
  - `invoice_reference` (nullable)
  - `paid_at` (nullable)
  - `metadata`
  - `created_at`
  - `updated_at`

- `revenue_events`
  - `id`
  - `revenue_id` (FK -> revenues.id)
  - `event_type` (`forecast_created|contract_linked|invoice_issued|payment_received|payment_partial|payment_failed|status_changed|adjustment`)
  - `event_date`
  - `amount` (nullable)
  - `currency_code` (`BRL|USD|EUR`)
  - `reference_code` (invoice/payment reference)
  - `notes`
  - `metadata`
  - `created_by`
  - `created_at`

## 2. APIs

Superficie proposta em `/api/crm/revenues`:

1. `GET /api/crm/revenues?status_financial=&client_id=&project_id=&contract_id=&period_from=&period_to=`
2. `POST /api/crm/revenues` (forecast pre-contrato ou contratado com contract)
3. `GET /api/crm/revenues/[id]`
4. `PATCH /api/crm/revenues/[id]`
5. `POST /api/crm/revenues/[id]/link-contract` (converter forecast em contracted)
6. `POST /api/crm/revenues/[id]/invoice`
7. `POST /api/crm/revenues/[id]/payment`
8. `POST /api/crm/revenues/[id]/status`
9. `POST /api/crm/revenues/[id]/installments`
10. `GET /api/crm/revenues/kpis?period_from=&period_to=`
11. `GET /api/crm/revenues/dashboard?period=monthly|quarterly|yearly`

Regras centrais:

- `forecast` pode existir sem `contract_id` (base em proposal/opportunity).
- `contracted` exige `contract_id` com contrato `signed|active|completed`.
- transicoes financeiras seguem maquina abaixo.

## 3. Telas

1. `/crm/revenue`
- listagem financeira por status, cliente, projeto, contrato e periodo.

2. `/crm/revenue/[id]`
- detalhe da receita, timeline, saldo aberto, historico de pagamentos e cronograma de parcelas.

3. `/dashboard/revenue`
- dashboard financeiro por periodo (mensal/trimestral/anual).

4. CTA em `/crm/contracts` e `/crm/contracts/new`
- "Gerar Revenue" para contrato elegivel.

## 4. Integracoes

1. `contracts`
- origem oficial para fase `contracted` em diante.

2. `contract_items`
- composicao de receita por servico.

3. `proposals`
- base para forecast pre-contrato e funil de conversao.

4. `opportunities`
- contexto comercial para projeção e conversao.

5. `clients`
- carteira, risco e recebimento por cliente.

6. `projects`
- receita por projeto e correlacao com execucao.

Fluxo alvo:

`Contract signed -> Revenue -> Invoice -> Payment -> Dashboard`

## 5. Status financeiros

Status obrigatorios:

- `forecast`
- `contracted`
- `invoiced`
- `partially_paid`
- `paid`
- `overdue`
- `cancelled`

Transicoes planejadas:

1. `forecast -> contracted|cancelled`
2. `contracted -> invoiced|cancelled`
3. `invoiced -> partially_paid|paid|overdue|cancelled`
4. `partially_paid -> paid|overdue|cancelled`
5. `overdue -> partially_paid|paid|cancelled`

## 6. KPIs

KPIs obrigatorios do Revenue Engine:

1. `forecast_revenue_value` (receita prevista)
2. `contracted_revenue_value` (receita contratada)
3. `invoiced_revenue_value` (receita faturada)
4. `paid_revenue_value` (receita recebida)
5. `overdue_revenue_value` (receita em atraso)
6. `proposal_to_contract_rate`
7. `contract_to_revenue_rate`
8. `proposal_to_revenue_rate`
9. `collection_rate` (% pago / faturado)
10. `average_days_to_pay`
11. `revenue_by_region`
12. `revenue_by_client`
13. `revenue_by_project`

## 7. Dashboard de receita

Dashboard financeiro por periodo:

1. Filtros:
- periodo (`monthly`, `quarterly`, `yearly`), moeda, cliente, projeto, regiao.

2. Cards executivos:
- previsto, contratado, faturado, recebido, em aberto, em atraso.

3. Conversao comercial-financeira:
- proposta -> contrato -> receita.

4. Cronograma de recebimentos:
- parcelas por vencimento e status.

5. Inadimplencia:
- titulos vencidos, dias de atraso e risco por cliente/projeto.

## 8. Estrategia de faturamento futuro

Preparacao estrutural (sem provider nesta fase):

1. `metadata.billing_mode` (`manual|gateway|erp|checkout`).
2. `metadata.billing_provider` (ex.: stripe, asaas, omie, sap, totvs).
3. `metadata.invoice_reference`.
4. `metadata.payment_reference`.
5. `metadata.checkout_session_id` (futuro checkout).
6. endpoint futuro de webhook para conciliacao automatica de pagamentos.
7. ledger de eventos em `revenue_events` para auditoria completa.

## 9. Criterios de aceite

1. Revenue forecast pode ser criada antes de contrato.
2. Revenue contracted nasce apos contract `signed`/`active`.
3. Campos base financeiros disponiveis:
- `contract_date`, `invoice_date`, `due_date`, `paid_at`, `currency_code`.
4. Moedas suportadas: `BRL`, `USD`, `EUR`.
5. Parcelamento e cronograma de pagamento registrados em `revenue_installments`.
6. Invoice atualiza status para `invoiced`.
7. Pagamento parcial atualiza `partially_paid`.
8. Quitacao total atualiza `paid` e saldo aberto para zero.
9. Vencimento sem quitacao permite transicao para `overdue`.
10. Dashboard por periodo exibe KPIs e funil proposta->contrato->receita.

## 10. Dependencias

1. Contract Engine (S4) estavel e validado.
2. Fluxo autenticado de contratos em ambiente real.
3. RLS alinhada ao padrao CRM/Contract.
4. Definicao fiscal de emissao e vencimento de invoices.
5. Alinhamento com Mission Control para indicadores executivos.

## 11. Ordem de implantacao (quando autorizado)

1. Banco (`revenues`, `revenue_installments`, `revenue_events`, RLS, indices).
2. APIs base (`list/create/get/update/status`).
3. APIs financeiras (`link-contract`, `invoice`, `payment`, `installments`, `kpis`, `dashboard`).
4. UI listagem (`/crm/revenue`).
5. UI detalhe (`/crm/revenue/[id]`).
6. Dashboard financeiro por periodo (`/dashboard/revenue`).
7. Integracao com contratos (handoff automatico signed -> contracted).
8. Testes E2E financeiro-comercial.

## Revisao executiva — Resultado oficial

Todos os itens obrigatorios foram contemplados nesta revisao.

**STATUS: PRONTO PARA IMPLEMENTACAO**

## Fora de escopo desta etapa

- Implementar codigo
- Criar migrations
- Gerar SQL
- Integrar gateway/ERP/checkout real
