# PACOTE MASTER 002-S2 — IMPLEMENTACAO

Data: 2026-05-30
Workspace oficial: `D:\AI-constr\AI-Construction-Intelligence-Platform`

## Objetivo

Implementar a camada de servicos vendaveis com:

1. `services_catalog`
2. `opportunity_services`

## Entregas tecnicas

### 1) Migration e banco

Arquivo criado:

- `supabase/migrations/20260530_master002_s2_services_catalog.sql`

Aplicacao no remoto:

- estrutura aplicada (`services_catalog` e `opportunity_services`)
- indices aplicados
- RLS e policies aplicadas
- seed de servicos aplicado

Servicos seed confirmados:

- `permit_set_usa`
- `render_4k`
- `technical_docs`
- `marketing_package`

Policies confirmadas:

- `services_catalog_select_authenticated`
- `services_catalog_manage_elevated`
- `opportunity_services_select_scoped`
- `opportunity_services_insert_scoped`
- `opportunity_services_update_scoped`
- `opportunity_services_delete_scoped`

### 2) APIs CRM

Criadas:

- `pages/api/crm/services.ts`
- `pages/api/crm/opportunity-services.ts`

Funcionalidades:

- catalogo: listagem, cadastro e atualizacao (`ativo/inativo`)
- vinculo oportunidade-servico: listar por oportunidade, inserir, atualizar e excluir
- calculo de `line_total` por quantidade/preco/desconto

### 3) Tela

Criada:

- `pages/crm/services.tsx` (`/crm/services`)

Funcionalidades:

- cadastro de servico (codigo, categoria, preco, moeda, status)
- ativar/desativar servicos
- selecionar oportunidade e adicionar multiplos servicos
- visualizar linhas de servico por oportunidade

### 4) Integracao com oportunidades/clients/projects

- `opportunity_services` integra nativamente com `opportunities` via FK.
- endpoint `GET /api/crm/opportunity-services` retorna dados de oportunidade e servico para composicao comercial.
- tela carrega oportunidades existentes e vincula servicos por oportunidade.

## Evidencias

### Build

- `npm run build` executado com sucesso.
- rotas confirmadas no output:
  - `/api/crm/services`
  - `/api/crm/opportunity-services`
  - `/crm/services`

### Banco

- tabelas existentes no remoto: `services_catalog`, `opportunity_services`
- seed catalogo confirmado com 4 servicos.
- RLS/policies confirmadas para as 2 tabelas.

## Critério de aceite

Requisito: uma opportunity deve conter multiplos servicos.

Status:

- **Implementado em schema + API + UI** (suporte N:N operacional).
- **Validacao autenticada automatizada pendente nesta rodada** por dois bloqueios de ambiente:
  1. limite de envio de email no signup (`over_email_send_rate_limit`);
  2. restricao de seguranca para atribuicao manual de `created_by` em profile real durante insercao direta.

## Riscos remanescentes

1. Executar teste autenticado final de vinculacao multi-servico quando houver usuario QA/token disponivel.
2. Conflito legado de migrations `20260529*` segue pendente fora do escopo S2.

## Checklist S2

- [x] `services_catalog` criado
- [x] `opportunity_services` criado
- [x] APIs `/api/crm/services` e `/api/crm/opportunity-services`
- [x] Tela `/crm/services`
- [x] Build validado
- [x] Documentacao atualizada
- [ ] Evidencia E2E autenticada de 1 opportunity com 4 servicos (pendente por rate-limit/auth)
