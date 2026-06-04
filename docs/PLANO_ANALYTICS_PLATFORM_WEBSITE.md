# Plano — Analytics para Platform + Website

**Data:** 04/06/2026  
**Status:** 📋 Planejamento (Aguardando Aprovação)

---

## Executive Summary

Implementar rastreamento de visitantes e page views para:
1. **Plataforma privada** (apexglobalai.com) — Analytics operacional interno
2. **Website público** (apexconstrutora.com) — Analytics de tráfego público

**Benefícios:**
- Owner vê uso da plataforma por módulo, rota e usuário
- Admin vê análise limitada
- Website rastreia conversões e tráfego
- Dados protegidos, sem exposição de secrets/privado

---

## 1. Plataforma Privada — Analytics Interno

### 1.1 O que rastrear

#### Page Views (Automático)
- Cada rota visitada gera evento
- Timestamp, usuário, rota, módulo
- Exemplo: `/dashboard`, `/apex-ai`, `/mission-control`

#### Eventos (Manuais)
```
- login              → quando usuário faz sign in
- dashboard_view     → quando abre /dashboard
- apex_ai_open       → quando abre Apex AI
- apex_ai_send       → quando envia prompt
- mission_control_view → quando abre Mission Control
- owner_command_view → quando abre Owner Command Chat
- storage_upload     → quando faz upload de arquivo
- crm_view          → quando abre CRM (se houver)
- proposal_view      → quando abre proposta
- export_report      → quando exporta relatório
```

### 1.2 Estrutura de Dados

**Tabela: `analytics_events` (Supabase)**
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT now(),
  
  -- Usuário
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_role VARCHAR(20),  -- 'owner' | 'admin' | 'user'
  
  -- Evento
  event_type VARCHAR(50),    -- 'page_view' | 'login' | 'apex_ai_open' | ...
  event_name VARCHAR(255),   -- descrição do evento
  
  -- Contexto
  page_path VARCHAR(500),    -- '/dashboard', '/apex-ai', etc
  module VARCHAR(100),       -- 'dashboard' | 'apex-ai' | 'mission-control' | ...
  
  -- Metadata (sem dados sensíveis)
  metadata JSONB,            -- {duration: 120, action: 'submit', ...}
  
  -- IP e User-Agent (opcional)
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX ON analytics_events(user_id, created_at DESC);
CREATE INDEX ON analytics_events(event_type, created_at DESC);
CREATE INDEX ON analytics_events(page_path, created_at DESC);
```

**Tabela: `analytics_page_views` (Supabase)**
```sql
CREATE TABLE analytics_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT now(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id),
  page_path VARCHAR(500),
  module VARCHAR(100),
  duration_seconds INT,      -- tempo que passou na página
  
  previous_path VARCHAR(500) -- de onde veio
);

CREATE INDEX ON analytics_page_views(page_path, created_at DESC);
CREATE INDEX ON analytics_page_views(user_id, created_at DESC);
```

### 1.3 Backend — API de Rastreamento

**Novo endpoint: `/api/analytics/track` (POST)**
```typescript
// lib/api/analytics.ts
export async function trackEvent(
  event: {
    type: string;           // 'page_view' | 'login' | ...
    name?: string;
    page_path?: string;
    module?: string;
    metadata?: Record<string, any>;
    duration?: number;      // para page views
  }
)

