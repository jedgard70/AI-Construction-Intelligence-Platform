# PR Owner Command Chat

Branch: `feature/owner-command-chat`

## Objetivo
Retomar o Owner Command Chat com continuidade segura no backend, mantendo integracao com Safety Gate e separacao Owner vs segundo assento.

## Escopo aplicado
- `pages/owner-command.tsx`
- `pages/api/owner-command/chat.ts`
- `lib/owner-auth.ts`
- `docs/OWNER_COMMAND_CHAT_CONTINUITY_RULES.md`
- `docs/OWNER_LOGIN_SETUP.md`
- `docs/PR_OWNER_COMMAND_CHAT.md`

## O que foi implementado
- Endpoint com resolucao de assento via backend.
- Regra de `owner continuity` para Dr. Edgard.
- Filtro de continuidade para nao-owner por:
  - `owner_user_id`
  - `assigned_to`
  - `department`
  - `allowed_scopes`
  - `visibility`
  - `requires_owner_approval`
- Bloqueio explicito para:
  - chat privado do Owner por segundo assento
  - aprovacao critica por nao-owner
  - guest tentando acessar historico interno
- Integracao do contexto de continuidade ao Safety Gate no prompt do backend.
- Frontend `/owner-command` sem system prompt no cliente.

## Regras de governanca preservadas
- Nao aplicar stash em `main`.
- Nao apagar nada do historico anterior.
- Nao criar clone.
- Nao pedir token/secret.
- Enforcement sempre no backend.

## Persistencia
- Nenhuma migration criada nesta fase.
- Se necessario em fase futura:
  - `owner_command_threads`
  - `owner_command_messages`
  - `task_handoffs`
  - `seat_activity_log`

## Validacao esperada
1. Owner autenticado recebe `continuity.scope=global`.
2. Segundo assento recebe bloqueio em `visibility=owner_private`.
3. Segundo assento pode continuar fluxo atribuido ou de mesmo departamento.
4. Fluxo critico com `requires_owner_approval=true` bloqueia nao-owner.
5. Build do projeto conclui sem erro.
