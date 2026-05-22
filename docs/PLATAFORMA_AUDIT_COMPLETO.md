# AI Construction Intelligence Platform — Auditoria Completa

> **Data:** 22 de maio de 2026  
> **Plataforma:** Next.js  
> **Branch:** `claude/api-key-env-priority-Wwjia`

---

## Sumário

1. [Visão Geral da Arquitetura](#visão-geral)
2. [Status Geral](#status-geral)
3. [Páginas](#páginas)
4. [APIs](#api-routes)
5. [Componentes](#componentes)
6. [Bibliotecas /lib](#bibliotecas)
7. [Padrões de Arquitetura](#padrões-de-arquitetura)
8. [Exemplos de Tela](#exemplos-de-tela)
9. [Achados e Pendências](#achados-e-pendências)

---

## Visão Geral

```
AI-Construction-Intelligence-Platform/
├── pages/               # 41 páginas (Next.js routing)
│   ├── api/             # 29 rotas de API
│   └── juridico/        # Sub-rotas jurídico
├── components/          # 18 componentes (migração JS → TSX em andamento)
├── lib/                 # 9 bibliotecas de infraestrutura
├── public/              # Assets estáticos
└── styles/              # Tailwind CSS
```

**Stack:**
- Framework: Next.js (SSR + SSG)
- Estilização: Tailwind CSS
- Backend de dados: Supabase (opcional) + localStorage (primário)
- IA: Anthropic Claude API (chat, visão, PDF), Google Gemini
- Assinatura eletrônica: Lumin
- Observabilidade: `recordApiCall()` — custo por token em todos os endpoints

---

## Status Geral

| Categoria       | ✅ Funcional | 🟡 Demo/Híbrido | 🔴 Incompleto | Total |
|-----------------|:-----------:|:--------------:|:-------------:|:-----:|
| Páginas         | 6           | 25             | 10            | 41    |
| API Routes      | 21          | 8              | 0             | 29    |
| Componentes     | 11          | 5 (dual JS/TS) | 0             | 18    |

**Legenda:**
- ✅ **Funcional** — dados reais, integração real, produção-ready
- 🟡 **Demo/Híbrido** — dados hardcoded + APIs reais de IA
- 🔴 **Incompleto** — stub, shell, redirect

---

## Páginas

### ✅ Páginas Funcionais

#### `dashboard.tsx`
- Persistência de perfil: `localStorage → Supabase → ProfileSetup modal`
- 6 papéis hardcoded: `diretor_executivo`, `gestor_financeiro`, `coordenador_projetos`, `engenheiro_campo`, `gestor_qualidade`, `investidor`
- Rota por papel via `DashboardByRole` (dynamic import com loading state)
- Supabase com graceful degradation (null fallback)

#### `projeto/[id].tsx`
- Dados reais de projeto: `localStorage (atlas_projects) → Supabase`
- CRUD completo: `status`, `completion_pct`, `budget_planned/actual`, `cpi`, `spi`, `esg_score`
- 3 análises IA via `/api/chat`: Diagnóstico Executivo, Análise de Risco, Relatório para Cliente
- Log de atividades: `atlas_activity_${id}` + `recordApiCall()`
- Contratos: `atlas_contracts` filtrado por `projectId`

#### `cliente/[id].tsx`
- Visualização de projeto para stakeholders externos
- Cálculo de `burnPct`, validação `CPI/SPI`
- Dados: `localStorage → Supabase fallback`

---

### 🟡 Páginas Demo (dados hardcoded + IA real)

#### `vendas.tsx`
```
LEADS hardcoded:
  L-001: R$ 12.4M — score 87
  L-002: R$ 28.7M — score 92
  L-003: R$ 45.8M — score 96
  L-004: R$ 19.3M — score 89
  L-005: R$ 33.1M — score 91
```
- API real: `/api/chat` → Claude Sonnet para geração de copy de vendas
- `PrintShareModal` para exportação PDF
- `LAUNCH_STEPS`: 5 etapas de campanha hardcoded

#### `qualidade.tsx`
```
CHECKLISTS hardcoded:
  NBR 15575 — Desempenho de Edificações
  NBR 6118   — Projeto de Concreto
  NBR 13749  — Revestimento de Argamassa
  ISO 9001   — Gestão da Qualidade

NCIs demo (NCI-001 a NCI-005): localização, severidade, descrição
```
- Persistência real: `localStorage (atlas_ncis)` para NCIs criadas pelo usuário
- Projetos de: `atlas_projects`

#### `bim-ops.tsx` *(mais extenso)*
```
CLASH_DATA:        6 clashes com grid, severidade
PERMIT_CHECKLIST:  10 itens de permissão
WORKFLOW_TASKS:    6 tarefas com prioridades
MARKET_ROLES:      8 papéis US ($45–$120/hr)
US_CODES:          IRC 2021, IBC 2021, NEC 2023, FBC 8th Ed.
RESIDENTIAL_SYSTEMS: 6 categorias com especificações
RFI_LOG / SUBMITTAL_LOG / COORD_MATRIX: coordenação de projeto
CSI_TAKEOFF:       12 itens de custo
FEASIBILITY_MARKETS: 6 mercados US (ROI 18–28%)
```
- API real: `/api/chat` para análise IA; upload de arquivo com visão
- Persistência real: `atlas_bimops_rfis_${projectId}`

#### `investimentos.tsx`
```
PROJETOS hardcoded:
  Edifício Horizonte    — VGV R$ 48.2M  ROI 18.7%  18 meses
  Complexo Turístico    — VGV R$ 125M   ROI 28.5%  48 meses
  Retrofit Corporativo  — VGV R$ 67.3M  ROI 22.1%  24 meses
  Marina Residencial    — VGV R$ 89.5M  ROI 25.8%  36 meses
```
- API real: `/api/chat` → Claude para geração de pitch de investimento

#### `plantas.js`, `contratos/novo.js`, `archvis.tsx`, `bim-3d.tsx`, `rdo.tsx`, `documentos.tsx`
- UI presente, dados demo, integração backend parcial

---

### 🔴 Páginas Incompletas

| Página | Situação |
|--------|----------|
| `index.js` | Redirect para `/login` apenas |
| `login.js` | Stub de autenticação Supabase, incompleto |
| `juridico.tsx` | Delega para `JuridicoClient` (dynamic import) |
| `orcamento.tsx` | Delega para `OrcamentoClient` (dynamic import) |

---

## API Routes

### ✅ Integrações Reais Verificadas

#### `/api/chat.js` — **Principal**
```
Endpoint: https://api.anthropic.com/v1/messages

Modelos suportados:
  claude-sonnet-4-6
  claude-opus-4-7
  claude-opus-4-1
  claude-haiku-4-5-20251001

Task types detectados automaticamente:
  plant_analysis, legal_analysis, budget_analysis,
  sales_copy, document_ocr, marketing_copy, llm_completion

Extras:
  - PDF support: anthropic-beta: pdfs-2024-09-25
  - Token cost tracking via COST_RATES
  - Observabilidade: recordApiCall()
  - Validação: ANTHROPIC_API_KEY obrigatório
```

#### `/api/sales/pipeline.js`
- Validação: `project_id`, `trigger_event`, `assets`, `audience`
- Triggers válidos: `cinematic_assets_approved`, `roi_report_generated`, `esg_score_published`, `milestone_reached`, ...
- Pipeline: `asset_compilation → copywriting_generation → audience_targeting → webhook_dispatch`
- Webhook: `SALES_WEBHOOK_URL` (opcional)

#### `/api/projects/create.js`
- Criação de projeto com validação e persistência

#### Agentes Autônomos
```
/api/agents/orchestrator.ts   — coordenação multi-agente
/api/agents/conflict-resolution.js
/api/agent-loop.ts
/api/autonomous/task.ts
/api/autonomous/status.ts
/api/actions/execute.ts
```

#### Domínios Especializados (todos com Claude API)
```
/api/juridico/contratos/analisar.js   — análise de contratos
/api/juridico/contratos/gerar.js      — geração de contratos
/api/juridico/compliance/check.js     — verificação de compliance
/api/juridico/due-diligence/relatorio.js
/api/juridico/assinatura/enviar.js    — Lumin e-signature
/api/juridico/assinatura/status.js    — status de assinatura
/api/plantas/analisar.js              — visão de plantas (multimodal)
/api/render.js                        — pipeline cinematic
/api/ocr.ts                           — OCR de documentos
/api/learn.js                         — geração de conhecimento
```

#### Infraestrutura de Conhecimento
```
/api/knowledge/index.ts
/api/knowledge/retrieve.ts
/api/metrics/index.ts
/api/prompts/index.ts
/api/digital-twin/state.ts
/api/config.js
```

### 🟡 APIs Demo/Parciais
```
/api/gemini.ts          — Google Gemini (real, não Anthropic)
/api/campaigns/launch.js — workflow hardcoded
/api/sales/leads.js     — dados demo
/api/infrastructure/edge-sync.js
```

---

## Componentes

### ✅ Componentes Funcionais

| Componente | Função |
|------------|--------|
| `DashboardByRole.tsx` | Roteamento de UI por papel do usuário |
| `JuridicoClient.tsx` | Módulo jurídico completo + Lumin |
| `OrcamentoClient.tsx` | Orçamento com cálculos reais |
| `OrcamentoBarChart.tsx` | Gráfico de barras de orçamento |
| `OrcamentoCurvaSChart.tsx` | Análise curva S |
| `CurvaSChart.tsx` | Timeline curva S de projeto |
| `BrandMark.jsx` | Logo/branding |
| `ui/button.tsx` | Componente de botão reutilizável |

### 🟡 Duplicatas (Migração JS → TSX em andamento)

| JS | TSX | Usado por |
|----|-----|-----------|
| `HelpButton.js` | `HelpButton.tsx` | — |
| `LoginClient.js` | `LoginClient.tsx` | `login.js` |
| `NewClientModal.js` | `NewClientModal.tsx` | dashboard |
| `NewProjectModal.js` | `NewProjectModal.tsx` | dashboard |
| `PrintShareModal.js` | `PrintShareModal.tsx` | vendas, qualidade, bim-ops |

---

## Bibliotecas

| Arquivo | Função | Status |
|---------|--------|--------|
| `supabase.ts` | Singleton Supabase; retorna `null` se env ausente | ✅ Real |
| `observability.ts` | `recordApiCall()` — log de modelo, tokens, custo, duração | ✅ Real |
| `agent-graph.ts` | Grafo de orquestração de agentes | ✅ Real |
| `governance.ts` | Controles e políticas de governança | ✅ Real |
| `knowledge-store.ts` | Base de conhecimento | ✅ Real |
| `llm-router.ts` | Roteamento de modelos LLM | ✅ Real |
| `prompt-governor.ts` | Versionamento de prompts | ✅ Real |
| `tenant.ts` | Multi-tenant | ✅ Real |
| `utils.ts` | Utilidades gerais | ✅ Real |

---

## Padrões de Arquitetura

### 1. Estratégia de Dados Híbrida

```
Requisição de dados
        │
        ▼
  localStorage (primário)
  atlas_projects, atlas_ncis, atlas_contracts
        │
        ▼ (se disponível)
  Supabase (secundário)
  getSupabase() → SupabaseClient | null
        │
        ▼ (graceful degradation)
  Retorna null → continua com localStorage
```

### 2. Integração de IA

```
Componente UI
     │
     ▼ fetch POST
/api/chat.js
     │
     ├─ detecta taskType
     ├─ seleciona modelo
     ├─ calcula custo (COST_RATES)
     │
     ▼
Anthropic API (api.anthropic.com)
     │
     ▼
recordApiCall() → observability log
     │
     ▼
Resposta para UI
```

### 3. Sistema de Papéis (RBAC)

```
6 papéis disponíveis:
  diretor_executivo    → visão executiva completa
  gestor_financeiro    → foco em orçamento/EVM
  coordenador_projetos → cronograma e equipe
  engenheiro_campo     → RDO, qualidade, BIM
  gestor_qualidade     → checklists, NCIs
  investidor           → ROI, ESG, pitch deck
```

### 4. Observabilidade

```typescript
recordApiCall({
  agentId:  string,
  taskType: TaskType,
  model:    string,
  provider: 'anthropic' | 'google',
  tokens:   { input: number, output: number },
  cost:     number,         // USD
  success:  boolean,
  duration: number,         // ms
  metadata: object
})
```

---

## Exemplos de Tela

### Dashboard — Seleção de Papel

```
┌─────────────────────────────────────────────────────────────────┐
│  🏗 AI Construction Intelligence Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Bem-vindo, [Nome]                                              │
│  Selecione seu perfil para acessar o painel:                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ 📊 Diretor       │  │ 💰 Financeiro    │                    │
│  │ Executivo        │  │ Gestor           │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ 📋 Coordenador   │  │ 🔧 Engenheiro    │                    │
│  │ de Projetos      │  │ de Campo         │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ ✅ Gestor        │  │ 📈 Investidor    │                    │
│  │ de Qualidade     │  │                  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Projeto — Análise IA (projeto/[id].tsx)

```
┌─────────────────────────────────────────────────────────────────┐
│  Projeto: Edifício Horizonte [P-001]              Status: Em Andamento │
├────────────┬────────────┬────────────┬────────────┬─────────────┤
│ Conclusão  │ CPI        │ SPI        │ ESG Score  │ Budget Real │
│   67%      │ 0.94       │ 1.02       │   82       │ R$ 32.1M   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [ Diagnóstico Executivo IA ]  [ Análise de Risco ]  [ Rel. Cliente ] │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🤖 Diagnóstico Executivo (Claude Sonnet)                │  │
│  │                                                          │  │
│  │ O projeto apresenta CPI de 0.94, indicando leve         │  │
│  │ desvio orçamentário de 6%. O SPI de 1.02 demonstra     │  │
│  │ adiantamento de cronograma. Recomenda-se revisão        │  │
│  │ dos pacotes de trabalho com custo acima do baseline...  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Vendas — Pipeline de Leads

```
┌─────────────────────────────────────────────────────────────────┐
│  💼 Vendas — Pipeline Inteligente                               │
├─────────────────────────────────────────────────────────────────┤
│  Score IA  │ Lead          │ Valor       │ Etapa       │ Status │
├────────────┼───────────────┼─────────────┼─────────────┼────────┤
│   96 ●●●   │ Marina Sul    │ R$ 45.8M   │ Proposta    │ Quente │
│   92 ●●●   │ Corp Tower    │ R$ 28.7M   │ Negociação  │ Quente │
│   91 ●●●   │ Residencial X │ R$ 33.1M   │ Qualificado │ Morno  │
│   89 ●●○   │ Galpão Logist │ R$ 19.3M   │ Prospecção  │ Morno  │
│   87 ●●○   │ Varejo Centro │ R$ 12.4M   │ Contato     │ Frio   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [ Gerar Copy com IA ]  →  Claude Sonnet gera pitch personalizado │
│  [ Exportar PDF ]       →  PrintShareModal                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Qualidade — NCIs e Checklists

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Gestão de Qualidade                                         │
├─────────────────────────────────────────────────────────────────┤
│  Normas Aplicáveis:                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ NBR 15575    │  │ NBR 6118     │  │ NBR 13749    │         │
│  │ Desempenho   │  │ Concreto     │  │ Argamassa    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
├─────────────────────────────────────────────────────────────────┤
│  Não-Conformidades (NCIs)                                       │
│                                                                  │
│  NCI-001  [CRÍTICO]  Pavimento 3 — Fissura viga V12            │
│  NCI-002  [ALTO]     Cobertura  — Infiltração canto SE         │
│  NCI-003  [MÉDIO]    Fachada    — Eflorescência coluna C4      │
│  NCI-004  [BAIXO]    Interno    — Rejunte faltante banheiro 2  │
│  NCI-005  [INFO]     Fundação   — Verificação futura           │
│                                                                  │
│  [ + Nova NCI ]  [ Exportar Relatório PDF ]                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### BIM Ops — Clash Detection

```
┌─────────────────────────────────────────────────────────────────┐
│  🏗 BIM Ops — Coordenação e Clash Detection                    │
├─────────────────────────────────────────────────────────────────┤
│  Clashes Detectados (6)                                         │
│                                                                  │
│  ID      │ Grid  │ Disciplinas       │ Severidade │ Status      │
│  CLH-001 │ B3    │ Estrutura × HVAC  │ 🔴 Alto    │ Aberto      │
│  CLH-002 │ C5    │ Elét × Hidráulic  │ 🟡 Médio   │ Em análise  │
│  CLH-003 │ A2    │ HVAC × Estrutura  │ 🔴 Alto    │ Aberto      │
│  CLH-004 │ D4    │ Hidráulic × Civil │ 🟢 Baixo   │ Resolvido   │
│  CLH-005 │ B6    │ Elét × Estrutura  │ 🟡 Médio   │ Aberto      │
│  CLH-006 │ E1    │ HVAC × Hidráulic  │ 🟢 Baixo   │ Em análise  │
│                                                                  │
│  [ Análise IA dos Clashes ]  →  Claude gera plano de resolução │
├─────────────────────────────────────────────────────────────────┤
│  Mercados US — Viabilidade                                      │
│                                                                  │
│  Miami    ROI 24% │ Austin   ROI 28% │ Phoenix  ROI 22%        │
│  Denver   ROI 19% │ Dallas   ROI 26% │ Atlanta  ROI 18%        │
└─────────────────────────────────────────────────────────────────┘
```

---

### Investimentos — Projetos e Pitch IA

```
┌─────────────────────────────────────────────────────────────────┐
│  📈 Investimentos — Portfólio                                   │
├─────────────────────────────────────────────────────────────────┤
│  Projeto              │ VGV         │ ROI    │ Prazo  │ Fase   │
├───────────────────────┼─────────────┼────────┼────────┼────────┤
│  Edifício Horizonte   │ R$ 48.2M   │ 18.7%  │ 18m    │ Obra   │
│  Complexo Turístico   │ R$ 125M    │ 28.5%  │ 48m    │ Lançam │
│  Retrofit Corporativo │ R$ 67.3M   │ 22.1%  │ 24m    │ Proj   │
│  Marina Residencial   │ R$ 89.5M   │ 25.8%  │ 36m    │ Aprov  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [ Gerar Pitch Deck IA ]                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  "O Complexo Turístico representa uma oportunidade      │   │
│  │   única no segmento de resort premium no Nordeste       │   │
│  │   brasileiro. Com ROI projetado de 28.5% em 48 meses   │   │
│  │   e demanda reprimida de 12.000 unidades na região..." │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Observabilidade — Custo de API

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 Observabilidade — Chamadas de API                           │
├─────────────────────────────────────────────────────────────────┤
│  Timestamp     │ Modelo          │ Task Type      │ Custo (USD) │
├────────────────┼─────────────────┼────────────────┼─────────────┤
│  10:23:45      │ claude-sonnet-4-6│ legal_analysis │ $0.0032    │
│  10:22:11      │ claude-opus-4-7 │ plant_analysis │ $0.0187    │
│  10:20:55      │ claude-sonnet-4-6│ sales_copy     │ $0.0041    │
│  10:19:30      │ claude-haiku-4-5│ llm_completion │ $0.0008    │
├─────────────────────────────────────────────────────────────────┤
│  Total sessão: $0.0268           Tokens: 47,320                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Achados e Pendências

### O que está funcionando em produção

- [x] Dashboard com seleção de papel (6 roles) e persistência
- [x] Projetos: CRUD completo com EVM (CPI, SPI, EAC, ESG)
- [x] 3 análises IA por projeto (diagnóstico, risco, cliente)
- [x] Assinatura eletrônica Lumin integrada no módulo jurídico
- [x] Geração de contratos, análise de compliance, due diligence via Claude
- [x] Análise de plantas com visão multimodal
- [x] OCR de documentos
- [x] Pipeline de vendas com copywriting IA
- [x] Observabilidade com custo por token em todos os endpoints
- [x] Orquestração multi-agente (`orchestrator.ts`, `agent-loop.ts`)

### Pendências críticas

| Item | Página/Arquivo | Impacto |
|------|----------------|---------|
| Autenticação incompleta | `login.js` | Bloqueante para produção |
| Homepage sem conteúdo | `index.js` | Redirect apenas |
| Dados de leads hardcoded | `vendas.tsx` | Demo only |
| Dados de clash hardcoded | `bim-ops.tsx` | Demo only |
| Duplicatas JS/TSX | 5 componentes | Técnica (migração) |

### Variáveis de ambiente necessárias

```bash
# Obrigatório
ANTHROPIC_API_KEY=sk-ant-...

# Opcional (graceful degradation para localStorage)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Opcional
SALES_WEBHOOK_URL=https://...   # webhook de pipeline de vendas
LUMIN_API_KEY=...               # assinatura eletrônica
GOOGLE_GEMINI_API_KEY=...       # provedor alternativo de IA
```

### Chaves localStorage

```
atlas_projects              → projetos criados pelo usuário
atlas_ncis                  → não-conformidades
atlas_contracts             → contratos
atlas_activity_${id}        → log de atividades por projeto
atlas_bimops_rfis_${id}     → RFIs BIM por projeto
atlas_profile               → perfil do usuário ativo
```

---

*Gerado em 22/05/2026 — Auditoria completa: 41 páginas, 29 APIs, 18 componentes, 9 libs*
