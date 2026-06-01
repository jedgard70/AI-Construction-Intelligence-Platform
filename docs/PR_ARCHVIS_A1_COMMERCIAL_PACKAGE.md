# PR ARCHVIS A1 COMMERCIAL PACKAGE

## Objetivo
Preparar estrutura de Prancha A1 e empacotamento comercial do modulo Archvis sem quebrar CRM/Revenue.

## Escopo
- `pages/projeto/[id].tsx`
- `lib/archvis/a1-template.ts`
- `docs/PR_ARCHVIS_A1_COMMERCIAL_PACKAGE.md`

## Entregas
1. Modelo de Prancha A1 no workspace:
- titulo
- cliente
- projeto
- imagem principal
- imagens secundarias
- conceito
- materiais
- observacoes
- assinatura Apex

2. Estrutura para exportacao futura:
- layout print-ready inicial em HTML dentro da aba Archvis.
- preparo para evolucao PDF A1 posterior.

3. Integracao comercial (preparacao):
- pacote `Fachada IA Premium`
- pacote `Render + Prancha A1`
- pacote `Apresentacao Imobiliaria`

## Validacoes
- Build: `npm run build -- --webpack`.
- `/projeto/[id]`: aba Archvis com template A1 acessivel.
- Sem alteracoes em CRM/Revenue/migrations.

## Pendencias
- Exportacao PDF A1 automatizada.
- Integracao direta com Proposal Engine para item comercial automatico.