// Exemplo de uso (frontend):
await trackEvent({
  type: 'dashboard_view',
  page_path: '/dashboard',
  module: 'dashboard',
  metadata: { filters: 'status=active' }
})
```

**API segura:**
- ✅ Requer autenticação (session cookie)
- ✅ Extrai user_id da session
- ✅ Extrai user_role da session
- ✅ Valida event_type (whitelist)
- ✅ Nunca registra secrets/passwords
- ✅ Insere em Supabase `analytics_events`

**Permissões (RLS Supabase):**
- Owner: pode ler TODOS os eventos
- Admin: pode ler eventos (não-owner)
- User: NÃO pode ler analytics
- Ninguém: pode escrever (apenas via API)

### 1.4 Frontend — Tracking Automático

**Hook: `usePageTracking.ts`**
```typescript
export function usePageTracking() {
  const router = useRouter()
  const { user } = useAuth()
  
  useEffect(() => {
    const handleRouteChange = (url) => {
      const module = getModuleFromPath(url)
      trackEvent({
        type: 'page_view',
        page_path: url,
        module,
      })
    }
    
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [])
}
```

**Envolver app/_app.tsx:**
```typescript
function App({ Component, pageProps }) {
  usePageTracking()  // rastreia todas as rotas automaticamente
  
  return <Component {...pageProps} />
}
```

**Eventos manuais (onde necessário):**
```typescript
// Ao abrir Apex AI
const openApexAI = () => {
  trackEvent({
    type: 'apex_ai_open',
    module: 'apex-ai',
    metadata: { view: 'full-screen' }
  })
  // ... abrir modal
}

// Ao fazer upload
const uploadFile = async (file) => {
  // ... fazer upload
  trackEvent({
    type: 'storage_upload',
    module: 'storage',
    metadata: { size: file.size, type: file.type }
  })
}
```

### 1.5 Dashboard — Mission Control Analytics Card

**Novo card em Mission Control:**

```
┌─────────────────────────────────────────┐
│  📊 PLATFORM ANALYTICS                  │
├─────────────────────────────────────────┤
│                                          │
│  Visitas Hoje: 12 usuários              │
│  Page Views: 48                         │
│  Módulos: Dashboard (18) | Apex AI (20) │
│                                          │
│  Páginas Mais Usadas:                   │
│  1. /dashboard (18 views)               │
│  2. /apex-ai (15 views)                 │
│  3. /mission-control (8 views)          │
│                                          │
│  Últimos Eventos:                       │
│  • john@company.com opened Apex AI      │
│  • admin@company.com viewed dashboard   │
│  • jane@company.com uploaded file       │
│                                          │
│  [Ver Detalhes Completos] →             │
└─────────────────────────────────────────┘
```

**API: `/api/analytics/dashboard` (GET, owner-only)**
```typescript
{
  today_visitors: 12,
  today_page_views: 48,
  
  modules: {
    dashboard: 18,
    apex_ai: 20,
    mission_control: 8,
    crm: 2
  },
  
  top_pages: [
    { path: '/dashboard', views: 18 },
    { path: '/apex-ai', views: 15 },
    { path: '/mission-control', views: 8 }
  ],
  
  recent_events: [
    { user: 'john@...', event: 'apex_ai_open', at: '14:32' },
    { user: 'admin@...', event: 'dashboard_view', at: '14:28' },
    { user: 'jane@...', event: 'storage_upload', at: '14:15' }
  ]
}
```

### 1.6 Permissões & Segurança

| Role | Ações | Ver Analytics |
|------|-------|---|
| **Owner** | Ler TODOS os eventos | ✅ Completo |
| **Admin** | Ler não-owner events | ⚠️ Limitado |
| **User** | Nenhum | ❌ Negado |

**RLS Policy (Supabase):**
```sql
-- Owner vê tudo
CREATE POLICY "owner_see_all" ON analytics_events
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM auth.users WHERE role = 'owner')
  );

-- Admin vê eventos de usuários comuns
CREATE POLICY "admin_see_users" ON analytics_events
  FOR SELECT USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
    AND user_role = 'user'
  );

-- Ninguém escreve direto (só via API)
CREATE POLICY "no_direct_write" ON analytics_events
  FOR INSERT WITH CHECK (false);
```

---

## 2. Website Público — Analytics de Tráfego

### 2.1 O que rastrear

**Visitantes (Públicos):**
- Visitantes únicos (sessão por cookie)
- Page views por página
- Tempo médio na página
- Bounce rate
- Origem/Referrer
- País (via IP, se disponível)
- Dispositivo/Browser

**Conversões:**
- Clique em "Solicitar Demonstração"
- Clique em "Entrar na Plataforma"
- Preenchimento de formulário de contato
- Download de recursos

### 2.2 Opções Técnicas

#### Option A: Vercel Analytics (Recomendado para Start)
**Vantagens:**
- ✅ Integrado com Vercel
- ✅ Zero-config (apenas importar)
- ✅ Dashboard automático
- ✅ Relatórios básicos

**Limitações:**
- Rastreamento básico apenas
- Sem eventos customizados (por enquanto)

**Implementação:**
```typescript
// pages/_app.tsx ou app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  )
}
```

#### Option B: Analytics Interno Custom (Mais controle)
**Vantagens:**
- ✅ Full controle
- ✅ Eventos customizados (clique em demo, etc)
- ✅ Sem dependência de terceiros
- ✅ Dados próprios

**Implementação:**
```typescript
// Tracking público (sem autenticação)
export async function trackPublicEvent(data: {
  event: 'page_view' | 'demo_click' | 'contact_submit' | ...
  page: string
  metadata?: Record<string, any>
}) {
  await fetch('/api/public-analytics/track', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}
```

#### Option C: Plausible/PostHog/Umami (Futuro)
**Para depois:**
- Plausible: Privacy-friendly analytics
- PostHog: Full-stack product analytics
- Umami: Self-hosted, lightweight

### 2.3 Recomendação: Híbrido

**Implementar agora:**
1. Vercel Analytics para tráfego básico (automático)
2. Tracking público custom para conversões específicas

**Depois:**
3. Dashboard próprio se necessário
4. Considerar Plausible para privacy-first approach

### 2.4 Estrutura de Dados (Opcional)

Se usar analytics interno:

```sql
CREATE TABLE public_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT now(),
  
  event_type VARCHAR(50),    -- 'page_view', 'demo_click', etc
  page_path VARCHAR(500),
  
  session_id VARCHAR(255),   -- cookie-based
  referrer VARCHAR(1000),
  country VARCHAR(100),      -- opcional
  device VARCHAR(100),       -- 'mobile' | 'tablet' | 'desktop'
  
  metadata JSONB
);

