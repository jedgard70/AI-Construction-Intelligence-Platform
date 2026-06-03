# Phase 0 – Nova Foundation Supabase: Inventário e Backup Strategy

**Data de Preparo:** 2026-06-03  
**Status:** Planejamento Pré-Execução (Sem Implementação Técnica)  
**Responsável:** Owner Decision Required  

---

## I. Checkpoint Git e Estado Atual

### Commit Base
```
ba16e89d66a306e08ea7e8dfd40b22b47c6b5122
docs: add worktree audit report after TEXT ONLY violation check
```

### Estado de Worktree
- Branch Ativa: `claude/beautiful-brown-aUCq6`
- Arquivos Staged: 0
- Arquivos Modificados: 0
- Arquivos Não Rastreados: 0
- Status: ✅ LIMPO E PRONTO

### PRs Abertas e Congeladas (Bloqueadas para Phase 0)
1. **PR #84** – Security Passo 2 (Remediação P0/P1/P2)
   - Status: Frozen (congelada durante Phase 0)
   - Impacto: Bloqueia avanço de hardening de segurança

2. **PR #87** – Clients Foundation Refactoring
   - Status: Frozen (congelada durante Phase 0)
   - Impacto: Feature em espera durante preparação da nova foundation

---

## II. Supabase: Estado Atual de Segurança e Dados

### Projeto Supabase Identificado
- **Project ID:** `stjhkxwylqtihzflspqe`
- **Última Auditoria:** 2026-06-02
- **Status Security Gate:** FAIL EM P0

### P0 – Achados Críticos Remanescentes

#### Security Definer Views (CORRIGIDO em C.1)
- ✅ `public.quality_nci_view` – Corrigido com `security_invoker = true`
- ✅ `public.budget_items_view` – Corrigido com `security_invoker = true`
- **Conclusão C.1:** Não aparecem mais no advisor remoto

#### Anonymous Access Policies (REMANESCENTE – DECISÃO DO OWNER)
Tabelas com policies aceitas por `authenticated` (incluindo anonymous):
- `documents`, `project_members`, `projects`
- `revenue_records`, `revenue_installments`, `revenue_events`
- `profiles`, `proposals`, `proposal_items`
- `opportunities`, `opportunity_services`
- `pipeline_stages`, `services_catalog`
- `storage.objects`

**Estratégia Phase 0:** 
- Owner decidiu: NÃO anonymous access para dados internos
- Foundation reset implementará RLS restritivas sem fallback `authenticated` para dados confidenciais
- Anonymous access será desabilitado em `Auth > Providers` durante foundation

### P1 – Achados em Aberto
- `function_search_path_mutable` em 5 funções críticas
- `Leaked Password Protection Disabled`
- `Extension in Public` para `pg_trgm`

### P2 – Achados em Aberto
- `RLS Enabled No Policy` em 5 tabelas (agent_memory, agent_tasks, autonomous_alerts, knowledge_chunks, site_states)

---

## III. Estratégia de Preservação: Dados Operacionais Reais Apenas

**OWNER DECISION (2026-06-03):** Mudança paradigmática de categorias para preservação restrita a dados operacionais reais.

### Escopo Preservação (OPERATIONAL-DATA-ONLY)
**PRESERVE:**
- Authentication & Identity: `auth.users`, `profiles`, `user_roles` (usuários e acesso reais)
- Real Projects: `projects`, `clients`, `project_members` (projetos em operação)
- Real Contracts: `contracts` (documentação contratual ativa)
- Real Revenue Cycle: `revenue_records`, `revenue_installments`, `revenue_events` (faturamento real)
- Real CRM: `proposals`, `proposal_items`, `opportunities`, `opportunity_services` (pipeline de vendas ativo)
- Real Catalog: `services_catalog`, `pipeline_stages` (catálogo de serviços operacional)
- Real Documents: `documents` (artefatos documentais vinculados a projetos reais)
- Real Analyses: `bim3d_analyses`, `floor_plans`, `rdo_reports`, `video_analyses` (análises vinculadas a projetos reais)
- Real ArchVis: `brand_assets`, `compliance_checks`, `due_diligence` (ativos operacionais)
- Real Storage: `storage.objects` (blobs vinculados a projetos reais e documentos reais)

### Escopo Descartar (EXPLICIT EXCLUSIONS)
**DO NOT PRESERVE:**
- **Logs & Temporary:** `site_states` (estados temporários de sessão), logs de eventos
- **Cache & Generated:** `archvis_renders` (renders cacheados, regeneráveis), snapshots gerados
- **Technical Debt:** `agent_memory`, `agent_tasks`, `autonomous_alerts`, `knowledge_chunks` (obsoleto)
- **QA/Test/Demo:** Dados de teste, dados de QA, dados de demonstração, staging data
- **Duplicates & Empty:** Tabelas duplicadas, tabelas vazias, tabelas com <5 registros sem valor operacional
- **Histórico não-operacional:** Histórico de eventos temporários, sessões expiradas

