# PR ARCHVIS AI FOUNDATION

## Objetivo
Estabelecer a base operacional do modulo de Visualizacao Arquitetonica IA no Project Workspace, reaproveitando Storage Foundation ja existente.

## Escopo
- `pages/projeto/[id].tsx`
- `docs/PR_ARCHVIS_AI_FOUNDATION.md`
- `docs/ARCHVIS_AI_OPERATING_SYSTEM.md`

## Estrutura operacional aplicada
- Plantas
- Referencias
- Previews IA
- Refinamentos
- Render Final
- Prancha A1

## Integracao com Storage existente
- Bucket: `project-files` (ja existente).
- Metadata: reaproveito de `documents` + arquivos de `/api/storage/project-files`.
- Sem migration nova: classificacao por etapa feita por inferencia de nome/extensao/mime.

## Implementacao
- Nova aba no workspace do projeto:
  - `Visualizacao Arquitetonica IA`.
- Painel com cards por etapa do fluxo Archvis.
- Contagem e listagem resumida de itens por etapa.
- Indicacao explicita de que taxonomia de metadata pode ser refinada futuramente sem quebrar o fluxo atual.

## Validacoes
- Build: `npm run build -- --webpack`.
- Smoke:
  - `/projeto/[id]` carrega.
  - Aba Archvis aparece.
  - Abas existentes continuam funcionais.

## Riscos
- Classificacao por inferencia de nome pode exigir padronizacao futura de nomenclatura.
- Sem automacao de geracao de imagem nesta fase (escopo intencional).
