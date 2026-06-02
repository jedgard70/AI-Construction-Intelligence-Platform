# MASTERPLAN 8 PASSOS FINALIZACAO APEX

Data: 2026-06-02
Workspace oficial: `D:\AI-constr\AI-Construction-Intelligence-Platform`

## Regra geral do masterplan

Cada passo deve ser tratado como um pacote grande, fechado e sequencial com:
- auditoria
- correcao
- validacao
- documentacao
- PR

Regras transversais:
- nao criar feature nova fora do passo atual
- nao misturar passos no mesmo PR
- nao limpar maquina sem autorizacao explicita
- nao declarar `PASS` sem evidencia real
- nao mover o foco para `Ebook` ou `Revit` antes do passo 8

---

## 1. Plataforma Operacional Controlada

### Objetivo

Congelar uma versao operacional controlada da plataforma, com `main` limpo, gates centrais conhecidos e pendencias remanescentes classificadas como controladas.

### Escopo permitido

- auditoria de `main`
- isolamento de worktree sujo
- build local
- fechamento documental da versao controlada
- classificacao do que esta operacional vs. pendente controlado

### Escopo proibido

- nova feature
- hardening grande de seguranca
- migration nova de produto
- limpeza de maquina

### Arquivos provaveis

- `docs/RELATORIO_FINAL_PLATAFORMA_OPERACIONAL_CONTROLADA.md`
- `docs/*` de auditoria e handoff
- `package.json`
- `pages/api/*`
- `pages/*`

### Validacoes obrigatorias

- `git status` limpo na branch do passo
- build local verde
- registro do estado real de `Owner/Auth`, `Revenue`, `Storage` e `Security`

### Criterios de PASS

- `main` limpo
- build `PASS`
- worktree anterior preservado ou isolado com rastreabilidade
- relatorio final aprovado

### Riscos

- esconder pendencias reais sob narrativa otimista
- misturar fechamento operacional com correcao de seguranca

### Quando parar

- quando a plataforma estiver classificada como `OPERACIONAL CONTROLADA`
- quando o PR documental desse passo estiver fechado

### Entregaveis

- relatorio final da versao operacional controlada
- PR fechado e mergeado do passo 1

### Proximo passo

- `2. Security PASS`

---

## 2. Security PASS

### Objetivo

Sair de `PENDENCIA CONTROLADA` para `Security PASS` com estado reproduzivel entre repositório, preview e banco principal.

### Escopo permitido

- reconciliacao da migration chain do Supabase
- sincronizacao entre repo e estado remoto
- fechamento dos lints P0 restantes
- rerun de advisors
- validacao de preview e banco principal

### Escopo proibido

- features de produto
- refatoracao ampla fora do escopo de seguranca
- hardening em lote sem auditoria por grupo

### Arquivos provaveis

- `supabase/migrations/*`
- `docs/PR80_SUPABASE_REMOTE_MIGRATION_SYNC_PLAN.md`
- `docs/QA_SUPABASE_SECURITY.md`
- `docs/*security*`

### Validacoes obrigatorias

- `supabase migration list --linked`
- `supabase db advisors --linked`
- confirmacao de preview reproduzivel
- confirmacao de `rls_policy_always_true = 0`

### Criterios de PASS

- migration chain coerente entre repo e banco principal
- preview sem quebra de chain
- lints P0 alvo zerados com evidencia real

### Riscos

- cristalizar historico incoerente de migration
- quebrar preview ao tentar “corrigir rapido”
- confundir banco principal com estado do repo

### Quando parar

- quando `Security PASS` estiver comprovado por advisor e preview
- ou quando surgir dependencia externa que exija novo pacote isolado

### Entregaveis

- PR limpo de sincronizacao/normalizacao
- relatorio final de seguranca

### Proximo passo

- `3. Auth PASS`

---

## 3. Auth PASS

### Objetivo

Fechar `Owner/Auth` como `PASS` real, com evidencia ponta a ponta de lifecycle de sessao.

### Escopo permitido