CREATE INDEX ON public_events(event_type, created_at DESC);
CREATE INDEX ON public_events(page_path, created_at DESC);
CREATE INDEX ON public_events(session_id);
```

---

## 3. Implementação — Roadmap

### Fase 1: Planejamento (Agora)
- [x] Definir escopo
- [x] Escolher arquitetura
- [x] Criar documentação

### Fase 2: Plataforma (Next Sprint)
- [ ] Criar tabelas Supabase
- [ ] Criar API `/api/analytics/track`
- [ ] Criar hook usePageTracking
- [ ] Adicionar tracking em rotas críticas
- [ ] Dashboard em Mission Control
- [ ] Permissões RLS

### Fase 3: Website (Next Sprint)
- [ ] Integrar Vercel Analytics
- [ ] Adicionar tracking público (conversões)
- [ ] Testar page_view tracking

### Fase 4: Melhorias (Depois)
- [ ] Dashboard dedicado de analytics
- [ ] Relatórios exportáveis
- [ ] Integração com Plausible/PostHog
- [ ] Anomaly detection

---

## 4. Segurança & Privacidade

### O que NUNCA rastrear
- ❌ Passwords / Tokens
- ❌ Conteúdo de arquivos enviados
- ❌ Mensagens privadas (completas)
- ❌ Dados sensíveis de contrato
- ❌ Nomes de clientes em projetos

### O que É seguro rastrear
- ✅ Rotas visitadas
- ✅ Módulos acessados
- ✅ Tipos de eventos (não detalhes sensíveis)
- ✅ Duração de acesso
- ✅ Página views

### GDPR & Privacidade
- ✅ Website: Aviso de cookies (sim/não)
- ✅ Plataforma: Privada (login obrigatório)
- ✅ Nenhuma venda de dados
- ✅ Dados deletados com account deletion
- ✅ Owner vê dados completos (confiança interna)

---

## 5. Estimativa Técnica

| Componente | Esforço | Tempo |
|-----------|---------|-------|
| Plataforma — DB + API | Medium | 4h |
| Plataforma — Frontend tracking | Medium | 3h |
| Plataforma — Mission Control card | Small | 2h |
| Website — Vercel Analytics | Minimal | 0.5h |
| Website — Custom tracking | Small | 1.5h |
| Testes & validação | Medium | 2h |
| **Total** | | **~13h** |

---

## 6. Success Criteria

✅ **Plataforma:**
- [ ] Page views registrados para cada rota
- [ ] Eventos (login, apex_ai_open, etc) registrados
- [ ] Dashboard em Mission Control mostra resumo
- [ ] Owner vê analytics completo
- [ ] Admin vê analytics limitado
- [ ] User não vê analytics
- [ ] Nenhum dado sensível registrado

✅ **Website:**
- [ ] Page views registrados
- [ ] Conversões (demo, contato) registradas
- [ ] Dados visíveis no Vercel Analytics
- [ ] Rastreamento funciona em production

---

## 7. Próximas Etapas

1. **Aprovação:** Aceitar plano?
2. **Criar checklist:** CHECKLIST_ANALYTICS_TRACKING.md
3. **Implementação:** Sprint dedicado
4. **Deploy:** Teste em staging → produção
5. **Monitoramento:** Verificar dados coletados

---

**Status:** 📋 Aguardando Aprovação

Deseja prosseguir com implementação?
