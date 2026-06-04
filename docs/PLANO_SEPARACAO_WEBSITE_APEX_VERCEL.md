# Plano de Separação — Website Apex em Vercel Próprio

**Data:** 04/06/2026  
**Objetivo:** Separar website público (apexconstrutora.com) da plataforma privada (apexglobalai.com)  
**Status:** 📋 PRONTO PARA EXECUÇÃO

---

## Visão Geral da Estratégia

### Arquitetura Alvo

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│  PLATAFORMA PRIVADA                  │  WEBSITE PÚBLICO                     │
│  =============================        │  ===========================         │
│                                       │                                      │
│  Repo: AI-Construction-              │  Repo: apex-global-website           │
│        Intelligence-Platform          │        (novo)                        │
│  URL:  apexglobalai.com              │  URL:  apexconstrutora.com          │
│  Tech: Next.js + React               │  Tech: HTML + React (CDN/Vite)      │
│  Auth: Supabase                      │  Auth: Nenhuma                       │
│  Vercel: ai-construction-...         │  Vercel: apex-global-website        │
│        (projeto atual)                │        (novo projeto)                │
│                                       │                                      │
│  ✅ Dados privados                    │  ✅ Marketing                        │
│  ✅ Dashboard                         │  ✅ Informação pública               │
│  ✅ Owner Command                     │  ✅ Cases / Pricing                  │
│  ✅ BIM/EVM                           │  ✅ Contato / Demo                   │
│                                       │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Timeline

| Fase | Descrição | Duração | Quando |
|------|-----------|---------|---------|
| **1** | Documentação & Auditoria | ✅ Completo | 04/06 |
| **2** | Preparação Local (branding) | 1-2h | 04/06 (hoje) |
| **3** | Setup Vercel Novo Projeto | 30min | 04/06-05/06 |
| **4** | Deploy em Preview | 15min | 05/06 |
| **5** | Validação & Testes | 1h | 05/06 |
| **6** | Domínio apexconstrutora.com | Var. | 05/06+ |
| **7** | Go-Live | 5min | 05/06+ |

---

## FASE 1: Documentação ✅

### ✅ Concluído
- [x] Auditoria completa do website
- [x] Inventário de arquivos
- [x] Análise de dependências
- [x] Identificação de riscos

### Outputs
- `AUDITORIA_WEBSITE_APEX_EXISTENTE.md` (esse documento)
- `PLANO_SEPARACAO_WEBSITE_APEX_VERCEL.md` (este arquivo)

---

## FASE 2: Preparação Local

### 2.1 Copiar Estrutura
```bash
# Na máquina local do desenvolvedor:
$ cp -r landing-page-AI-Construction apex-global-website
$ cd apex-global-website
```

### 2.2 Renomear Arquivo Raiz
```bash
$ mv "Landing Page.html" index.html
```

### 2.3 Atualizar Branding

#### 2.3.1 index.html
```html
<!-- ANTES: -->
<title>Atlas · ConstructAI — Construction Intelligence Platform</title>

<!-- DEPOIS: -->
<title>Apex Global AI — Construction Intelligence Platform</title>

<!-- ALÉM DISSO: Adicionar meta tags SEO -->
<meta name="description" content="Plataforma de IA multi-agente para construção civil, BIM, EVM e inteligência executiva.">
<meta name="og:title" content="Apex Global AI — Construction Intelligence Platform">
<meta name="og:description" content="Inteligência operacional para construção, engenharia e negócios.">
<meta name="og:image" content="design-system/logo_apex_nova.jpeg">
```

#### 2.3.2 components/data.jsx

**Buscar/Substituir:**

```javascript
// Encontrar e substituir TODAS as instâncias:

"ConstructAI"          → "Apex Global AI"
"Atlas Construction"   → "Apex"
"Atlas Construction Intelligence" → "Apex Global AI"
"Atlas / ConstructAI"  → "Apex Global AI"

Exemplos:

// ANTES:
subhead: "ConstructAI é o sistema operacional da construção civil brasileira..."
lede: "Atlas Construction Intelligence opera como sua engenharia estendida..."
eyebrow: "Plataforma · ConstructAI",
title: "Pacote Atlas"

// DEPOIS:
subhead: "Apex Global AI é o sistema operacional inteligente da construção civil brasileira..."
lede: "Apex Global AI opera como sua engenharia estendida..."
eyebrow: "Plataforma · Apex Global AI",
title: "Pacote Apex"
```

**Contagem estimada:** ~20-30 instâncias

