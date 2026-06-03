# Phase 0 – Nova Foundation Supabase: Plano de Execução

**Data de Preparo:** 2026-06-03  
**Status:** Planejamento Pré-Execução (Sem Execução Técnica)  
**Responsável:** Owner Decision Required  
**Baseline Commit:** `ba16e89d66a306e08ea7e8dfd40b22b47c6b5122`

---

## I. Visão Geral Executiva

Este documento detalha a sequência EXATA de execução para o reset da nova foundation Supabase, com foco em:
1. **Ordem de migração** para Phase 0 foundation reset
2. **RLS sem anonymous fallback** para dados internos (Option B do Owner)
3. **Preservação e import de dados** (Categorias A+B+D)
4. **Validação em Preview** com testes de cada role
5. **Rollout staged** Preview → Production
6. **Rollback procedures** com restore sequencial
7. **Criteria para Phase 1** (aprovação final)

---

## II. Pré-Execução: Checklist 48h Antes

### A. Backup & Export (Completar Fase 1 de INVENTARIO_E_BACKUP.md)
- [ ] `pg_dump` completo capturado + gzip + SHA256 checksum
- [ ] CSV/JSON-L exports de tabelas Categoria A finalizados
- [ ] Storage object manifest JSON criado com metadados
- [ ] Integridade validada em restore local de teste
- [ ] Arquivos backup armazenados local + Password Manager (service role key)

### B. Preview Environment Prep
- [ ] Preview project clonado e data sincronizada com Production
- [ ] Service role key de Preview confirmada
- [ ] Credenciais removidas de documentação (ANON_KEY local apenas)
- [ ] Equipe notificada de janela de indisponibilidade Preview (2-3h)

### C. Production Environment Safeguards
- [ ] Backup final executado em Production IMEDIATAMENTE antes de reset
- [ ] Maintenance window agendado (off-peak, com notificação stakeholders)
- [ ] Rollback plan revisado com SRE/DBA
- [ ] Communication template preparado para incidentes

### D. Migration Files Validation
- [ ] Todas as migrations Phase 0 revisadas para idempotência
- [ ] Scripts de data import (CSV→Tables) testados em ambiente local
- [ ] RLS policies Phase 0 confirmadas (sem `authenticated` fallback para internal data)
- [ ] Foreign key constraints validadas post-reset

---

## III. Sequência de Execução: Preview Environment

### Fase A: Foundation Reset (Preview)
**Duração Estimada:** 45–60 min

**Procedimento:**
```
1. Conectar ao Supabase Preview project
2. Executar "Reset Database" via Supabase dashboard
   - Limpa todos os schemas (public, auth, storage)
   - Reapplica migrations padrão Supabase (auth, storage schemas)
   - Reapplica migrations do projeto (supabase/migrations/*.sql)

3. Validar estrutura pós-reset:
   - Tables principais recridas (verificar count)
   - Views recriadas (verificar sintaxe)
   - Funções recriadas
   - RLS policies reapplicadas
```

**Verificação Pós-Reset:**
- [ ] Schema public criado com tabelas base
- [ ] Storage bucket recriado
- [ ] auth.users table vazia (esperado)
- [ ] Sem erros em migration application
- [ ] Advisor security: Novos achados P0 (esperado, serão corrigidos em Foundation)

### Fase B: Foundation RLS Implementation (Preview)
**Duração Estimada:** 30–45 min

**Objetivo:** Implementar RLS sem anonymous fallback para dados internos (Option B)

**Tabelas Críticas (Categoria A):**
```
projects, clients, project_members, contracts
revenue_records, revenue_installments, revenue_events
proposals, proposal_items
opportunities, opportunity_services
profiles, user_roles
documents, bim3d_analyses, floor_plans, rdo_reports, video_analyses
services_catalog, brand_assets, compliance_checks, due_diligence
storage.objects
```

**Estratégia RLS por Categoria:**

#### A1: Dados de Projeto (project_id scoped)
- `projects`: `authenticated` + `(project_id IN select id from projects where owner_id = auth.uid())`
- `project_members`: `authenticated` + `(project_id IN select project_id from project_members where user_id = auth.uid())`
- `documents`: `authenticated` + `(project_id IN select project_id from project_members where user_id = auth.uid())`
- `floor_plans`, `rdo_reports`, `video_analyses`: Similar scoping por project_id + membership

