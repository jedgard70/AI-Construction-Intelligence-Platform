# PACOTE MASTER 001-B — ENVIRONMENT, STORAGE & FINAL VALIDATION

Status: migration de storage aplicada no Supabase remoto e validacao avancou. O pacote ainda nao atende todos os criterios de aceite por falta de teste E2E autenticado com IDs reais de negocio.

## Bloco 1 — ENV server-side

### Envs necessarias

| Variavel | Local | Status local | Observacao |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Local + Vercel | Presente | Pode ir ao browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local + Vercel | Presente | Pode ir ao browser |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Local + Vercel | Presente | Pode ir ao browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Somente server/Vercel | Ausente | Nunca usar em componente/browser |

### Onde configurar no Vercel

Vercel Dashboard -> Project Settings -> Environment Variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- marcar para Production, Preview e Development conforme ambiente.
- nunca criar variavel com prefixo `NEXT_PUBLIC_` para service role.

### Teste `/api/agent-events/log`

Sem token:

```text
HTTP 401
{"error":"Authorization Bearer token obrigatorio."}
```

Resultado esperado com token real + `SUPABASE_SERVICE_ROLE_KEY`:

- valida sessao do usuario;
- valida acesso ao `project_id`;
- grava em `agent_events` usando service role no server;
- retorna `event.id`.

## Bloco 2 — Storage plan

Implementacao preparada e executada no remoto.

Arquivos criados:

- `supabase/migrations/20260529_prepare_project_files_storage.sql`
- `pages/api/storage/signed-url.ts`

Bucket proposto:

| Item | Valor |
|---|---|
| Nome | `project-files` |
| Publico | Nao |
| Path | `projects/{project_id}/intake/{timestamp}-{filename}` |
| Metadata | `documents.file_path`, `documents.ai_entities.storage_bucket` |
| Acesso | signed URL via `/api/storage/signed-url` |

Execucao realizada em 2026-05-29:

```text
supabase link --project-ref stjhkxwylqtihzflspqe
supabase migration repair --status reverted 20260522224041 20260522224323 20260522225616 20260522230329 20260522230439 20260522231025 20260522231554 20260522232038 20260522232558 20260523114713 20260523114800 --linked
supabase migration up --linked
```

Resultado:

- migration `20260529_prepare_project_files_storage.sql` aplicada com sucesso;
- bucket privado `project-files` e policies de `storage.objects` criados por SQL de migration;
- sem abertura de bucket publico.

Observacao de evidencias:

- `supabase migration list --linked` confirmou `Remote 20260529`;
- dump remoto de schema/data nao foi possivel nesta sessao por ausencia de Docker Desktop no host do CLI.

## Bloco 3 — Nova Analise validacao final

Codigo atualizado:

- permite selecionar cliente existente;
- permite criar cliente pela propria tela usando `NewClientModal`;
- cria `projectId` antes do registro;
- usa path padrao de storage em `documents.file_path`;
- registra metadata com `storage_bucket = project-files` e `storage_status = prepared_pending_bucket`;
- chama `/api/agent-events/log` para registrar evento de intake.

Validacao automatica:

| Etapa | Status |
|---|---|
| `/nova-analise` compila | OK |
| Upload UI com usuario logado | Pendente (nao executado nesta rodada) |
| Criar projeto real | Pendente teste autenticado |
| Criar document real | Pendente teste autenticado |
| Redirecionar `/projeto/[id]` | Codigo pronto, nao validado visualmente |
| AgentWindow gravar evento | API pronta; pendente teste autenticado |

Smoke tests de API (2026-05-29):

```text
POST /api/storage/signed-url -> HTTP 401 {"error":"Authorization Bearer token obrigatorio."}
POST /api/agent-events/log -> HTTP 401 {"error":"Authorization Bearer token obrigatorio."}
```

Conclusao: rotas estao ativas e exigem autenticacao como esperado.

## Bloco 4 — Mission Control final check

Ultima consulta registrada antes da execucao desta migration:

```text
projects: 10
documents: 4
agent_events: 0
platform_modules: 18
```

Nota: `storage.buckets: 0` era estado anterior; apos aplicacao da migration 20260529, o bucket `project-files` passa a ser esperado como existente.

Mission Control usa:

- `platform_modules`: `module_key`, `label`, `page`, `status`, `description`
- `projects`: projetos recentes
- `documents`: contagem
- `agent_events`: eventos recentes

## Bloco 5 — Documentacao

Checklist:

| Criterio | Status |
|---|---|
| `npm run build` passar | OK |
| `/nova-analise` criar projeto real | Pendente teste autenticado |
| `documents` registrar arquivo/metadado | Codigo pronto, pendente teste autenticado |
| `/projeto/[id]` abrir | Codigo/build OK, pendente teste logado |
| `/api/agent-events/log` gravar em `agent_events` | API validada (401 sem token); falta teste autenticado de gravacao |
| Mission Control mostrar dados reais | Codigo ajustado; dados existem |
| Bucket privado `project-files` | Migration aplicada no remoto |
| Signed URL | API ativa; falta teste autenticado de geracao |

## Percentuais finais

| Bloco | Percentual |
|---|---:|
| Env server-side | 80% |
| Storage plan | 95% |
| Nova Analise final | 65% |
| Mission Control final | 80% |
| Documentacao | 100% |

## Bloqueios antes de fechar Pacote 001

1. Executar teste manual autenticado em `/nova-analise` (fluxo completo Upload -> Objetivo -> Projeto -> Workspace).
2. Confirmar IDs reais criados em `projects`, `documents` e `agent_events`.
3. Validar geracao de signed URL autentica via `/api/storage/signed-url` para path `projects/{project_id}/...`.
4. Registrar evidencia final (IDs + timestamps) e fechar pacote.
