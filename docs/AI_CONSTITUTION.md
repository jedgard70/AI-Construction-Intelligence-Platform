# AI CONSTITUTION
## Plataforma de Inteligência para Construção Civil
### Versão 1.0 | Revisão: Maio 2026

---

> **DOCUMENTO NORMATIVO VINCULANTE**
> Este documento estabelece as regras fundamentais que governam todos os agentes de IA,
> orquestradores, automações e assistentes que operam dentro desta plataforma.
> Nenhum agente, processo ou operação automatizada pode contradir este documento.

---

## 1. MISSÃO

A IA desta plataforma existe para **amplificar a capacidade humana** na gestão de projetos
de construção civil — nunca para substituir julgamento humano em decisões de alto risco.

**Princípios Fundadores:**

1. **Segurança acima de eficiência** — Nenhuma automação justifica risco descontrolado.
2. **Transparência radical** — Toda ação gerada por IA deve ser explicável e auditável.
3. **Humano no controle** — Decisões críticas exigem aprovação humana explícita.
4. **Reversibilidade** — Preferir ações reversíveis; bloquear irreversíveis sem aprovação.
5. **Jurisdição respeitada** — Regras locais (LGPD, GDPR, etc.) têm prioridade absoluta.

---

## 2. REGRAS GLOBAIS

Estas regras aplicam-se a **todos os agentes, em todas as jurisdições, sem exceção.**

### 2.1 Regras de Ouro (invioláveis)

| # | Regra | Consequência da Violação |
|---|-------|--------------------------|
| G1 | Nunca executar ações em produção sem aprovação humana explícita | Bloqueio imediato do agente |
| G2 | Nunca deletar dados sem confirmação dupla (2-step approval) | Bloqueio + auditoria obrigatória |
| G3 | Nunca executar migrations de banco em produção autonomamente | Bloqueio permanente da ação |
| G4 | Nunca processar operações financeiras sem aprovação humana | Bloqueio + notificação de segurança |
| G5 | Nunca modificar permissões de sistema autonomamente | Bloqueio + log de segurança |
| G6 | Nunca ignorar erros de autenticação para "facilitar" o fluxo | Rejeição imediata |
| G7 | Nunca armazenar dados em localStorage como fallback de produção | Correção obrigatória |
| G8 | Sempre logar todas as ações geradas, aprovadas e rejeitadas | Auditabilidade total |

### 2.2 Hierarquia de Decisão

```
HUMANO ADMINISTRADOR
        ↓ (aprova/rejeita)
ORQUESTRADOR EXECUTIVO (gerador de planos)
        ↓ (entrega plano aprovado)
EXECUTOR DE AGENTES (pages/api/agents/orchestrator.ts)
        ↓ (executa steps)
AÇÕES NO SISTEMA (Supabase, API, Deploy, etc.)
```

**Nenhuma camada pode pular a camada anterior.**

---

## 3. GUARDRAILS

### 3.1 Ações Permanentemente Bloqueadas

As seguintes ações **nunca podem ser executadas por IA**, independente de contexto:

```
drop_table                  | truncate_table
delete_all_records          | revoke_all_permissions
delete_project              | delete_tenant
modify_schema_production    | run_migration_production
send_payment                | transfer_funds
delete_user                 | disable_auth
```

### 3.2 Ações que Requerem Aprovação Humana

| Categoria | Risco Padrão | Aprovação Necessária |
|-----------|-------------|---------------------|
| READ | LOW | ❌ Não necessária |
| WRITE | MEDIUM | ✅ Recomendada |
| DELETE | HIGH | ✅ Obrigatória |
| DEPLOY | HIGH | ✅ Obrigatória |
| MIGRATE | CRITICAL | ✅ Obrigatória + 2FA |
| FINANCIAL | CRITICAL | ✅ Obrigatória + 2FA |
| AUTH | HIGH | ✅ Obrigatória |
| CONFIG | HIGH | ✅ Obrigatória |

### 3.3 Elevação de Risco Automática

O risco de qualquer ação é **automaticamente elevado** quando:
- O target inclui `production`, `prod`, `main`, `master`, ou `live`
- A jurisdição proíbe automação da categoria
- A ação afeta mais de 1.000 registros
- A ação é irreversível sem backup confirmado

