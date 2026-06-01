# PR ARCHVIS PROMPT LIBRARY

## Objetivo
Criar biblioteca operacional de prompts para renderizacao arquitetonica e brief comercial reaproveitavel.

## Escopo
- `lib/archvis/prompts.ts`
- `pages/api/archvis/prompts.ts`
- `pages/api/archvis/generate-brief.ts`
- `docs/PR_ARCHVIS_PROMPT_LIBRARY.md`

## Biblioteca criada
Categorias:
- fachadas conceituais premium
- renderizacao rapida
- refinamento visual
- iluminacao noturna
- paisagismo
- brutalista moderna
- minimalista sofisticada
- imagens ultra realistas
- videos cinematograficos
- prancha A1

## APIs opcionais implementadas
1. `GET /api/archvis/prompts`
- retorna biblioteca completa
- filtro opcional por `?category=...`
- exige autenticacao (401 sem token)

2. `POST /api/archvis/generate-brief`
- recebe payload do brief arquitetonico
- retorna prompt estruturado + template de referencia
- exige autenticacao (401 sem token)

## Reaproveitamento futuro
- AgentWindow
- Apex AI
- fluxo comercial de Proposals/Contracts (sem alterar CRM nesta fase)

## Validacoes
- Build: `npm run build -- --webpack`.
- API endpoints compilam e respeitam contrato base de resposta (`success/data/error`).

## Riscos/Pendencias
- Sem conector de geracao automatica de imagem/video nesta fase.
- Futuro: persistir briefs por projeto para trilha historica completa.
