# Checklist - Login Apex Global AI EN/PT

Data: 04/06/2026
Checkpoint: Login Apex Global AI EN/PT final
Status: revalidado localmente no PR #122

## Objetivo

Finalizar `/login` com identidade Apex Global AI:

- APEX GLOBAL AI
- CONSTRUCTION INTELLIGENCE PLATFORM
- ingles como idioma padrao
- nenhum texto em portugues no primeiro carregamento visivel
- seletor EN/PT visivel
- logomarca Apex/IPEX oficial existente
- paleta navy / vermelho / prata
- sem Atlas
- sem alterar auth

## Escopo Permitido

- [x] `components/LoginClient.tsx`
- [x] `docs/CHECKLIST_LOGIN_APEX_GLOBAL_AI_EN_PT.md`
- [x] Asset existente `public/logo_apex_nova.jpeg`

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
- [x] Headline EN obrigatoria: `Operational Intelligence for Construction & Business`.
- [x] Descricao EN obrigatoria: `AI-powered platform for construction, BIM, EVM and executive intelligence.`
- [x] Labels EN obrigatorios: `Email`, `Password`, `Sign in`, `Create account`, `Authorized users only`.
- [x] Logomarca existente `public/logo_apex_nova.jpeg` exibida no login.
- [x] Paleta ajustada para navy, vermelho e prata.
- [x] Referencias Atlas nao foram adicionadas.
- [x] Chamadas `signInWithPassword` e `signUp` preservadas.

## Validacao Obrigatoria

- [x] `/login` abre em ingles.
- [x] Primeiro carregamento visivel nao mostra texto em portugues.
- [x] Seletor EN/PT troca textos principais.
- [x] Logo aparece no login.
- [x] Login continua chamando `supabase.auth.signInWithPassword`.
- [x] Criar conta continua chamando `supabase.auth.signUp`.
- [x] Build passa.
- [x] PR aberto: #122.
- [ ] Checks acompanhados.
- [x] Nao mergear ainda.

## Evidencias

- [x] Build local registrado: `npm run build -- --webpack` passou em 04/06/2026.
- [x] Browser check registrado: Chrome headless confirmou ingles padrao, ausencia de portugues antes de PT, logo carregado e troca EN/PT.
- [x] PR URL registrado: https://github.com/jedgard70/AI-Construction-Intelligence-Platform/pull/122