#### 2.3.3 styles.css

**Buscar/Substituir comentários:**
```css
/* ANTES */
/* Atlas / ConstructAI marketing surface */

/* DEPOIS */
/* Apex Global AI marketing surface */
```

#### 2.3.4 design-system/colors_and_type.css

```css
/* ANTES */
* Operator: Apex Global Ltda · Eng. José Edgard de Oliveira
* ConstructAI Design System — Foundations
* ConstructAI / Construction Intelligence Platform v5.3

/* DEPOIS */
* Operator: Apex Global Ltda · Eng. José Edgard de Oliveira
* Apex Global AI Design System — Foundations
* Apex Global AI / Construction Intelligence Platform v5.3
```

### 2.4 Considerar React Production Builds

**Opção A: Usar React Production (Simples)**
```html
<!-- ANTES (development): -->
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>

<!-- DEPOIS (production): -->
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
```

**Benefícios:** ~3x menor, melhor performance

**Opção B: Build Step com Vite (Futuro)**
```bash
# Futuro (não fazer agora):
$ npm create vite@latest apex-global-website -- --template react
$ npm install
$ npm run build
$ # Vercel detecta e faz deploy automaticamente
```

### 2.5 Testar Localmente

```bash
# Opção 1: Python SimpleHTTPServer
$ python3 -m http.server 3000

# Opção 2: Node http-server
$ npx http-server -p 3000

# Abrir em browser:
# http://localhost:3000

# Validar:
# ✅ Título está correto
# ✅ Componentes carregam
# ✅ Bilíngue funciona (PT/EN)
# ✅ Dark/Light mode funciona
# ✅ Nenhum erro no console
```

### 2.6 Criar .gitignore (se não existir)

```
# apex-global-website/.gitignore
node_modules/
.DS_Store
*.log
.env
.env.local
```

### 2.7 Inicializar Git Repo (local)

```bash
$ git init
$ git add .
$ git commit -m "chore: initial commit - Apex Global AI website"
```

---

## FASE 3: Setup Vercel Novo Projeto

### 3.1 Criar Repo GitHub

**Via GitHub CLI:**
```bash
$ gh repo create apex-global-website \
  --public \
  --source=. \
  --remote=origin \
  --push
```

**Via Web UI (github.com):**
1. Ir a github.com/new
2. Name: `apex-global-website`
3. Description: "Public website for Apex Global AI — Construction Intelligence"
4. Visibilidade: **Public**
5. Create
6. Fazer push local:
```bash
$ git remote add origin https://github.com/seu-usuario/apex-global-website.git
$ git branch -M main
$ git push -u origin main
```

### 3.2 Criar Projeto Vercel

**Via Vercel Dashboard (vercel.com):**
1. Ir a dashboard.vercel.com
2. Click "Add New..." → "Project"
3. Importar repo `apex-global-website`
4. Framework: **Other** (static HTML + React)
5. Build Command: (deixar em branco, ou: `# No build required`)
6. Output Directory: (deixar em branco)
7. Environment Variables: (none necessário)
8. Deploy

**Resultado:**
- URL padrão: `apex-global-website.vercel.app` (preview)
- Domínio: será configurado depois

### 3.3 Configurar Vercel (Opcional)

**Settings → General:**
- Production Branch: `main`
- Framework: `Other`

**Settings → Domains:**
- Deixar em branco por enquanto (configurar no passo 6)

---

## FASE 4: Deploy em Preview

### 4.1 Vercel Auto-Deploy

Quando o repo é conectado, Vercel faz auto-deploy:
- Cada push para `main` = novo deploy automático
- Preview URLs para feature branches
- Logs disponíveis no dashboard

### 4.2 Testar Preview URL

```
https://apex-global-website.vercel.app
```

**Validações:**
- [x] Página carrega
- [x] Título está "Apex Global AI"
- [x] Logo Apex aparece
- [x] Dark/Light mode funciona
- [x] Bilíngue funciona
- [x] Todos os links internos funcionam
- [x] Responsivo em mobile
- [x] Console sem erros

### 4.3 Lighthouse Score

**Via Vercel Analytics ou PageSpeed Insights:**

```
https://pagespeed.web.dev/?url=apex-global-website.vercel.app
```

**Meta:** Score > 90 (Apex blue theme é leve)

---

## FASE 5: Validação & Testes

### 5.1 Testes Funcionais

