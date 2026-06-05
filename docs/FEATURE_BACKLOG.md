# AI Construction Intelligence Platform — Feature Backlog Completo

> **Gerado em:** 22/05/2026  
> **Fontes:** Sessões Claude Code (histórico), `Sugetoes de mudaças na plataforma.docx`, `PLATAFORMA_AUDIT_COMPLETO.md`, análise direta de código  
> **Propósito:** Recuperar TODOS os pedidos feitos nas sessões anteriores que não foram implementados

---

## LEGENDA DE PRIORIDADE

| Prioridade | Símbolo | Critério |
|-----------|---------|----------|
| Crítico | 🔴 | Bloqueia uso em produção ou pedido explícito urgente |
| Alto | 🟠 | Funcionalidade core pedida pelo usuário |
| Médio | 🟡 | Melhora significativa de experiência |
| Baixo | 🟢 | Nice-to-have, qualidade de código |

---

## GRUPO 1 — PEDIDOS EXPLÍCITOS DO USUÁRIO (não implementados)

Estes foram pedidos diretamente nas sessões de chat com Claude Code e **nunca foram realizados**.

---

### 🔴 P1 — Impressão de Plantas + Memorial Descritivo

**O que foi pedido:**
> "padrao de renderizaçoes que ainda nao funciona a impressao da planta junto com os relatorios respectivo no memorial descritivo"

**Status atual em `pages/plantas.js`:**
- Botão "↓ Exportar" (linha 379) existe mas **não tem nenhuma função** — `onClick` ausente
- Zero código de impressão no arquivo inteiro (681 linhas auditadas)
- Zero menção a "memorial descritivo" em todo o arquivo
- Nenhuma integração com `/api/plantas/analisar.js` para gerar relatório

**O que precisa ser implementado:**

#### 1a. Impressão da Planta (window.print / PDF)

```js
// Adicionar função de impressão no plantas.js
const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
    <head>
      <title>Planta A-201 — ${projectName}</title>
      <style>
        @page { size: A3 landscape; margin: 15mm; }
        body { font-family: 'Geist', sans-serif; }
        .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
        .stamp { border: 1px solid #333; padding: 8px; font-family: monospace; font-size: 11px; }
        .findings-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .findings-table th, td { border: 1px solid #ccc; padding: 6px; font-size: 11px; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <!-- SVG da planta aqui -->
      <!-- Tabela de achados aqui -->
    </body>
    </html>
  `)
  printWindow.print()
}
```

#### 1b. Memorial Descritivo

Nova seção/modal em `plantas.js` que gera o documento técnico com:
- Identificação da obra (projeto, folha, data, responsável técnico, ART)
- Tabela de ambientes com áreas (do `DRAWING.rooms`)
- Lista de achados com severidade, norma de referência e ação recomendada
- Assinatura de engenheiro responsável
- Botão "Gerar PDF" que chama `/api/chat` com `taskType: 'plant_analysis'`

**Template do Memorial Descritivo:**
```
MEMORIAL DESCRITIVO — ANÁLISE DE PLANTA BAIXA
===============================================
Obra:        [Nome do Projeto]
Folha:       A-201
Escala:      1:100
Data:        [Data]
Responsável: [Engenheiro Responsável]
CREA/CAU:    [Número do Conselho]

1. OBJETO
   Análise técnica da planta baixa Pavimento 04 — Vista Tower

2. AMBIENTES
   [Tabela com id, nome, área de cada room em DRAWING.rooms]

3. ACHADOS DE REVISÃO
   [Para cada finding: id, categoria, severidade, descrição, norma, ação]

4. CONCLUSÃO
   [Gerada por Claude com base nos achados]

5. RESPONSABILIDADE TÉCNICA
   _________________________________
   [Nome] — CREA/CAU [número]
