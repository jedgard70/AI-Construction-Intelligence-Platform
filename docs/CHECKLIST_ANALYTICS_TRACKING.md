# Checklist — Analytics Tracking Implementation

**Status:** 📋 Planejamento (Não iniciado)  
**Data:** 04/06/2026

---

## Implementação — Platform Analytics

### 1. Database Setup

- [ ] Criar tabela `analytics_events` (Supabase)
  - [x] Schema: user_id, event_type, page_path, module, metadata
  - [x] Índices: (user_id, created_at), (event_type, created_at), (page_path, created_at)
  - [ ] Criar RLS policies
    - [ ] Owner vê todos
    - [ ] Admin vê não-owners
    - [ ] User não vê nada

- [ ] Criar tabela `analytics_page_views` (Supabase)
  - [x] Schema: user_id, page_path, module, duration_seconds, previous_path
  - [x] Índices: (page_path, created_at), (user_id, created_at)

### 2. Backend API

- [ ] Criar `/lib/api/analytics.ts`
  - [x] Função `trackEvent(event: {...})`
  - [x] Validação de event_type (whitelist)
  - [x] Extração de user_id/role da session
  - [ ] Teste: registra evento em Supabase
  - [ ] Teste: rejeita event_type desconhecido
  - [ ] Teste: nunca expõe secrets

- [ ] Criar `/pages/api/analytics/track.ts` (POST endpoint)
  - [x] Requer autenticação (session cookie)
  - [x] Valida dados
  - [x] Insere em `analytics_events`
  - [x] Retorna 200 OK
  - [ ] Teste: endpoint funciona
  - [ ] Teste: rejeita request não-autenticada
  - [ ] Teste: log de erros (no error message details)

- [ ] Criar `/pages/api/analytics/dashboard.ts` (GET endpoint, owner-only)
  - [x] Requer autenticação + role='owner'
  - [x] Retorna: today_visitors, today_page_views, modules, top_pages, recent_events
  - [ ] Teste: owner vê dados
  - [ ] Teste: admin não vê dados
  - [ ] Teste: user não vê dados
  - [ ] Teste: response bem formatada

### 3. Frontend — Hooks & Tracking

- [ ] Criar `/hooks/usePageTracking.ts`
  - [x] Hook que rastreia router changes
  - [x] Determina module a partir de page_path
  - [x] Chama trackEvent para cada rota
  - [ ] Teste: rastreia /dashboard
  - [ ] Teste: rastreia /apex-ai
  - [ ] Teste: rastreia /mission-control

- [ ] Criar `/lib/tracking.ts` (helpers)
  - [x] `trackEvent(type, metadata)`
  - [x] `getModuleFromPath(path)`
  - [x] Event types (validados)
  - [ ] Teste: valida event_type
  - [ ] Teste: mapeia rota → módulo

- [ ] Envolver app em `usePageTracking`
  - [ ] Adicionar hook em `pages/_app.tsx`
  - [ ] Verificar: rastreamento automático
  - [ ] Teste: abre /dashboard → registra page_view

### 4. Eventos Manuais

- [ ] Login event
  - [x] Quando: após sign in bem-sucedido
  - [x] Dados: user_id, timestamp
  - [ ] Implementar em: `components/LoginClient.tsx` (ou auth middleware)
  - [ ] Teste: trackEvent('login') é chamado

- [ ] Apex AI Open event
  - [x] Quando: modal/tab Apex AI abre
  - [x] Dados: module='apex-ai', view_type (modal/fullscreen)
  - [ ] Implementar em: componente Apex AI
  - [ ] Teste: abre Apex AI → trackEvent('apex_ai_open')

- [ ] Mission Control View event
  - [x] Quando: abre Mission Control
  - [x] Dados: timestamp
  - [ ] Implementar em: componente Mission Control
  - [ ] Teste: abre Mission Control → trackEvent

- [ ] Eventos adicionais
  - [ ] apex_ai_send (quando envia prompt)
  - [ ] owner_command_view (quando abre Owner Command)
  - [ ] storage_upload (quando faz upload)
  - [ ] crm_view (se houver CRM)
  - [ ] proposal_view (se houver proposta)
  - [ ] export_report (quando exporta)

### 5. Mission Control — Analytics Card

- [ ] Criar componente `AnalyticsDashboard.tsx`
  - [x] Layout: visitas hoje, page views, módulos, top pages, eventos
  - [x] Dados: `/api/analytics/dashboard`
  - [x] Owner-only (verificar role)
  - [ ] Teste: Owner vê card
  - [ ] Teste: Admin não vê card
  - [ ] Teste: Dados aparecem corretamente

- [ ] Adicionar card ao Mission Control
  - [ ] Integrar em layout principal
  - [ ] Responsivo em mobile
  - [ ] Teste: card é visível
  - [ ] Teste: dados carregam

---

## Implementação — Website Analytics

### 6. Vercel Analytics

- [ ] Integrar em `app/layout.tsx` (ou `pages/_app.tsx`)
  - [x] Importar: `import { Analytics } from '@vercel/analytics/react'`
  - [x] Adicionar componente: `<Analytics />`
  - [ ] Teste: dashboard Vercel mostra page views
  - [ ] Teste: metrics aparecem em ~1h

### 7. Custom Public Tracking

- [ ] Criar `/api/public-analytics/track.ts` (POST endpoint)
  - [x] Sem autenticação (público)
  - [x] Valida: event_type, page_path
  - [x] Insere em `public_events` (se usar)
  - [x] Retorna 200 OK
  - [ ] Teste: registra evento
  - [ ] Teste: sem autenticação necessária

