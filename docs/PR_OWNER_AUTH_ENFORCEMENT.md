# PR Owner Auth Enforcement

Branch: `feature/owner-auth-enforcement`

## Objetivo
Fechar a autenticacao real do Owner Command Chat para que a rota `/owner-command` nao abra como guest e o reconhecimento do Owner dependa de sessao Supabase Auth valida.

## Escopo
- `middleware.js`
- `components/LoginClient.tsx`
- `pages/owner-command.tsx`
- `pages/api/owner-command/chat.ts`
- `lib/owner-auth.ts`
- `docs/OWNER_LOGIN_SETUP.md`
- `docs/OWNER_COMMAND_CHAT_CONTINUITY_RULES.md`
- `docs/PR_OWNER_AUTH_ENFORCEMENT.md`

## O que muda
- `/owner-command` passa a exigir sessao real e redireciona para `/login?redirect=/owner-command`.
- A tela de login respeita o `redirect` e volta para a rota solicitada apos autenticacao.
- O backend de `/api/owner-command/chat` responde `401` sem bearer token e `401` para sessao invalida.
- O backend responde `503` se a configuracao real de auth do Owner nao estiver presente.
- O reconhecimento de Owner continua no backend por sessao Supabase Auth + email/perfil.

## Como o Owner e reconhecido
- Prioridade:
  - sessao Supabase Auth valida
  - email autenticado
  - perfil persistido (`profiles`, `users`, `user_roles`) quando existir
  - fallback controlado `OWNER_EMAIL` / `OWNER_EMAILS` / `APEX_OWNER_EMAILS`
- Owner oficial:
  - `jedgard70@gmail.com`

## Configuracao exigida
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OWNER_EMAIL=jedgard70@gmail.com` recomendado

## Validacao
- `/owner-command` sem login: redireciona para `/login`
- login com conta autenticada: retorna para `/owner-command`
- `GET/POST /api/owner-command/chat` sem token: `401`
- frontend continua sem system prompt
- `NEXT_DISABLE_BUILD_WORKER=1 npm run build -- --webpack`

## Riscos
- Se o ambiente nao tiver cookies/sessao Supabase funcionando corretamente, a rota vai redirecionar para login em loop ate a configuracao ser corrigida.
- O fallback do email do Owner continua controlado, mas o ambiente produtivo deve definir `OWNER_EMAIL` explicitamente para evitar ambiguidade futura.