```

**Arquivos a criar/modificar:**
- `pages/plantas.js` — adicionar botões "Imprimir Planta", "Gerar Memorial", função `handlePrint()`, componente `MemorialDescritivo`
- `pages/api/plantas/memorial.js` — novo endpoint que usa Claude para redigir o texto técnico

---

### 🔴 P2 — Rastreamento de Dias Trabalhados / Lembretes

**O que foi pedido:**
> "como lembrar de dias de trabalho, os perdi tenho que fazer tudo de novo"

**Status atual:** Não existe em nenhum arquivo da plataforma.

**O que precisa ser implementado:**

#### Módulo `pages/jornada.js` (novo)

```
Interface:
┌─────────────────────────────────────────────┐
│  📅 Jornada de Trabalho                     │
├─────────────────────────────────────────────┤
│  Hoje: Sexta, 22 Mai 2026                   │
│  Horas trabalhadas: [__:__]  [▶ Iniciar]    │
├─────────────────────────────────────────────┤
│  PROJETOS ATIVOS HOJE:                      │
│  ☑ Vista Tower — 2h30 — BIM Coordination    │
│  ☑ Edifício Horizonte — 1h15 — Qualidade    │
│  + Adicionar projeto                        │
├─────────────────────────────────────────────┤
│  HISTÓRICO (últimos 7 dias):                │
│  22/05  8h30  Vista Tower + Horizonte       │
│  21/05  7h45  Vista Tower                   │
│  20/05  0h00  (ausente)                     │
│  19/05  9h00  Horizonte + Reunião cliente   │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- Timer de ponto (start/stop, com localStorage)
- Associar horas a projetos específicos
- Notas do dia (o que foi feito)
- Relatório semanal (total de horas por projeto)
- localStorage key: `atlas_jornada_${yyyymmdd}`
- Lembrete via `Notification API` do browser: "Registrar ponto de entrada/saída"
- Exportar horas em CSV para RDO (Relatório Diário de Obra)

**Integração com RDO:**
- `pages/rdo.tsx` deve puxar horas da jornada para preencher automaticamente o RDO do dia

---

### 🟠 P3 — Dados Reais nos Módulos Demo

**O que foi pedido:** Substituir hardcoded por dados reais do usuário.

#### 3a. `vendas.tsx` — Leads reais

- Conectar à tabela `leads` no Supabase
- CRUD de leads: criar, editar, mover estágio (kanban)
- Conectar ao `PrintShareModal` para exportar PDF do pipeline

#### 3b. `bim-ops.tsx` — Clashes reais

- Upload de arquivo IFC/NWC para detectar clashes
- Conectar `/api/plantas/analisar.js` para visão multimodal
- Salvar RFIs em `atlas_bimops_rfis_${projectId}` (já existe)

#### 3c. `investimentos.tsx` — Projetos reais

- Conectar à tabela `investments` no Supabase
- CRUD de investimentos
- Geração de pitch deck real (já tem API, falta UI de configuração)

#### 3d. `rdo.tsx` — RDO real

- Formulário de RDO diário com campos: data, obra, clima, efetivo, atividades, ocorrências, fotos
- Persistência: localStorage `atlas_rdo_${projectId}_${yyyymmdd}`
- Exportar PDF/Word do RDO
- Assinar digitalmente via Lumin (já tem integração)

---

### 🟠 P4 — Login / Autenticação Completa

**Status atual:** `login.js` é stub — Supabase auth chamado mas fluxo incompleto.

**O que precisa:**
- Supabase `signInWithPassword` com redirect após login
- Página de `register.js` para novos usuários
- `forgot-password.js` com `resetPasswordForEmail`
- Middleware de proteção de rotas (verificar sessão)
- Logout funcional no dashboard

---

### 🟠 P5 — Homepage (`index.js`)

**Status atual:** Apenas redirect para `/login`.

**O que precisa:** Landing page da plataforma com:
- Hero section com logo ConstructAI / Atlas
- Cards dos módulos (Dashboard, BIM, Plantas, Vendas, etc.)
- Call to action: "Acessar Plataforma" → `/login`
- Links para landing pages Atlas e Apex Nova

