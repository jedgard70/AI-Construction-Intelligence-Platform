# AUDITORIA FILA GITHUB RESTANTE

Data: 2026-06-01  
Base auditada: `origin/main` atualizado

## A) Confirmacao STORAGE-2 em main

Hash em `origin/main`:
- `16441fd07014fa0e10a63e0bc07803283e52fcb6`

Ultimas 3 entradas do log:
1. `16441fd feat: add secure Storage APIs (#50)`
2. `84a3f66 feat: implement Storage foundation (#49)`
3. `e08f8bb Feature/storage foundation (#48)`

Presenca de arquivos esperados:
- `pages/api/storage/upload.ts` ✅
- `pages/api/storage/signed-url.ts` ✅
- `pages/api/storage/project-files.ts` ✅
- `lib/storage-access.ts` ✅
- `docs/PR_STORAGE_2_APIS.md` ✅

## B) Auditoria PR #21

PR:
- `#21` — `Vercel/react server components CVE vu 7445pg`
- Branch origem: `vercel/react-server-components-cve-vu-7445pg`
- Arquivos alterados: `package.json`, `package-lock.json`

Dependencias afetadas no PR:
- `next`
- `react`
- `react-dom`
- lockfile relacionado

Observacao critica:
- O PR #21 nao faz patch minimalista; ele altera baseline de dependencias para stack antiga (`next 15.3.8`, `react 18.x`) enquanto `main` atual esta em `next 16.2.6` e `react 19.x`.
- Isso caracteriza alto risco de regressao e nao atende governanca atual de correcao minima de seguranca.

CVE citada ainda aplicavel?
- Nao comprovada neste ciclo por scanner dedicado.
- Pelo estado atual de `main` (versoes mais novas), o PR legado nao e o caminho seguro.

Main ja resolveu?
- `main` ja divergiu para stack mais recente; PR #21 tornou-se obsoleto como proposta de fix.

Risco de merge direto:
- Alto (downgrade implícito/alteracao ampla de dependencias).

Plano de reaproveitamento:
- Nao reaproveitar PR #21 diretamente.
- Se houver alerta de seguranca real, abrir PR novo minimo dedicado (`package.json`/`package-lock.json`) baseado no estado atual de `main`, com scanner + build.

Recomendacao:
- **Fechar PR #21 como obsoleto** com comentario tecnico e sem merge.

## C) Auditoria issue aberta

Issue aberta encontrada:
- `#22` — `Implantação final: consolidar Supabase, Vercel, módulos reais e limpeza do projeto`

Analise:
- Conteudo macro e abrangente, sem recorte executavel unico.
- Parte relevante ja foi desdobrada e executada por PRs posteriores (Storage-1, Storage-2, governanca e hardening).
- No formato atual, a issue fica melhor como historico/epico encerrado.

Recomendacao:
- **Fechar issue #22** com comentario apontando que os blocos foram migrados para pacotes/PRs especificos e que novos itens devem abrir issues menores por escopo.

## D) Tabela consolidada

| ITEM | TIPO | STATUS | RISCO | RECOMENDACAO | ACAO |
|---|---|---|---|---|---|
| #21 | PR | Aberto (na auditoria) | Alto se merge direto | Fechar como obsoleto; nao mergear | Comentar motivo + fechar |
| #22 | Issue | Aberta (na auditoria) | Medio (fila difusa) | Fechar como epico legado | Comentar motivo + fechar |

## E/F) Execucao de limpeza

Status de execucao remota:
- Dependente de autenticacao `gh` valida neste ambiente para comentar/fechar.
- Comentarios sugeridos prontos abaixo.

Comentario sugerido para PR #21:

"Fechando este PR legado de seguranca por obsolescencia em relacao ao estado atual de main. O diff altera baseline de dependencias de forma ampla e nao representa uma correcao minima segura no contexto atual. Se houver vulnerabilidade real remanescente, ela sera tratada em PR novo minimo, com scanner, build e escopo estrito em dependencias."

Comentario sugerido para issue #22:

"Fechando esta issue macro porque o conteudo foi desdobrado em pacotes/PRs especificos ao longo dos ciclos recentes (incluindo Storage-1 e Storage-2). Para continuidade, abrir issues menores com escopo unico, criterio de aceite e rastreabilidade por PR."

## G) Security real

- Nao identificado sinal conclusivo de vulnerabilidade ativa que exija acao emergencial neste instante com base apenas no PR #21 legado.
- Nao foi criado plano `SECURITY_MINIMAL_FIX_PLAN.md` nesta etapa porque gatilho de seguranca real nao foi comprovado.

## Conclusao

- STORAGE-2 confirmado em `main`.
- PR #21: recomendado fechar como obsoleto (sem merge).
- Issue #22: recomendada fechar como epico legado.
- Proxima acao segura: executar fechamento com comentario registrado via GitHub autenticado.
