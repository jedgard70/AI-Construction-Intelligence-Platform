# Owner Login Setup

## Objetivo
Orientar o acesso do Owner Command Chat sem expor segredos e sem depender de regra apenas no frontend.

## Requisitos
- Login valido no Supabase Auth.
- `NEXT_PUBLIC_SUPABASE_URL` configurada.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada.
- `SUPABASE_SERVICE_ROLE_KEY` configurada apenas no backend.
- `APEX_OWNER_EMAILS` com o email oficial do Owner quando necessario.

## Fluxo
1. O frontend obtém a sessao do Supabase.
2. O access token e enviado em `Authorization: Bearer <token>`.
3. O backend resolve o usuario autenticado.
4. O backend calcula `role`, `is_owner`, `department` e `allowed_scopes`.
5. O endpoint aplica as regras de continuidade antes de consultar o modelo.

## Regras
- Nunca pedir token/secret no chat.
- Nunca confiar em flags vindas do cliente para liberar acesso.
- `is_owner` e inferido no backend por sessao valida e/ou perfil persistido.
- Se faltar perfil, o fallback deve ser restritivo.

## Resultado esperado
- Dr. Edgard consegue retomar qualquer fluxo autenticado como Owner.
- Segundo assento nao enxerga nem assume contexto privado do Owner.
- Guest nao acessa historico interno.