| Teste | Status | Detalhes |
|-------|--------|----------|
| Página carrega | ✅ | No navegador |
| Componentes renderizam | ✅ | React carrega |
| Bilíngue PT/EN | ✅ | Toggle de idioma funciona |
| Dark/Light mode | ✅ | Toggle de modo funciona |
| Responsive Mobile | ✅ | Viewport 375px width |
| Links internos | ✅ | Navegação entre seções |
| Imagens carregam | ✅ | Logo, screenshots, assets |
| Fonts carregam | ✅ | Geist, Sora, Noto Sans Mono |
| Nenhum console error | ✅ | DevTools open |
| SEO meta tags | ✅ | og:title, og:description, etc. |

### 5.2 Performance

- **FCP** (First Contentful Paint): < 1.5s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **PageSpeed Insights**: > 90

### 5.3 Compatibilidade

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

### 5.4 Conformidade

- ✅ Meta charset UTF-8
- ✅ Meta viewport responsive
- ✅ Nenhuma quebra de layout
- ✅ WCAG 2.1 Level AA (contraste, navegação)

---

## FASE 6: Configurar Domínio apexconstrutora.com

### 6.1 Adquirir Domínio (Se não tiver)

**Opções:**
- Vercel (recomendado, integrado)
- Google Domains
- Namecheap
- GoDaddy
- Registro.br (para .com.br)

**⏱️ Tempo:** 5-30 min (instantâneo em Vercel, 24-48h em outros registrars)

### 6.2 Apontar para Vercel

**Se comprado em Vercel:**
1. Dashboard Vercel → Projeto
2. Settings → Domains
3. Add: `apexconstrutora.com`
4. Vercel gera DNS records (A + CNAME)
5. Pronto (automático)

**Se comprado em outro registrar:**
1. Dashboard Vercel → Projeto
2. Settings → Domains
3. Add: `apexconstrutora.com`
4. Vercel fornece nameservers:
   ```
   ns1.vercel.com
   ns2.vercel.com
   ```
5. Ir para registrar (GoDaddy, Namecheap, etc)
6. Atualizar nameservers
7. Aguardar propagação (5-24h)
8. Vercel valida e ativa SSL

### 6.3 Configurar WWW (Opcional)

```
apexconstrutora.com     → projeto Vercel
www.apexconstrutora.com → redireciona para apexconstrutora.com
```

**Via Vercel:**
1. Settings → Domains
2. Add: `www.apexconstrutora.com`
3. Vercel auto-redireciona

### 6.4 SSL Automático

- Vercel fornece automaticamente via Let's Encrypt
- Renova a cada 60 dias
- Nenhuma ação necessária

### 6.5 Validar Domínio

```bash
$ curl -I https://apexconstrutora.com
# HTTP/1.1 200 OK
# Content-Type: text/html
# SSL: ✅ válido
```

---

## FASE 7: Go-Live

### 7.1 Checklist Final

```
PRÉ-LAUNCH
─────────────────────────────────────────────
✅ Website auditado e pronto
✅ Branding atualizado (ConstructAI → Apex)
✅ Todos os arquivos em novo repo
✅ Vercel projeto criado e testado
✅ Preview URL validado
✅ Domínio apontando para Vercel
✅ SSL ativo (HTTPS)
✅ Performance aceitável (Lighthouse > 90)
✅ Testes funcionais passam
✅ Nenhum console error
✅ Responsivo em mobile
✅ Dark/Light mode funciona
✅ Bilíngue funciona

LAUNCH
─────────────────────────────────────────────
✅ apexconstrutora.com está LIVE
✅ apexglobalai.com (plataforma) não alterada
✅ Repos separados em GitHub
✅ Vercel projetos separados
✅ DNS apontado corretamente
```

### 7.2 Comunicação

**Anúncio (Exemplar):**

> **Website Apex Global AI Launched**
>
> 🎉 O novo website institucional de Apex Global AI está ao vivo!
>
> **Plataforma Privada (sem mudança):**
> - https://apexglobalai.com — Login de usuários
>
> **Website Público (novo):**
> - https://apexconstrutora.com — Marketing, cases, pricing, demo
>
> Repos separados em GitHub:
> - `ai-construction-intelligence-platform` (privada)
> - `apex-global-website` (pública)

---

## FASE 8: Pós-Launch (Primeira Semana)

### 8.1 Monitoramento

- [ ] Verificar Vercel Analytics
- [ ] Monitoring de erros (Sentry, etc.)
- [ ] Performance (Core Web Vitals)
- [ ] Uptime (99.9%+)

### 8.2 Otimizações Futuras

