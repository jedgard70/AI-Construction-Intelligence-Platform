# Auditoria final de implementacao

Data: 2026-05-25
Branch local: `codex/final-implementation-audit`
Issue de referencia: #22

## Escopo

Auditoria documental inicial para consolidacao final do projeto, sem commit direto em `main`, sem merge e sem migrations.

## PRs analisados

- #21: nao mesclar como esta; branch defasada, `mergeable=false` e deploy Vercel com erro.
- #20: aproveitar apenas partes revisadas; risco de reintroduzir `localStorage` como persistencia principal.
- #14: nao mesclar integralmente; draft antigo, persistencia local e alteracao sensivel de RLS.
- #3: obsoleto para merge direto; escopo amplo e retorno a modo demo/bypass.

## Estado local observado

Alteracoes locais nao commitadas existem na branch de trabalho e devem ser revisadas antes de qualquer commit.

Pontos de atencao:

- preservar Supabase real como fonte principal;
- validar schema real de `clients`, `projects`, `quality_nci`/`ncis`;
- definir governanca global de idioma, jurisdicao e contexto normativo;
- nao incluir scripts SQL sem revisao explicita;
- validar `package.json` e lockfile antes de ajustes de dependencias;
- remover duplicatas somente apos busca de imports e build verde.

## Auditoria do Supabase real

Achados confirmados por metadados de leitura do projeto Supabase real `stjhkxwylqtihzflspqe`:

- o Supabase real usa a tabela `quality_nci`; a tabela `ncis` nao aparece no schema `public`;
- `projects.owner_id` existe, referencia `profiles.id`, mas e nullable;
- `projects.created_by` e obrigatorio (`NOT NULL`) e referencia `auth.users.id`;
- `projects.type` usa enum `project_type`, com valores controlados como `edificacao_residencial`, `edificacao_comercial`, `infraestrutura_viaria`, `infraestrutura_hidrica`, `industrial` e `outro`;
- `NewProjectModal.tsx` esta incompatvel com o banco real porque envia labels de UI em `type` e nao envia `created_by`;
- `pages/qualidade.tsx` deve trocar a consulta de `ncis` para `quality_nci` e mapear os campos reais da tabela;
- `NewClientModal.tsx` ainda precisa confirmacao das colunas reais de `clients` antes de qualquer ajuste tecnico;
- nao executar SQL, migration ou alteracao destrutiva para resolver esses pontos sem nova revisao.
## Plano tecnico seguro

- Corrigir `pages/qualidade.tsx`: trocar a consulta de `ncis` para `quality_nci` e mapear os campos reais da tabela para a UI atual.
- Corrigir `NewProjectModal.tsx`: mapear o `type` selecionado na UI para o enum real `project_type` do Supabase.
- Garantir `created_by` obrigatorio usando o usuario autenticado via `sb.auth.getUser()`, sem hardcode e sem service role no client.
- Nao alterar `NewClientModal.tsx` ate confirmar as colunas reais de `clients` no Supabase.
- Manter a regra `Localization & Regulatory Governance`: `pt-BR` = portugues brasileiro + regras brasileiras; `pt-PT` = portugues europeu + regras portuguesas/europeias; `en-US` = ingles + regras americanas.
## Localization & Regulatory Governance

A plataforma deve processar resultados conforme idioma e jurisdicao declarados ou inferidos. Agentes, relatorios, contratos, compliance, engenharia, orcamento e referencias tecnicas nao devem misturar normas brasileiras, portuguesas/europeias e americanas no mesmo resultado, salvo quando a comparacao entre jurisdicoes for explicitamente solicitada.

Contextos obrigatorios:

- `pt-BR`: portugues brasileiro + regras brasileiras; normas e referencias do Brasil; contexto tecnico de engenharia, obras, orcamento, contratos e compliance brasileiros.
- `pt-PT`: portugues europeu + regras portuguesas/europeias; normas e referencias de Portugal e Uniao Europeia; contexto tecnico de engenharia, construcao, contratacao, compliance e regulacao europeia/portuguesa.
- `en-US`: ingles + regras americanas; normas e referencias dos Estados Unidos; contexto tecnico de construction, permitting, contracts, compliance and engineering standards americanos.

## Proposta tecnica de implementacao

Modelo de dados proposto, sem migration neste ciclo:

- adicionar campo `locale` nos dominios relevantes, por exemplo usuario, projeto, documento, contrato, relatorio e tarefa de agente;
- adicionar campo `jurisdiction` separado de `locale`, para permitir idioma e jurisdicao distintos quando necessario;
- criar tabela ou enum `regulatory_context` para mapear combinacoes permitidas de idioma, jurisdicao, normas, terminologia e fontes oficiais;
- usar valores iniciais controlados: `pt-BR/BR`, `pt-PT/PT_EU`, `en-US/US`;
- manter defaults explicitos e auditaveis, evitando inferencia silenciosa em fluxos sensiveis.

Middleware e inferencia:

- inferir `locale` a partir de perfil do usuario, configuracao do projeto, navegador e rota;
- inferir `jurisdiction` a partir de projeto, endereco, pais, contrato ou configuracao organizacional;
- exigir confirmacao quando idioma e jurisdicao conflitarem ou quando o dado de origem for ambiguo;
- propagar `locale`, `jurisdiction` e `regulatory_context` para APIs, agentes e geracao de documentos.

Camada de prompt e agentes:

- injetar o contexto regulatorio no system/developer prompt dos agentes;
- selecionar normas, unidades, terminologia, formatos de data/moeda e exemplos conforme `regulatory_context`;
- registrar no output qual contexto normativo foi usado quando o resultado tiver impacto tecnico, juridico, financeiro ou de compliance;
- bloquear respostas que misturem referencias de BR, PT/EU e US sem pedido explicito de comparacao.

Validacao e seguranca:

- validar entradas para impedir combinacoes nao suportadas de `locale` e `jurisdiction`;
- adicionar testes de prompt para garantir que `pt-BR` nao cite normas portuguesas/europeias ou americanas por engano;
- adicionar testes para garantir que `pt-PT` use portugues europeu e referencias PT/EU;
- adicionar testes para garantir que `en-US` use ingles e referencias americanas;
- exigir revisao humana para fluxos contratuais, compliance e normas tecnicas antes de qualquer automacao decisoria.

## Proximos passos seguros

1. Revisar diffs locais.
2. Separar mudancas seguras de mudancas arriscadas.
3. Rodar build/lint antes de qualquer PR tecnico.
4. Nao executar migrations neste ciclo.
5. Documentar e revisar o modelo `locale`/`jurisdiction`/`regulatory_context` antes de qualquer alteracao de schema.
6. Implementar primeiro a camada de prompt/contexto e validacoes nao destrutivas.
7. Planejar migrations apenas apos confirmacao do schema real Supabase e revisao de RLS.
