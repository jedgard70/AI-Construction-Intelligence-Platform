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
- [x] **002-E2E — Commercial Flow Validation:** migration aplicada no Supabase real, revenue_* confirmadas, fluxo opportunity→service→proposal→contract→revenue→dashboard operacional com token real
- [x] **PR B — Foundation Operacional:** AgentWindow, ApexCopilot, ApexShell, Nova Análise, Mission Control, Project Workspace, Agent Events API e integrações BIM/Plantas. Commit main: `5e45e76`.

---

## Próximos Passos

### Pacote 002-S6 — CRM Completo (planejado)
- [x] Endurecer autenticacao server-side do Revenue Engine (concluído no 002-E2E)
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

## Trilho Help AI Advanced (PR1-PR5)

- [x] PR1 — Backend Prompt Governance
- [x] PR2 — Role/Seat Enforcement
- [x] PR3 — ApexCopilot UI Hardening (cliente leve, políticas no backend)
- [x] PR4 — AgentWindow + Mission Control Integration
- [ ] PR5 — Safety + Audit Trail guardrails (em PR)

### Próximos passos específicos do Help AI
- [ ] E2E real owner/admin com JWT e cenários de assento
- [ ] Persistência estruturada de audit trail (sem vazar conteúdo sensível)
- [ ] Regras de publicação externa por conector com workflow de aprovação

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