**RLS Mínimo Requerido:**
```sql
-- Exemplo template para table project-scoped
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_projects" ON projects
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND auth.jwt()->>'is_anonymous' = 'false'
    AND owner_id = auth.uid()
  );

CREATE POLICY "users_update_own_projects" ON projects
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' 
    AND auth.jwt()->>'is_anonymous' = 'false'
    AND owner_id = auth.uid()
  );

CREATE POLICY "members_view_team_projects" ON projects
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND auth.jwt()->>'is_anonymous' = 'false'
    AND id IN (select project_id from project_members where user_id = auth.uid())
  );
```

#### A2: Dados de Faturamento (revenue_*)
- `revenue_records`, `revenue_installments`, `revenue_events`: Scoped to `authenticated` + elevated roles (manager/finance)
- Sem fallback `authenticated` broad → Requer explicit role grant

#### A3: Dados de Identidade
- `profiles`: `authenticated` + `(user_id = auth.uid())`
- `user_roles`: `authenticated` + `(user_id = auth.uid())` ou elevated role for management

#### A4: Dados Internos sem project_id (Categoria A3/A4)
- `brand_assets`, `compliance_checks`, `due_diligence`: `authenticated` + `is_elevated_role(auth.uid())` custom function
- Sem fallback broad → Admin-only access

#### Storage (storage.objects)
```sql
CREATE POLICY "authenticated_users_view_bucket" ON storage.objects
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND auth.jwt()->>'is_anonymous' = 'false'
    AND bucket_id = 'project-documents'
  );
```

**Verificação Pós-RLS:**
- [ ] Cada tabela Categoria A com mínimo 1 policy `authenticated + is_anonymous = false`
- [ ] Sem fallback `USING (true)` para dados internos
- [ ] Service role (`service_role` header) pode byppassar RLS (verificado)
- [ ] Anonymous role (se habilitado) bloqueado de tabelas internas
- [ ] Test: anon user NOT pode SELECT projects, revenue_records, documents

### Fase C: Data Import (Preview)
**Duração Estimada:** 60–90 min (depende do volume)

**Procedimento:**

```sql
-- 1. Desabilitar triggers e constraints temporariamente
ALTER TABLE projects DISABLE TRIGGER ALL;
ALTER TABLE revenue_records DISABLE TRIGGER ALL;
-- ... desabilitar para todas as tabelas Categoria A+B

-- 2. Importar data from CSV/JSON-L backups
-- Via supabase-cli ou pg_restore (se backup era pg_dump)
-- Exemplo com CSV:
COPY projects (id, name, owner_id, created_at, updated_at) 
FROM '/path/to/projects.csv' CSV HEADER;

-- 3. Validar counts
SELECT COUNT(*) FROM projects; -- Comparar com backup count
SELECT COUNT(*) FROM revenue_records;
-- ... para cada tabela

-- 4. Reabilitar triggers e constraints
ALTER TABLE projects ENABLE TRIGGER ALL;
-- ... reabilitar para todas as tabelas

-- 5. Validar foreign keys
SELECT * FROM projects WHERE owner_id NOT IN (SELECT id FROM profiles);
-- Se algum resultado, executar remediation ou rollback
```

**Validação de Integridade:**
- [ ] Row count matches backup para cada tabela
- [ ] Foreign keys sem orphans (ou decidir remediation)
- [ ] Timestamps preservados (created_at, updated_at)
- [ ] UUIDs únicos e válidos
- [ ] No soft_deleted data (filter active records only)

### Fase D: RLS Testing em Preview (48-72h pós-import)
**Duração Estimada:** 2–4 horas de testes

**Test Cases por Role:**

#### Role: `anon` (anonymous)
```
1. SELECT projects → BLOQUEADO (0 rows)
2. SELECT documents → BLOQUEADO (0 rows)
3. SELECT revenue_records → BLOQUEADO (0 rows)
4. SELECT storage.objects → BLOQUEADO (0 rows)
5. Expected result: All queries return 0 rows or permission denied
```

#### Role: `authenticated` (com is_anonymous = false)
```
1. SELECT projects WHERE owner_id = current_user
   → PERMITIDO (rows retornadas)
2. SELECT revenue_records
   → BLOQUEADO se user não é finance/manager (depende da policy)
3. SELECT documents WHERE project_id IN (select ... project_members)
   → PERMITIDO (rows de projetos do user)
4. UPDATE projects SET name = '...' WHERE id = own_project
   → PERMITIDO
5. UPDATE projects WHERE owner_id != current_user
   → BLOQUEADO
```

