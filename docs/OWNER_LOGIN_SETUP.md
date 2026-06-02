# Owner Login Setup

## Objetivo
Orientar o acesso do Owner Command Chat sem expor segredos e sem depender de regra apenas no frontend.

## Requisitos
- Login valido no Supabase Auth.
- Owner email oficial: `jedgard70@gmail.com`.
- `NEXT_PUBLIC_SUPABASE_URL` configurada.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada.
- `SUPABASE_SERVICE_ROLE_KEY` configurada apenas no backend.
- `OWNER_EMAIL` ou `OWNER_EMAILS` preferencialmente configurada com `jedgard70@gmail.com`.
- `APEX_OWNER_EMAILS` permanece aceito como compatibilidade.

## Fluxo
1. A rota `/owner-command` exige sessao real e redireciona para `/login` quando nao ha autenticacao.
2. O frontend obtém a sessao do Supabase Auth apos login valido.
3. O access token e enviado em `Authorization: Bearer <token>`.
4. O backend resolve o usuario autenticado.
5. O backend calcula `role`, `is_owner`, `department` e `allowed_scopes`.
6. O endpoint aplica as regras de continuidade antes de consultar o modelo.

## Regras
- Nunca pedir token/secret no chat.
- Nunca registrar senha em docs, chat ou env commitado.
- A senha do Owner deve ser definida somente via Supabase Auth ou painel seguro equivalente.
- Configurar `OWNER_EMAIL=jedgard70@gmail.com` ou `OWNER_EMAILS=jedgard70@gmail.com` no ambiente da Vercel/backend.
- Nunca confiar em flags vindas do cliente para liberar acesso.
- `is_owner` e inferido no backend por sessao valida e/ou perfil persistido.
- O fallback documental/controlado para ambiente sem configuracao adicional continua sendo `jedgard70@gmail.com`.
- Se faltar perfil, o fallback deve ser restritivo.

## Resultado esperado
- Dr. Edgard consegue retomar qualquer fluxo autenticado como Owner.
- Segundo assento nao enxerga nem assume contexto privado do Owner.
- Guest nao acessa historico interno.
