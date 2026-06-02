# APEX SAFETY GATE — Plano

## Objetivo
Impedir que agentes/assentos/automações executem ações destrutivas em paths críticos sem validação de segurança e aprovação explícita.

## Contexto crítico
- Windows é case-insensitive.
- `D:\AI-constr\AI-Construction-Intelligence-Platform` e variantes com caixa diferente podem representar o mesmo caminho.
- Incidente recente mostrou risco de exclusão por path equivalente.

## Escopo desta entrega
1. Criar camada de segurança em `lib/safety/*`.
2. Integrar primeiro nas APIs `autonomous` (avaliação + bloqueio de alto risco sem aprovação).
3. Documentar regras e evidências.
4. Não implementar operações destrutivas reais.

## Módulos
- `lib/safety/path-guard.ts`
  - `normalizePath`
  - `isCaseInsensitiveSamePath`
  - `hasRepoMarkers`
- `lib/safety/workspace-guard.ts`
  - `isOfficialWorkspace`
- `lib/safety/destructive-action-guard.ts`
  - `classifyDestructiveRisk`
  - `requireOwnerApproval`

## Integração inicial (API)
- `pages/api/autonomous/task.ts`
  - Classificar risco de tarefa destrutiva.
  - Bloquear risco crítico sem aprovação de owner.
- `pages/api/autonomous/status.ts`
  - Expor status do Safety Gate.
- `pages/api/autonomous/next-actions.ts`
  - Expor guardrails de segurança no payload.

## Critérios de aceite
- Paths equivalentes por caixa são tratados como mesmo caminho.
- Diretórios com marcadores de repositório (`.git`, `package.json`, `pages`, `docs`, `supabase`) recebem risco elevado/crítico.
- Bloqueio explícito para tarefa crítica sem aprovação owner.
- Build passa.

## Riscos e limites
- A análise de texto de tarefa pode não capturar 100% dos casos sem parser dedicado.
- Integração nesta fase é focada no trilho `autonomous`; outros módulos podem adotar em etapas seguintes.