#### Role: `service_role` (server-side)
```
1. SELECT projects
   → PERMITIDO (todos os rows, bypassa RLS)
2. INSERT INTO projects
   → PERMITIDO (sem RLS check)
3. DELETE FROM projects
   → PERMITIDO (sem RLS check)
```

**Test Tool:**
- Usar `supabase-cli` com `--local` ou Supabase Studio client connections
- Para cada test case, registrar: role, query, expected result, actual result, status (✅/❌)
- Se algum teste falhar, investigar e corrigir RLS policy antes de Production

### Fase E: Advisor Security Re-validation (Preview)
**Duração Estimada:** 15–30 min

**Esperados Após Foundation:**
- P0 `anonymous_access_policies`: ✅ RESOLVIDO (anonymous bloqueado)
- P0 `security_definer_views`: ✅ RESOLVIDO (já corrigido em C.1)
- P0 `rls_policy_always_true`: ✅ RESOLVIDO (policies não permissivas)
- P1/P2: Podem permanecer (fora do escopo Phase 0)

**Se Advisor retornar novos P0:**
- [ ] Parar. Investigar policy.
- [ ] Corrigir em Preview.
- [ ] Re-teste RLS.
- [ ] SÓ então aprovar para Production.

---

## IV. Validação Production: Staged Rollout

### Fase F: Production Foundation Reset (PRODUCTION)
**Duração Estimada:** 1–2 horas

**Pré-Reset Checklist:**
- [ ] Preview validation PASSADA completamente
- [ ] Backup final Production executado
- [ ] Maintenance window comunicado
- [ ] Team on-call disponível

**Procedimento:**
```
1. Maintenance mode ativado (ou put app behind status page)
2. Final backup Production executado
3. Execute reset via Supabase dashboard (mesma sequência que Preview)
4. Aplicar migrations Phase 0 (RLS policies, custom functions)
5. Validar post-reset (schemas, tables, functions criadas)
6. Proceder para data import IMEDIATAMENTE (minimizar downtime)
```

### Fase G: Production Data Import
**Duração Estimada:** 60–120 min

**Mesma sequência que Preview (Fase C):**
- Disable triggers
- Import data from backups
- Validate counts
- Re-enable triggers
- Check foreign keys

**Success Criteria:**
- [ ] Row counts match backups (±5% tolerance para eventual cleanup)
- [ ] No foreign key orphans
- [ ] All timestamps preserved
- [ ] Zero import errors

### Fase H: Production RLS Validation (Smoke Test)
**Duração Estimada:** 30–45 min

**Lightweight Test Suite (não replicar Fase D):**
1. Anon user: SELECT projects → 0 rows ✅
2. Anon user: SELECT documents → permission denied ✅
3. Authenticated user: SELECT own projects → rows ✅
4. Authenticated user: SELECT projects owned by others → 0 rows ✅
5. Service role: SELECT projects → all rows ✅

**If any test fails:**
- [ ] ROLLBACK immediately (Fase I)
- [ ] Investigate + fix in Preview
- [ ] Retry Production in next maintenance window

### Fase I: Rollback Procedure (If Needed)
**Duração Estimada:** 30–60 min

**Trigger de Rollback:**
- Teste crítico falha em Production
- Data integrity issue descoberto
- RLS bloqueando acesso legítimo

**Sequência Rollback:**
```sql
-- 1. Restaurar backup pré-reset via pg_restore
-- Conectar como service_role com credencial segura
pg_restore -U postgres -d supabase_production \
  --clean --if-exists \
  /path/to/backup_pre_reset.sql.gz

-- 2. Validar integridade pós-restore
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM auth.users WHERE auth.users.id IN (...);

-- 3. Verificar RLS policies são políticas antigas
SELECT policyname FROM pg_policies WHERE tablename = 'projects';

-- 4. Revert App connection strings (se necessário)
-- Reapply old ANON_KEY e SERVICE_ROLE_KEY

-- 5. Teste smoke (mesma Fase H)

-- 6. Comunicar status
```

**Fallback Plan:**
- Se rollback de database não restaurar estado válido:
  - Restore from backup anterior ao Phase 0
  - Contactar Supabase support se backup corrompido
  - Contingency: Manual data re-entry para dados críticos (última resort)

---

## V. Critérios Phase 1: Aprovação e Readiness Gate

