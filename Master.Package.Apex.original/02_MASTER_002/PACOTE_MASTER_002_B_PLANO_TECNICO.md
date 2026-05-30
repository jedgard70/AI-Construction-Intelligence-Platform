# PACOTE MASTER 002-B — PLANO TECNICO DE IMPLEMENTACAO

Data: 2026-05-29
Status: planejamento aprovado para auditoria executiva (sem implementacao)

Base obrigatoria:

- `docs/PACOTE_MASTER_002_A_SCHEMA_FINAL.md`

Escopo desta fase:

- definir plano tecnico completo de CRM + Revenue Engine + Digital Products;
- sem gerar SQL;
- sem implementar codigo;
- sem criar tabelas fora do modelo 002-A aprovado.

## 1. Modulos

### 1.1 CRM Core

Objetivo:

- operacionalizar funil comercial com oportunidades e atividades.

Componentes:

- estagios de pipeline (`pipeline_stages`);
- oportunidades (`opportunities`);
- atividades comerciais (`opportunity_activities`);
- historico de qualificacao (`lead_scores`).

Reaproveitamento:

- `leads`, `clients`, `projects`, `profiles`.

### 1.2 Revenue Engine

Objetivo:

- transformar oportunidades em propostas e contratos com rastreabilidade comercial.

Componentes:

- propostas (`proposals`);
- itens de servico por oportunidade (`opportunity_services`);
- catalogo de servicos (`services_catalog`);
- campanhas e disparos (`campaign_runs`, `campaign_dispatches`).

Reaproveitamento:

- `contracts`, `documents`, APIs juridicas e sales existentes.

### 1.3 Digital Products

Objetivo:

- usar a base comercial para venda de produtos/servicos digitais sem duplicar juridico/contratos.

Componentes:

- tipificacao de proposta (`proposal_type`);
- associacao de multiplos servicos por oportunidade;
- entrega documental via `documents` e fluxos juridicos existentes.

## 2. Telas (Planejamento)

### 2.1 Pipeline Comercial

URL alvo:

- evolucao de `/vendas`

Blocos:

- kanban por estagio (`pipeline_stages`);
- lista de oportunidades com filtros por owner, regiao, pais e status;
- card com valor, probabilidade, servicos vinculados e proxima acao.

### 2.2 Oportunidades

URL alvo:

- `/vendas/oportunidades` (ou secao dedicada na tela de vendas)

Blocos:

- cadastro/edicao de oportunidade;
- timeline de atividades (`opportunity_activities`);
- vinculacao com lead/cliente/projeto;
- internacionalizacao (`country_code`, `market_region`, `currency_code`).

### 2.3 Propostas

URL alvo:

- `/vendas/propostas`

Blocos:

- criacao de proposta por oportunidade;
- definicao de `proposal_type`;
- valor total, validade e status;
- vinculo com documentos e contrato final.

### 2.4 Servicos

URL alvo:

- `/vendas/servicos`

Blocos:

- catalogo de servicos (`services_catalog`);
- vinculacao de servicos a oportunidades (`opportunity_services`);
- precificacao por quantidade/unidade/desconto.

### 2.5 Campanhas

URL alvo:

- `/vendas/campanhas`

Blocos:

- execucoes de campanha (`campaign_runs`);
- historico de disparos (`campaign_dispatches`);
- status operacional por canal.

### 2.6 Dashboard Comercial

URL alvo:

- secao no `/vendas` ou `/mission-control` comercial

KPIs:

- oportunidades abertas/ganhas/perdidas;
- valor de pipeline por estagio;
- conversao por regiao/pais;
- performance de campanha;
- distribuicao de servicos vendidos.

## 3. APIs (Planejamento)

Padrao:

- manter rotas atuais;
- adicionar rotas incrementais sem quebrar contrato legado.

### 3.1 Opportunities

- `GET /api/sales/opportunities`
- `POST /api/sales/opportunities`
- `PATCH /api/sales/opportunities/:id`
- `GET /api/sales/opportunities/:id`

### 3.2 Activities

- `GET /api/sales/opportunities/:id/activities`
- `POST /api/sales/opportunities/:id/activities`
- `PATCH /api/sales/activities/:id`

### 3.3 Proposals

- `GET /api/sales/proposals`
- `POST /api/sales/proposals`
- `PATCH /api/sales/proposals/:id`
- `POST /api/sales/proposals/:id/convert-contract`

### 3.4 Services

- `GET /api/sales/services-catalog`
- `POST /api/sales/services-catalog` (restrito)
- `POST /api/sales/opportunities/:id/services`
- `PATCH /api/sales/opportunity-services/:id`

### 3.5 Campaigns

- reuso de:
  - `POST /api/sales/pipeline`
  - `POST /api/campaigns/launch`
- extensao:
  - persistencia de execucao/disparos em `campaign_runs` e `campaign_dispatches`.

### 3.6 Lead Scores

- `GET /api/sales/leads/:id/scores`
- `POST /api/sales/leads/:id/score` (ou persistencia no fluxo atual de `POST /api/sales/leads`)

## 4. Tabelas Afetadas

## 4.1 Reaproveitadas

- `leads`
- `contracts`
- `projects`
- `clients`
- `documents`
- `agent_events`
- `project_members`
- `profiles`

## 4.2 Novas (somente as aprovadas no 002-A)

- `pipeline_stages`
- `opportunities`
- `opportunity_activities`
- `proposals`
- `services_catalog`
- `opportunity_services`
- `campaign_runs`
- `campaign_dispatches`
- `lead_scores`

## 5. Migrations Necessarias (Plano, sem SQL)

### 5.1 Migration 01 — Estrutura

- criar 9 tabelas novas aprovadas;
- FKs, constraints e indices basicos.

### 5.2 Migration 02 — Catalogos e Seeds

- popular `pipeline_stages` (incluindo `proposal_review`);
- seed inicial de `services_catalog`.

### 5.3 Migration 03 — RLS

- habilitar RLS nas novas tabelas;
- policies alinhadas a owner/projeto/papel elevado.

### 5.4 Migration 04 — Backfill e Compatibilidade

- backfill opcional `leads -> opportunities`;
- ajustes de compatibilidade para telas e APIs atuais;
- views de transicao se necessario.

## 6. Dependencias

### 6.1 Tecnicas

- Supabase Postgres + RLS;
- Next.js API routes existentes;
- componentes atuais de `/vendas` e juridico.

### 6.2 Funcionais

- validacao final do Pacote 001 (Trilho A) nao bloqueia planejamento, mas bloqueia go-live total.
- definicao de papeis/comercial owners (profiles + RBAC).

### 6.3 Integracoes

- Anthropic (score/copy);
- Lumin (proposta->contrato->assinatura);
- webhook comercial (`SALES_WEBHOOK_URL`).

## 7. Ordem de Implantacao (Obrigatoria)

1. Migrations
2. APIs
3. UI
4. Integracoes
5. Relatorios

Detalhamento de rollout:

1. aplicar schema e RLS;
2. liberar APIs em modo compativel;
3. evoluir `/vendas` para pipeline completo;
4. conectar campanhas e juridico;
5. consolidar dashboard comercial e evidencias.

## Critérios de Aceite da Fase 002-B

1. plano cobre modulos, telas, APIs, banco, migrations, dependencias e ordem;
2. nenhuma tabela fora do 002-A foi proposta;
3. nenhuma duplicacao de CRM/leads/contratos foi introduzida;
4. documentacao mestre atualizada.

## Fora de Escopo (Nesta Fase)

- escrita de SQL;
- implementacao de APIs;
- implementacao de UI;
- execucao de backfill real.
