# PR Fix Owner Auth + Apex AI + Layout

Branch: `feature/fix-owner-auth-apex-ai-layout`

## Objetivo
Corrigir os bugs pos-72 confirmados na auditoria:
- Apex AI global respondendo como guest mesmo com sessao
- falta de envio de bearer token para `/api/chat`
- launcher do Apex AI sem drag real
- ausencia de fullscreen no Apex AI
- sidebar/menu duplicado no dashboard

## Escopo
- `components/ApexCopilot.tsx`
- `components/DashboardByRole.tsx`
- `pages/api/chat.js`
- `docs/AUDITORIA_OWNER_APEX_AI_LAYOUT_POS_72.md`
- `docs/PR_FIX_OWNER_AUTH_APEX_AI_LAYOUT.md`

## O que mudou
- O Apex AI global agora tenta obter `session.access_token` via Supabase Auth.
- As chamadas para `/api/chat` enviam `Authorization: Bearer <token>` quando houver sessao.
- `/api/chat` passou a responder com `apex_context` para o frontend saber se esta em `guest`, `user` ou `owner`.
- O launcher do Apex AI ficou arrastavel e com persistencia propria em `localStorage`.
- O painel aberto continua arrastavel e ganhou fullscreen/quase fullscreen.
- O dashboard deixou de renderizar o sidebar legado quando ja esta dentro do `ApexShell`.

## Owner auth
- `jedgard70@gmail.com` continua sendo reconhecido como Owner via regra centralizada em `lib/owner-auth.ts`.
- Sem token, o Apex AI continua em contexto guest.
- Com token valido, o Apex AI global passa a compartilhar a mesma base de reconhecimento do Owner Command Chat.

## Layout
- `ApexShell` permanece como navegacao principal oficial.
- O sidebar interno duplicado do dashboard foi suprimido para evitar poluicao visual e conflito de navegacao.
- Informacoes de perfil/logout foram preservadas na topbar do dashboard.

## Validacao local
- `NEXT_DISABLE_BUILD_WORKER=1 npm run build -- --webpack`
- rotas principais auditadas com servidor local
- `/api/owner-command/chat` sem token continua `401`
- `/owner-command` sem sessao continua redirecionando para `/login`

## Riscos
- A validacao completa de Owner em runtime depende de uma sessao Supabase real de `jedgard70@gmail.com`.
- O drag/fullscreen foi validado por implementacao e build; validacao visual final deve ser observada no browser com a interface carregada.
