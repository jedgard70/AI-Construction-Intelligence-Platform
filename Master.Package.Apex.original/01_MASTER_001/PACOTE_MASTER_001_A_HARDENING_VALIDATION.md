# PACOTE MASTER 001-A — HARDENING & OPERATIONAL VALIDATION

Status: implementado parcialmente, com bloqueios operacionais documentados.

## 1. Problemas encontrados

| Bloco | Problema | Impacto |
|---|---|---|
| Agent Events | `agent_events` aceita INSERT apenas com `service_role` ou role `diretor_executivo` | AgentWindow nao persistia eventos para usuario comum |
| Agent Events | Codigo usava `metadata`, mas schema real usa `payload` | Falha runtime ao registrar evento |
| Agent Events | Codigo usava `priority = media`, mas enum real usa `medio` | Falha runtime por enum invalido |
| Mission Control | Codigo esperava `platform_modules.name/slug`, mas schema real usa `label/module_key/page` | Leitura quebrada do Mission Control |
| Validacao operacional | Navegador embutido do Codex falhou com `windows sandbox failed: spawn setup refresh` | Nao foi possivel testar UI logada ponta a ponta |
| Storage | Nao existem buckets em `storage.buckets` | Upload fisico ainda nao existe |
| Limpeza tecnica | Rotas duplicadas `pages/api/sales/pipeline.js` e `pipeline.ts` | Aviso no build/dev e ambiguidade de rota |
| Env | `.env.local` nao possui `SUPABASE_SERVICE_ROLE_KEY` | API segura de agent events nao consegue gravar ate configurar a chave no servidor |

## 2. Problemas resolvidos

| Problema | Solucao |
|---|---|
| Persistencia direta insegura/impedida por RLS em `agent_events` | Criada API server-side `/api/agent-events/log` |
| Uso de coluna inexistente `metadata` | Trocado para `payload` |
| Enum invalido `media` | Trocado para `medio` |
| Mission Control lendo colunas erradas | Ajustado para `module_key`, `label`, `page`, `status` |
| Rota duplicada sales/pipeline | Removido `pages/api/sales/pipeline.ts`, mantendo a versao `.js` mais completa |

## 3. Problemas pendentes

1. Configurar `SUPABASE_SERVICE_ROLE_KEY` no servidor local e na Vercel.
2. Validar `/api/agent-events/log` com usuario autenticado real.
3. Testar fluxo UI logado: `/nova-analise -> /projeto/[id]`.
4. Aprovar criacao de bucket Supabase Storage.
5. Decidir se `agent_tasks` e `agent_memory` precisam de RLS/policies dedicadas para UI ou devem continuar apenas server-side.
6. Renomear `middleware` para `proxy` quando for conveniente para Next 16.

## 4. RLS auditado

### `agent_events`

| Operacao | Politica | Resultado |
|---|---|---|
| SELECT | `auth.role() = authenticated` | Usuario autenticado le eventos |
| INSERT | `service_role` ou `get_my_role() = diretor_executivo` | Usuario comum nao grava |

Estrategia escolhida:

- Manter RLS fechada.
- Nao abrir INSERT direto para browser.
- Usar API server-side `/api/agent-events/log`.
- API valida Bearer token do usuario.
- API verifica acesso ao `project_id` usando client com JWT do usuario.
- API grava com `SUPABASE_SERVICE_ROLE_KEY`.

### `agent_tasks`

Schema existe, mas nao foram encontradas policies em `pg_policies`.

Uso recomendado:

- Manter escrita via APIs server-side.
- Nao expor criacao direta pelo browser ate definir aprovacao/dry-run.

### `agent_memory`

Schema existe, mas nao foram encontradas policies em `pg_policies`.

Uso recomendado:

- Memoria operacional deve ser gravada server-side.
- Antes de expor no browser, criar politica por usuario/projeto ou API governada.

## 5. Storage auditado

Consulta real:

- `storage.buckets`: nenhum bucket encontrado.

Plano recomendado:

| Item | Recomendacao |
|---|---|
| Bucket | `project-files` |
| Estrutura | `projects/{project_id}/intake/{yyyy}/{mm}/{timestamp}-{safe_filename}` |
| Publico? | Nao. Bucket privado. |
| Upload | Server-side signed upload ou client upload autenticado com path limitado |
| Download | Signed URLs com expiracao |
| Metadata | Registrar sempre em `documents` |
| Politicas | SELECT/INSERT por membro do projeto ou via API server-side |

Custos:

- Supabase Free inclui quota limitada de storage/egress.
- Planos pagos incluem mais egress; excedente de cached egress aparece na pagina oficial como US$ 0.03/GB em plano Pro/Team.
- O impacto maior sera egress de PDFs/imagens/modelos BIM grandes, nao a linha em `documents`.

Fonte: https://supabase.com/pricing

## 6. Fluxo validado

| Etapa | Status |
|---|---|
| `/nova-analise` compila | OK |
| `/nova-analise` responde localmente | OK |
| Criacao real via UI logada | Bloqueado pelo navegador/session |
| Registro em `projects` | Nao criado nesta validacao |
| Registro em `documents` | Nao criado nesta validacao |
| Redirecionamento para `/projeto/[id]` | Codigo implementado, nao validado visualmente |
| AgentWindow no projeto | Codigo implementado |
| `agent_events` via API | Implementado; bloqueado ate configurar `SUPABASE_SERVICE_ROLE_KEY` |
| `/mission-control` compila | OK |
| `/mission-control` le schema correto | OK em codigo/build |
| ApexCopilot global | OK em build/HTML |

## 7. Checklist atualizado

| Bloco | Status |
|---|---|
| Agent Events RLS auditado | Feito |
| API server-side para agent events | Feito |
| AgentWindow usando API segura | Feito |
| Nova Analise usando API segura para evento | Feito |
| Validacao operacional UI logada | Bloqueado |
| Storage auditado | Feito |
| Criacao de bucket | Pendente de aprovacao |
| Mission Control hardening | Feito |
| Rota duplicada sales/pipeline | Feito |
| Build limpo | Feito |

## 8. Percentual atualizado

| Bloco | Avanco |
|---|---:|
| Agent Events | 70% |
| Validacao Operacional | 40% |
| Supabase Storage | 55% |
| Mission Control Hardening | 75% |
| Limpeza Tecnica | 70% |

## Logs reais

Build:

```text
npm run build
Compiled successfully
Route criada: /api/agent-events/log
Aviso duplicado sales/pipeline removido
Aviso restante: middleware file convention deprecated; usar proxy no Next 16
```

API sem token:

```text
POST /api/agent-events/log
HTTP 401
Authorization Bearer token obrigatorio.
```

Supabase:

```text
projects: 10
documents: 4
agent_events: 0
platform_modules: 18
storage.buckets: 0
```
