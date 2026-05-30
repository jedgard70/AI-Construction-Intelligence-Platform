# PACOTE MASTER 002-UX — IA CONSTRUCTION PLATFORM REDESIGN (PLANO)

Data: 2026-05-30
Status: planejamento UX oficial (sem implementacao)

## 1. Auditoria completa das rotas atuais

### 1.1 Rotas de interface (Pages)

Core:

- `/`
- `/dashboard`
- `/platform`
- `/mission-control`
- `/nova-analise`
- `/documentos`
- `/projeto/[id]`
- `/cliente/[id]`

Comercial/CRM:

- `/vendas`
- `/crm`
- `/crm/services`
- `/crm/proposals`
- `/crm/proposals/new`
- `/investimentos`

Operacao/Engenharia:

- `/orcamento`
- `/rdo`
- `/qualidade`
- `/plantas`
- `/bim-3d`
- `/bim-ops`
- `/archvis`
- `/director-cut`
- `/us-brand`

Juridico/Contratos:

- `/juridico`
- `/juridico/contratos`
- `/juridico/assinatura`
- `/juridico/compliance`
- `/juridico/due-diligence`
- `/contratos/novo`

Conta/Auth:

- `/login`
- `/forgot-password`
- `/reset-password`
- `/jornada`

### 1.2 Rotas de API (principais domínios)

- CRM: `/api/crm/*`
- Sales/Campaigns: `/api/sales/*`, `/api/campaigns/*`
- Storage: `/api/storage/signed-url`
- Projects: `/api/projects/create`
- Agent events/autonomous: `/api/agent-events/log`, `/api/autonomous/*`, `/api/agent-loop`
- Juridico: `/api/juridico/*`
- Knowledge/Metrics/Actions: `/api/knowledge*`, `/api/metrics`, `/api/actions/execute`

### 1.3 Diagnóstico UX atual

1. Sobreposição de entradas (`/dashboard`, `/platform`, `/mission-control`) sem hierarquia clara.
2. Navegação distribuída por domínio sem menu global único.
3. Jornadas comerciais e operacionais coexistem, porém com arquitetura visual heterogênea.
4. Fluxos de ponta-a-ponta existem, mas não estão expostos em um "command center" unificado por perfil.

## 2. Mapa de navegação oficial

Nível 1 (global):

1. Visão Geral
2. Comercial
3. Projetos
4. Operação BIM
5. Jurídico
6. Dados & IA
7. Configurações

Nível 2 (proposta):

1. Visão Geral
- Dashboard Executivo
- Mission Control

2. Comercial
- Pipeline
- Opportunities
- Services Catalog
- Proposals
- Investments

3. Projetos
- Projetos (lista)
- Projeto (detalhe)
- Clientes
- Documentos

4. Operação BIM
- BIM Ops
- BIM 3D
- Plantas
- Qualidade
- RDO
- Orçamento

5. Jurídico
- Contratos
- Assinatura
- Compliance
- Due Diligence

6. Dados & IA
- Nova Análise
- Agentes/Automação
- Conhecimento/Métricas

7. Configurações
- Perfil/Jornada
- Segurança/Auth

## 3. Estrutura do menu lateral único

Princípios:

1. Um único menu para toda a plataforma.
2. Seções recolhíveis por domínio.
3. Destaque de contexto da página atual.
4. Atalhos rápidos por perfil.

Blocos do menu:

1. Header do menu
- Workspace
- Projeto ativo

2. Seções
- Visão Geral
- Comercial
- Projetos
- Operação BIM
- Jurídico
- Dados & IA
- Configurações

3. Footer do menu
- Alertas críticos
- Status integrações
- Ajuda

## 4. Dashboard por perfil

Perfis alvo:

1. Executivo
- Receita pipeline
- Forecast
- Risco jurídico
- Saúde operacional

2. Comercial
- Funil por estágio
- Propostas por status
- Taxa de conversão
- Serviços mais vendidos

3. Gerente de Projeto/Operação
- Projetos ativos
- KPIs obra (prazo/custo/qualidade)
- Pendências técnicas

