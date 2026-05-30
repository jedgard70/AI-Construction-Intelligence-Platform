# PACOTE MASTER 002-C — PLANO DE EXECUCAO

Data: 2026-05-29
Status: planejamento executivo (sem implementacao, sem SQL)

Base:

- `docs/PACOTE_MASTER_002_B_PLANO_TECNICO.md`

## 1. Sequencia de Sprints

### Sprint 002-C.1 — Foundation Comercial

Escopo:

- preparar rollout de dados do CRM/Revenue;
- definir backlog tecnico fechado de migrations e APIs;
- padronizar contratos de resposta para novas rotas.

Entregas:

- matriz final de tabelas/indices/constraints (documental);
- especificacao de payloads de APIs de oportunidades/atividades;
- plano de compatibilidade com `/vendas` atual.

### Sprint 002-C.2 — CRM Core

Escopo:

- oportunidades + pipeline + atividades.

Entregas:

- fluxo funcional de pipeline comercial definido;
- regras de ownership, status e probabilidade consolidadas;
- observabilidade de funil e SLA de atividades.

### Sprint 002-C.3 — Proposals + Services

Escopo:

- propostas comerciais e venda multi-servico.

Entregas:

- modelo de proposta com `proposal_type`;
- vinculacao N:N oportunidade-servicos;
- estrategia de conversao proposta -> contrato.

### Sprint 002-C.4 — Campaigns + Lead Scores

Escopo:

- persistencia de campanhas e qualificacao.

Entregas:

- trilha de campanhas (`campaign_runs`, `campaign_dispatches`);
- historico de scoring (`lead_scores`);
- relatorios de performance comercial por canal.

### Sprint 002-C.5 — Dashboard Comercial + Revenue Ops

Escopo:

- consolidacao executiva para operacao e receita.

Entregas:

- dashboard comercial com KPIs de conversao e valor de pipeline;
- recorte por pais/regiao/moeda;
- governanca final de status, riscos e pendencias.

## 2. Dependencias Entre Modulos

1. `pipeline_stages` depende de setup inicial de catalogos.
2. `opportunities` depende de `leads`, `clients`, `projects`, `profiles`.
3. `opportunity_activities` depende de `opportunities`.
4. `proposals` depende de `opportunities` e integra com `contracts`/`documents`.
5. `services_catalog` e `opportunity_services` dependem de `opportunities`.
6. `campaign_runs` e `campaign_dispatches` dependem de `opportunities`/`projects`.
7. `lead_scores` depende de `leads` e do fluxo de qualificacao.
8. dashboard comercial depende de todos os modulos anteriores.

## 3. Criterios de Aceite por Sprint

### Sprint 002-C.1

1. backlog tecnico fechado e versionado em `.md`;
2. contratos de API documentados;
3. plano de rollback por etapa definido.

### Sprint 002-C.2

1. pipeline comercial cobrindo estagios ate `proposal_review`;
2. regras de ownership e status aprovadas;
3. sem duplicacao de CRM/leads existentes.

### Sprint 002-C.3

1. proposta vinculada a oportunidade e servicos;
2. `proposal_type` operacional definido;
3. fluxo de conversao para contrato mapeado.

### Sprint 002-C.4

1. campanhas com trilha persistida e status por canal;
2. lead score historico consultavel;
3. sem quebra das APIs legadas de sales/campaign.

### Sprint 002-C.5

1. dashboard comercial com KPIs de receita/funil;
2. visao internacional (pais/regiao/moeda) consolidada;
3. governanca documental final atualizada.

## 4. Riscos

1. Risco de duplicacao funcional com telas atuais.
- Mitigacao: rollout incremental com compatibilidade e reaproveitamento.

2. Risco de quebra de rota/API legada.
- Mitigacao: contratos versionados e testes de compatibilidade.

3. Risco de inconsistencia de dados no backfill.
- Mitigacao: backfill em fases com checkpoints e validacao.

4. Risco de RLS bloquear operacao comercial.
- Mitigacao: politicas por owner/projeto/papel elevado revisadas por sprint.

5. Risco de atraso no impacto de receita.
- Mitigacao: priorizar sprints com entrega comercial direta (oportunidades/propostas).

## 5. Impacto no Banco

Escopo de impacto:

- criacao de 9 tabelas aprovadas no 002-A;
- novos relacionamentos com tabelas existentes (`leads`, `contracts`, `projects`, `clients`, `documents`);
- RLS nas novas tabelas;
- backfill opcional de leads para oportunidades.

Diretriz:

- nenhuma tabela fora do 002-A pode ser criada.

## 6. Impacto nas APIs

Novas superficies planejadas:

- `opportunities`
- `activities`
- `proposals`
- `services`
- `campaigns` (persistencia complementar)
- `lead_scores`

Impacto esperado:

- ampliar backend comercial sem remover rotas legadas;
- manter `POST /api/sales/pipeline` e `POST /api/campaigns/launch` como compativeis.

## 7. Impacto nas Telas

Telas alvo:

- evolucao de `/vendas` como pipeline principal;
- blocos de oportunidades, propostas, servicos e campanhas;
- dashboard comercial executivo.

Impacto esperado:

- migracao gradual da UX de vendas para modelo CRM/Revenue;
- preservacao de navegacao e componentes existentes sempre que possivel.

## 8. Ordem Ideal para Geracao de Receita

1. Oportunidades + pipeline (habilita controle real de funil).
2. Propostas + servicos (habilita monetizacao estruturada).
3. Conversao proposta -> contrato (acelera fechamento).
4. Campanhas persistidas + lead scoring (escala aquisicao).
5. Dashboard comercial (otimiza decisao de investimento em vendas).

## Sequencia Executiva Recomendada

1. Sprint 002-C.2 (CRM Core)
2. Sprint 002-C.3 (Proposals + Services)
3. Sprint 002-C.4 (Campaigns + Lead Scores)
4. Sprint 002-C.5 (Dashboard + Revenue Ops)

## Fora de Escopo desta Etapa

- implementacao;
- SQL de migrations;
- alteracao de codigo em runtime.