- auditoria de auth owner/common seat
- correcao de runtime de sessao
- validacao browser real
- validacao de logout, re-login e expiracao

### Escopo proibido

- novos modulos de permissao
- nova UI fora da necessaria para validacao
- features de Apex AI fora do fluxo de auth

### Arquivos provaveis

- `lib/owner-auth.ts`
- `pages/api/owner-command/chat*`
- `pages/api/chat*`
- `pages/login*`
- `middleware.js` ou `proxy`
- `docs/QA_OWNER_AUTH_REAL.md`

### Validacoes obrigatorias

- owner real
- usuario autenticado sem privilegio owner
- sem sessao
- token invalido
- logout interativo
- expiracao natural ou revogacao real

### Criterios de PASS

- todos os cenarios de sessao validados com evidencia real
- `Apex AI` e `Owner Command` coerentes com o papel

### Riscos

- fechar com base apenas em chamadas backend
- ignorar comportamento real em browser

### Quando parar

- quando `Owner/Auth PASS` estiver fechado com evidencia real

### Entregaveis

- relatorio final de auth
- PR isolado de auth

### Proximo passo

- `4. Data PASS`

---

## 4. Data PASS

### Objetivo

Garantir integridade de dados, persistencia real, leituras corretas e ausencia de comportamento demo indevido nos fluxos core.

### Escopo permitido

- Revenue
- Storage metadata
- CRM core persistente
- trilhas de evento
- verificacao de tabelas e contratos de dados

### Escopo proibido

- feature nova comercial
- analytics novo
- expansao de schema fora de necessidade de estabilizacao

### Arquivos provaveis

- `pages/api/crm/*`
- `pages/api/storage/*`
- `pages/crm/*`
- `lib/storage-access.ts`
- `supabase/migrations/*` apenas se estritamente necessario neste passo
- `docs/QA_REVENUE_REAL.md`
- `docs/QA_STORAGE_REAL.md`

### Validacoes obrigatorias

- create/read/update/delete conforme escopo
- trilha de eventos
- dados persistem entre sessoes
- sem fallback demo ativo no fluxo principal

### Criterios de PASS

- Revenue `PASS`
- Storage `PASS`
- ausencia de desvio operacional entre dado real e fallback demo

### Riscos

- confundir “build ok” com persistencia ok
- manter residuos demo que mascaram falha de dados

### Quando parar

- quando os fluxos core de dados estiverem validados ponta a ponta

### Entregaveis

- relatorio de dados reais
- PR isolado de estabilizacao de dados

### Proximo passo

- `5. CI/CD PASS`

---

## 5. CI/CD PASS

### Objetivo

Fechar a trilha de entrega continua com checks reproduziveis, PR previews confiaveis e politica clara de merge.

### Escopo permitido

- GitHub Actions
- Vercel status/checks
- Supabase Preview
- padrao de branch/PR/checks

### Escopo proibido

- refatoracao funcional de modulos de produto
- automacoes de negocio novas

### Arquivos provaveis

- `.github/workflows/*`
- `vercel.json`
- `supabase/*`
- docs operacionais de PR/CI

### Validacoes obrigatorias

- build em CI
- preview Vercel coerente
- Supabase Preview coerente
- regras claras para merge

### Criterios de PASS

- PRs fecham com checks verdes de forma consistente
- sem falso verde por status conflitante
- preview reproduzivel

### Riscos

- depender de check verde local mas vermelho remoto
- tratar falhas de preview como “aceitaveis” sem plano

### Quando parar

- quando um PR padrao do repositório conseguir fechar e mergear com trilha limpa

### Entregaveis

- relatorio de CI/CD
- PR isolado de pipeline

### Proximo passo

- `6. UX PASS`

---

## 6. UX PASS

### Objetivo

Fechar qualidade de experiencia nos fluxos ja existentes, sem abrir frente de produto nova.

### Escopo permitido

- coerencia visual
- mensagens de erro/estado
- logout/login UX
- Revenue/Storage/Owner flow UX
- ajustes de navegacao e clareza

