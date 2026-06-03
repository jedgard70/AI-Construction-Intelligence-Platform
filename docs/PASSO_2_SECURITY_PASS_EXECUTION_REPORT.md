# Passo 2 - Security PASS Execution Report

Data: 2026-06-02

Base:
- `origin/main`: `e4f9577bd0b1e88e313ba1b01dab1f6efacc6ac1`
- Branch de trabalho: `security/passo-2a-functions-hardening`
- Projeto Supabase real: `stjhkxwylqtihzflspqe`

## Objetivo

Executar o Passo 2 em pacote amplo controlado:

- 2A - Functions Hardening
- 2B - Anonymous Sign-ins / Anonymous Access
- 2C - Verificacao Final

Resultado: `Security PASS parcial`, com apenas uma pendencia controlada de configuracao Auth fora de migration SQL.

## Escopo alterado

Arquivos criados no pacote:

- `docs/PASSO_2A_SECURITY_FUNCTIONS_HARDENING.md`
- `docs/PASSO_2_SECURITY_PASS_EXECUTION_REPORT.md`
- `supabase/migrations/20260603002822_passo_2a_security_functions_hardening.sql`
- `supabase/migrations/20260603003549_passo_2_security_pass_hardening.sql`

Nao houve alteracao de:

- UI;
- package files;
- codigo de produto;
- Ebook/Revit;
- features novas.

Revenue/Auth funcional:

- nao houve alteracao de fluxo funcional de Revenue/Auth;
- houve hardening de policies e funcoes exigido por seguranca;
- `auth_leaked_password_protection` ficou pendente porque exige configuracao Auth/Attack Protection, nao migration SQL.

## Fase 2A - Functions Hardening

Achados antes:

- `function_search_path_mutable`: 5
- `anon_security_definer_function_executable`: 4
- `authenticated_security_definer_function_executable`: 4
- `extension_in_public`: 1

Tratamento aplicado:

- `search_path` explicito nas funcoes:
  - `public.claim_pending_tasks(integer)`
  - `public.handle_new_user()`
  - `public.set_nci_sequence()`
  - `public.has_project_access(uuid)`
  - `public.set_updated_at()`
- wrappers publicos `SECURITY INVOKER` para:
  - `public.current_role_acip()`
  - `public.get_my_role()`
- helpers privilegiados movidos para schema `private`:
  - `private.current_role_acip()`
  - `private.get_my_role()`
- revogado `EXECUTE` de `anon`/`authenticated` em funcoes `SECURITY DEFINER` expostas indevidamente;
- `pg_trgm` movido de `public` para `extensions` apos confirmar que nao havia indices trigram dependentes.

Resultado 2A:

- `function_search_path_mutable`: 0
- `anon_security_definer_function_executable`: 0
- `authenticated_security_definer_function_executable`: 0
- `extension_in_public`: 0

## Fase 2B - Anonymous Sign-ins / Anonymous Access

Fonte oficial usada para decisao:

- Supabase diferencia a `anon` API key de usuarios criados por anonymous sign-ins.
- Usuarios anonymous sign-in usam role Postgres `authenticated` e carregam claim JWT `is_anonymous`.
- A recomendacao oficial para distinguir esses usuarios em RLS e verificar `auth.jwt()->>'is_anonymous'`.

Auditoria local:

- nao foi encontrado uso de `signInAnonymously` no app;
- login e paginas publicas nao dependem de criar usuario anonymous sign-in;
- o acesso via anon key precisava ser preservado onde uma policy ja permitia acesso publico intencional.

Tratamento aplicado:

- migration `20260603003549_passo_2_security_pass_hardening.sql`;
- adiciona guarda nas policies reportadas pelo advisor:

```sql
coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
```

Efeito da guarda:

- usuario Supabase anonymous sign-in (`is_anonymous=true`) fica bloqueado;
- usuario autenticado permanente continua permitido quando a policy original permitia;
- acesso sem JWT via anon key permanece como antes quando a policy original era publica/intencional, porque a claim ausente avalia como `false`.

Resultado 2B:

- `auth_allow_anonymous_sign_ins`: 54 -> 0

## Fase 2C - Verificacao Final

Comando executado:

```text
npx supabase db advisors --linked --type security --output-format json --fail-on none
```

Resultado final do advisor remoto:

| Lint | Nivel | Quantidade |
| --- | --- | ---: |
| `auth_leaked_password_protection` | WARN | 1 |
| Total | WARN | 1 |

Achados zerados no pacote:

- `function_search_path_mutable`: 5 -> 0
- `anon_security_definer_function_executable`: 4 -> 0
- `authenticated_security_definer_function_executable`: 4 -> 0
- `extension_in_public`: 1 -> 0
- `auth_allow_anonymous_sign_ins`: 54 -> 0

## Pendencia controlada

### `auth_leaked_password_protection`

Status: pendente controlada.

Motivo:

- e configuracao de Supabase Auth/Attack Protection;
- nao e uma migration SQL segura/idempotente no repo;
- nao deve ser improvisada via SQL;
- deve ser habilitada no painel Supabase ou por mecanismo oficial de configuracao Auth, com registro separado.

Recomendacao objetiva:

1. habilitar leaked password protection no Supabase Auth/Attack Protection;
2. reexecutar:

```text
npx supabase db advisors --linked --type security --output-format json --fail-on none
```

3. se o advisor retornar `[]`, declarar `Security PASS` completo.

## Migration chain

Observacao operacional:

- `supabase migration list --linked` continua mostrando desalinhamento historico de chain;
- por isso, nao foi usado `supabase db push`;
- as migrations deste pacote foram aplicadas isoladamente no Supabase real via conector Supabase.

Essa decisao evitou aplicar migrations antigas fora do escopo do Passo 2.

## Status final

Status tecnico: `Security PASS parcial`.

Leitura objetiva:

- todos os achados SQL/RLS/funcoes/extensao do pacote foram corrigidos;
- restou apenas uma configuracao Auth externa ao SQL;
- nao houve alteracao de UI, package, feature nova, Ebook/Revit ou fluxo funcional amplo de Revenue/Auth.

