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

---

## 7. Regra Operacional de Repositório (Obrigatória)

### Workspace único autorizado

- Caminho oficial de trabalho: `D:\AI-constr\AI-Construction-Intelligence-Platform`
- Qualquer evolução deve ocorrer **neste repositório local** com merge no próprio workspace.

### Proibição explícita

- **É proibido criar novos clones** do projeto em outros diretórios.
- **É proibido trabalhar em cópias paralelas** para depois sincronizar manualmente.

### Diretriz de execução

- Operar sempre no repositório existente em `D:\AI-constr`.
- Reaproveitar histórico, branches e contexto já presentes.
- Em caso de conflito técnico, resolver por branch/merge no mesmo repositório (sem clonar).

---

## 8. Governança Documental Obrigatória

### Regra de encerramento de sprint

Nenhuma sprint futura pode ser encerrada sem atualização documental.

### Documentos obrigatórios de atualização

1. `docs/PACOTE_MASTER_STATUS_GERAL.md`
2. `docs/APEX_GLOBAL_MASTER_PLAN.md`
3. `docs/IA_CONSTRUCTION_PLATFORM_ARCHITECTURE.md`
4. `docs/ROADMAP_OFICIAL.md`
5. Índice do pacote ativo (ex.: `docs/PACOTE_MASTER_002_INDEX.md`)

### Critério de completude

- Código sem documentação atualizada é entrega incompleta.
- Toda conclusão deve registrar: status, evidências, pendências e próximos passos.

### REGRA 004 — KNOWLEDGE FIRST

Antes de encerrar qualquer pacote, validar obrigatoriamente:

1. código atualizado
2. banco atualizado
3. documentação atualizada
4. status atualizado

Se faltar qualquer item:

- pacote não encerrado

---

## 9. Regra de Não Duplicação

Antes de criar qualquer novo artefato (tela, API, tabela, agente ou workflow), verificar se já existe estrutura semelhante no repositório.

Se existir, a ação padrão deve ser:

1. expandir
2. integrar
3. reaproveitar

Diretriz:

- nunca duplicar domínio funcional já existente (CRM, leads, contratos, vendas, etc.).

---

## 10. Espelho Documental Obrigatório

Além da atualização em `docs/`, manter o espelho organizado em:

- `D:\AI-constr\AI-Construction-Intelligence-Platform\Master.Package.Apex.original`

Estrutura obrigatória:

- `00_INDEX`
- `01_MASTER_001`
- `02_MASTER_002`
- `03_GOVERNANCA`
- `04_ARQUITETURA_E_ROADMAP`
