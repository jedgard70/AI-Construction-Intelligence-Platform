# Handoff Security Remaining After Codex Limit

Data: 2026-06-02

## Estado principal

- `origin/main` atual no momento do handoff: `df50b46 fix: harden third group of permissive RLS policies`
- PRs mergeados nesta linha de trabalho:
  - `#74` ArchVis RLS hardening
  - `#75` SECURITY DEFINER views hardening
  - `#76` policies true group 1
  - `#77` policies true group 2
  - `#78` policies true group 3

## PR group 4

- Status: `aberto / aguardando commit e PR final` no momento deste handoff
- Resultado técnico desejado: `rls_policy_always_true = 0`
- Tabelas tratadas:
  - `public.bim3d_analyses`
  - `public.prompt_versions`
  - `public.video_projects`

## P0 restantes

- `auth_allow_anonymous_sign_ins`: 39
- `anon_security_definer_function_executable`: 4
- `function_search_path_mutable`: 5

## Recomendacao

1. decidir `Allow anonymous sign-ins`;
2. corrigir as funcoes com `search_path` mutavel;
3. rodar QA final e revalidar advisors.