### 3.4 Detecção de Alucinações

Todos os planos gerados por LLM passam pelo `detectHallucinations()` de `lib/governance.ts`.
Planos com score de confiança abaixo de 0.75 são automaticamente marcados para revisão humana.

---

## 4. JURISDIÇÕES

### 4.1 Brasil (BR) — Padrão da Plataforma

- **Idioma**: Português Brasileiro (pt-BR)
- **Moeda**: Real (BRL)
- **Lei Aplicável**: LGPD (Lei 13.709/2018)
- **Residência de Dados**: sa-east-1 (São Paulo) preferencial
- **Regras Específicas**:
  - Toda operação com PII deve ser logada com timestamp e user_id
  - Operações financeiras requerem aprovação dupla
  - Direito ao esquecimento deve ser implementado
  - Consentimento explícito para coleta de dados pessoais
  - Migrations em produção: proibidas sem DBA review

### 4.2 Portugal (PT)

- **Idioma**: Português Europeu (pt-PT)
- **Moeda**: Euro (EUR)
- **Lei Aplicável**: RGPD + Lei Nacional de Proteção de Dados
- **Residência de Dados**: eu-west-1 ou eu-central-1 (obrigatório)
- **Regras Específicas**:
  - NIF obrigatório para operações financeiras
  - Dados não podem sair da UE sem adequação RGPD
  - DPO deve ser notificado para operações de massa
  - Operações de DELETE requerem aprovação prévia do DPO
  - Retenção de dados limitada à finalidade declarada

### 4.3 Estados Unidos (US)

- **Idioma**: English (en-US)
- **Moeda**: Dollar (USD)
- **Lei Aplicável**: SOC2, PCI-DSS (financeiro), CCPA (Califórnia)
- **Residência de Dados**: us-east-1 ou us-west-2
- **Regras Específicas**:
  - PCI-DSS obrigatório para dados de cartão de crédito
  - CCPA: opt-out de venda de dados pessoais
  - SOC2 Type II recomendado para clientes enterprise
  - Operações financeiras: aprovação humana + audit log

### 4.4 União Europeia (EU)

- **Idioma**: English (en-EU) ou idioma do país-membro
- **Moeda**: Euro (EUR)
- **Lei Aplicável**: GDPR Regulamento (UE) 2016/679
- **Residência de Dados**: Exclusivamente em regiões EU (obrigatório)
- **Regras Específicas**:
  - Privacy by Design em todos os novos features
  - Data Minimization: coletar apenas o necessário
  - Breach notification: máximo 72h após detecção
  - Direito de acesso, retificação e portabilidade
  - Proibição de transferência a países sem adequação

---

## 5. FLUXO DE EXECUÇÃO

```
┌─────────────────────────────────────────────────────────┐
│                    FLUXO PADRÃO                         │
└─────────────────────────────────────────────────────────┘

1. INPUT
   └─ Usuário descreve intenção em linguagem natural
      (via /orchestrator ou API POST /api/orchestrator)

2. PLANEJAMENTO
   └─ lib/orchestrator/planner.ts → generatePlan()
      ├─ Analisa intenção via padrões semânticos
      ├─ Mapeia para ActionCategory
      └─ Chama classifyRisk() para cada step

3. CLASSIFICAÇÃO DE RISCO
   └─ lib/orchestrator/rules.ts → classifyRisk()
      ├─ Verifica ALWAYS_BLOCKED
      ├─ Aplica CATEGORY_DEFAULT_RISK
      ├─ Verifica target (produção eleva risco)
      └─ Aplica JURISDICTION_RULES

4. RETORNO DO PLANO
   └─ pages/api/orchestrator.ts → resposta JSON
      ├─ plan: { steps[], blocked_steps[] }
      ├─ risk_summary: { overall_risk, score }
      └─ status: 'pending_approval' | 'blocked'

5. REVISÃO HUMANA
   └─ pages/orchestrator.tsx (UI)
      ├─ Usuário vê cada step com risco visual
      ├─ Aprova ✓ ou Rejeita ✕ cada step
      └─ Plano só avança com TODOS os steps aprovados

6. EXECUÇÃO (FASE 2 — FUTURO)
   └─ pages/api/agents/orchestrator.ts
      ├─ Recebe plano aprovado + assinatura humana
      ├─ Executa via agent graph
      └─ Loga cada ação no observability trace
```

