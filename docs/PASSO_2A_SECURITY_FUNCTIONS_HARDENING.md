# Passo 2A - Security Functions Hardening

Data: 2026-06-02

Base:
- `origin/main`: `e4f9577bd0b1e88e313ba1b01dab1f6efacc6ac1`
- PR anterior: `docs: audit current Security P0 state`
- Projeto Supabase real: `stjhkxwylqtihzflspqe`

## Objetivo

Corrigir em um pacote isolado os achados de funcoes e extensao apontados pelo Supabase Security Advisor:

- `function_search_path_mutable`
- `anon_security_definer_function_executable`
- `authenticated_security_definer_function_executable`
- `extension_in_public`

Este PR nao corrige `auth_allow_anonymous_sign_ins`.

## Escopo aplicado

Arquivos alterados:

- `supabase/migrations/20260603002822_passo_2a_security_functions_hardening.sql`
- `docs/PASSO_2A_SECURITY_FUNCTIONS_HARDENING.md`

Nao houve alteracao de:

- UI;
- package files;
- codigo de produto;
- Revenue/Auth funcional;
- anonymous sign-ins;
- Ebook/Revit.

## Funcoes afetadas

### `function_search_path_mutable`

Funcoes corrigidas com `search_path` explicito:

- `public.claim_pending_tasks(integer)` -> `public, pg_catalog`
- `public.handle_new_user()` -> `public, auth`
- `public.set_nci_sequence()` -> `public, pg_catalog`
- `public.has_project_access(uuid)` -> `public, auth`
- `public.set_updated_at()` -> `public, pg_catalog`

### `anon_security_definer_function_executable`

Funcoes reportadas antes:

- `public.current_role_acip()`
- `public.get_my_role()`
- `public.handle_new_user()`
- `public.rls_auto_enable()`

Tratamento:

- `public.current_role_acip()` passou a ser wrapper `SECURITY INVOKER`.
- `public.get_my_role()` passou a ser wrapper `SECURITY INVOKER`.
- helpers privilegiados foram movidos para schema privado:
  - `private.current_role_acip()`
  - `private.get_my_role()`
- `public.handle_new_user()` manteve `SECURITY DEFINER`, mas deixou de ser executavel por `anon` e `authenticated`.
- `public.rls_auto_enable()` manteve `SECURITY DEFINER`, mas deixou de ser executavel por `anon` e `authenticated`.

### `authenticated_security_definer_function_executable`

Mesmo conjunto tratado:

- `public.current_role_acip()`
- `public.get_my_role()`
- `public.handle_new_user()`
- `public.rls_auto_enable()`

Resultado esperado:

- nenhum desses helpers permanece como funcao `SECURITY DEFINER` executavel diretamente por `authenticated` no schema exposto `public`;
- wrappers publicos que precisam continuar existindo para RLS sao `SECURITY INVOKER`;
- execucao privilegiada fica encapsulada no schema `private`.

### `extension_in_public`

Extensao tratada:

- `pg_trgm`

Validacao previa:

- a extensao estava instalada em `public`;
- nao havia indice `gin_trgm_ops` ou `gist_trgm_ops` detectado em `pg_indexes`.

Tratamento:

- schema `extensions` criado se necessario;
- `pg_trgm` movido de `public` para `extensions`;
- `USAGE` em `extensions` concedido para `anon`, `authenticated` e `service_role` para preservar acesso aos operadores/funcoes da extensao se necessario.

## Aplicacao no Supabase real

Por causa da migration chain ja documentada como desalinhada, nao foi usado `supabase db push`, para evitar aplicar migrations antigas fora do escopo.

A migration 2A foi aplicada isoladamente no Supabase real pelo conector Supabase:

- migration name aplicada: `passo_2a_security_functions_hardening`
- resultado: `success: true`

Arquivo de migration versionado no repo:

- `supabase/migrations/20260603002822_passo_2a_security_functions_hardening.sql`

## Advisor antes

Auditoria anterior em `docs/PASSO_2_SECURITY_PASS_AUDITORIA_ATUAL.md`:

| Lint | Quantidade |
| --- | ---: |
| `auth_allow_anonymous_sign_ins` | 54 |
| `function_search_path_mutable` | 5 |
| `anon_security_definer_function_executable` | 4 |
| `authenticated_security_definer_function_executable` | 4 |
| `extension_in_public` | 1 |
| `auth_leaked_password_protection` | 1 |
| Total | 69 |

## Advisor depois

Comando executado:

```text
npx supabase db advisors --linked --type security --output-format json --fail-on none
```

Resumo depois da migration:

| Lint | Quantidade |
| --- | ---: |
| `auth_allow_anonymous_sign_ins` | 54 |
| `auth_leaked_password_protection` | 1 |
| Total | 55 |

Achados zerados nesta etapa:

- `function_search_path_mutable`: 5 -> 0
- `anon_security_definer_function_executable`: 4 -> 0
- `authenticated_security_definer_function_executable`: 4 -> 0
- `extension_in_public`: 1 -> 0

## Validacao SQL pos-aplicacao

Funcoes privadas:

- `private.current_role_acip()`:
  - `SECURITY DEFINER`
  - `search_path=public, auth`
  - `anon_execute=false`
  - `authenticated_execute=true`
- `private.get_my_role()`:
  - `SECURITY DEFINER`
  - `search_path=public, auth`
  - `anon_execute=false`
  - `authenticated_execute=true`

Wrappers publicos:

- `public.current_role_acip()`:
  - `SECURITY INVOKER`
  - `search_path=private, public, auth`
  - `anon_execute=false`
  - `authenticated_execute=true`
- `public.get_my_role()`:
  - `SECURITY INVOKER`
  - `search_path=private, public, auth`
  - `anon_execute=false`
  - `authenticated_execute=true`

Funcoes de trigger/event trigger:

- `public.handle_new_user()`:
  - `SECURITY DEFINER`
  - `search_path=public, auth`
  - `anon_execute=false`
  - `authenticated_execute=false`
- `public.rls_auto_enable()`:
  - `SECURITY DEFINER`
  - `search_path=pg_catalog`
  - `anon_execute=false`
  - `authenticated_execute=false`

Extensao:

- `pg_trgm` agora esta no schema `extensions`.

## Status Security apos 2A

Security PASS ainda nao foi atingido.

Restam:

- `auth_allow_anonymous_sign_ins`: 54 achados;
- `auth_leaked_password_protection`: 1 achado.

Proxima etapa recomendada:

1. manter anonymous sign-ins fora deste PR;
2. abrir pacote proprio para `auth_allow_anonymous_sign_ins`, dividido por dominio/tabela;
3. tratar `auth_leaked_password_protection` como configuracao Auth separada, com decisao explicita.