### Security & RLS
- [ ] Advisor P0 = 0 findings (anonymous + security_definer + policy_always_true)
- [ ] Cada tabela Categoria A tem mínimo RLS `authenticated + is_anonymous = false`
- [ ] Anon role bloqueado de internal data tables
- [ ] Service role pode bypass (verificado)
- [ ] Smoke test Production PASSADO

### Data Integrity
- [ ] Row counts ±5% de backup (tolerance para cleanup)
- [ ] Foreign key constraints sem orphans
- [ ] Timestamps preserved (created_at, updated_at)
- [ ] No data loss em Categorias A+B (verificado pós-import)

### Operational Readiness
- [ ] App funcionando com nova RLS policies
- [ ] Logged-in users conseguem acessar own data
- [ ] No "permission denied" para queries legítimas
- [ ] Storage buckets accessible por authenticated users
- [ ] Background jobs (if any) executando com service_role (test)

### Stakeholder Sign-off
- [ ] Owner confirma segurança aceitável
- [ ] DBA/SRE assina off no rollback plan
- [ ] Team comunicado de novo RLS behavior
- [ ] Support team treinado em troubleshooting

### Phase 1 Readiness Statement
```
Após aprovação acima:

"Phase 0 Foundation Reset CONCLUÍDO COM SUCESSO

- Segurança: P0 PASS ✅
- Dados: Integridade validada ✅
- RLS: Implementado sem anonymous fallback ✅
- Operacional: Smoke tests passados ✅
- Aprovação: [Owner], [SRE], [DBA] ✅

READINESS: Production Foundation estável.
Próximo: Phase 1 – Feature development em nova foundation."
```

---

## VI. Documentação & Observability

### Logs & Audit Trail
- Cada passo de execução registrado com timestamp
- Migration execution logs salvos
- Import statistics (rows processed, errors, duration)
- RLS test results (role, query, outcome)
- Rollback (if executed) documentado completamente

### Handoff Documentation
- Admin guide: "How to reset Foundation" (para futuros resets)
- RLS policies reference (which policy applies to which table)
- Backup location & restore procedure (para futuros backups)
- Service role key storage location (Password Manager)

---

## VII. Risk Mitigation Reiterada

### Risco: Perda de Dados em Import
**Mitigação Específica:**
- Pre-import row count validation
- Post-import row count validation (±5%)
- Test restore em ambiente local ANTES de Production

### Risco: RLS Bloqueando Acesso Legítimo
**Mitigação Específica:**
- 48-72h Preview testing com todos os roles
- Smoke test Production ANTES de maintenance window encerrar
- Quick rollback procedure documented

### Risco: Downtime Prolongado
**Mitigação Específica:**
- Estimativas 1–2h Production (vs 4–6h sem validação)
- Preview reset paralelo + sequential Production
- On-call team disponível durante execução

---

## VIII. Timeline Estimada

| Etapa | Ambiente | Duração | Agendamento |
|-------|----------|---------|-------------|
| Backup & Export | Local | 2-4h | T-2 days |
| Preview Reset | Preview | 1h | T-1 day |
| Preview RLS | Preview | 0.5h | T-1 day |
| Preview Import | Preview | 1-1.5h | T-1 day |
| Preview Testing | Preview | 2-4h | T-1 to T day |
| Production Reset | Production | 1-2h | T (off-peak) |
| Production Import | Production | 1-2h | T (off-peak) |
| Production Testing | Production | 0.5h | T (off-peak) |
| **Total Downtime** | **Production** | **2-4h** | **T (off-peak window)** |

---

## IX. Decisões Finais do Owner (Necessárias pré-execução)

- [ ] **Decisão 1:** Timeline confirmada (Opção A: 4-6 semanas; Opção B: data específica; Opção C: após PR #84/#87)
- [ ] **Decisão 2:** Data preservation level (Opção A: A+B+C+D; Opção B: A+B+D; Opção C: A+D)
- [ ] **Decisão 3:** Anonymous access (Opção B CONFIRMADA: Disable em Auth > Providers)
- [ ] **Decisão 4:** Validação strategy (Opção A RECOMENDADA: Preview first, dann Prod staged)

---

## X. Metadados Documento

- **Versão:** 1.0 (Draft)
- **Criado em:** 2026-06-03
- **Tipo:** Plano de Execução Pré-Autorização
- **Escopo:** Phase 0 Foundation Reset (Option B)
- **Aprovação Requerida:** Owner + SRE/DBA
- **Merge Bloqueado:** Até aprovação final de segurança

