# PR C Security P0 Remaining Plan

Data da auditoria: 2026-06-02
Base: `origin/main` no commit `a291d2bef8899de74a235aef5bb1be75c2399c19`

## Objetivo

Documentar o restante do `Security P0` sem misturar Revenue/Auth, sem UI, sem package files e sem hardening em lote.

Este plano cobre apenas:
- `SECURITY DEFINER` views restantes;
- `Anonymous Access Policies` restantes;
- policies `USING (true)` / `WITH CHECK (true)` restantes;
- impacto por tabela e modulo;
- o que pode ser corrigido agora;
- o que depende de decisao do projeto.

## Contexto atual

O advisor remoto do Supabase ainda aponta os seguintes blocos de seguranca:

### ERROR

- `public.quality_nci_view` - `SECURITY DEFINER VIEW`
- `public.budget_items_view` - `SECURITY DEFINER VIEW`

### WARN

- `function_search_path_mutable`
- `extension_in_public`
- `auth_leaked_password_protection`
- `rls_policy_always_true`
- `auth_allow_anonymous_sign_ins`

### INFO

- `rls_enabled_no_policy`

## 1. SECURITY DEFINER views restantes

### Tabelas / views

- [public.quality_nci_view](D:/AI-constr/AI-Construction-Intelligence-Platform/docs/PR_C_SECURITY_P0_REMAINING_PLAN.md)
- [public.budget_items_view](D:/AI-constr/AI-Construction-Intelligence-Platform/docs/PR_C_SECURITY_P0_REMAINING_PLAN.md)

### Impacto por modulo

- `quality_nci_view`:
  - modulo de qualidade e inspecao;
  - risco principal: a view aplica permissao do criador e pode contornar RLS do usuario chamador.
- `budget_items_view`:
  - modulo financeiro/planejamento;
  - risco principal: exposicao de itens de orcamento com permissao elevativa da view.

### O que pode corrigir agora

- substituir `SECURITY DEFINER` por `security_invoker` quando suportado;
- em PostgreSQL 17, preferir `CREATE VIEW ... WITH (security_invoker = true)`;
- se a view depende de permissao interna, mover a logica para funcao segura ou schema nao exposto;
- validar com advisor depois da migracao.

Status C.1:
- as duas views alvo estao em hardening isolado;
- a migracao foi preparada para aplicar `security_invoker = true` sem recreacao destrutiva;
- o plano C continua separado das policies em lote.
- confirmacao no Supabase real: as duas views deixaram de aparecer como `SECURITY DEFINER VIEW` no advisor.
- o restante do plano C continua focado em `Anonymous Access Policies` e policies `USING/WITH CHECK true`.

### O que precisa decisao

- se a view realmente deve ser consumivel por `authenticated` no schema exposto;
- se a regra pode ser reescrita para invoker sem quebrar relatórios.

## 2. Anonymous Access Policies restantes

### Tabelas confirmadas pelo advisor

- `public.documents`
- `public.project_members`
- `public.projects`
- `public.revenue_records`
- `public.revenue_installments`
- `public.revenue_events`
- `public.profiles`
- `public.proposals`
- `public.proposal_items`
- `public.opportunities`
- `public.opportunity_services`
- `public.pipeline_stages`
- `public.services_catalog`
- `public.due_diligence`
- `public.floor_plans`
- `public.rdo_records`
- `public.rdo_reports`
- `public.work_sessions`
- `public.workflow_tasks`
- `public.director_projects`
- `public.director_reviews`
- `public.investments`
- `public.platform_layers`
- `public.platform_modules`
- `public.quality_nci`
- `public.prompt_versions`
- `storage.objects`

### Impacto por modulo

- `docs` e `storage`:
  - `documents`, `storage.objects`, `project_members`;
  - risco: acesso de visitante a arquivos e metadados se policies não forem realmente restritivas.
- `projects`, `opportunities`, `proposals`, `proposal_items`, `services_catalog`, `pipeline_stages`:
  - risco: vazamento de pipeline, proposta e dados de projeto.
- `revenue_*`:
  - risco: leitura ou escrita indevida em receitas, parcelas e eventos.
- `profiles`, `director_*`, `work_sessions`, `workflow_tasks`, `investments`, `platform_*`, `quality_nci`, `rdo_*`, `due_diligence`, `floor_plans`:
  - risco: contexto interno, operacional e de governanca exposto para roles que o advisor ainda interpreta como acessiveis a `anonymous`.
