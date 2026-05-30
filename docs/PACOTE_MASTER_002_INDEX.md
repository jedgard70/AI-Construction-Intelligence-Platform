# Pacote Master 002 — Índice

**Projeto:** AI Construction Intelligence Platform
**Última atualização:** 30 de maio de 2026

---

## Sub-pacotes

| Sub-pacote | Nome | Status | Arquivos |
|-----------|------|--------|---------|
| S1 | BIM Ops | ✅ | `pages/bim-ops.tsx` |
| S2 | Jurídico + Lumin | ✅ | `pages/juridico/`, `pages/api/juridico/` |
| S3 | Sales Pipeline | ✅ | `pages/vendas.tsx`, `pages/api/sales/` |
| S4 | Studio 3D Plantas | ✅ | `pages/plantas.js`, `pages/api/render.js` |
| **S5** | **Revenue Engine** | **✅** | Ver abaixo |

---

## S5 — Revenue Engine

### Banco de Dados
```
database/011_revenue_engine.sql
  - ENUMs: revenue_status, installment_status, revenue_currency
  - Tabelas: revenue_records, revenue_installments, revenue_events
  - RLS: gestor_financeiro + diretor_executivo
```

### APIs
```
pages/api/crm/revenue/index.js       GET lista + POST criar
pages/api/crm/revenue/[id].js        GET detalhe + PUT + DELETE
pages/api/crm/revenue/dashboard.js   GET KPIs + funil + parcelas
```

### Páginas
```
pages/crm/revenue.tsx    Dashboard financeiro + CRUD
```

### Documentação
```
docs/CODEX_POLICY.md
docs/PACOTE_MASTER_002_S5_IMPLEMENTACAO.md
docs/PACOTE_MASTER_002_S5_RECUPERACAO_CLEAN_BRANCH.md
docs/PACOTE_MASTER_STATUS_GERAL.md
docs/ROADMAP_OFICIAL.md
docs/PACOTE_MASTER_002_INDEX.md (este arquivo)
```

---

## Fluxo de Dados S5

```
Contract signed
    │
    ▼
POST /api/crm/revenue
    { status: 'contracted', amount_contracted, contract_signed_date }
    │
    ▼
revenue_records.id
    │
    ▼
revenue_installments (N parcelas)
    │
    ├── due_date vencido → status: 'overdue'
    ├── paid_date preenchido → status: 'paid'
    │
    ▼
revenue_events (audit trail imutável)
    │
    ▼
GET /api/crm/revenue/dashboard
    KPIs: forecast | contracted | invoiced | received | overdue
    Funil: forecast→contracted→invoiced→paid (% conversão)
```

---

## Pendências S5

- [ ] Aplicar `database/011_revenue_engine.sql` no Supabase
- [ ] Criar rota `/api/crm/revenue/[id]/installments` (gerar + pagar parcelas)
- [ ] Adicionar `/crm/revenue` ao sidebar de navegação
- [ ] Integrar com tabela `contracts` quando criada (Pacote S6)
- [ ] Aplicar endurecimento de autenticacao server-side nas APIs Revenue
