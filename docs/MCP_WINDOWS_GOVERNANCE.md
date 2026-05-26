# MCP_WINDOWS_GOVERNANCE.md — Governança de Acesso via Windows MCP

> **Projeto:** AI Construction Intelligence Platform (ACIP)
> **Ferramenta:** Windows MCP (`mcp__Windows-MCP__*`)
> **Responsável:** Dr. Edgard | jedgard70@gmail.com

---

## 1. Escopo Permitido

O Windows MCP tem acesso ao sistema de arquivos local e ao terminal PowerShell do computador do Dr. Edgard. Este acesso é limitado ao escopo técnico do projeto ACIP.

### ✅ O que Claude PODE fazer via Windows MCP

| Categoria | Operações Permitidas |
|-----------|---------------------|
| **Git** | `git status`, `git log`, `git diff`, `git branch` (leitura) |
| **Git** | `git add <arquivo>`, `git commit`, `git push` — **após aprovação** |
| **Git** | `git revert` — **após aprovação e acordo sobre estratégia** |
| **Arquivos** | Leitura (`Get-Content`, `cat`, `Read`) |
| **Arquivos** | Criação/edição de arquivos em branches de feature |
| **Build** | `npm run build`, `npm run dev`, `tsc --noEmit` |
| **Testes** | `npm test`, `npm run lint` |
| **npm** | `npm ci`, `npm install` — apenas para restaurar ambiente |
| **Logs** | Leitura de logs de build e runtime |
| **Diagnóstico** | `Get-Process`, `Test-Path`, `ls`, `dir` |

---

## 2. Comandos Proibidos

### Absolutamente proibidos — jamais executar

```powershell
# ❌ NUNCA — operações destrutivas no git
git push origin main              # push direto na main
git push --force                  # reescrita de histórico
git merge <qualquer>              # sem aprovação
git rebase <qualquer>             # sem aprovação
git reset --hard HEAD~N           # sem aprovação

# ❌ NUNCA — banco de dados
psql -c "DROP TABLE ..."          # SQL destrutivo
npx supabase db push              # migration automática
npx supabase migration run        # migration automática
npx prisma migrate deploy         # migration automática

# ❌ NUNCA — arquivos sensíveis
Remove-Item -Recurse node_modules # somente com instrução explícita
Remove-Item .env.local            # jamais
cat .env.local                    # jamais (valores de secrets)
Get-Content .env.local            # jamais (valores de secrets)

# ❌ NUNCA — alterações globais
npm install <novo-pacote>         # sem aprovação prévia
npm uninstall <pacote>            # sem aprovação prévia
```

### Proibidos sem aprovação explícita

```powershell
# ⛔ Requer aprovação antes de executar
git revert <sha>                  # propor estratégia primeiro
git stash drop                    # confirmar o que será perdido
npm install (reinstalação)        # informar antes de commitar lock
Remove-Item <arquivo>             # listar primeiro, confirmar
```

---

## 3. Política de Aprovação Humana

### Níveis de autonomia

| Nível | Ação | Aprovação necessária |
|-------|------|---------------------|
| 🟢 **Autônomo** | Leitura, status, diff, build | Não precisa |
| 🟡 **Confirmar** | Criar/editar arquivo, npm install | Mostrar antes de executar |
| 🔴 **Aprovação explícita** | git commit, git push, git revert | Aguardar "pode commitar" / "confirmo" |
| 🚫 **Sempre proibido** | push main, SQL, alterar secrets | Nunca, independente de instrução |

### Fórmula de solicitação de aprovação

Antes de commitar, Claude deve apresentar:

```
📋 RESUMO DO COMMIT PROPOSTO
Branch: codex/final-implementation-audit
Arquivos: [lista]
Mensagem: feat/fix/chore: descrição
Risco: 🟢 baixo / 🟡 médio / 🔴 alto

Diff:
[diff completo]

✅ Posso prosseguir com o commit?
```

