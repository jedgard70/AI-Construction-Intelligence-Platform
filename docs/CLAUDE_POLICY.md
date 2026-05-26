# CLAUDE_POLICY.md — Política para Anthropic Claude (Cowork / Claude Code)

> Aplica-se a: Claude Cowork, Claude Code CLI, Claude API com acesso ao repositório via MCP.
> Herda todas as regras de `/AGENTS.md`. Este documento adiciona restrições específicas para Claude.

---

## 1. Identidade e Acesso

Claude acessa este repositório via:
- **Windows MCP** (`mcp__Windows-MCP__PowerShell`, `mcp__Windows-MCP__FileSystem`) — acesso ao sistema de arquivos local
- **Cowork** — sessão interativa com o Dr. Edgard

**Caminho do repositório:**
```
D:\AI-constr\AI-Construction-Intelligence-Platform
```

**Branch ativa de trabalho:**
```
codex/final-implementation-audit
```

---

## 2. PRs Protegidas (não fechar sem instrução explícita)

| PR | Título | Status |
|----|--------|--------|
| #20 | Studio 3D | Manter aberta |
| #21 | Segurança/CVE | Manter aberta |
| #23 | codex/final-implementation-audit | Manter aberta — PR principal |
| #3  | Aguardando instrução | Não fechar ainda |
| #14 | Aguardando instrução | Não fechar ainda |

> ⚠️ **Nunca fechar PRs listadas acima sem instrução explícita do Dr. Edgard.**

---

## 3. Protocolo de Segurança — Windows MCP

### Antes de qualquer ação:
1. `git status` para confirmar branch e estado do working tree
2. Confirmar que está em `codex/final-implementation-audit` (ou branch acordada)
3. Ler arquivo antes de editar

### Operações permitidas via MCP:
- ✅ Ler arquivos (`Read`, `Get-Content`, `cat`)
- ✅ Verificar estado git (`git status`, `git log`, `git diff`)
- ✅ Criar/editar arquivos em branches de feature
- ✅ Rodar build (`npm run build`, `tsc --noEmit`)
- ✅ Rodar testes (`npm test`)
- ✅ `git add`, `git commit` — **somente após aprovação explícita**
- ✅ `git push` — **somente após aprovação explícita**

### Operações proibidas via MCP:
- ❌ `git push origin main` (direto em main)
- ❌ `git merge` sem aprovação
- ❌ `git rebase` sem aprovação (exceto para sync com upstream acordado)
- ❌ `npm run migrate` ou qualquer execução de SQL
- ❌ Deletar arquivos sem confirmação
- ❌ Alterar `.env.local` ou qualquer arquivo de secrets
- ❌ `npm install <pacote>` sem aprovação prévia

---

## 4. Regras de Commit

```bash
# ✅ Fluxo correto
git status                          # 1. Verificar estado
git diff <arquivo>                  # 2. Mostrar diff ao usuário
# --- AGUARDAR APROVAÇÃO ---
git add <arquivo-especifico>        # 3. Adicionar apenas o necessário
git commit -m "fix: descrição"      # 4. Commit semântico
git push origin <branch>            # 5. Push na branch correta
```

**Nunca usar:**
```bash
git add .          # ❌ Adiciona tudo sem revisão
git add -A         # ❌ Idem
git commit --amend # ❌ Sem aprovação
git push --force   # ❌ Jamais
```

---

## 5. Plataforma ACIP — Alerta Crítico de Segurança

> ⚠️ **CUIDADO**: Nunca deletar, sobrescrever, ou alterar dados da plataforma ACIP em produção por engano.
> Todo acesso ao Supabase é ao ambiente do projeto `ai-construction-intelligence-platform`.
> Em caso de dúvida, PARAR e perguntar antes de agir.

---

## 6. Gestão de Erros e Incidentes

Se algo der errado durante uma operação:

1. **Parar imediatamente** — não tentar "consertar" silenciosamente
2. **Reportar** o estado atual exato (`git status`, último erro)
3. **Não fazer revert automático** — propor e aguardar aprovação
4. **Documentar** o que foi feito antes do erro
5. Lema: _"1 problema por vez / 1 revert por vez / validar build / só depois decidir"_

---

## 7. Prioridades de Trabalho

```
P0 — Produção funcionando (Supabase, autenticação, cliente/projeto)
P1 — Build limpo (npm run build sem erros críticos)
P2 — PR #23 limpa e pronta para merge
P3 — Funcionalidades novas (orchestrator, Studio 3D, etc.)
```

---

## 8. Informações de Contato

**Responsável:** Dr. Edgard  
**Email:** jedgard70@gmail.com  
**Idioma:** pt-BR (respostas técnicas em pt-BR)
