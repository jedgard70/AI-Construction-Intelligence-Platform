# ACIP — Migrations Supabase  |  v5.1 Enterprise

## Visão geral

```
supabase/migrations/
├── 001_extensions.sql     → Extensões PostgreSQL (uuid-ossp, pgcrypto, pg_trgm)
├── 002_enums.sql          → Todos os ENUMs (roles, status, severity, formatos BIM…)
├── 003_profiles.sql       → Tabela profiles + trigger auto-criação ao registrar
├── 004_roles_permissions.sql → Roles, permissões, seed dos 4 perfis do CORE_SYSTEM
├── 005_projects.sql       → Projetos, membros, documentos BIM, ocorrências, KPIs
├── 006_memory_agents.sql  → Memory system (curto/longo prazo) + agentes IA
├── 007_audit_log.sql      → Audit log imutável + função log_audit()
├── 008_rls.sql            → Row Level Security — cada role vê só o que pode
└── 009_seed_demo.sql      → Dados de demonstração (NÃO executar em produção)
```

---

## 1. Pré-requisitos

- Conta no [supabase.com](https://supabase.com) com projeto criado  
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado: `npm install -g supabase`

---

## 2. Executar via Supabase CLI (recomendado)

```bash
# 1. Logue na sua conta
supabase login

# 2. Vincule ao projeto remoto
supabase link --project-ref SEU_PROJECT_REF

# 3. Execute todas as migrations em ordem
supabase db push

# 4. Verifique o status
supabase migration list
```

---

## 3. Executar manualmente via SQL Editor

Abra o **SQL Editor** no dashboard do Supabase e execute os arquivos em ordem:

| Ordem | Arquivo | Ação |
|-------|---------|------|
| 1 | `001_extensions.sql` | Cole e execute |
| 2 | `002_enums.sql` | Cole e execute |
| 3 | `003_profiles.sql` | Cole e execute |
| 4 | `004_roles_permissions.sql` | Cole e execute |
| 5 | `005_projects.sql` | Cole e execute |
| 6 | `006_memory_agents.sql` | Cole e execute |
| 7 | `007_audit_log.sql` | Cole e execute |
| 8 | `008_rls.sql` | Cole e execute |
| 9 | `009_seed_demo.sql` | **Apenas em staging/dev** |

> ⚠️  O arquivo `009_seed_demo.sql` tem proteção automática:  
> se o nome do banco contiver "prod", ele lança um erro e não executa.

---

## 4. Diagrama do banco

```
auth.users (Supabase)
    │
    ▼
profiles ──────────────── roles ──── role_permissions ──── permissions
    │                                                           │
    ├─── project_members ──────────── projects                 │
    │                                    │                     │
    │                            ┌───────┴──────────┐          │
    │                     bim_documents   occurrences          │
    │                                    │                     │
    │                             project_kpis                 │
    │                                                          │
    ├─── user_permissions ───────────────────────────────── permissions
    │
    ├─── memory_short_term
    ├─── memory_long_term
    │
    ├─── ai_agent_executions ──── ai_agents
    │
    └─── audit_log
```

---

## 5. Permissões por role (resumo)

| Permissão | Eng. Campo | Coordenador | Gest. Financeiro | Diretor |
|-----------|:----------:|:-----------:|:----------------:|:-------:|
| leitura_bim | ✅ | ✅ | ❌ | ✅ |
| upload_bim | ❌ | ✅ | ❌ | ✅ |
| registro_ocorrencias | ✅ | ✅ | ❌ | ✅ |
| aprovacao_compras | ❌ | ✅ | ❌ | ✅ |
| leitura_orcamento | ❌ | ✅ | ✅ | ✅ |
| aprovacao_pagamentos | ❌ | ❌ | ✅ | ✅ |
| roi_analysis | ❌ | ❌ | ✅ | ✅ |
| override_decisions | ❌ | ❌ | ❌ | ✅ |
| acesso_total | ❌ | ❌ | ❌ | ✅ |

---

## 6. Variáveis de ambiente necessárias

```env
# .env (frontend)
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

---

## 7. Próximas migrations sugeridas

- `010_notifications.sql` — tabela de notificações por canal (email, SMS, WhatsApp)
- `011_investment_reports.sql` — relatórios do módulo investment_intelligence
- `012_bim_clash_results.sql` — resultados detalhados de clash detection
- `013_storage_policies.sql` — políticas de Storage para arquivos BIM
