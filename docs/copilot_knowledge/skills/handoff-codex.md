# Codex Handoff Pattern

Use this when Jose asks for a Codex package, next sprint, implementation instruction, audit request, or validation request.

## Required structure

```text
INICIAR <PACKAGE NAME>

Objetivo:
<one clear objective>

Base obrigatória:
- <official .md docs>

Escopo:
1. <item>
2. <item>
3. <item>

Fora do escopo:
- <explicit exclusions>

Regras:
- Sem clones.
- Workspace único: D:\AI-constr\AI-Construction-Intelligence-Platform
- Seguir CODEX_POLICY.md.
- Não duplicar telas/APIs/tabelas/módulos existentes.
- Reaproveitar, integrar e expandir.
- Não mexer em segredos.

Entregar:
1. Arquivos alterados
2. Migrations, se aprovadas
3. APIs/telas/componentes criados
4. Evidências de build/testes
5. Bloqueios e pendências
6. Documentos .md atualizados
7. Master.Package.Apex.original sincronizado

Critérios de aceite:
- npm run build OK
- evidências reais quando possível
- docs atualizados
- status e roadmap atualizados
```

## Validation handoff
For validation-only packages, explicitly say: `não implementar novas features`.

## Implementation handoff
For implementation packages, name exactly the package and its approved plan document.

## If Codex has no credits
Produce a Claude handoff using `handoff-claude.md`, not a new architecture.
