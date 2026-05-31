# Roadmap Oficial — AI Construction Intelligence Platform

**Última atualização:** 31 de maio de 2026

---

## Concluído

### Pacote 001 — Fundação
- [x] Estrutura Next.js + Tailwind + Supabase
- [x] Dashboard com 6 perfis (RBAC)
- [x] Módulo de Projetos (CRUD + EVM)
- [x] Módulo de Qualidade (NCIs)
- [x] RDO (Relatório Diário de Obra)
- [x] Módulo Jurídico (contratos, compliance, due diligence, assinatura Lumin)
- [x] Orçamento com Curva S e EVM

### Pacote 002 — Revenue + IA

- [x] **S1 — BIM Ops:** clash detection, workflow, US market feasibility
- [x] **S2 — Jurídico + Lumin:** e-signature integrada
- [x] **S3 — Sales Pipeline:** leads, copywriting IA, campanhas
- [x] **S4 — Studio 3D Plantas:** upload, render Gemini, paleta, marketing
- [x] **S5 — Revenue Engine:** tabelas, APIs, dashboard financeiro
- [x] **S5 — Recuperacao limpa:** branch isolada baseada em `origin/main`
- [x] **PR B — Foundation Operacional:** AgentWindow, ApexCopilot, ApexShell, Nova Análise, Mission Control, Project Workspace, Agent Events API e integrações BIM/Plantas. Commit main: `5e45e76`.

---

## Próximos Passos

### Pacote 002-S6 — CRM Completo (planejado)
- [ ] Endurecer autenticacao server-side do Revenue Engine
- [ ] Tabelas: `opportunities`, `proposals`, `contracts`
- [ ] Pipeline visual Kanban
- [ ] Integração proposals → contracts → revenue

### Pacote 003 — Autenticação e Multi-tenant (planejado)
- [ ] login.js completo com Supabase Auth
- [ ] Isolamento por organização
- [ ] Convite de usuários
- [ ] Papéis: gestor_qualidade, investidor

### Pacote 004 — Relatórios e Exportação (planejado)
- [ ] Relatório executivo PDF por projeto
- [ ] Exportação de dashboard financeiro
- [ ] Histórico de KPIs em gráficos

### Pacote 005 — Integrações Externas (planejado)
- [ ] Webhooks de saída configuráveis
- [ ] API pública RESTful documentada
- [ ] Integração com ERPs (TOTVS, SAP)

---

## Arquitetura de Dados

```
clients
  └── revenue_records ────── revenue_installments
        └── revenue_events   (audit imutável)

projects
  └── project_kpis
  └── occurrences (NCIs, RDO)
  └── bim_documents
  └── revenue_records (FK opcional)

profiles
  └── project_members
  └── audit_log
```
