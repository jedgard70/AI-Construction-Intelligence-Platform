# APEX ENTRY FLOW — SOURCE OF TRUTH
**Apex Global AI Platform — Complete Entry & UX Flow**

**Date:** 2026-06-04  
**Status:** Active — Checkpoint 0  
**Audience:** Architecture, Engineering, Product, Owner

---

## 1. PLATFORM MODES

### Mode 1: Apex Internal Operations
- **User:** Apex Global AI (company operating the platform)
- **Access:** Full platform + all clients + all projects + all operations
- **Visibility:** All CRM, financeiro, documentos, produção, marketing, jurídico, contratos, ArchVis, DirectCut, Design/Web, gestão
- **Role:** `diretor_executivo` (Owner/Admin)

### Mode 2: Construtech / SaaS for Clients
- **User:** Cliente tenant (external company using platform for their business)
- **Access:** Own tenant universe only
- **Visibility:** Own CRM, own projects, own financeiro, own documentos, own marketing, own web, own social media
- **Role:** Client (limited), Employee (scoped by function)

### Mode 3: Employee/Functional Roles
- **User:** Employee of Apex or Client tenant
- **Access:** Assigned sector, function, projects only
- **Visibility:** Only permitted data (project members, assigned projects, sector-specific modules)
- **Role:** gestor_financeiro, coordenador_projetos, engenheiro_campo, gestor_qualidade, investidor, etc.

---

## 2. AUTHENTICATION FLOW

```
User enters email/password
  ↓
Supabase Auth validates credentials
  ↓
Session created + cookie set
  ↓
Full page redirect to /dashboard (browser sends fresh session cookie)
  ↓
pages/dashboard.tsx loads
  ↓
useEffect: fetch profile from Supabase (RLS enforces visibility)
  ↓
Profile loaded with role from database
  ↓
Access gate check: role validates against AUTHORIZED_OWNER_ROLES
  ↓
If diretor_executivo → DashboardByRole (operational dashboard)
Else → SafeEntryHome (welcome/intake screen)
```

---

## 3. ENTRY SCREEN — WELCOME PAGE / ANÁLISES

**This is the correct first screen for ALL users after login.**

### Visual Structure
```
┌─────────────────────────────────────────┐
│  APEX GLOBAL AI                         │
│  Bem-vindo à Apex Global AI, [Name]!   │
├─────────────────────────────────────────┤
│                                          │
│  Estamos prontos para ajudar você com   │
│  gestão de projetos, análise de         │
│  documentos, renders e muito mais.      │
│                                          │
│  [📋 Iniciar Atendimento]                │
│  [📎 Anexar Documento]                   │
│  [🤖 Falar com Apex AI]                  │
│                                          │
│  💡 Dica: Use o Apex AI para anexar     │
│  qualquer documento (projeto, RG,        │
│  nota fiscal, contrato) e deixe a IA    │
│  classificar e rotear...                 │
│                                          │
│  Email: [user@email.com]                 │
│                                          │
│  ╔═══════════════════════════════════╗   │
│  ║ [Owner Only - Visible After Scroll] ║  │
│  ║ 🔐 Controle Owner / Dashboard Exec ║  │
│  ╚═══════════════════════════════════╝   │
└─────────────────────────────────────────┘
```

### Owner Special Behavior
- Owner logs in → sees Welcome Page / Análises (SAME screen as everyone)
- Scroll down → sees additional button: **"Controle Owner / Dashboard Executivo"**
- Owner can choose:
  - Análises/Welcome (intake, attachments, Copilot) OR
  - Dashboard Executivo (metrics, all projects, all clients, operations)

### Non-Owner Behavior
- Non-owner logs in → sees Welcome Page / Análises ONLY
- No "Controle Owner" button visible
- Focus on: Intake, Attachments, Copilot conversation

---

## 4. DASHBOARD EXECUTIVO — Owner Only

**This is NOT the entry screen. It's a separate control area.**

### Access
- Only `diretor_executivo` (Owner/Admin) role
- Reached via: Welcome Page → scroll → "Controle Owner" button OR sidebar menu (if visible to owner)

