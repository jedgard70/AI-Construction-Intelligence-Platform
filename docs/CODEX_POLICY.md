# CODEX_POLICY — AI Construction Intelligence Platform

## Regras Absolutas de Desenvolvimento

1. **Não criar clones** do repositório ou workspace paralelo.
2. **Não criar pasta paralela** fora da estrutura oficial do projeto.
3. **Não criar arquitetura nova** sem aprovação registrada no PACOTE MASTER.
4. **Não duplicar** tabelas, APIs ou telas existentes.
5. **Não alterar escopo** sem registrar em `PACOTE_MASTER_STATUS_GERAL.md`.
6. **Seguir este CODEX_POLICY** em todas as sessões.
7. **Atualizar documentação** ao final de cada pacote implementado.
8. **Sincronizar** `Master.Package.Apex.original` ao final de cada sessão.

## Padrões de Código

### APIs
- Sempre validar `Authorization: Bearer <token>` → retornar 401 se ausente.
- Suportar modo demo (sem Supabase configurado): retornar `{ demo: true, data: [...] }`.
- Seguir padrão de `getSupabaseService()` com fallback graceful.
- Registrar eventos em tabelas de auditoria quando aplicável.

### Banco de Dados
- Migrations numeradas sequencialmente: `NNN_nome.sql` em `database/`.
- Todas as tabelas têm `created_at`, `updated_at` com trigger `set_updated_at()`.
- RLS habilitado em todas as tabelas públicas.
- ENUMs definidos com `CREATE TYPE IF NOT EXISTS`.

### Frontend
- Usar `'use client'` apenas quando necessário.
- Modo demo com localStorage como fallback quando Supabase indisponível.
- Chaves localStorage prefixadas com `atlas_`.
- Inline styles para consistência com o padrão existente do projeto.

### Convenções de Nomenclatura
```
Chaves localStorage: atlas_<entidade>_<sufixo>
API routes:          /api/<domínio>/<recurso>/[id]
Migrations:          NNN_nome_descritivo.sql
Páginas:             /pages/<domínio>/<página>.tsx
Eventos de audit:    <entidade>_<ação> (ex: revenue_record_created)
```

## Variáveis de Ambiente Necessárias

```bash
ANTHROPIC_API_KEY=sk-ant-...              # Obrigatório para IA
NEXT_PUBLIC_SUPABASE_URL=...              # Opcional (graceful degradation)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...  # Opcional
SUPABASE_SERVICE_ROLE_KEY=...             # Opcional (server-side)
SALES_WEBHOOK_URL=...                     # Opcional
LUMIN_API_KEY=...                         # Opcional
```

## Estrutura de Diretórios

```
/pages/                  → Rotas Next.js
  /api/                  → API routes
    /crm/revenue/        → Revenue Engine APIs
    /juridico/           → Módulo jurídico
    /agents/             → Orquestração de agentes
  /crm/                  → Páginas CRM
  /juridico/             → Páginas jurídico
/components/             → Componentes React
/lib/                    → Infraestrutura (supabase, observability, etc.)
/database/               → Migrations SQL numeradas
/docs/                   → Documentação do projeto
```
