# Help AI Audit Trail Contract (No Migration)

Status: contrato preparado sem migration neste PR.

## Objetivo
Registrar trilha mínima não sensível de uso do Help AI sem quebrar o fluxo de chat.

## Campos mínimos sugeridos
- `timestamp`
- `user_id` (quando disponível)
- `role`
- `page_path`
- `intent_class` (`safe_info`, `implementation_guidance`, `destructive_request`, `secret_request`, `external_publish`, `unknown`)
- `blocked_by_policy` (boolean)
- `reason` (string curta)

## Regras de privacidade
- Não salvar mensagem completa do usuário.
- Não salvar tokens, chaves, secrets, PAT, service-role.
- Não salvar system prompt completo.

## Implementação nesta fase
- Logging de metadados via `console.info` com fallback não bloqueante.
- Se log falhar, chat continua.

## Próxima fase (opcional)
- Persistência em endpoint/tabela dedicada já existente e segura.
- Sem migration automática até aprovação explícita.
