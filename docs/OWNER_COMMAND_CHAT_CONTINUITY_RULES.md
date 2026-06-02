# Owner Command Chat Continuity Rules

## Objetivo
Garantir continuidade operacional com enforcement no backend para chats, tarefas, PRs e fluxos em andamento, preservando a hierarquia de assentos:

- Dr. Edgard/Owner (`jedgard70@gmail.com`) pode retomar qualquer fluxo.
- Segundo assento/admin nao pode ver nem assumir contexto privado do Owner.
- Guest nao acessa historico interno global.

## Hierarquia de assentos
- `owner`: acesso global a todos os chats operacionais, handoffs, PRs, historicos e aprovacoes criticas.
- `admin`: acesso operacional restrito ao proprio contexto, atribuicoes explicitas, departamento e escopos autorizados.
- `user`: acesso apenas ao proprio contexto, atribuicoes, departamento e escopos autorizados.
- `guest`: sem acesso a historico interno global.

## Owner continuity
- Dr. Edgard / `jedgard70@gmail.com` = Owner oficial da plataforma.
- O backend reconhece `is_owner=true`.
- Quando `is_owner=true`, a continuidade global e liberada para:
  - listar chats operacionais
  - abrir historicos
  - continuar tarefas iniciadas por outro assento
  - visualizar decisoes pendentes
  - aprovar ou reprovar acoes
  - retomar qualquer chat, tarefa, PR ou decisao
  - assumir execucao de qualquer fluxo
- Safety Gate continua ativo para acoes destrutivas, mas a aprovacao critica continua reservada ao Owner.

## Regras do segundo assento/admin
- Nao ve chats privados do Owner.
- Nao ve contexto `owner_private`.
- Vê apenas:
  - proprios chats
  - tarefas explicitamente atribuidas ao assento
  - fluxos do mesmo departamento
  - fluxos cobertos por `allowed_scopes`
- Nao pode assumir tarefa privada do Owner.
- Nao pode aprovar acao critica no lugar do Owner.

## Enforcement no backend
- Nunca confiar apenas no frontend.
- A rota `/owner-command` exige login real antes de carregar o chat.
- O endpoint `/api/owner-command/chat` resolve o contexto autenticado via bearer token.
- Sem bearer token valido, o endpoint responde `401`.
- O backend calcula a decisao de continuidade usando:
  - `owner_user_id`
  - `assigned_to`
  - `department`
  - `allowed_scopes`
  - `visibility`
  - `requires_owner_approval`
- Se `visibility=owner_private`, assentos nao-owner recebem bloqueio.
- Se `requires_owner_approval=true`, apenas o Owner pode seguir.

## Quem pode ver o que
| Contexto | Owner | Admin/Segundo assento | Guest |
| --- | --- | --- | --- |
| Chat privado do Owner | Sim | Nao | Nao |
| Chat do proprio assento | Sim | Sim | Nao |
| Tarefa atribuida ao assento | Sim | Sim | Nao |
| Fluxo do mesmo departamento | Sim | Sim, se mesmo departamento | Nao |
| Fluxo por `allowed_scopes` | Sim | Sim, se houver intersecao de escopo | Nao |
| Historico interno global | Sim | Nao | Nao |
| Aprovacao critica | Sim | Nao | Nao |

## Quem pode continuar o que
- Owner:
  - qualquer chat
  - qualquer tarefa
  - qualquer PR
  - qualquer execucao
- Admin/segundo assento:
  - proprio contexto
  - tarefas atribuidas
  - fluxos do departamento
  - fluxos autorizados por escopo
- Guest:
  - nao continua contexto interno

## Exemplos
1. `is_owner=true` e thread com `visibility=owner_private`
Resultado: permitido. Dr. Edgard pode abrir e continuar.

2. `is_owner=false`, `visibility=owner_private`
Resultado: bloqueado no backend.

3. `is_owner=false`, `assigned_to=<user_id atual>`
Resultado: permitido para visualizacao e continuidade.

4. `is_owner=false`, `department=financeiro`, usuario do mesmo departamento
Resultado: permitido.

5. `is_owner=false`, `requires_owner_approval=true`
Resultado: bloqueado. Aprovacao critica continua exclusiva do Owner.

## Persistencia futura
Se a plataforma ainda nao tiver persistencia dedicada para o Owner Command Chat, a modelagem sugerida para fase posterior e:

- `owner_command_threads`
- `owner_command_messages`
- `task_handoffs`
- `seat_activity_log`

## Observacoes
- Esta fase nao cria migration.
- O frontend nao recebe nem controla system prompt.
- A continuidade e sempre decidida no backend antes da chamada ao modelo.
