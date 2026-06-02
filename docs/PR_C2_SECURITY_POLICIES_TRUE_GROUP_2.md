# PR C.2 Security P0 Policies True - Group 2

Data de inicio: 2026-06-02
Base: `origin/main` em `d95e1ecc2daddfc0aa88251628e1a9c722525600`

## Objetivo

Corrigir o proximo grupo pequeno de policies `rls_policy_always_true` sem hardening em lote e sem tocar em Revenue/Auth.

## Grupo selecionado

Tabelas:
- `public.floor_plans`
- `public.rdo_reports`
- `public.video_analyses`

## Motivo da selecao

As tres tabelas compartilham uma chave de escopo clara (`project_id`), o que permite substituir o fallback permissivo por policies baseadas em membership de projeto e papeis elevados.

## Mudanca aplicada

- removida a policy `auth_all_floor_plans`;
- removida a policy `auth_all_rdo_reports`;
- removida a policy `auth_all_video_analyses`;
- criadas policies escopadas de `SELECT`, `INSERT`, `UPDATE` e `DELETE` com base em:
  - membership de projeto;
  - papeis elevados (`diretor_executivo`, `coordenador_projetos`).

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

Medio. A reducao de permissividade pode revelar dependencias ocultas, mas o desenho ja preserva acesso por membership e papeis elevados.

## Status

Concluido para o grupo 2.

## Evidencia obtida

- a migration foi aplicada no Supabase real com sucesso;
- as policies `auth_all_floor_plans`, `auth_all_rdo_reports` e `auth_all_video_analyses` nao aparecem mais em `pg_policies`;
- o advisor remoto nao retorna mais `rls_policy_always_true` para essas tres tabelas;
- o build local passou.
