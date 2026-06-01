# PR — Feature Generator + PR Auditor

## Objetivo
Adicionar a base de recomendacao de proxima feature e template de auditoria de PR no bloco autonomo, sem autoexecucao destrutiva.

## Escopo
- `lib/autonomous/feature-generator.ts`
- `pages/api/autonomous/next-feature.ts`
- `pages/api/autonomous/pr-audit-template.ts`
- `pages/mission-control.tsx`

## O que foi implementado
1. **Feature Generator (advisory)**
   - Prioriza backlog autonomo.
   - Sugere proxima feature com objetivo, escopo, riscos e criterios de aceite.
   - Le fontes de roadmap documentais para referencia operacional.
2. **PR Auditor (template)**
   - Checklist de escopo.
   - Itens proibidos.
   - Checagens de qualidade.
   - Guia simples de risco de merge.
3. **Mission Control**
   - Card para proxima feature recomendada.
   - Card para checklist-base de auditoria de PR.

## Guardrails
- Sem merge/deploy automatico.
- Sem migrations.
- Sem execucao destrutiva.
- Sem alteracoes em CRM/Revenue/Storage.

## Validacao
- `npm run build -- --webpack`
- API `GET /api/autonomous/next-feature`
- API `GET /api/autonomous/pr-audit-template`
- Tela `/mission-control`

## Riscos remanescentes
- Classificacao de prioridade ainda estatica (pode evoluir para dados reais).
- Auditoria de PR ainda baseada em template (sem leitura automatica de diff remoto).
