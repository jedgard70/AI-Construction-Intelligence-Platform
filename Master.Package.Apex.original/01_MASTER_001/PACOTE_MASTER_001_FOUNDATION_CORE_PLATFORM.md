# IA Construction Platform — Pacote Master 001

Foundation & Core Platform

Data: 2026-05-29
Repositorio mestre: `D:\AI-constr\AI-Construction-Intelligence-Platform`

## Regra operacional

- Usar somente a pasta mestre `D:\AI-constr\AI-Construction-Intelligence-Platform`.
- Nao criar clones paralelos.
- Nao criar modulos experimentais.
- Priorizar integracao, consolidacao e reaproveitamento do que ja existe.
- Antes de qualquer tabela nova: auditar Supabase real, reutilizar tabelas e documentar gaps.
- Nenhum SQL, migration, commit, deploy ou acao destrutiva sem aprovacao explicita.

## Objetivo

Implementar a fundacao operacional da plataforma baseada no Master Plan aprovado:

1. Project Intake Engine.
2. Agent Window Framework.
3. Mission Control V1.
4. Apex AI Copilot Foundation.
5. Project Workspace.
6. Supabase Gap Analysis.

## Bloco 1 — Project Intake Engine

### Fluxo obrigatorio

`Upload -> Objetivo -> Cliente -> Projeto Automatico -> Classificacao IA -> Workspace do Projeto`

### Entradas suportadas

- PDF
- Imagem
- DWG
- IFC
- RVT
- ZIP
- Video

### Regras

- Nao deve existir botao "Criar Projeto" como acao principal.
- O projeto nasce automaticamente a partir da entrada.
- Gerar `Project ID`.
- Vincular ao cliente.
- Registrar upload.
- Registrar objetivo.
- Redirecionar para Workspace do Projeto.

### Reaproveitamento recomendado

- Tela base a criar: `pages/nova-analise.tsx`.
- Reaproveitar `clients`, `projects`, `documents`, `floor_plans`, `bim3d_analyses`.
- Reaproveitar APIs existentes:
  - `/api/plantas/analisar`
  - `/api/plantas/memorial`
  - `/api/ocr`
  - `/api/chat`
  - `/api/agents/orchestrator`

### Gap provavel

- Falta uma tabela/evento central para intake de arquivo e roteamento.
- Recomendacao provisoria: documentar como `project_intake_events` ou `project_files`, mas nao criar antes de aprovar migration.

## Bloco 2 — Agent Window Framework

### Contrato padrao

```ts
type AgentWindowResult = {
  message: string
  findings: Array<Record<string, unknown>>
  actions: Array<Record<string, unknown>>
  artifacts: Array<Record<string, unknown>>
}
```

### Integracoes

- `/api/agents/orchestrator`
- `/api/actions/execute`

### Fluxo obrigatorio

`Agente -> Analisa -> Propoe acao -> Dry Run -> Aprovacao -> Execucao`

### Aplicacao inicial

- BIM 3D
- BIM OPS
- Plantas

### Persistencia requerida

- Conversa persistida.
- Historico persistido.
- Artefatos persistidos.
- Acoes persistidas.

### Gap provavel

- O Supabase real ja possui `agent_events`, `agent_tasks`, `agent_memory`, `bim3d_analyses`, `documents`, `floor_plans`.
- Falta confirmar se `ai_agents` e `ai_agent_executions` existem no schema real atual.
- Falta estrutura dedicada para mensagens/conversas e artefatos se `agent_events` nao for suficiente.

## Bloco 3 — Mission Control V1

### Exibir

- Status modulos.
- GitHub.
- Supabase.
- Vercel.
- Roadmap.
- Checklist.

### Regras

- Nao inventar metricas.
- Usar dados reais quando disponiveis.

### Estrutura solicitada

- `platform_status`
- `roadmap_items`
- `implementation_status`

### Reaproveitamento recomendado

- `platform_modules` ja existe no Supabase real com 18 linhas.
- Arquivos/documentos existentes:
  - `docs/SPRINT_3_3_BLUEPRINT_IMPLANTACAO.md`
  - `docs/IMPLEMENTATION_AUDIT.md`
  - `docs/FEATURE_BACKLOG.md`
  - `AGENTS.md`

### Gap provavel

- `platform_status`, `roadmap_items` e `implementation_status` nao aparecem no schema real consultado.
- Antes de criar, verificar se podem ser representados por `platform_modules` + arquivo markdown + `agent_events`.

## Bloco 4 — Apex AI Copilot Foundation

### Conhecimentos iniciais

- Plataforma.
- Modulos.
- Roadmap.
- Mission Control.

### Funcoes

- Manual.
- Supervisor.
- Status.