---

### 🟠 P6 — Cronograma / Gantt

**O que foi pedido nas sessões anteriores:** Visualização de cronograma com Gantt.

**Arquivo a criar:** `pages/cronograma.js`

```
Interface:
┌─────────────────────────────────────────────────────────┐
│  📅 Cronograma — Vista Tower                            │
├─────────────────────────────────────────────────────────┤
│  Tarefa              │ Mai │ Jun │ Jul │ Ago │ Set      │
│  Fundação            │ ████ ████ │     │     │          │
│  Estrutura           │          │ ████ ████ ████ │      │
│  Alvenaria           │          │          │ ██ ████    │
│  Revestimento        │          │          │     │ ████  │
├─────────────────────────────────────────────────────────┤
│  CPI: 0.94  SPI: 1.02  EAC: R$ 34.2M                   │
└─────────────────────────────────────────────────────────┘
```

- Usar biblioteca `react-gantt` ou SVG nativo
- Curva S de progresso integrada
- Baseline vs real
- Export para PDF

---

### 🟠 P7 — Módulo de Fornecedores

**Arquivo a criar:** `pages/fornecedores.js`

- Cadastro de fornecedores (nome, CNPJ, especialidade, contato)
- Avaliação por projeto (qualidade, prazo, preço)
- Histórico de contratos
- Conectar ao módulo de Orçamento (associar itens a fornecedores)
- Persistência: Supabase tabela `suppliers`

---

### 🟠 P8 — Painel de Custo de IA (IA Cost Dashboard)

**Status atual:** `recordApiCall()` existe e funciona — mas não há UI para visualizar.

**Arquivo a criar:** `pages/ia-custo.js`

```
Interface:
┌─────────────────────────────────────────────────────────┐
│  🤖 Custo de IA — Sessão atual                          │
├──────────────┬──────────────────┬───────────┬───────────┤
│ Agente        │ Modelo           │ Tokens    │ Custo USD │
│ BIM_Coord     │ claude-opus-4-7  │ 12,400   │ $0.0187   │
│ Jurídico_AI   │ claude-sonnet-4-6│  8,200   │ $0.0041   │
│ Sales_Copy_AI │ claude-haiku-4-5 │  3,100   │ $0.0008   │
├──────────────┴──────────────────┴───────────┴───────────┤
│ TOTAL:  23,700 tokens  │  $0.0236 USD  │  R$ 0.12 BRL   │
└─────────────────────────────────────────────────────────┘
```

- Ler logs de `localStorage (recordApiCall)`
- Gráfico de custo por dia/semana
- Alerta quando custo diário ultrapassar threshold

---

### 🟠 P9 — Sistema de Notificações

**Arquivo a criar:** `components/NotificacoesPanel.tsx`

- Notificações de: novo RFI, clash detectado, NCI aberta, prazo próximo, RDO pendente
- Badge de contador no navbar
- Persistência em localStorage `atlas_notificacoes`
- Integrar com `Notification API` do browser para push notifications

---

### 🟡 P10 — `contratos/novo.js` — Formulário Completo

**Status atual:** UI presente mas formulário incompleto.

**O que precisa:**
- Formulário com todos os campos do template de contrato (`test-01.md`)
- 13 cláusulas configuráveis
- Preview em tempo real
- Gerar PDF via Claude → Lumin para assinatura
- Salvar em `atlas_contracts`

---

### 🟡 P11 — Módulo Documentos (`documentos.tsx`)

**Status atual:** Demo, sem backend real.

**O que precisa:**
- Upload de documentos (PDF, DWG, IFC, DOCX)
- OCR via `/api/ocr.ts`
- Organização por projeto e categoria
- Busca full-text com Claude
- Armazenar no Supabase Storage

---

### 🟡 P12 — Digital Twin UI

**Status:** `/api/digital-twin/state.ts` existe mas não há página de UI.

**Arquivo a criar:** `pages/digital-twin.js`
- Visualização do estado atual do projeto em tempo real
- Integração com `bim-3d.tsx`