---

## 4. Regra: Nunca Alterar `main` Diretamente

```
main branch = produção = INTOCÁVEL

Todo trabalho segue o fluxo:
  nova branch → commits → PR → review → merge (por humano)

Claude NUNCA faz:
  git checkout main
  git push origin main
  git merge <branch> (quando HEAD = main)
```

Se por acidente `git status` mostrar `On branch main`, Claude deve:
1. Reportar imediatamente
2. Não executar nenhuma operação de escrita
3. Aguardar instrução para trocar de branch

---

## 5. Regra: SQL e Migrations Requerem Aprovação

```
Toda operação de banco de dados = risco de perda irreversível

Proibido executar automaticamente:
- SELECT * com DELETE subsequente
- INSERT em tabelas de produção
- UPDATE sem WHERE específico
- DROP TABLE / TRUNCATE
- npx supabase db push
- npx supabase migration run

Permitido apenas APÓS aprovação escrita do Dr. Edgard:
- Ler estrutura de tabelas (somente leitura)
- Rodar migration em ambiente de desenvolvimento isolado
```

---

## 6. Regra: Nunca Mexer em Secrets

```
Arquivos de secrets (JAMAIS ler valor, apenas nomes de variáveis):
- .env.local
- .env.production
- qualquer arquivo .env.*
- Supabase service_role key
- ANTHROPIC_API_KEY e similares

Permitido:
- Ler .env.example (apenas template, sem valores reais)
- Listar nomes de variáveis em next.config.js (sem valores)
```

---

## 7. Regra: Não Apagar Arquivos sem Confirmação

Antes de qualquer `Remove-Item` ou `rm`:

```
1. Listar o arquivo e seu conteúdo
2. Mostrar por que precisa ser apagado
3. Aguardar: "pode apagar" ou "confirmo"
4. Apenas então executar a remoção
```

---

## 8. Fluxo Padrão de Trabalho via Windows MCP

```
Passo 1: LOCALIZAR REPO
  cd D:\AI-constr\AI-Construction-Intelligence-Platform
  git branch --show-current

Passo 2: GIT STATUS
  git status --short
  git log --oneline -5

Passo 3: LER ARQUIVOS
  Get-Content <arquivo> | Out-String
  (entender o estado atual antes de propor mudança)

Passo 4: PROPOR PATCH
  Descrever exatamente o que será alterado
  Listar arquivos afetados
  Mostrar nível de risco (🟢/🟡/🔴)

Passo 5: APLICAR PATCH PEQUENO
  Editar apenas os arquivos necessários
  Responsabilidade única por patch

Passo 6: MOSTRAR DIFF
  git diff <arquivo>
  (mostrar resultado completo ao Dr. Edgard)

Passo 7: PEDIR APROVAÇÃO ANTES DE COMMIT
  "✅ Posso prosseguir com o commit?"
  Aguardar resposta afirmativa

Passo 8: RODAR BUILD/TESTE
  npm run build 2>&1
  (verificar que não introduziu novos erros)

Passo 9: REPORTAR RESULTADO
  git log --oneline -3
  SHA do commit
  Link do PR
  Próximos passos
```

---

## 9. Incidentes e Recuperação

Em caso de operação inadvertida:

```
1. PARAR imediatamente — não continuar nem "consertar" sozinho
2. REPORTAR estado exato: git status, último erro, o que foi executado
3. AGUARDAR instrução do Dr. Edgard
4. Lema operacional: "1 problema por vez / 1 revert por vez / validar / decidir"
```

---

## 10. Auditoria

Este documento deve ser revisado toda vez que:
- Uma nova ferramenta de IA for integrada ao projeto
- Uma operação proibida for executada por engano (post-mortem)
- O responsável técnico alterar as políticas de segurança

**Última revisão:** 2026-05-25
**Revisado por:** Dr. Edgard / Claude (Anthropic)
