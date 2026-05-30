# PACOTE DE ORGANIZACAO E GOVERNANCA — APEX GLOBAL

Data de consolidacao: 2026-05-29
Workspace oficial: `D:\AI-constr\AI-Construction-Intelligence-Platform`

## Objetivo

Consolidar definitivamente a estrutura documental, organizacional e de arquivos da plataforma, mantendo governanca, rastreabilidade e continuidade operacional.

## REGRA 001 — WORKSPACE OFICIAL

Workspace unico autorizado:

- `D:\AI-constr\AI-Construction-Intelligence-Platform`

Proibido:

- criar clones paralelos
- criar copias do repositorio
- criar versoes alternativas
- criar workspaces fora do caminho oficial

Toda evolucao deve ocorrer por:

- Branch -> Merge -> Repositorio Oficial

## REGRA 002 — DOCUMENTACAO OBRIGATORIA

Nenhuma sprint pode ser encerrada sem:

1. atualizacao dos `.md` existentes
2. criacao dos `.md` necessarios
3. atualizacao dos indices
4. atualizacao do status geral
5. registro das decisoes
6. registro das pendencias
7. registro dos proximos passos

Codigo sem documentacao atualizada e considerado incompleto.

## REGRA 003 — KNOWLEDGE FIRST

Antes de encerrar qualquer etapa:

- codigo atualizado
- banco atualizado
- documentacao atualizada
- status atualizado

Se qualquer item faltar: sprint nao encerrada.

## REGRA 004 — NAO DUPLICACAO

Antes de criar:

- tela
- API
- tabela
- agente
- workflow

Verificar: "ja existe algo semelhante?"

Se existir:

- expandir
- integrar
- reaproveitar

Nunca duplicar.

## Estrutura Documental Oficial (docs/)

Manter atualizados:

- `docs/PACOTE_MASTER_STATUS_GERAL.md`
- `docs/PACOTE_MASTER_001_FOUNDATION_CORE_PLATFORM.md`
- `docs/PACOTE_MASTER_001_A_HARDENING_VALIDATION.md`
- `docs/PACOTE_MASTER_001_B_ENV_STORAGE_FINAL_VALIDATION.md`
- `docs/PACOTE_MASTER_002_INDEX.md`
- `docs/PACOTE_MASTER_002_FASE1_AUDITORIA_CAPACIDADES.md`
- `docs/PACOTE_MASTER_002_A_SCHEMA_FINAL.md`
- `docs/APEX_GLOBAL_MASTER_PLAN.md`
- `docs/IA_CONSTRUCTION_PLATFORM_ARCHITECTURE.md`
- `docs/ROADMAP_OFICIAL.md`
- `docs/CODEX_POLICY.md`

## Repositorio Documental Mestre

Manter copia organizada em:

- `D:\AI-constr\AI-Construction-Intelligence-Platform\Master.Package.Apex.original`

Estrutura:

- `00_INDEX`
- `01_MASTER_001`
- `02_MASTER_002`
- `03_GOVERNANCA`
- `04_ARQUITETURA_E_ROADMAP`

Sempre atualizar esta pasta quando documentos oficiais forem alterados.

## Arquivos Externos ao Projeto

Itens fora do workspace oficial foram classificados como:

- acervo estrategico
- referencia
- prototipos
- historico

Diretriz:

- nao apagar
- nao considerar baseline ativo do produto

## Logs Temporarios

- `install-err.txt`
- `install-out.txt`
- `install-pid.txt`

Classificacao:

- logs operacionais

Diretriz:

- nao fazem parte do produto
- preservar apenas para troubleshooting

## Proxima Prioridade Oficial

PACOTE MASTER 002-C (apos auditoria executiva do 002-B)

Entregaveis obrigatorios:

- implementar somente o que foi aprovado no plano `002-B`
- manter trilha documental e status atualizado por etapa
- validar aderencia as regras 001-004 antes de encerrar sprint

Fluxo obrigatorio:

- Planejar -> Documentar -> Aprovar -> Implementar -> Documentar novamente
