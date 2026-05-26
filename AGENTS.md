# AGENTS.md — AI Agent Policy for ACIP

> **AI Construction Intelligence Platform (ACIP)**
> Jurisdição principal: 🇧🇷 Brasil (regras BR). Secundário: 🇵🇹 PT · 🇺🇸 US · 🇪🇺 EU.
> Este arquivo é lido automaticamente por Codex, Claude, e outros agentes de IA ao acessar este repositório.

---

## 1. Regras Absolutas — NUNCA faça sem aprovação humana explícita

| # | Proibição |
|---|-----------|
| 1 | **Commit direto em `main`** — toda mudança vai para branch dedicada + PR |
| 2 | **Executar SQL automaticamente** — nem SELECT destrutivo, nem INSERT/UPDATE/DELETE |
| 3 | **Executar migrations** sem aprovação do responsável técnico |
| 4 | **Alterar schema Supabase** (tables, RLS policies, roles) sem aprovação |
| 5 | **Usar `service_role` no browser** — nunca expor chave privilegiada no frontend |
| 6 | **Apagar arquivos** sem confirmação explícita (listar primeiro, aguardar "pode apagar") |
| 7 | **Fingir sucesso** com fallback demo/localStorage quando Supabase falhar |
| 8 | **Refactor massivo** sem plano aprovado e escopo delimitado |
| 9 | **Alterar `package.json`** manualmente (somente via `npm install <pkg>` documentado) |
| 10 | **Tocar em secrets** (`.env`, `.env.local`, Vault, Supabase secrets) — leitura de nomes OK, valores nunca |

---

## 2. Regras de Comportamento — SEMPRE faça

| # | Obrigação |
|---|-----------|
| 1 | `git status` antes de qualquer operação de arquivo |
| 2 | Listar arquivos afetados pelo patch antes de aplicar |
| 3 | Mostrar diff (unified) antes de commit |
| 4 | Patch pequeno e isolado (1 responsabilidade por commit) |
| 5 | Mensagem de commit semântica (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`) |
| 6 | Branch dedicada por feature/fix (`feat/*`, `fix/*`, `chore/*`) |
| 7 | Build/teste local antes de declarar tarefa concluída |
| 8 | Mostrar nível de risco (🟢 baixo / 🟡 médio / 🔴 alto) de cada ação |
| 9 | Pedir aprovação antes de `git commit` |
| 10 | Reportar resultado final com SHA do commit e link do PR |

---

## 3. Fluxo Obrigatório de Trabalho

```
1. LOCALIZAR    → confirmar branch e diretório correto
2. GIT STATUS   → verificar estado do working tree
3. AUDITORIA    → ler arquivos relevantes (Read/cat)
4. PLANO        → propor lista de mudanças, listar riscos
5. PATCH        → aplicar mudança pequena e isolada
6. DIFF         → mostrar diff completo ao usuário
7. APROVAÇÃO    → aguardar confirmação explícita
8. COMMIT       → commit isolado com mensagem semântica
9. BUILD        → npm run build (ou tsc --noEmit)
10. RELATÓRIO   → SHA, arquivos alterados, próximos passos
```

> Se algum passo falhar, **parar e reportar** — nunca continuar silenciosamente.

---

## 4. Jurisdição e Idioma

| Contexto do projeto | Idioma de resposta | Regras adicionais |
|---------------------|--------------------|-------------------|
| BR (padrão)         | pt-BR              | LGPD, NBR, ABNT   |
| PT                  | pt-PT              | RGPD (GDPR)       |
| US                  | en-US              | CCPA, SOC2        |
| EU                  | en-US / pt-PT      | GDPR, DORA        |

---

## 5. Gestão de PRs

- PRs abertas só são fechadas com instrução explícita do responsável
- Nunca fazer merge de PR sem aprovação
- Lista de PRs protegidas: ver `docs/CLAUDE_POLICY.md`

---

## 6. Referências

- `docs/CLAUDE_POLICY.md` — regras específicas para Claude/Cowork
- `docs/CODEX_POLICY.md` — regras específicas para OpenAI Codex
- `docs/MCP_WINDOWS_GOVERNANCE.md` — regras de acesso via Windows MCP
- `docs/AI_CONSTITUTION.md` — constituição do orquestrador AI (fase 1)
