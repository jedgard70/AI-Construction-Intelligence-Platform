# PACOTE MASTER 002 — FASE 1
# Auditoria de Capacidades Existentes

Data: 2026-05-29
Objetivo: mapear tudo que ja existe para evitar duplicacao de CRM, vendas, propostas, contratos, leads, marketing, landing pages, produtos digitais, pagamentos e integracoes comerciais.

## Resumo Executivo

- CRM e vendas ja possuem base em `leads` + tela `/vendas` + APIs de sales.
- Contratos e assinatura digital ja possuem fluxo funcional (geracao, analise e assinatura via Lumin).
- Marketing e posicionamento ja existem em `/us-brand` e APIs de campanha.
- Landing principal existe em `/`, e ha uma landing standalone fora do fluxo Next principal.
- Pagamentos possuem regras contratuais/permissoes, mas nao ha gateway de checkout implementado.
- Integracoes comerciais existentes: webhook de vendas, Lumin e Anthropic.

## Inventario por Dominio

| Dominio | Arquivo | Tela | API | Tabela Supabase | Status | Reaproveitamento |
|---|---|---|---|---|---|---|
| CRM | `pages/vendas.tsx` | `/vendas` | — | `leads` | Parcial | Base do CRM operacional |
| Leads | `pages/api/sales/leads.js` | — | `POST /api/sales/leads` | (sem persistencia direta) | Parcial | Motor de qualificacao/score |
| Vendas | `pages/api/sales/pipeline.js` | — | `POST /api/sales/pipeline` | (sem persistencia direta) | Parcial | Orquestrador de campanhas |
| Marketing | `pages/api/campaigns/launch.js` | — | `POST /api/campaigns/launch` | (sem persistencia direta) | Parcial | Fluxo de lancamento de campanha |
| Propostas | `pages/contratos/novo.js` | `/contratos/novo` | `POST /api/juridico/contratos/gerar` | (sem persistencia padrao) | Parcial | Proposal builder inicial |
| Contratos | `pages/juridico/contratos.js` | `/juridico/contratos` | `POST /api/juridico/contratos/analisar` | `contracts` | Parcial | Workspace de analise contratual |
| Assinatura | `pages/juridico/assinatura.js` | `/juridico/assinatura` | `POST /api/juridico/assinatura/enviar`, `GET /api/juridico/assinatura/status` | `contracts` | Parcial | Fechamento digital do funil |
| Marketing/Brand | `pages/us-brand.tsx` | `/us-brand` | — | `brand_assets` | Ativo | Hub de ICP/mensagem/GTM |
| Landing | `pages/index.js` | `/` | — | — | Ativo | Landing principal integrada |
| Landing (standalone) | `landing-page-AI-Construction/*` | HTML/React standalone | — | — | Parcial | Reuso de copy/layout |
| Produtos Digitais | `templates/contratos/prestacao-servicos-engenharia-obra.md` | usado em juridico | `POST /api/juridico/contratos/gerar` | — | Ativo | Produto digital de contratos |
| Pagamentos (regras) | `components/JuridicoClient.tsx` | `/juridico` | — | `contracts` (via telas) | Parcial | Regras de pagamento contratual |
| Permissoes financeiras | `database/004_roles_permissions.sql` | — | — | permissoes (`aprovacao_pagamentos`) | Estrutural | Base de RBAC financeiro |

## Tabelas Relevantes Ja Encontradas

- `leads`
- `contracts`
- `projects`
- `clients`
- `documents`
- `agent_events`
- `project_members`
- `brand_assets`
- `video_projects`
- `archvis_projects`
- `due_diligence`
- `compliance_checks`

## Gaps Identificados (Sem Implementar Nesta Fase)

1. Falta camada CRM completa para oportunidades/atividades/estagios.
2. Falta persistencia nativa de execucoes de campanhas/disparos.
3. Falta modelagem de proposta comercial separada de contrato final.
4. Falta gateway de pagamento (checkout/invoice/subscription).
5. Falta camada padronizada de conectores comerciais externos.

## Conclusao

A recomendacao e evoluir por **extensao das estruturas existentes** (especialmente `leads`, `contracts`, `projects`, `documents`) sem criar dominios paralelos.