- `prompt_versions`:
  - risco: leitura de prompts ativos e policy de service role demasiado permissiva.

### O que pode corrigir agora

- para tabelas que nao precisam de visitante, trocar o desenho para `authenticated` com bloqueio restritivo claro e validacao por `is_anonymous = false`;
- para tabelas de modulo interno, remover `anon` completamente;
- separar por grupos pequenos:
  - documentos/storage;
  - projetos/oportunidades/propostas;
  - revenue;
  - governanca/qualidade/juridico.

### O que precisa decisao

- se `Allow anonymous sign-ins` continua habilitado no projeto;
- se tabelas internas devem aceitar qualquer visitante autenticado ou apenas usuarios com sessao permanente;
- se `prompt_versions` deve ser mantida exposta a `authenticated` ou movida para schema mais restrito.

## 3. Policies `USING (true)` / `WITH CHECK (true)` restantes

### Tabelas confirmadas pelo advisor

- `public.bim3d_analyses`
- `public.brand_assets`
- `public.clients`
- `public.compliance_checks`
- `public.contracts`
- `public.due_diligence`
- `public.floor_plans`
- `public.rdo_reports`
- `public.video_analyses`
- `public.video_projects`

### Impacto por modulo

- `bim-3d`:
  - `bim3d_analyses` pode liberar operacoes amplas demais para authenticated.
- `brand assets`:
  - risco de gravação/leitura sem escopo real.
- `CRM / contratos / compliance / due diligence / floor plans / RDO`:
  - risco de a policy permissiva anular o sentido do RLS.
- `video / analyses`:
  - risco de qualquer authenticated operar sem restricao por projeto ou criador.

### O que pode corrigir agora

- trocar policies `ALL` permissivas por policies separadas de `SELECT`, `INSERT`, `UPDATE` e `DELETE`;
- adicionar predicates por `created_by`, `project_id`, `owner_user_id`, `manager_id`, `coordinator_id` ou membership real;
- manter `USING/WITH CHECK` explicitos e nunca `true` em modulos sensiveis.

### O que precisa decisao

- quais desses modulos devem continuar acessiveis a todo authenticated;
- quais devem ser quebrados em grupos de migração separados para evitar regressao operacional;
- se algum deles é realmente legado e deve ser desativado em vez de endurecido.

## 4. O que pode corrigir agora versus o que exige decisao

### Pode corrigir agora

1. `SECURITY DEFINER` views.
2. policies claramente permissivas com `USING/WITH CHECK true`.
3. tabelas internas com `anon` desnecessario.
4. policies de storage e documentos com escopo por projeto.

### Exige decisao

1. `Allow anonymous sign-ins`.
2. `prompt_versions` exposto a `authenticated`.
3. qualquer modulo legado que ainda depende de acesso amplo.
4. qualquer remocao de `anon` que possa quebrar demo/guest.

## 5. Risco geral

- risco tecnico: medio;
- risco operacional: medio-alto se a limpeza for feita em bloco;
- risco de experiencia do usuario: medio, porque remover `anon` ou endurecer `authenticated` sem separar por modulo pode quebrar fluxos de login/guest.

## 6. Recomendacao de PR

### PR C.1

- corrigir `public.quality_nci_view`
- corrigir `public.budget_items_view`
- manter este PR apenas para as views

### PR C.2

- corrigir policies `USING/WITH CHECK true` por modulo, em grupos pequenos
- exibir claramente o impacto por tabela

Status C.2 em andamento:
- primeiro grupo selecionado: `public.clients` e `public.contracts`;
- o objetivo e remover os fallbacks permissivos desses dois quadros sem mexer em Revenue/Auth ou UI;
- a migration idempotente foi preparada e a validação no advisor vem em seguida.
- confirmacao no Supabase real: o advisor deixou de apontar `rls_policy_always_true` para essas duas tabelas.
- o plano C continua para os demais grupos de policies permissivas.

### PR C.3

- revisar `auth_allow_anonymous_sign_ins`
- decidir globalmente sobre `Allow anonymous sign-ins`
- se necessario, documentar excecao por modulo antes de outra migration

## 7. Recomendacao final

Status recomendado:
- `pode iniciar correcoes isoladas, mas nao em lote`

Leitura objetiva:
- o PR C deve nascer como plano e depois se dividir em migrations pequenas;
- o primeiro alvo seguro e mais claro continua sendo `SECURITY DEFINER VIEW`;
- o restante precisa de decisao de produto e de seguranca para nao quebrar fluxos de visitante ou de autenticao permanente.