### Escopo proibido

- redesign amplo de marca
- novas jornadas
- expansao de modulos fora do core

### Arquivos provaveis

- `pages/*`
- `components/*`
- `styles/*`
- `lib/*` de helpers UX
- docs de QA visual

### Validacoes obrigatorias

- walkthrough real dos fluxos core
- estados de erro
- estados vazios
- responsividade minima

### Criterios de PASS

- fluxos core usaveis sem ambiguidade
- sem bloqueios UX graves em login, owner, revenue e storage

### Riscos

- transformar UX em redesign infinito
- misturar UX com feature nova

### Quando parar

- quando o fluxo core estiver claro, consistente e validado

### Entregaveis

- relatorio UX
- PR isolado de UX

### Proximo passo

- `7. Governance/Automation PASS`

---

## 7. Governance/Automation PASS

### Objetivo

Fechar governanca operacional, automacoes seguras e disciplina de continuidade para evitar recaida no caos de worktree/processo.

### Escopo permitido

- regras operacionais
- guardrails de PR
- safety gates
- disciplina de handoff e auditoria
- automacoes seguras de rotina

### Escopo proibido

- automacao destrutiva ampla
- limpeza de maquina sem autorizacao
- agentes novos fora de necessidade operacional

### Arquivos provaveis

- `docs/*operational*`
- `docs/*handoff*`
- `lib/safety/*`
- `pages/api/autonomous/*`
- `.github/*`

### Validacoes obrigatorias

- fluxo de handoff
- rastreabilidade de worktree
- regras de separacao de PR
- guardrails para acoes sensiveis

### Criterios de PASS

- processo claro para continuar sem misturar frentes
- automacoes essenciais seguras e auditaveis

### Riscos

- excesso de burocracia sem enforcement real
- automacao demais sem visibilidade

### Quando parar

- quando a governanca estiver simples, aplicavel e comprovada no fluxo real

### Entregaveis

- relatorio de governanca/automacao
- PR isolado do passo

### Proximo passo

- `8. Produto/SaaS PASS`

---

## 8. Produto/SaaS PASS

### Objetivo

Fechar a plataforma como produto/SaaS utilizavel, incluindo expansoes fora do core apenas quando os 7 passos anteriores estiverem concluídos.

### Escopo permitido

- consolidacao de posicionamento SaaS
- modulos nao-core ainda pendentes
- `Ebook`
- `Revit`
- `ArchVis`
- planos comerciais e de operacao de produto

### Escopo proibido

- reabrir pendencias dos passos 1-7 sem pacote proprio
- declarar SaaS pronto sem evidencia operacional e comercial minima

### Arquivos provaveis

- `docs/*produto*`
- `docs/*saas*`
- `archvis-*`
- caminhos oficiais de `Ebook` e `Revit`
- materiais comerciais e operacionais

### Validacoes obrigatorias

- alinhamento entre plataforma core e narrativas de produto
- evidencia minima de uso/entrega/operacao
- definicao clara do que entra ou nao na oferta

### Criterios de PASS

- produto descrito de forma coerente com o que realmente existe
- modulos complementares tratados sem contaminar o core

### Riscos

- vender como pronto algo que ainda esta foundation
- misturar marketing com estado real tecnico

### Quando parar

- quando houver um fechamento honesto e verificavel da oferta produto/SaaS

### Entregaveis

- relatorio final de produto/SaaS
- PR isolado do passo 8

### Proximo passo

- encerramento do programa de finalizacao ou abertura de novo roadmap

---

## Sequencia obrigatoria

1. Plataforma Operacional Controlada
2. Security PASS
3. Auth PASS
4. Data PASS
5. CI/CD PASS
6. UX PASS
7. Governance/Automation PASS
8. Produto/SaaS PASS

## Regra de passagem

Um passo so pode comecar quando:
- o passo anterior tiver relatorio final
- o PR do passo anterior estiver fechado
- o criterio de `PASS` ou `PENDENCIA CONTROLADA` daquele passo estiver documentado com evidencia real