---

### 🟡 P13 — PWA / Mobile

**O que foi pedido:** App funcionar offline e em mobile.

- Adicionar `next-pwa` package
- `public/manifest.json`
- Service worker para cache offline
- Ícones para home screen

---

## GRUPO 2 — ARQUITETURA E QUALIDADE (de `Sugestoes de mudaças.docx`)

Estes são os 6 gaps críticos e 5 melhorias do documento de sugestões (74/100 pontos).

---

### 🔴 A1 — Autenticação Multi-Tenant v6.0 (API Versioning)

**Problema:** Sem API versioning → bloqueia multi-tenant v6.0  
**Solução:** Prefixar todas as rotas com `/api/v1/` e criar middleware de versão

```js
// pages/api/v1/[...route].js — proxy com versionamento
```

---

### 🔴 A2 — Testes Automatizados

**Problema:** Risco existencial — qualquer refatoração pode quebrar tudo silenciosamente.

**O que implementar:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

- Testes unitários: `OrcamentoClient`, `DashboardByRole`, `CurvaSChart`
- Testes de integração: `/api/chat.js`, `/api/projects/create.js`
- Cobertura mínima: 60% das funções críticas

---

### 🔴 A3 — Orçamento de IA (Budget Management)

**Problema:** 8 agentes rodando sem limite de gasto.

**Solução:**
```typescript
// lib/ai-budget.ts
export const AI_BUDGET = {
  daily_limit_usd: 5.00,
  per_request_limit_usd: 0.50,
  alert_threshold_pct: 0.80,
}

export function checkBudget(estimatedCost: number): boolean {
  const todaySpend = getTodaySpend() // de recordApiCall()
  if (todaySpend + estimatedCost > AI_BUDGET.daily_limit_usd) {
    throw new Error(`Orçamento diário de IA excedido ($${AI_BUDGET.daily_limit_usd})`)
  }
  return true
}
```

---

### 🔴 A4 — Gerenciamento de Segredos (Secrets Manager)

**Problema:** Chaves em variáveis de ambiente simples (`.env.local`) — risco de vazamento.

**Solução imediata:**
- Rotacionar todas as chaves agora (Supabase, Anthropic, Lumin, Gemini)
- No Vercel: usar "Environment Variables" criptografadas (já existe)
- Nunca logar chaves em `recordApiCall()`

**Solução ideal:**
- AWS Secrets Manager ou HashiCorp Vault
- Wrapper `lib/secrets.ts` que busca do vault em runtime

---

### 🔴 A5 — LGPD para Dados de Terceiros

**Problema:** Sem política de retenção de dados de clientes/projetos.

**O que implementar:**
- Política de privacidade visível
- Consentimento explícito no cadastro
- Endpoint de exclusão de dados `DELETE /api/user/data`
- Retenção: dados de projetos por 5 anos conforme ABNT

---

### 🟠 A6 — Document Intelligence AI — Proteção contra Prompt Injection

**Problema:** Upload de PDFs pode conter prompts maliciosos que alteram o comportamento do Claude.

**Solução:**
```js
// Sanitizar conteúdo OCR antes de passar ao Claude
const sanitized = extractedText
  .replace(/<instructions>/gi, '[REDACTED]')
  .replace(/ignore previous/gi, '[REDACTED]')
  .substring(0, 50000) // limite de tamanho
```

---

### 🟠 A7 — Gateway de API Centralizado

**Problema:** Cada página faz fetch direto para `/api/chat` com configurações diferentes.

**Solução:** `lib/api-client.ts` centralizado:
```typescript
export const apiClient = {
  chat: (payload) => fetch('/api/chat', { ... }),
  analyze: (file) => fetch('/api/plantas/analisar', { ... }),
  // etc
}
```

---

### 🟠 A8 — Isolamento de Contexto por Projeto

**Problema:** Agentes de IA não isolam contexto entre projetos diferentes.

