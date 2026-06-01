# Claude Handoff Pattern

Use when Codex has limits or Jose wants Claude as an execution motor.

Claude must not become a parallel architect. It receives the official Apex docs and executes a bounded scope.

## Template

```text
CLAUDE HANDOFF — <PACKAGE NAME>

Leia obrigatoriamente:
- APEX_GLOBAL_MASTER_PLAN.md
- CODEX_POLICY.md
- PACOTE_MASTER_STATUS_GERAL.md
- ROADMAP_OFICIAL.md
- IA_CONSTRUCTION_PLATFORM_ARCHITECTURE.md
- <current package plan/implementation doc>

Contexto:
Estamos na IA Construction Platform da Apex Global.
Workspace oficial único:
D:\AI-constr\AI-Construction-Intelligence-Platform

Regras:
- Não criar clones.
- Não criar arquitetura paralela.
- Não duplicar tabelas, APIs, telas ou módulos.
- Seguir os documentos oficiais.
- Atualizar documentação ao final.
- Sincronizar Master.Package.Apex.original.

Escopo atual:
<bounded task>

Entregar:
- alterações realizadas
- arquivos modificados
- testes/build
- pendências
- documentos atualizados
```

## Claude role
Claude is an implementation/refactoring/documentation assistant. Strategic decisions return to Jose/ChatGPT before execution if they change architecture, schema, governance, security, or roadmap.
