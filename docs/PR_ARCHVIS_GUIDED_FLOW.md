# PR ARCHVIS GUIDED FLOW

## Objetivo
Implementar o fluxo guiado de Visualizacao Arquitetonica IA no Project Workspace:
planta/referencia → preview → refinamento → aprovacao → prancha A1.

## Escopo
- `pages/projeto/[id].tsx`
- `lib/archvis/guided-flow.ts`
- `docs/PR_ARCHVIS_GUIDED_FLOW.md`

## Entregas
- Aba `Visualizacao Arquitetonica IA` com estados operacionais:
  - referencia recebida
  - preview gerado
  - refinamento em andamento
  - aprovado
  - prancha A1 pronta
- Formulario de direcao criativa:
  - estilo arquitetonico
  - objetivo
  - padrao do imovel
  - iluminacao
  - paisagismo
  - materiais
  - observacoes
- Prompt builder estruturado com presets:
  - fachada moderna
  - minimalista sofisticada
  - brutalista moderna
  - luxo
  - noturna
  - paisagismo frontal

## Limites desta fase
- Sem geracao automatica de imagem/video.
- Sem novo conector externo.
- Preparacao de prompt + status operacional para execucao assistida.

## Validacoes
- Build: `npm run build -- --webpack`.
- Smoke:
  - `/projeto/[id]` 200.
  - Aba Archvis abre sem quebrar abas existentes.

## Riscos/Pendencias
- Evoluir persistencia de status/prompt por projeto em fase posterior.
- Integrar com motor de geracao quando conector estiver validado.