- [ ] Criar tracking helpers (`lib/public-tracking.ts`)
  - [x] `trackPublicEvent(event, page, metadata)`
  - [x] Session ID via cookie
  - [ ] Teste: evento registrado com session_id

- [ ] Integrar conversões
  - [ ] "Solicitar Demonstração" button
    - [x] onClick: trackPublicEvent('demo_click', ...)
    - [ ] Teste: clique registrado
  
  - [ ] "Entrar na Plataforma" button
    - [x] onClick: trackPublicEvent('platform_click', ...)
    - [ ] Teste: clique registrado
  
  - [ ] Contact form submit
    - [x] onSubmit: trackPublicEvent('contact_submit', ...)
    - [ ] Teste: submit registrado

---

## Testing & Validation

### Platform

- [ ] **Page View Tracking:**
  - [ ] Abrir /dashboard → evento registrado
  - [ ] Abrir /apex-ai → evento registrado
  - [ ] Abrir /mission-control → evento registrado
  - [ ] Verificar: page_path, module corretos
  - [ ] Verificar: user_id preenchido
  - [ ] Verificar: timestamp correto

- [ ] **Event Tracking:**
  - [ ] Sign in → 'login' event
  - [ ] Abrir Apex AI → 'apex_ai_open' event
  - [ ] Abrir Mission Control → 'mission_control_view' event
  - [ ] Upload de arquivo → 'storage_upload' event
  - [ ] Verificar: metadata correto

- [ ] **Permissions:**
  - [ ] Owner acessa `/api/analytics/dashboard` → sucesso
  - [ ] Admin acessa `/api/analytics/dashboard` → erro 403
  - [ ] User acessa `/api/analytics/dashboard` → erro 403
  - [ ] Owner vê Mission Control analytics card
  - [ ] Admin não vê Mission Control analytics card
  - [ ] User não vê Mission Control analytics card

- [ ] **Security:**
  - [ ] Nenhum password registrado
  - [ ] Nenhum token registrado
  - [ ] Nenhum conteúdo de arquivo registrado
  - [ ] Logs não expostos em error messages
  - [ ] RLS policies funcionam

- [ ] **Performance:**
  - [ ] Tracking não causa lag visível
  - [ ] Requests completam em <500ms
  - [ ] Dashboard carrega em <1s

### Website

- [ ] **Page View Tracking:**
  - [ ] /index → registrado em Vercel Analytics
  - [ ] /services → registrado
  - [ ] /pricing → registrado
  - [ ] Verificar: Vercel dashboard mostra page views

- [ ] **Conversion Tracking:**
  - [ ] Clique em "Solicitar Demonstração" → registrado
  - [ ] Clique em "Entrar" → registrado
  - [ ] Submit de contato → registrado

- [ ] **Public Events:**
  - [ ] Sem autenticação necessária
  - [ ] Session ID via cookie
  - [ ] Dados registrados em production

---

## Build & Deployment

- [ ] **Build:**
  - [ ] `npm run build` passes
  - [ ] Nenhum TypeScript error
  - [ ] Nenhum console warning relacionado a analytics

- [ ] **Staging Deployment:**
  - [ ] Platform staging rastreia eventos
  - [ ] Website staging Vercel Analytics funciona
  - [ ] Verificar dados após 1h

- [ ] **Production Deployment:**
  - [ ] Platform production rastreia
  - [ ] Website production rastreia
  - [ ] Dashboard mostra dados reais
  - [ ] Monitorar por 24h

---

## Documentation

- [ ] **Docstring:**
  - [ ] `trackEvent()` documentado
  - [ ] `trackPublicEvent()` documentado
  - [ ] Tipos TypeScript corretos
  - [ ] Exemplos no código

- [ ] **README:**
  - [ ] Como rastrear novo evento
  - [ ] Como acessar dashboard (owner-only)
  - [ ] Como interpretar dados

---

## Post-Launch Monitoring

- [ ] Verificar dados em 24h
  - [ ] Page views aparecem
  - [ ] Eventos aparecem
  - [ ] Nenhum erro de rate-limiting

- [ ] Dashboard accuracy
  - [ ] Números fazem sentido
  - [ ] Top pages corretos
  - [ ] Módulos com uso realista

- [ ] User impact
  - [ ] Nenhuma degradação de performance
  - [ ] Load times normais
  - [ ] Nenhuma queixa de usuários

---

## Success Criteria ✅

### Platform
- [x] Page views rastreados por rota
- [x] Eventos manuais registrados (login, apex_ai_open, etc)
- [x] Dashboard em Mission Control funcional
- [x] Permissões corretas (owner > admin > user)
- [x] Nenhum dado sensível exposto
- [x] Build passa sem erros

### Website
- [x] Page views em Vercel Analytics
- [x] Conversões rastreadas (demo, contato)
- [x] Sem autenticação necessária
- [x] Dados em production

---

## Não Implementado (Escopo Futuro)

- 🔮 Dashboard dedicado de analytics
- 🔮 Relatórios exportáveis (PDF, CSV)
- 🔮 Anomaly detection
- 🔮 Integração com Plausible/PostHog
- 🔮 Retention analysis
- 🔮 Cohort analysis

---

**Status:** 📋 Aguardando Aprovação para Iniciar

Proceder com implementação?
