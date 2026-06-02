# PR C.1 Security Definer Views Hardening

Data de inicio: 2026-06-02
Base: `origin/main` em `a291d2bef8899de74a235aef5bb1be75c2399c19`

## Objetivo

Remover os dois achados P0 de `SECURITY DEFINER VIEW` sem misturar Revenue/Auth, sem mexer em UI e sem corrigir policies em lote.

Views alvo:
- `public.quality_nci_view`
- `public.budget_items_view`

## Escopo deste PR

- `supabase/migrations/20260602203314_qa_real_003_c1_security_definer_views_hardening.sql`
- `docs/PR_C1_SECURITY_DEFINER_VIEWS_HARDENING.md`
- `docs/QA_SUPABASE_SECURITY.md` apenas evidencia atualizada
- `docs/PR_C_SECURITY_P0_REMAINING_PLAN.md` apenas status

## Estrategia aplicada

As duas views sao simples `SELECT` sobre tabelas base e foram endurecidas com:

- `ALTER VIEW ... SET (security_invoker = true)`

Isso faz a view respeitar as policies/RLS do usuario chamador, preservando o contrato de colunas e evitando o comportamento elevativo de `SECURITY DEFINER`.

## Garantias

- sem Revenue/Auth
- sem CRM APIs
- sem Storage
- sem Owner Command
- sem Apex AI
- sem package files
- sem UI
- sem recriacao destrutiva das views

## Validacoes previstas

- `supabase db push --linked`
- advisor remoto do Supabase
- `NEXT_DISABLE_BUILD_WORKER=1 npm run build -- --webpack`

## Evidencia obtida

- a migration foi aplicada no Supabase real com sucesso;
- o advisor de seguranca nao retornou mais os achados de `SECURITY DEFINER VIEW` para `public.quality_nci_view` e `public.budget_items_view`;
- a propriedade `security_invoker=true` foi confirmada em ambas as views via `pg_class.reloptions`;
- o build local passou.

## Risco

Baixo. A mudanca nao altera colunas nem contratos publicos da view; ela apenas faz a leitura seguir a seguranca do chamador.

## Status

Concluido para as duas views alvo.
