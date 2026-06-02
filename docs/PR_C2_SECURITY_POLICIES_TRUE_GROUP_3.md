# PR C.2 Security P0 Policies True - Group 3

Data de inicio: 2026-06-02
Base: `origin/main` em `dea5f0f703a63b38104133a8688b08d33526f1f6`

## Objetivo

Corrigir o proximo grupo pequeno de policies `rls_policy_always_true` sem hardening em lote e sem tocar em Revenue/Auth.

## Grupo selecionado

Tabelas:
- `public.brand_assets`
- `public.compliance_checks`
- `public.due_diligence`

## Motivo da selecao

As tres tabelas sao internas e nao dependem de `project_id`; o caminho mais seguro e substituir o acesso amplo por policies de `authenticated` restritas a papeis elevados.

## Mudanca aplicada

- removida a policy `auth_all_brand_assets`;
- removida a policy `auth_all_compliance_checks`;
- removida a policy `auth_all_due_diligence`;
- criadas policies `SELECT`, `INSERT`, `UPDATE` e `DELETE` para `authenticated` com verificacao de papel elevado.

## Garantias

- migration idempotente;
- sem apagar dados;
- sem Revenue/Auth;
- sem UI;
- sem package files;
- sem hardening em lote.

## Validacoes previstas

- `supabase db push --linked`
- advisor remoto do Supabase
- `NEXT_DISABLE_BUILD_WORKER=1 npm run build -- --webpack`

## Risco

Medio. A mudanca reduz acesso amplo anteriormente permissivo, mas mantém o acesso para roles elevadas e elimina o `auth_all_*`.

## Status

Concluido para o grupo 3.

## Evidencia obtida

- a migration foi aplicada no Supabase real com sucesso;
- as policies `auth_all_brand_assets`, `auth_all_compliance_checks` e `auth_all_due_diligence` nao aparecem mais em `pg_policies`;
- o advisor remoto nao retorna mais `rls_policy_always_true` para essas tres tabelas;
- o build local passou.
