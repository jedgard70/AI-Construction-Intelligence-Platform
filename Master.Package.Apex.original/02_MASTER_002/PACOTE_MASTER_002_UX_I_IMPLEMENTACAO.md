# PACOTE MASTER 002-UX-I — IMPLEMENTACAO

Data: 2026-05-30
Workspace oficial: `D:\AI-constr\AI-Construction-Intelligence-Platform`

## Objetivo

Implementar a Fase 1 do redesign UX com shell global unificado (sidebar + topbar + layout + tema), sem alterar escopo de engines comerciais/jurídicos avançados.

## Escopo implementado

1. Sidebar unica
2. Topbar unica
3. Estrutura de layout global
4. Tema Apex
5. Navegacao consolidada
6. Preparacao para dashboards por perfil

## 1) Componentes criados

- `components/layout/ApexShell.tsx`

Responsabilidades:

- menu lateral unico por dominios (`Visao Geral`, `Comercial`, `Projetos`, `Operacao BIM`, `Juridico`)
- topbar unica com contexto de pagina
- tokens visuais do tema Apex via CSS variables globais
- shell responsavel por acolher todas as telas autenticadas

## 2) Integração global de layout

Arquivo atualizado:

- `pages/_app.tsx`

Implementacao:

- `ApexShell` aplicado globalmente para rotas que nao sao:
  - `/`
  - `/login`
  - `/forgot-password`
  - `/reset-password`
  - `/jornada`
  - `/api/*`

Resultado:

- toda area logada passa a usar sidebar/topbar/layout unificados sem refatorar cada tela individualmente.

## 3) Telas migradas

Migracao por regra global do `_app` (sem duplicacao de codigo de tela):

- Dashboard e control center:
  - `/dashboard`
  - `/mission-control`
  - `/platform`

- Comercial/CRM:
  - `/crm`
  - `/crm/services`
  - `/crm/proposals`
  - `/crm/proposals/new`
  - `/vendas`
  - `/investimentos`

- Projetos/operacao:
  - `/nova-analise`
  - `/documentos`
  - `/orcamento`
  - `/rdo`
  - `/qualidade`
  - `/bim-ops`
  - `/bim-3d`
  - `/plantas`
  - `/archvis`
  - `/director-cut`

- Juridico:
  - `/juridico`
  - `/juridico/contratos`
  - `/juridico/assinatura`
  - `/juridico/compliance`
  - `/juridico/due-diligence`

## 4) Evidências visuais/técnicas

### Evidência técnica primária

- Build validou todas as rotas após integração do shell global.
- Rotas estratégicas compiladas com sucesso:
  - `/dashboard`
  - `/mission-control`
  - `/crm`
  - `/crm/services`
  - `/crm/proposals`
  - `/platform`

### Observação sobre captura visual HTTP

- As rotas migradas são protegidas por autenticação e redirecionam sem sessão ativa.
- Por isso, a inspeção HTML pública não exibe o shell completo sem login válido.
- A comprovação de migração foi registrada via regra global do `_app` + build limpo.

## 5) Build validado

- `npm run build` executado com sucesso.

## 6) Preparação para dashboards por perfil

Entregue na Fase 1:

- estrutura visual única pronta para injeção de widgets por perfil
- ponto único de governança UX em `ApexShell`
- base para evoluir para layout condicional por role sem retrabalho estrutural

## Arquivos alterados

1. `components/layout/ApexShell.tsx` (novo)
2. `pages/_app.tsx` (atualizado)

## Fora do escopo (respeitado)

- Contract Engine: nao implementado
- Revenue Engine: nao implementado
- Campaigns: nao implementado