---

## IV. Tabelas Mandatórias para Preservação

### Categoria A: Dados Críticos de Negócio (PRESERVE COMPLETO)
1. **Projetos & Clientes**
   - `projects` – metadata de projetos ativos
   - `clients` – dados de clientes
   - `project_members` – team assignments
   - `contracts` – documentação contratual

2. **Receita & Vendas**
   - `revenue_records` – registros de faturamento
   - `revenue_installments` – parcelas de receita
   - `revenue_events` – timeline de eventos de receita
   - `proposals` – propostas comerciais
   - `proposal_items` – itens de proposta
   - `opportunities` – pipeline de oportunidades
   - `opportunity_services` – serviços em oportunidades
   - `pipeline_stages` – fases do pipeline

3. **Usuários & Identidade**
   - `auth.users` – usuários do Supabase Auth
   - `profiles` – perfis estendidos
   - `user_roles` – atribuições de role

4. **Análises & Documentação**
   - `documents` – artefatos documentais
   - `bim3d_analyses` – análises BIM 3D
   - `floor_plans` – plantas de andar
   - `rdo_reports` – relatórios RDO
   - `video_analyses` – análises de vídeo

5. **Catálogo & Configuração**
   - `services_catalog` – serviços oferecidos
   - `brand_assets` – ativos de marca
   - `compliance_checks` – verificações de conformidade
   - `due_diligence` – dados de due diligence

### Categoria B: Dados Auxiliares (DESCARTE CONFIRMADO)
**OWNER DECISION (2026-06-03):** NÃO preservar por padrão. Considerar apenas se indispensável operacionalmente:
- `floor_plans`, `video_projects`, `rdo_reports` – descarte (histórico de análises)
- `agent_memory`, `agent_tasks` – descarte (technical debt)
- `autonomous_alerts`, `knowledge_chunks` – descarte (technical debt)
- Estratégia: Revisar manualmente apenas se operacionalmente crítico

### Categoria C: Dados Ephemeral (DESCARTE CONFIRMADO)
**OWNER DECISION (2026-06-03):** NÃO preservar por padrão
- `site_states` – descarte (estados temporários de sessão)
- `archvis_renders` – descarte (renders cacheados, regeneráveis)
- Histórico de eventos temporários – descarte
- Estratégia: Limpar completamente durante reset

### Categoria D: Storage (PRESERVAR SELETIVAMENTE)
- `storage.objects` – preservar APENAS blobs ligados a projetos reais, documentos reais, e ArchVis real
- Descarte: blobs de QA/teste/demo, caches, staging
- Estratégia: Auditoria manual de storage_path para confirmar operational value

---

## V. Estratégia de Backup e Export

### Fase 1: Snapshot Pré-Reset (PRÉ-FOUNDATION)
```
Data: 2026-06-03 ou próxima confirmação Owner
Tipo: pg_dump com todas as Categorias A+B+D
Destino: Arquivo local comprimido (gzip)
Retenção: Indefinida (preservação padrão ampliado)
Validação: Checksum SHA256
```

### Fase 2: Export de Dados Selecionados
**Para cada tabela Categoria A+B:**
- Format: CSV ou JSON-L (por preferência)
- Incluir: Todas as colunas, timestamps de criação
- Filtro: Dados ativos (exclusão de marked_deleted ou soft_deletes)
- Validação: Row count verificado pré e pós-export

**Para storage:**
- Listar todos os object_ids e paths
- Criar manifesto JSON com metadados
- Preservar blobs críticos via `storage-api` ou `supabase-cli`

### Fase 3: Validação de Integridade
- Restaurar backup local em ambiente de teste
- Validar foreign keys e constraints
- Comparar row counts e checksums
- Testar queries críticas de negócio

---

## VI. Checklist de Validação Pré-Foundation

### Dados
- [ ] Snapshot pg_dump completo capturado e comprimido
- [ ] Exports CSV/JSON-L de tabelas Categoria A finalizados
- [ ] Storage objects catalogados e metadados salvos
- [ ] Integridade validada em ambiente de teste
- [ ] Permissões verificadas (owner, service_role)

### Segurança
- [ ] Backup encriptado (AES-256) antes do upload
- [ ] Acesso a backup restrito (local + Owner apenas)
- [ ] Credenciais de Supabase removidas de toda documentação
- [ ] Service role key armazenado em local seguro (Password Manager)