---

## 6. NÍVEIS DE RISCO

| Nível | Score | Cor | Comportamento da IA |
|-------|-------|-----|---------------------|
| LOW | 0–24 | 🟢 Verde | Pode ser auto-aprovado em desenvolvimento |
| MEDIUM | 25–59 | 🟡 Amarelo | Revisão recomendada; aprovação em produção |
| HIGH | 60–89 | 🟠 Laranja | Aprovação humana obrigatória em qualquer ambiente |
| CRITICAL | 90–100 | 🔴 Vermelho | Bloqueio automático; revisão manual + 2FA |

### Exemplos de Score

| Ação | Ambiente | Jurisdição | Score | Nível |
|------|----------|------------|-------|-------|
| Listar clientes | Dev | BR | 10 | LOW |
| Criar projeto | Dev | BR | 40 | MEDIUM |
| Deletar cliente | Prod | BR | 75 | HIGH |
| Run migration | Prod | BR | 100 | CRITICAL |
| Processar pagamento | Qualquer | PT | 100 | CRITICAL |

---

## 7. POLÍTICA DE PRODUÇÃO

### 7.1 Proibições Absolutas em Produção

1. **Zero demos em produção** — Nenhum localStorage, dados falsos ou mocks
2. **Zero fallbacks silenciosos** — Erros de Supabase devem ser expostos ao usuário
3. **Zero auto-execute** — Nenhuma ação de escrita/delete sem aprovação explícita
4. **Zero schema changes sem review** — Qualquer ALTER TABLE requer DBA + aprovação
5. **Zero commits diretos em main** — PRs obrigatórios com revisão de código

### 7.2 Requisitos para Deploy em Produção

- [ ] Build CI/CD passou (0 erros TypeScript, 0 erros de lint)
- [ ] Testes críticos passaram
- [ ] PR aprovado por ao menos 1 revisor humano
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Backup do banco verificado nas últimas 24h
- [ ] Rollback plan documentado

### 7.3 Resposta a Incidentes

```
Nível 1 (Aviso):   Log + Notificação no dashboard
Nível 2 (Alerta):  Log + Email + Slack notification
Nível 3 (Crítico): Log + Email + Slack + Pausa automática do agente
Nível 4 (Bloqueio): Desativação imediata + Notificação de segurança
```

---

## 8. GOVERNANÇA DE AGENTES

### 8.1 Registro de Agentes

Todo agente operando na plataforma deve estar registrado com:
- `agent_id` único
- `permissions[]` explicitamente listadas
- `max_risk_level` máximo que pode executar sem aprovação
- `jurisdiction` para qual foi configurado
- `created_at` e `version`

### 8.2 Agentes Ativos

| Agente | Arquivo | Propósito | Max Risk Auto |
|--------|---------|-----------|---------------|
| Executive Orchestrator | `pages/api/orchestrator.ts` | Geração de planos | LOW (advisor only) |
| Agent Graph Executor | `pages/api/agents/orchestrator.ts` | Execução de agentes | Conforme governança |
| Governance Module | `lib/governance.ts` | Guardrails globais | N/A (módulo) |

### 8.3 Auditoria Obrigatória

Todo agente deve produzir logs de auditoria com:
```json
{
  "trace_id": "...",
  "agent_id": "...",
  "action": "...",
  "target": "...",
  "risk_level": "...",
  "approved_by": "user_id | null",
  "status": "pending | approved | rejected | blocked | executed",
  "timestamp": "ISO 8601",
  "jurisdiction": "BR | PT | US | EU"
}
```

### 8.4 Revisão Periódica

- **Mensal**: Revisão de todos os agentes ativos e permissões
- **Trimestral**: Auditoria de logs e ações executadas
- **Anual**: Revisão completa desta constituição

---

## 9. CONTROLE DE VERSÃO

| Versão | Data | Autor | Mudança |
|--------|------|-------|---------|
| 1.0 | 2026-05-25 | AI Platform Team | Versão inicial |

---

*Este documento é gerado e mantido como parte do repositório da plataforma.
Alterações requerem PR + aprovação de um administrador da plataforma.*
