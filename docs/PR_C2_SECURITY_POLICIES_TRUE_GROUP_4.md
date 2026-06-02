# PR C.2 Security Policies True Group 4

Data: 2026-06-02
Base: `origin/main` apos PR #78

## Objetivo

Fechar o ultimo grupo de policies `rls_policy_always_true` remanescentes:
- `public.bim3d_analyses`
- `public.prompt_versions`
- `public.video_projects`

## Mudanca aplicada

Migration aplicada no Supabase real:
- `supabase/migrations/20260602213000_qa_real_003_c2_policies_true_group_4.sql`

Estrutura da remediacao:
- removeu o fallback permissivo `auth_all_bim3d_analyses`;
- removeu o fallback permissivo `service_role_all` em `prompt_versions`;
- removeu o fallback permissivo `auth_all_video_projects`;
- substituiu por policies simples para `authenticated` com condicao nao-constante (`auth.uid() is not null`).

## Resultado

Advisor atual:
- `rls_policy_always_true = 0`

## Build

Build local validado com:
- `NEXT_DISABLE_BUILD_WORKER=1 npm run build -- --webpack`

## Risco

Risco operacional:
- baixo a medio, porque a mudanca restringe acesso de visitante nessas tabelas e pode exigir login onde antes havia acesso amplo.

Risco de seguranca:
- reduzido, porque elimina o fallback permissivo que o advisor apontava.

## Recomendacao

Pode seguir para PR limpo e mergear quando os checks do GitHub ficarem verdes.
