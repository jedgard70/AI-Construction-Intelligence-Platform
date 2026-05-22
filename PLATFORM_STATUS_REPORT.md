# AI Construction Intelligence Platform — Status Report
**Data:** 22 de Maio de 2026  
**Responsável:** Dr. Edgard (jedgard70@gmail.com)  
**Stack:** Next.js · TypeScript · Supabase · Anthropic Claude · Vercel

---

## ✅ O QUE FOI FEITO (esta sessão)

### Banco de Dados — Supabase
- **`SUPABASE_SETUP_COMPLETO.sql`** criado e executado com sucesso
- Tabelas criadas/atualizadas: `profiles`, `clients`, `projects`, `leads`, `checklists`, `ncis`, `clash_items`, `permit_checklist`, `workflow_tasks`
- Seed com dados reais: 2 clientes, 2 projetos, 2 leads, 2 checklists
- Perfil de `jedgard70@gmail.com` atualizado para role `diretor_executivo` na empresa "JEDGARD Engenharia"

### Autenticação
- `components/LoginClient.tsx` — removido modo demo / localStorage flag
- Login agora usa `supabase.auth.signInWithPassword()` real
- Erros exibidos em português ao usuário
- Fluxo de cadastro com confirmação de e-mail

### Dashboard
- `pages/dashboard.tsx` — removido bloco demo
- Agora redireciona para `/login` se Supabase não configurado ou sessão inválida
- Busca perfil real da tabela `profiles` com role correto

### Módulo Vendas (`pages/vendas.tsx`)
- Substituídos dados fake `LEADS[]` por fetch do Supabase (`leads` table)
- KPIs calculados em tempo real: VGV pipeline, leads ativos, negociações, probabilidade média
- Estado de loading + mensagem de vazio

### Módulo Qualidade (`pages/qualidade.tsx`)
- Interface `Checklist` e `NCI` tipadas
- Fetch paralelo: `checklists` + `ncis` (Promise.all)
- Aba Checklists: rendering completo com barra de conformidade, badge de status, norma, responsável, prazo
- Aba NCIs: loading state, empty state, filtro funcional
- Conformidade calculada por item (`itens.filter(i => i.ok).length / itens.length`)

### Módulo BIM-Ops (`pages/bim-ops.tsx`)
- `CLASH_DATA`, `PERMIT_CHECKLIST`, `WORKFLOW_TASKS` continuam como fallback de demo
- Estado: `clashData`, `permitData`, `workflowData` — inicializados com demo data
- Fetch do Supabase ao montar: se houver dados reais, substitui o demo
- Todas as referências no render atualizadas para usar state vars
- Zero referências hardcoded restantes no render

---

## 🚀 COMO FAZER O DEPLOY (passos manuais)

### 1 — Deletar o lock file do Git (necessário uma única vez)
Abra o Explorer e delete este arquivo:
```
D:\AI-constr\AI-Construction-Intelligence-Platform\.git\index.lock
```

### 2 — Commit e push das mudanças
Abra o terminal na pasta do projeto (`D:\AI-constr\AI-Construction-Intelligence-Platform`) e execute:

```bash
git add components/LoginClient.tsx
git add pages/dashboard.tsx pages/vendas.tsx pages/qualidade.tsx pages/bim-ops.tsx
git add SUPABASE_SETUP_COMPLETO.sql PLATFORM_STATUS_REPORT.md

git commit -m "fix: conectar todos os módulos ao Supabase real - auth, vendas, qualidade, bim-ops"
git push origin main
```

### 3 — Configurar variáveis no Vercel
Acesse: https://vercel.com → Seu Projeto → Settings → Environment Variables

Adicione/atualize estas variáveis (em **Production**):

| Variável | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | Sua nova chave Anthropic (já rotacionada) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[seu-projeto].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave `sb_publishable_...` do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Mesma chave (alias para compatibilidade) |

> **Onde encontrar as chaves Supabase:** Dashboard Supabase → Settings → API → Project URL e API Keys

### 4 — Forçar redeploy
No Vercel → Deployments → clique em "Redeploy" no último deployment, ou a push do step 2 já dispara automaticamente.

---

## 📊 STATUS DOS MÓDULOS

| Módulo | Antes | Agora | Supabase |
|---|---|---|---|
| Login / Auth | ❌ Demo (localStorage) | ✅ Real | Auth |
| Dashboard | ❌ Demo bypass | ✅ Session check | profiles |
| Projetos | ✅ Parcial | ✅ Funcional | projects, clients |
| Vendas / Pipeline | ❌ Dados fake | ✅ Real | leads |
| Qualidade / NCIs | ❌ Dados fake | ✅ Real | checklists, ncis |
| BIM-Ops | ⚠️ Demo fallback | ✅ Real + fallback | clash_items, permits, tasks |
| Orçamento | ✅ Existia | ✅ Manter | budget_items |
| RDO | ✅ Existia | ✅ Manter | rdos |
| Jurídico | ✅ Existia | ✅ Manter | contracts |
| AI Chat (`/api/chat`) | ✅ Funcional | ✅ Funcional | ANTHROPIC_API_KEY |

---

## ⚠️ PENDÊNCIAS / PRÓXIMOS PASSOS

1. **Deletar duplicatas `.js`** — manualmente no Windows Explorer:
   - `components/HelpButton.js`
   - `components/LoginClient.js`  
   - `components/NewClientModal.js`
   - `components/NewProjectModal.js`
   - `components/PrintShareModal.js`
   - `components/OrcamentoClient_backup.tsx`

2. **Criar tabela `ncis`** no Supabase — se quiser registrar Não Conformidades:
   ```sql
   CREATE TABLE IF NOT EXISTS public.ncis (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     titulo text NOT NULL,
     projeto text,
     responsavel text,
     severidade text DEFAULT 'medio',
     status text DEFAULT 'aberta',
     prazo date,
     project_id uuid REFERENCES public.projects(id),
     created_at timestamptz DEFAULT now()
   );
   ALTER TABLE public.ncis ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "ncis_select" ON public.ncis FOR SELECT USING (true);
   ```

3. **Rotacionar chaves Supabase** — se ainda não foi feito (exposto anteriormente na sessão)

4. **Módulo Projetos — NewClientModal**: verificar se o formulário de novo cliente salva corretamente na tabela `clients`

---

## 🔧 ARQUITETURA ATUAL

```
/pages
  index.js          → redireciona para /login
  login.js          → LoginClient.tsx (Supabase Auth real)
  dashboard.tsx     → DashboardByRole por role
  vendas.tsx        → leads (Supabase)
  qualidade.tsx     → checklists + ncis (Supabase)
  bim-ops.tsx       → clash_items + permits + tasks (Supabase)
  orcamento.tsx     → budget_items (Supabase)
  rdo.tsx           → rdos (Supabase)
  projeto/[id].tsx  → projects (Supabase)
  cliente/[id].tsx  → clients (Supabase)
  /api/chat.js      → Anthropic API (ANTHROPIC_API_KEY)
  /api/prompts/     → Prompt governance system

/components
  LoginClient.tsx        → Auth real, sem modo demo
  DashboardByRole.tsx    → Role-based dashboard
  NewClientModal.tsx     → Modal criar cliente
  NewProjectModal.tsx    → Modal criar projeto

/lib
  supabase.ts           → getSupabase() (null-safe)
  prompt-governor.ts    → versioning de prompts

/SUPABASE_SETUP_COMPLETO.sql  → script de setup completo
```
