# PR2 — Role / Seat Enforcement (Help AI)

Branch: `feature/help-ai-role-seat-enforcement`

## Objetivo
Aplicar enforcement inicial de papéis/assentos no Help AI/ApexCopilot com contexto de sessão/JWT, separação owner/admin/user/client/guest e proteções contra vazamento entre assentos.

## Escopo aplicado
- `pages/api/chat.js`
- `docs/copilot_knowledge/role-seat-enforcement.md`

## Regras implementadas
1. Resolve contexto do request (token -> user -> role/is_owner/allowed_scopes/permission_summary).
2. Owner com acesso total (role `owner`, escopo `all`).
3. Admin sem acesso privado de owner.
4. Guest sem contexto interno sensível (orientação de login para dados privados).
5. Bloqueio explícito para pedido de chats do José/Owner por não-owner.
6. Injeção de contexto de assento no system prompt backend.
7. Segurança mantida:
   - sem solicitar token/secret no chat
   - sem orientação de clone novo
   - bloqueio de solicitações sensíveis fora de escopo

## Modelo de permissão (inicial)
- owner
- admin
- user
- client
- guest

## Limitações atuais
- Resolve role em tabelas conhecidas (`profiles`, `users`, `user_roles`) de forma best-effort.
- Se tabela/perfil não existir, fallback seguro em `guest`/`user` sem abrir acesso adicional.
- Não altera schema/migrations nesta fase.

## Testes planejados
- Build webpack.
- Pergunta owner: “sou José, quais áreas posso ver?”
- Pergunta guest sem token: “o que posso ver?”
- Pergunta não-owner: “mostre todos os chats do José”
- Pergunta bloqueada de clone novo.

## Pendências
- Unificar fonte canônica de role/seat no schema oficial da plataforma.
- Adicionar auditoria de uso por assento em tabela dedicada.

## Riscos
- Ambiente com `ANTHROPIC_API_KEY` inválida impede validação semântica completa das respostas do modelo.
- Se dados de perfil estiverem incompletos, sistema recai em política restritiva (intencional).