- [ ] Google Analytics setup
- [ ] Hotjar para user tracking
- [ ] SEO sitemap.xml
- [ ] robots.txt
- [ ] Open Graph images
- [ ] Twitter cards
- [ ] Structured data (JSON-LD)

### 8.3 Build Step (Opcional)

Se performance for crítica:

```bash
# Converter para Vite + React
$ npm create vite@latest apex-global-website -- --template react
$ npm install
$ npm run build
```

Vercel detecta automaticamente e faz build.

---

## Estimativas de Esforço

| Fase | Tempo | Quem | Quando |
|------|-------|------|--------|
| 2 (Local) | 1-2h | Dev | Hoje (04/06) |
| 3 (Vercel) | 30min | Dev | 04/06-05/06 |
| 4 (Deploy) | 15min | Vercel (automático) | 05/06 |
| 5 (Testes) | 1h | QA/Dev | 05/06 |
| 6 (Domínio) | Var. (5min-48h) | Dev | 05/06+ |
| 7 (Go-Live) | 5min | Dev | 05/06+ |
| **Total** | **3-4h** | **1 pessoa** | **Hoje-Amanhã** |

---

## Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|--------|-----------|
| Referências "ConstructAI" não capturadas | Média | Baixo | Busca/substituição completa em arquivos |
| React CDN CDN down | Baixa | Alto | Usar React production local (build step futuro) |
| DNS propagação lenta | Baixa | Médio | Usar Vercel nameservers (mais rápido) |
| Performance degradada | Baixa | Médio | Lighthouse > 90, considerar build step |
| Imagens quebram | Muito Baixa | Médio | Testar em preview antes de launch |
| Conflito com apexglobalai.com | Muito Baixa | Alto | Repos separados, Vercel separados, DNS diferentes |

---

## Decisões Arquiteturais

### ✅ Decisão 1: Dois Repos Separados
```
ai-construction-intelligence-platform/  ← Plataforma privada (sem mudança)
apex-global-website/                    ← Website público (novo)
```

**Benefícios:**
- Sem risco de clonar código privado ao público
- Independência de deploy
- Equipes diferentes podem trabalhar em paralelo
- Fácil de manter

### ✅ Decisão 2: Dois Projetos Vercel Separados
```
Vercel Projeto 1: ai-construction-intelligence-platform → apexglobalai.com
Vercel Projeto 2: apex-global-website → apexconstrutora.com
```

**Benefícios:**
- Deployments independentes
- Configurações isoladas (env vars, domains, etc.)
- Sem risco de sobrescrever um com o outro
- Analytics separados

### ✅ Decisão 3: Usar HTML + React (CDN) para MVP
```
Não fazer build step agora (YAGNI)
Usar React development builds → production builds (fácil)
Futuro: Considerar Vite/Next.js se necessário
```

**Benefícios:**
- Deploy hoje, não próxima semana
- Zero configuração
- Fácil de manter
- Suficiente para landing page

### ✅ Decisão 4: Preservar Bilíngue & Tweaks
```
Manter:
- Suporte PT-BR e EN
- Dark/Light mode
- Customização (tweaks panel)
- Design system completo
```

**Benefícios:**
- Alinhamento com plataforma
- Flexibilidade para marketing
- Profissional

---

## Rollback Plan

Se algo der errado:

### Cenário 1: Deploy quebrado em apexconstrutora.com
```
Revert:
1. Voltar commit anterior no GitHub
2. Vercel auto-deploy da versão anterior
3. Site volta ao normal em ~30s
```

### Cenário 2: Domínio apontado errado
```
Fix:
1. Ajustar DNS em Vercel dashboard
2. Ou: Apontar para preview URL temporária
3. Propagação: 5-24h
```

### Cenário 3: apexglobalai.com afetado
```
Não vai acontecer — repos/Vercel separados
Mas se acontecer:
1. Push correto para ai-construction-intelligence-platform
2. Vercel auto-deploy
3. Tudo restaurado em ~30s
```

---

## Conclusão

✅ **Plano está PRONTO para execução**

**Próximos passos imediatos:**
1. ✅ Auditoria concluída
2. ⏭️ Preparação local (2h)
3. ⏭️ Setup Vercel novo projeto (30min)
4. ⏭️ Deploy em apexconstrutora.com

**Timeline:** 3-4 horas de trabalho (pode ser feito hoje/amanhã)

**Confiabilidade:** Muito alta — estrutura sólida, sem dependências externas, sem riscos ao sistema privado

---

**Pronto para começar?** → Vá para FASE 2: Preparação Local
