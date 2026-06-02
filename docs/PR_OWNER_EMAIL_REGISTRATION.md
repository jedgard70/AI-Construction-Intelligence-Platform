# PR Owner Email Registration

Branch: `feature/register-owner-email`

## Objetivo
Garantir que Apex AI, Owner Command Chat e role/seat enforcement reconhecam `jedgard70@gmail.com` como Owner oficial da plataforma.

## Arquivos alterados
- `docs/OWNER_LOGIN_SETUP.md`
- `docs/OWNER_COMMAND_CHAT_CONTINUITY_RULES.md`
- `docs/PR_OWNER_EMAIL_REGISTRATION.md`
- `lib/owner-auth.ts`
- `pages/api/chat.js`
- `pages/api/owner-command/chat.ts`

## Como o Owner e reconhecido
- Preferencia de configuracao:
  - `OWNER_EMAILS`
  - `OWNER_EMAIL`
  - `APEX_OWNER_EMAILS`
- Fallback controlado no codigo:
  - `jedgard70@gmail.com`
- O backend continua validando sessao real via Supabase Auth e cruza email/perfil antes de elevar `is_owner=true`.

## Seguranca
- Nenhuma senha foi registrada.
- Nenhum token/secret foi pedido.
- Nenhuma migration foi criada.
- O reconhecimento de Owner permanece no backend; o frontend nao recebe autoridade para marcar owner.

## Build
- `NEXT_DISABLE_BUILD_WORKER=1 npm run build -- --webpack`

## Riscos
- Se o ambiente produtivo usar um owner diferente no futuro, o ideal e atualizar `OWNER_EMAIL` ou `OWNER_EMAILS`.
- `APEX_OWNER_EMAILS` segue aceito por compatibilidade, mas a preferencia operacional passa a ser `OWNER_EMAIL`/`OWNER_EMAILS`.

## Impacto
- `jedgard70@gmail.com` passa a ficar explicitamente documentado como Owner oficial.
- Help AI/Apex AI e Owner Command Chat passam a compartilhar a mesma resolucao de owner email.