**Solução:** Todo prompt de agente deve incluir `project_id` e `user_id`:
```typescript
const systemPrompt = `
  Contexto: project_id=${projectId}, user_id=${userId}
  Você só pode acessar dados deste projeto.
  Nunca mencione outros projetos.
`
```

---

### 🟠 A9 — Dividir Investment_Analyst_AI em 3 Agentes

**Problema:** `Investment_Analyst_AI` tem 22 capabilities (design smell).

**Solução:** Dividir em:
- `ROI_Calculator_AI` — cálculos financeiros (VGV, ROI, TIR, VPL)
- `Market_Intelligence_AI` — pesquisa de mercado e benchmarks
- `Pitch_Writer_AI` — geração de narrativa para investidores

---

### 🟡 A10 — Idempotência em Operações de Escrita

**Problema:** Double-click no botão "Criar Projeto" cria dois projetos.

**Solução:**
```js
// Adicionar idempotency key em todas as mutações
headers: {
  'Idempotency-Key': crypto.randomUUID()
}
```

---

### 🟡 A11 — Feature Flags para v6.0

**Problema:** Novas features vão direto para produção sem controle.

**Solução:** `lib/feature-flags.ts`
```typescript
export const FEATURES = {
  MULTI_TENANT:    process.env.FF_MULTI_TENANT === 'true',
  GANTT_CHART:     process.env.FF_GANTT === 'true',
  PWA_OFFLINE:     process.env.FF_PWA === 'true',
  AI_BUDGET_LIMIT: process.env.FF_AI_BUDGET === 'true',
}
```

---

## GRUPO 3 — MÓDULOS A CONECTAR AO SUPABASE

Módulos que usam localStorage mas precisam ser migrados para Supabase (persistência real, multi-usuário).

| Módulo | Arquivo | localStorage key atual | Tabela Supabase a criar |
|--------|---------|----------------------|------------------------|
| Plantas | `plantas.js` | — | `plant_findings` |
| RDO | `rdo.tsx` | `atlas_rdo_*` | `daily_reports` |
| Documentos | `documentos.tsx` | — | `documents` (+ Storage) |
| Investimentos | `investimentos.tsx` | — | `investments` |
| Fornecedores | (novo) | — | `suppliers` |
| Jornada | (novo) | `atlas_jornada_*` | `work_sessions` |
| Notificações | (novo) | `atlas_notificacoes` | `notifications` |
| Leads/Vendas | `vendas.tsx` | — | `leads` |

