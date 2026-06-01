# PR AUTONOMOUS CORE

Branch: `feature/autonomous-core`  
Objetivo: fundação do Autonomous Orchestrator com governança e visibilidade no Mission Control, sem execução destrutiva automática.

## Escopo implementado

1. Modelo de autonomia:
- `lib/autonomous/model.ts`
- backlog, prioridade, status, risco, aprovação necessária e módulo afetado.

2. API inicial de suporte:
- `GET /api/autonomous/status` (enriquecida com governança + próximo bloco recomendado)
- `GET /api/autonomous/next-actions` (próximas ações sugeridas e riscos)

3. Mission Control:
- card `Autonomous Orchestrator`
- exibe próximo bloco recomendado
- exibe riscos/aprovações obrigatórias

## Guardrails ativos

- sem merge automático destrutivo
- sem deploy crítico automático
- sem migration automática sem aprovação
- sem exclusão automática

## Validações

- `npm run build -- --webpack` passando
- `/mission-control` compilando no build
- APIs autônomas compilando no build

## Fora de escopo (mantido)

- execução automática de código destrutivo
- alterações em CRM/Revenue/Storage
- mudanças em Ebook/Revit
