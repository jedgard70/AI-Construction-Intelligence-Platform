# Role / Seat Enforcement (Help AI)

## Perfis base
- `owner`: acesso completo a plataforma.
- `admin`: acesso amplo operacional, sem contexto privado do owner.
- `user`: acesso por departamento/funcao.
- `client`: acesso apenas aos projetos/documentos autorizados.
- `guest`: sem sessao; apenas orientacao geral.

## Regras de protecao
1. Nunca solicitar token/secret no chat.
2. Nunca expor dados de outro assento.
3. Requests para “chats do Jose/Owner” devem ser bloqueados para nao-owner.
4. Guest nao recebe contexto interno sensivel nem roadmap privado.
5. Acoes destrutivas precisam autorizacao explicita.

## Contexto injetado no prompt
- `role`
- `is_owner`
- `allowed_scopes`
- `permission_summary`
- `department`

## Observacoes
- A resolucao de role prioriza sessao JWT valida.
- A resolucao de perfil consulta tabelas de perfil conhecidas (`profiles`, `users`, `user_roles`) quando disponiveis.
- Fallback seguro: `guest`.