### Content
- Produção geral (all projects, all stages)
- CRM geral (all clients, all opportunities)
- Financeiro geral (all invoices, all revenue, all costs)
- Todos os clientes (client list, tenant info)
- Todos os projetos (project portfolio, status)
- Métricas globais (KPIs, CPI, SPI, RDO, NCIs)
- Mission Control (PR status, builds, Vercel, Supabase, logs)

### Role Gate
```typescript
// pages/dashboard.tsx
const AUTHORIZED_OWNER_ROLES = new Set(['diretor_executivo'])

if (profile.role && AUTHORIZED_OWNER_ROLES.has(profile.role)) {
  return <DashboardByRole profile={profile!} />
}
return <SafeEntryHome email={profile.email} fullName={profile.full_name} />
```

---

## 5. PROJECT INTAKE — Automatic Flow

### Trigger
User uploads file to Análises module → Apex AI reads + analyzes → triggers intake

### Steps
1. **Upload** → PDF, JPG, PNG, print, IFC, DWG, RVT, ZIP, vídeo, contrato, nota fiscal, RG, memorial, planta, foto

2. **Análise** → Apex AI reads content, extracts data, classifies type

3. **Cliente** → "Cliente novo ou existente?"
   - Novo: Collect email, name, company, location (país, estado, cidade)
   - Existente: Select from list

4. **Projeto Automático** → Generate:
   - Project ID (auto)
   - Project name (from document or user input)
   - Location (país, estado, cidade - from client or document)
   - Production routing (EUA, Brasil, Europa)

5. **Classificação IA** → Apex AI determines:
   - Document type (projeto, contrato, RG, fatura, etc.)
   - Department (jurídico, produção, financeiro, etc.)
   - Workflow (project creation, contract engine, finance entry, etc.)

6. **Workspace do Projeto** → Open project workspace with:
   - Document stored + linked
   - Team assignments
   - Next workflow steps
   - Chat/Copilot available

---

## 6. DOCUMENTS — Contextual, Not Primary

**Documents is NOT a top-level menu item.**

### Pattern
Documents appear as button/link WITHIN relevant modules:

#### Financeiro Module
```
Financeiro
  ├─ Documents [button]
  │   ├─ Nota Fiscal
  │   │   └─ [cliente] → [obra/projeto] → [categoria/custo]
  │   ├─ Recibo
  │   └─ Contrato de Serviço
```

#### Jurídico Module
```
Jurídico / Contratos
  ├─ Documents [button]
  │   ├─ Contrato
  │   ├─ Memorial
  │   ├─ Escopo
  │   ├─ Permits
  │   └─ Endossos
```

#### Projeto / Workspace
```
Projeto [name]
  ├─ Documents [button]
  │   ├─ Planta Baixa
  │   ├─ Elevação
  │   ├─ Cortes
  │   └─ Memorial Técnico
```

---

## 7. ROUTING LOGIC — Apex AI Classification

When document is analyzed, Apex AI determines next workflow:

```
Document Type → Department → Workflow → Action

Nota Fiscal
  → Financeiro
  → Revenue Engine
  → Extract: cliente, obra, categoria, valor, data
  → Create Financeiro entry
  → Link to Project/Cliente

Contrato
  → Jurídico / Contratos
  → Contract Engine
  → Extract: partes, serviços, valores, prazo, país
  → Match contract template by country + service
  → Generate contract
  → Route to assinatura

RG / Documento Pessoal
  → CRM / Cliente
  → Extract: nome, email, dados pessoais (secure)
  → Create/update Cliente
  → Link to Project

Planta / Projeto Técnico
  → Produção / Projeto
  → Extract: dimensões, especificações, materiais
  → Link to Project Workspace
  → Available to design/build team

Memorial / Escopo
  → Jurídico + Produção
  → Extract: especificações, prazos, responsabilidades
  → Link to Project + Contrato
  → Routes to Contratos if needed

Foto de Obra / Campo
  → Produção / Campo / RDO
  → Extract: localização, data, atividades
  → Create RDO entry
  → Link to Project
```