4. Jurídico
- Contratos por status
- Assinaturas pendentes
- Compliance alerts

5. BIM/Coordenação
- Clash/issue backlog
- Evolução de entregáveis
- Status de modelos

## 5. Design System Apex

### 5.1 Princípios

1. Clareza operacional primeiro.
2. Hierarquia visual forte para decisão rápida.
3. Consistência entre módulos.
4. Acessibilidade AA mínima.

### 5.2 Tokens base

Cores:

- `apex-blue-700` (ação primária)
- `apex-cyan-500` (dados/IA)
- `apex-amber-500` (atenção)
- `apex-red-600` (risco)
- `apex-green-600` (sucesso)
- neutros para superfícies e texto.

Tipografia:

- UI: Geist Sans
- Dados/tabular: Geist Mono

Escala de componentes:

- botão, input, select, card, table, badge, tabs, sidebar item, status pill.

Estados:

- hover, focus, disabled, loading, success, warning, error.

### 5.3 Padrões

1. Grid responsivo 12 colunas desktop.
2. Cards KPIs uniformes.
3. Tabelas com filtros persistentes.
4. Padrão de actions: primaria + secundarias + overflow.

## 6. Dashboard Executivo

Objetivo: visão única de decisão da Apex.

Blocos:

1. Receita e pipeline
- `open_value`, `weighted_value`, `won_value`

2. Operação
- projetos ativos, CPI/SPI médio, alertas críticos

3. Jurídico
- propostas `approved` aguardando contrato
- contratos em assinatura

4. IA/Autonomia
- tarefas autônomas pendentes
- incidentes/alertas por severidade

5. Radar internacional
- pipeline por `country_code` e `market_region`

## 7. Fluxo principal oficial da plataforma

Fluxo macro:

1. Nova Análise
2. Opportunity
3. Services Catalog
4. Proposal Engine
5. Contract Engine (próximo pacote)
6. Projeto/Workspace
7. Execução e operação contínua

Fluxo comercial detalhado:

Opportunity -> selecionar serviços -> gerar proposta -> gerar PDF -> status -> versionamento -> contrato.

## 8. Wireframes conceituais das telas principais

### 8.1 Shell global

1. Sidebar esquerda fixa
2. Topbar com contexto (workspace/projeto/usuário)
3. Conteúdo com breadcrumbs + ações principais

### 8.2 Comercial (/crm)

1. Linha 1: KPIs de funil
2. Linha 2: Kanban de stages
3. Linha 3: Tabela de oportunidades + quick actions

### 8.3 Services (/crm/services)

1. Painel catálogo (filtros + status ativo)
2. Painel “serviços por opportunity”
3. Resumo de valor por moeda/região

### 8.4 Proposals (/crm/proposals)

1. Lista por status
2. Detalhe lateral da proposta
3. Timeline comercial (sent/viewed/approved/rejected/expired)
4. Ações: gerar PDF, versionar, mudar status

### 8.5 Executive Dashboard

1. Faixa de KPIs globais
2. Mapa/região + carteira
3. Riscos críticos e ações sugeridas

## 9. Estratégia de migração das telas atuais

Faseada, sem ruptura:

1. Fase UX-1 (Paralela)
- introduzir shell unificado e menu lateral único mantendo rotas atuais.

2. Fase UX-2 (Comercial)
- consolidar `/vendas` + `/crm` em experiência única de Comercial.

3. Fase UX-3 (Operação)
- harmonizar `/bim-ops`, `/plantas`, `/rdo`, `/qualidade` no mesmo design system.

4. Fase UX-4 (Jurídico)
- padronizar telas jurídicas no shell global.

5. Fase UX-5 (Deprecação)
- aliases/redirects para rotas antigas após estabilização.

Regras de migração:

1. Sem quebrar APIs existentes.
2. Sem remover fluxos críticos antes de equivalência funcional.
3. Entrega por domínio com feature flags.

## Resultado desta etapa

- Arquitetura UX oficial definida.
- Pronta para detalhamento de implementação em pacote subsequente.
- Sem alteração de código nesta fase.
