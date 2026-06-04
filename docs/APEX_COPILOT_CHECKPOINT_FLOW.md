# Apex Copilot Checkpoint Flow

Data: 04/06/2026
Status: fluxo operacional

## Objetivo

Padronizar como Apex Copilot cria, acompanha e fecha checkpoints.

## Fluxo Resumido

1. Receber pedido do Owner.
2. Criar checkpoint.
3. Definir objetivo.
4. Definir escopo permitido/proibido.
5. Escolher motor.
6. Gerar handoff.
7. Acompanhar execucao.
8. Acompanhar PR.
9. Acompanhar build.
10. Acompanhar Vercel.
11. Acompanhar Supabase.
12. Declarar status final.
13. Atualizar Mission Control/documentacao.

## Etapa 1: Criar Checkpoint

Template:

```
Checkpoint: CP-YYYYMMDD-NOME
Objetivo:
Escopo permitido:
Escopo proibido:
Motor:
Branch:
PR:
Validacoes:
Evidencias:
Status:
```

Status possiveis:
- `planejado`
- `em_execucao`
- `validando`
- `bloqueado`
- `pronto_para_merge`
- `100_confirmado`

## Etapa 2: Definir Objetivo

O objetivo deve ser verificavel.

Bom:
- "Criar documentacao operacional para checkpoint orchestration e abrir PR com checks verdes."

Ruim:
- "Melhorar Apex AI."

## Etapa 3: Definir Escopo

Sempre separar:

Permitido:
- arquivos;
- modulos;
- comandos;
- validacoes.

Proibido:
- migrations sem autorizacao;
- Supabase push sem autorizacao;
- login quando fora do escopo;
- website publico quando pausado;
- package files quando nao necessario;
- secrets/tokens.

## Etapa 4: Escolher Motor

Usar `docs/APEX_COPILOT_ENGINE_ROUTER.md`.

Exemplo:

```
Motor: Codex
Motivo: tarefa exige docs versionados, commit, PR, checks e merge.
```

## Etapa 5: Gerar Handoff

Handoff minimo:

```
Contexto:
Objetivo:
Arquivos permitidos:
Arquivos proibidos:
Regras:
Validacoes:
Commit esperado:
PR esperado:
Relatorio final:
```

## Etapa 6: Acompanhar PR

Apex Copilot deve registrar:
- numero do PR;
- branch origem;
- base;
- draft/ready;
- arquivos alterados;
- checks;
- status de merge;
- decisao: aguardar, corrigir, reduzir escopo, fechar ou mergear.

## Etapa 7: Acompanhar Build

Build local:
- `npm run build` quando app Next.js for afetado;
- documentar warnings relevantes;
- separar falhas do escopo atual de falhas pre-existentes.

Build CI:
- registrar nome do check;
- conclusao;
- link;
- erro real quando houver.

## Etapa 8: Acompanhar Vercel

Registrar:
- status Vercel;
- preview URL quando disponivel;
- erro externo se houver;
- se o deploy e obrigatorio para declarar 100%.

Vercel `FAILURE` bloqueia merge quando a mudanca afeta frontend/API.

## Etapa 9: Acompanhar Supabase

Registrar:
- se houve migration;
- se Supabase Preview rodou, falhou, cancelou ou foi skipped;
- se ha RLS/Auth/Storage envolvidos;
- se `db push` foi autorizado.

Sem autorizacao, nao executar `supabase db push`.

## Etapa 10: Declarar 100%

Formato:

```
Status: 100% confirmado
Evidencias:
- PR #...
- Build local: PASS
- GitHub Actions: PASS
- Vercel: READY/PASS ou N/A
- Supabase Preview: PASS ou N/A
- Mission Control: atualizado
Riscos residuais:
- ...
```

Se qualquer evidencia obrigatoria faltar, declarar:

```
Status: em validacao
Motivo: Vercel pendente / Supabase skipped / Owner sign-off pendente.
```

## Etapa 11: Atualizar Mission Control

Atualizar Mission Control somente quando:
- PR foi mergeado;
- estado real mudou;
- Owner aprovou status;
- docs de evidencia existem.

Mission Control nao deve mostrar `100%` por expectativa.