---

## 8. INTERNATIONAL PRODUCTION ROUTING

### By Country/System

**BRASIL**
- Alvenaria (masonry)
- Steel frame
- Render (3D visualization)
- Orçamento (budgeting)
- BIM (3D models)
- Análise Técnica

**EUA**
- Wood frame
- Steel frame
- Modular
- Permits (local by state)
- Compliance (local, federal)

**EUROPA**
- Varies by country/region
- Permits (regional/national)
- Compliance (EU + national)
- Building codes (varies)

### Routing Decision
```
Project Creation
  ↓
Collect: país, estado/região, cidade
  ↓
Determine: sistema construtivo (from document or user)
  ↓
Route to:
  - Produção Brasil (if BR)
  - Produção EUA (if US)
  - Produção Europa (if EU)
  ↓
Load correct:
  - Templates
  - Permits/Licenses
  - Compliance rules
  - Team pool
  - Documentação
```

---

## 9. SECURITY & ACCESS CONTROL

### Rule: Always RLS + Frontend Gate

**Frontend Gate** (dashboard.tsx)
```typescript
if (profile.role && AUTHORIZED_OWNER_ROLES.has(profile.role)) {
  return <DashboardByRole />
}
return <SafeEntryHome />
```

**Backend RLS** (Supabase policies)
- Projects: `user in project_members OR user is owner OR user is diretor_executivo`
- Profiles: User reads own, diretor_executivo reads all
- Documents: Linked to project RLS
- Financeiro: Linked to project/tenant RLS

### Data Visibility
```
Owner (diretor_executivo)
  ├─ All projects
  ├─ All clients
  ├─ All financeiro
  ├─ All documentos
  ├─ All contratos
  └─ All operations

Employee (setor/função)
  ├─ Assigned projects only
  ├─ Team members in same project
  ├─ Documents linked to project
  └─ Financeiro linked to project

Cliente (tenant)
  ├─ Own projects
  ├─ Own clients
  ├─ Own documentos
  ├─ Own contratos
  └─ Own financeiro (own workspace)
```

---

## 10. SIDEBAR MENU STRUCTURE

### Default (All Logged In Users)

**PRODUÇÃO** (Production)
- Análises (intake, attachments, Copilot)
- Produção Brasil
- Produção EUA
- Produção Europa
- Projetos
- Obras / Campo
- BIM / 3D / Render
- ArchVis

**VENDAS** (Sales)
- CRM
- Leads
- Oportunidades
- Propostas
- Serviços

**JURÍDICO / CONTRATOS** (Legal)
- Contratos
- Permits
- Endossos
- Compliance
- Assinaturas
- Documentos Legais

**MARKETING**
- Portfólio
- Conteúdo
- Render / Vídeo
- DirectCut
- Design / Web Builder
- Site / Materiais
- Social Media

---

### Owner Only (diretor_executivo)

**DIRETORIA** (Management) — Visible ONLY to Owner
- Controle Owner
- Dashboard Executivo
- Mission Control
- Indicadores (KPIs)
- Financeiro Geral
- Relatórios
- Configurações

---

## 11. LANGUAGE & LOCALIZATION

- **Default:** English
- **Alternative:** Português
- **Toggle:** One click to switch EN ↔ PT
- **Rule:** All new text must be i18n-ready from day one
- **No hardcoded Portuguese-only strings**

---

## 12. VISUAL IDENTITY

- **Base:** White
- **Structure:** Navy (sidebar, header, navigation)
- **CTA:** Red Apex (#f97316 or similar)
- **Borders/Cards:** Silver/light gray
- **Tone:** Premium, engineering, technology, trust

---

## STATUS

- **Checkpoint 0:** Documentation Phase
- **Last Updated:** 2026-06-04
- **Responsible:** Owner (Apex Global AI)
- **References:** ROADMAP_OFICIAL.md, APEX_GLOBAL_MASTER_PLAN.md

---

**Next:** Move to CHECKPOINT 1 — PR #123 Apex AI Foundation
