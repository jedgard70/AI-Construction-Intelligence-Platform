# Apex Copilot Engine Router

Data: 04/06/2026
Status: roteador operacional de motores

## Objetivo

Definir como a Apex Copilot escolhe entre Codex, Claude, Qwen e Copilot para cada checkpoint.

## Regra Geral

Apex Copilot orquestra. O motor executor e escolhido por tipo de tarefa, risco e necessidade de validacao.

## Motores

### Codex

Usar Codex quando:
- houver edicao real no reposititorio;
- for necessario rodar build/testes;
- for necessario abrir PR, acompanhar checks e fazer merge;
- houver alteracao em Next.js, API routes, migrations, docs versionados ou Mission Control;
- for necessario preservar worktree e evitar misturar escopos.

Evitar Codex quando:
- a tarefa for apenas brainstorming;
- nao houver repositorio envolvido;
- o usuario pedir apenas redacao externa.

### Claude

Usar Claude quando:
- for necessario gerar primeira versao extensa de documento, estrategia, copy ou checklist;
- for necessario resumir contexto longo;
- a tarefa exigir raciocinio narrativo, produto ou planejamento;
- o output for handoff para outro motor.

Evitar Claude quando:
- houver risco alto de alterar arquivos sem validacao local;
- houver necessidade de build, PR ou merge;
- houver necessidade de ler estado real do Git local.

### Qwen

Usar Qwen quando:
- for necessario raciocinio alternativo ou segunda opiniao tecnica;
- houver revisao de arquitetura, algoritmo, SQL ou edge case;
- for util comparar abordagem antes de implementar.

Evitar Qwen quando:
- a decisao depender de estado real de GitHub, Vercel ou Supabase;
- for necessario executar comandos locais.

### Copilot

Usar Apex Copilot interna quando:
- a tarefa for acompanhamento operacional dentro da plataforma;
- o usuario precisar de status, checkpoint, proxima acao ou leitura de Mission Control;
- for necessario orientar Owner/seat dentro das permissoes;
- for necessario gerar handoff, nao executar.

Evitar Copilot interna quando:
- a tarefa exigir acesso a secrets;
- a tarefa exigir executar shell livre;
- a tarefa exigir merge/deploy sem gate externo.

## Matriz De Decisao

| Tarefa | Motor Primario | Motor Auxiliar | Gate |
| --- | --- | --- | --- |
| Criar docs operacionais | Codex | Claude | Build + PR |
| Corrigir bug em codigo | Codex | Qwen | Build/testes |
| Auditar PR | Codex | Copilot | Checks reais |
| Planejar sprint | Claude | Copilot | Owner approval |
| Revisar arquitetura | Qwen | Codex | Evidencia tecnica |
| Atualizar Mission Control | Codex | Copilot | Build + preview |
| Criar handoff | Copilot | Claude | Escopo fechado |
| Migrations/RLS | Codex | Qwen | Supabase Preview |
| Vercel failure | Codex | Copilot | Logs/deploy |

## Politica De Escolha

1. Se precisa alterar repo, escolher Codex.
2. Se precisa apenas planejar, escolher Claude ou Copilot.
3. Se precisa segunda opiniao tecnica, chamar Qwen.
4. Se envolve PR/checks/deploy, Codex assume.
5. Se envolve usuario final dentro da plataforma, Copilot orienta.

## Formato De Decisao

Apex Copilot deve declarar:

```
Motor escolhido: Codex
Motivo: requer edicao versionada, build local, PR e acompanhamento de checks.
Motor auxiliar: Qwen, se houver duvida em RLS/SQL.
Escopo: docs e Mission Control apenas.
Proibido: Supabase db push, login, website publico.
```