### Infraestrutura
- [ ] Preview environment identificado e estado documentado
- [ ] Production environment backup realizado separadamente
- [ ] Variáveis de ambiente (NEXT_PUBLIC_SUPABASE_URL, ANON_KEY) identificadas
- [ ] Rollback plan documentado (FOUNDATION_PHASE_0_EXECUTION_PLAN)

### Comunicação
- [ ] Owner confirmou data de execução
- [ ] Time notificado de janela de indisponibilidade (4-6h estimado)
- [ ] Stakeholders alertados (Preview + Prod)

---

## VII. Riscos Identificados

### Risco 1: Perda de Dados Não-Replicáveis (CRÍTICO)
- **Cenário:** Alguns dados em `agent_memory`, `autonomous_alerts` podem ser únicos
- **Mitigação:** Review manual antes de descartar; considerar preservação de Categoria B completa
- **Owner Decision:** Necessário input sobre tolerância a perda de dados auxiliares

### Risco 2: Foreign Key Cascades Inesperadas (ALTO)
- **Cenário:** Reset da foundation pode deletar dados via cascades definidos incorretamente
- **Mitigação:** Validar todas as relações de FK antes de reset; testar em Preview primeiro
- **Owning Validation:** Executar dry-run com `DROP TABLE ... CASCADE` simulado

### Risco 3: RLS Policies Quebradas Pós-Reset (ALTO)
- **Cenário:** Policies new foundation pode bloquear acesso legítimo
- **Mitigação:** Plano de rollback deve incluir restore de RLS anterior
- **Testing:** Testar cada role (anon, authenticated, service_role) em Preview

### Risco 4: Indisponibilidade Prolongada (MÉDIO)
- **Cenário:** Reset em Production pode durar > 6 horas se migration falhar
- **Mitigação:** Timeline 4-6 semanas permite window off-peak; considerar maintenance window notificado
- **Owner Approval:** Confirmar janela de downtime aceitável

### Risco 5: Incompatibilidade de Import Pós-Reset (MÉDIO)
- **Cenário:** Dados exportados podem não encaixar em novo schema se migrations mudarem types/constraints
- **Mitigação:** Documentar delta de schema pós-reset; preparar scripts de transform
- **Validation:** Testar import em Preview antes de aplicar em Prod

---

## VIII. Decisões Pendentes do Owner

### Decisão 1: Timeline de Execução
- **Opção A:** Imediata (após aprovação desta Phase 0) – 4-6 semanas contadas de hoje
- **Opção B:** Agendada para data específica (a confirmar)
- **Opção C:** Aguardar PR #84 e #87 final antes de começar reset
- **Status:** ⏳ AGUARDANDO OWNER INPUT

### Decisão 2: Preservação de Dados Ephemeral
- **Opção A:** Preservar tudo (Categoria A+B+C+D) – Seguro, mas maior volume
- **Opção B:** Preservar A+B+D apenas (descartar C) – Balanço recomendado
- **Opção C:** Preservar A+D apenas (review B caso a caso) – Agressivo
- **Status:** ✅ OWNER JÁ DECIDIU OPÇÃO B (não preservar) – Preservação restrita a dados operacionais reais apenas

### Decisão 3: Anonymous Access Pós-Foundation
- **Opção A:** Manter `Allow anonymous sign-ins` habilitado, mas com RLS restritiva (interno=authenticated)
- **Opção B:** Desabilitar completamente `Allow anonymous sign-ins` em Auth > Providers
- **Status:** ⏳ OWNER JÁ DECIDIU OPÇÃO B (Desabilitar para internal data)
- **Implementação:** Foundation new RLS não inclui fallback `authenticated` para dados sensíveis

### Decisão 4: Validação em Preview vs Production
- **Opção A:** Reset em Preview, validar, depois clonar para Production (Seguro, mais tempo)
- **Opção B:** Reset direto em Production com rollback plan (Rápido, mais risco)
- **Recomendação:** Opção A + staged rollout (Preview → Prod separadamente)
- **Status:** ⏳ AGUARDANDO OWNER INPUT

---

## IX. Próximos Passos para Phase 0

1. **Owner Approval:** Confirmar decisões pendentes acima
2. **Backup Execution:** Executar snapshots pg_dump e exports CSV/JSON-L
3. **Preview Testing:** Rodar foundation reset em Preview environment
4. **Documentation:** Finalizar FOUNDATION_PHASE_0_EXECUTION_PLAN com sequência exata
5. **Readiness Gate:** Após aprovação, emitir "Phase 0 Ready for Execution"

---

## X. Metadados Documento

- **Versão:** 1.0 (Draft)
- **Criado em:** 2026-06-03
- **Tipo:** Planejamento Pré-Execução
- **Escopo:** Supabase Foundation Reset (Option B)
- **Aprovação Requerida:** Owner
- **Merge Bloqueado:** Até confirmação de segurança
