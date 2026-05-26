# CODEX_POLICY.md — Política para OpenAI Codex

> Aplica-se a: OpenAI Codex, ChatGPT Code Interpreter, GitHub Copilot agêntico, e qualquer LLM baseado em OpenAI que acesse este repositório.
> Herda todas as regras de `/AGENTS.md`. Este documento adiciona restrições específicas para Codex.

---

## 1. Contexto do Projeto

```
Projeto   : AI Construction Intelligence Platform (ACIP)
Stack     : Next.js 16 · TypeScript · Supabase · Vercel
Branch    : Trabalho apenas em branches de feature — NUNCA em main
Linguagem : TypeScript strict, pt-BR nos comentários de negócio
```

---

## 2. Proibições Específicas para Codex

1. **Não gerar código que chame Supabase `service_role`** fora de edge functions protegidas
2. **Não usar `any` em TypeScript** sem comentário `// FIXME: type` justificado
3. **Não criar arquivos de teste mock** que simulem Supabase — usar o cliente real
4. **Não instalar dependências** sem listar antes e pedir aprovação
5. **Não modificar `tailwind.config.*`** sem aprovação de design
6. **Não alterar rotas de API** que afetam autenticação sem revisão de segurança
7. **Não alterar `middleware.ts`** (controla auth em toda a aplicação)

---

## 3. Padrão de Código Exigido

### TypeScript
```typescript
// ✅ CORRETO — sem fallback silencioso
const sb = getSupabase()
if (!sb) {
  setError('Supabase não configurado')
  return
}

// ❌ ERRADO — fallback localStorage/demo
const data = localStorage.getItem('clients') ?? '[]'
```

### Erros de Supabase
```typescript
// ✅ CORRETO — propagar erro real
const { error } = await sb.from('projects').insert(data)
if (error) {
  setError(`Supabase: ${error.message}`)
  return
}
```

### Commits
```bash
# ✅ Formato exigido
feat: add project status filter
fix: require supabase for client creation
chore: update dependency versions
docs: add governance policy

# ❌ Proibido
update stuff
wip
fix
```

---

## 4. Arquivos Sensíveis — Leitura OK, Modificação Requer Aprovação

| Arquivo | Risco |
|---------|-------|
| `middleware.ts` | 🔴 Alto — controla auth global |
| `lib/supabase.ts` | 🔴 Alto — cliente Supabase singleton |
| `pages/api/auth/*` | 🔴 Alto — endpoints de autenticação |
| `supabase/migrations/*` | 🔴 Alto — schema do banco |
| `.env.local` | 🔴 Alto — **nunca ler valor, apenas nome** |
| `next.config.*` | 🟡 Médio — configuração de deploy |
| `tailwind.config.*` | 🟡 Médio — design system |
| `package.json` | 🟡 Médio — dependências |

---

## 5. Convenções de Branch

```
feat/descricao-curta      → nova funcionalidade
fix/descricao-do-bug      → correção de bug
chore/descricao           → manutenção, deps, config
docs/descricao            → documentação apenas
refactor/descricao        → refatoração sem mudança de comportamento
```

---

## 6. Checklist antes de Propor Código

- [ ] Li `AGENTS.md` e aplico todas as regras globais
- [ ] Identifiquei a branch correta (não main)
- [ ] Listei todos os arquivos que serei alterados
- [ ] Calculei o nível de risco (🟢/🟡/🔴)
- [ ] O patch tem responsabilidade única
- [ ] Não há `console.log` de debugging no código final
- [ ] Não há imports de módulos não instalados
- [ ] Build passa antes de propor commit