**SQL para criar estas tabelas:**
```sql
-- Executar no Supabase SQL Editor
CREATE TABLE plant_findings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  sheet TEXT NOT NULL,
  finding_id TEXT,
  x FLOAT, y FLOAT, w FLOAT, h FLOAT,
  category TEXT, severity TEXT, confidence FLOAT,
  title TEXT, body TEXT, ref TEXT, room TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  report_date DATE NOT NULL,
  weather TEXT, effective_team INT,
  activities TEXT, occurrences TEXT,
  worked_hours FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE work_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  session_date DATE NOT NULL,
  start_time TIME, end_time TIME,
  worked_hours FLOAT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  value DECIMAL,
  stage TEXT DEFAULT 'prospecting',
  score INT,
  status TEXT DEFAULT 'cold',
  contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  specialty TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  rating FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## GRUPO 4 — INTEGRAÇÕES EXTERNAS PENDENTES

### 🟡 I1 — AutoCAD / IFC Integration

**O que foi pedido:** Importar arquivos DWG/IFC para o visualizador de plantas.

- Converter IFC para JSON usando `ifc.js` ou `web-ifc`
- Renderizar em `bim-3d.tsx` (já tem three.js configurado)
- Detectar clashes automaticamente

### 🟡 I2 — Landing Pages Atlas / Apex Nova

**Status:** Website publico separado no repo `apex-global-website`. A plataforma privada nao deve manter landing duplicada.

**O que falta:**
- Conectar landing page ao domínio no repo/projeto Vercel do website publico
- Formulário de captura de leads → Supabase `leads`
- CTA "Solicitar Demo" → notificação para Edgard

### 🟡 I3 — Gemini API Integration UI

**Status:** `/api/gemini.ts` existe e funciona.

**O que falta:** Opção na UI para escolher Claude vs Gemini por módulo.

---

## GRUPO 5 — BUGS E CORREÇÕES CONHECIDAS

| # | Bug | Arquivo | Impacto |
|---|-----|---------|---------|
| B1 | Botão "Exportar" sem onClick em plantas.js | `plantas.js:379` | Alto |
| B2 | Login stub não redireciona após auth | `login.js` | Crítico |
| B3 | index.js não tem landing, só redirect | `index.js` | Alto |
| B4 | "Criar RFI formal" no modal de plantas sem onClick | `plantas.js:642` | Médio |
| B5 | `LAUNCH_STEPS` em vendas hardcoded | `vendas.tsx` | Médio |
| B6 | Duplicatas JS/TSX (5 componentes) ainda existem | `components/` | Baixo |
| B7 | `PrintShareModal.js` (versão JS) ainda existe | `components/` | Baixo |

---

## ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

### Sprint 1 — Funcionalidade Crítica Pedida (semana 1)
1. 🔴 **P1a** — Impressão da planta (window.print com SVG)
2. 🔴 **P1b** — Memorial Descritivo (template + Claude API)
3. 🔴 **P2** — Jornada/rastreamento de dias trabalhados
4. 🔴 **B2** — Login funcional com Supabase

### Sprint 2 — Core da Plataforma (semana 2)
5. 🟠 **P5** — Homepage (não só redirect)
6. 🟠 **P4** — Autenticação completa (register, forgot password)
7. 🟠 **P3b** — Dados reais no BIM-Ops
8. 🟠 **P6** — Cronograma / Gantt básico

### Sprint 3 — Segurança e Qualidade (semana 3)
9. 🔴 **A3** — AI Budget Management
10. 🔴 **A4** — Secrets Manager (rotacionar chaves)
11. 🔴 **A5** — LGPD compliance básico
12. 🟠 **A6** — Proteção prompt injection

### Sprint 4 — Módulos Novos (semana 4)
13. 🟠 **P8** — IA Cost Dashboard
14. 🟠 **P9** — Sistema de Notificações
15. 🟠 **P7** — Módulo Fornecedores
16. 🟠 **P10** — contratos/novo.js completo

### Sprint 5 — Dados Reais e Supabase (semana 5)
17. SQL do Grupo 3 — criar tabelas no Supabase
18. 🟠 **P3a** — Vendas/leads reais
19. 🟠 **P3d** — RDO real
20. 🟠 **P11** — Documentos reais

### Sprint 6 — Arquitetura e Qualidade (semana 6)
21. 🟠 **A7** — API Gateway centralizado
22. 🟠 **A8** — Isolamento de contexto
23. 🟠 **A9** — Split Investment_Analyst_AI
24. 🔴 **A1** — API Versioning (/v1/)
25. 🔴 **A2** — Testes automatizados

---

## PRÓXIMA AÇÃO IMEDIATA

**Começar com P1 — Impressão de Plantas + Memorial Descritivo** pois foi o pedido mais recente e mais urgente. Envolve:

1. Modificar `pages/plantas.js`:
   - Conectar o botão "↓ Exportar" a uma função `handlePrint()`
   - Adicionar botão "Memorial Descritivo"
   - Criar componente `MemorialDescritivo` com template
   - Função de impressão que gera HTML+CSS otimizado para A3

2. Criar `pages/api/plantas/memorial.js`:
   - Recebe findings, rooms, projectName
   - Chama Claude com `taskType: 'plant_analysis'`
   - Retorna texto técnico do memorial formatado

---

*Backlog gerado em 22/05/2026 — 25 features, 11 itens de arquitetura, 5 bugs, 3 integrações externas*