### UI

- Botao flutuante global.
- Disponivel em todas as paginas.

### Reaproveitamento recomendado

- `components/HelpButton.tsx`
- `components/HelpButton.js`
- `/api/chat`
- `/api/knowledge`
- `/api/knowledge/retrieve`
- `knowledge_chunks`
- `agent_memory`

### Gap provavel

- `HelpButton` ainda usa localStorage para memoria local.
- Precisa virar Copilot governado por projeto/modulo/usuario, sem fingir persistencia real.

## Bloco 5 — Project Workspace

### Projeto como centro da plataforma

Toda operacao deve orbitar um `project_id`.

### Abas obrigatorias

- Arquivos.
- Chat.
- Agentes.
- Documentacao.
- Entregas.
- Financeiro.

### Reaproveitamento recomendado

- `pages/projeto/[id].tsx` como base.
- `documents` para Arquivos/Documentacao.
- `agent_events`, `agent_tasks`, `agent_memory` para Agentes.
- `budget_items`, `projects` para Financeiro.
- APIs de plantas, contratos e RDO para Entregas.

### Gap provavel

- Falta padrao unico de workspace com abas.
- Hoje modulos existem separados; precisam navegar pelo `project_id`.

## Bloco 6 — Supabase Gap Analysis

Documento dedicado:

`docs/SUPABASE_GAP_ANALYSIS_MASTER_001.md`

## Entrega obrigatoria — status inicial

| Item | Status |
|---|---|
| 1. Arquivos modificados | `docs/PACOTE_MASTER_001_FOUNDATION_CORE_PLATFORM.md`, `docs/SUPABASE_GAP_ANALYSIS_MASTER_001.md`, `components/DashboardByRole.tsx`, `components/AgentWindow.tsx`, `components/ApexCopilot.tsx`, `pages/_app.tsx`, `pages/nova-analise.tsx`, `pages/mission-control.tsx`, `pages/bim-3d.tsx`, `pages/bim-ops.tsx`, `pages/plantas.js`, `pages/projeto/[id].tsx` |
| 2. Novas rotas criadas | `/nova-analise`, `/mission-control` |
| 3. Novos componentes criados | `AgentWindow`, `ApexCopilot` |
| 4. Migrations SQL | Nenhuma migration criada ou executada; gaps documentados para aprovacao |
| 5. Checklist atualizado | Ver secao abaixo |
| 6. Percentual de avanco por modulo | Ver secao abaixo |
| 7. Proximos bloqueios tecnicos | Ver secao final |

## Checklist Master 001

| Bloco | Checklist | Status |
|---|---|---|
| Project Intake Engine | Definir rota/tela `nova-analise` | Feito |
| Project Intake Engine | Definir estrategia de persistencia sem tabela nova experimental | Feito |
| Project Intake Engine | Criar fluxo Upload -> Workspace | Feito/parcial |
| Agent Window Framework | Criar contrato `message/findings/actions/artifacts` | Feito |
| Agent Window Framework | Conectar orchestrator + actions execute | Feito |
| Agent Window Framework | Aplicar em BIM 3D, BIM OPS e Plantas | Feito |
| Mission Control V1 | Reaproveitar `platform_modules` | Feito |
| Mission Control V1 | Mapear GitHub/Supabase/Vercel reais | Feito/parcial |
| Apex AI Copilot | Consolidar HelpButton/Copilot | Feito/fundacao |
| Project Workspace | Transformar `/projeto/[id]` no centro operacional | Feito/fundacao |
| Supabase Gap Analysis | Auditar tabelas existentes | Feito/parcial |
| Supabase Gap Analysis | Definir migrations propostas | Pendente de aprovacao |

## Percentual inicial por bloco

| Bloco | Avanco |
|---|---:|
| Project Intake Engine | 45% |
| Agent Window Framework | 55% |
| Mission Control V1 | 50% |
| Apex AI Copilot Foundation | 45% |
| Project Workspace | 55% |
| Supabase Gap Analysis | 60% |

## Proximos bloqueios tecnicos

1. Validar em sessao real se `/nova-analise` cria projeto, registra documento e redireciona para `/projeto/[id]`.
2. Aprovar estrategia de upload fisico em Supabase Storage; nesta primeira fatia o arquivo fica registrado em `documents` como intake, sem criar bucket novo.
3. Aprovar se `platform_status`, `roadmap_items`, `implementation_status` serao migrations reais; nesta entrega o Mission Control usa dados existentes.
4. Definir persistencia dedicada de conversas/agentes; nesta entrega `AgentWindow` reaproveita `agent_events` quando existe `project_id`.
5. Resolver `git` fora do PATH antes de fluxo com branch/diff/commit.
