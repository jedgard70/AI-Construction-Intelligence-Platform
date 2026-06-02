# PR APEX SAFETY GATE

## Objetivo
Adicionar camada de proteção para ações destrutivas com foco em paths críticos e comportamento case-insensitive no Windows.

## Escopo implementado
- `lib/safety/path-guard.ts`
- `lib/safety/workspace-guard.ts`
- `lib/safety/destructive-action-guard.ts`
- `pages/api/autonomous/task.ts`
- `pages/api/autonomous/status.ts`
- `pages/api/autonomous/next-actions.ts`
- `docs/APEX_SAFETY_GATE_PLAN.md`
- `docs/PR_APEX_SAFETY_GATE.md`

## Funções adicionadas
- `normalizePath`
- `isOfficialWorkspace`
- `isCaseInsensitiveSamePath`
- `hasRepoMarkers`
- `classifyDestructiveRisk`
- `requireOwnerApproval`

## Regras de proteção aplicadas
1. Paths equivalentes por caixa são tratados como o mesmo caminho.
2. Qualquer alvo dentro do workspace oficial é risco alto/crítico.
3. Presença de marcadores de repositório (`.git`, `package.json`, `pages`, `docs`, `supabase`) eleva risco.
4. Ações destrutivas de risco alto/crítico exigem aprovação owner.
5. Criacao de `temp`, `archived`, `backup`, `recovery`, clones ou copias paralelas sem autorizacao passa a ser proibida por regra operacional documentada.

## Integração nas APIs autonomous
- `POST /api/autonomous/task`
  - classifica risco da tarefa.
  - bloqueia com `403` quando risco exige owner approval e header `x-owner-approval: true` não é enviado.
- `GET /api/autonomous/status`
  - expõe estado do Safety Gate na governança.
- `GET /api/autonomous/next-actions`
  - expõe políticas ativas de Safety Gate para orquestração.

## Segurança operacional
- Implementação não executa limpeza/destruição real.
- Implementação apenas classifica/bloqueia no nível de enfileiramento de tarefas autônomas.
- Regras operacionais complementares registradas em `docs/CODEX_OPERATIONAL_RULES.md`.

## Validação
- Build obrigatório: `npm run build -- --webpack`.
