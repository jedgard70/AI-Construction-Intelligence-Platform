# Checklist - Login Apex Global AI EN/PT

Data: 04/06/2026
Checkpoint: Login Apex Global AI EN/PT final
Status: validado localmente

## Objetivo

Finalizar `/login` com identidade Apex Global AI:

- APEX GLOBAL AI
- CONSTRUCTION INTELLIGENCE PLATFORM
- ingles como idioma padrao
- seletor EN/PT visivel
- paleta navy / vermelho / prata
- sem Atlas
- sem alterar auth

## Escopo Permitido

- [x] `components/LoginClient.tsx`
- [x] `docs/CHECKLIST_LOGIN_APEX_GLOBAL_AI_EN_PT.md`

## Escopo Proibido

- [x] Sem Supabase
- [x] Sem auth logic
- [x] Sem migrations
- [x] Sem package files
- [x] Sem APIs
- [x] Sem website
- [x] Sem analytics
- [x] Sem Owner Executor

## Alteracoes

- [x] Ingles definido como idioma padrao no componente.
- [x] Seletor `EN | PT` visivel no painel de login.
- [x] Textos de login e criar conta internacionalizados.
- [x] Branding atualizado para `APEX GLOBAL AI`.
- [x] Submarca atualizada para `CONSTRUCTION INTELLIGENCE PLATFORM`.
- [x] Paleta ajustada para navy, vermelho e prata.
- [x] Referencias Atlas nao foram adicionadas.
- [x] Chamadas `signInWithPassword` e `signUp` preservadas.

## Validacao Obrigatoria

- [x] `/login` abre em ingles.
- [x] Seletor EN/PT troca textos principais.
- [x] Login continua chamando `supabase.auth.signInWithPassword`.
- [x] Criar conta continua chamando `supabase.auth.signUp`.
- [x] Build passa.
- [ ] PR aberto.
- [ ] Checks acompanhados.
- [ ] Merge somente se checks obrigatorios estiverem verdes.

## Evidencias

- [x] Build local registrado: `npm run build -- --webpack` passou em 04/06/2026.
- [x] Browser check registrado: Chrome headless confirmou ingles padrao e troca EN/PT.
- [ ] PR URL registrado.
