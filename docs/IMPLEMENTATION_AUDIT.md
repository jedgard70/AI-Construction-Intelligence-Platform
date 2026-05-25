# Auditoria final de implementacao

Data: 2026-05-25
Branch: `codex/final-implementation-audit`
Base analisada: `main` em `63a7e959324ec94da3a2c83b952bbeaceed9e6e3`
Issue de referencia: #22

## Escopo desta alteracao

Este PR e intencionalmente conservador. Ele entrega auditoria e documentacao para orientar a consolidacao final sem alterar `main`, sem aplicar migrations, sem remover arquivos e sem reintroduzir `localStorage`/demo como fonte principal de dados.

Nao foram expostas chaves, tokens ou segredos. Nenhuma migration destrutiva foi criada ou sugerida como acao automatica.

## Resumo executivo

A base atual em `main` ja declara Next.js 16, React 19, Supabase real e Vercel como alvo de deploy. O relatorio `PLATFORM_STATUS_REPORT.md` indica que Auth/Login, Dashboard, Vendas, Qualidade e BIM-Ops ja foram conectados ao Supabase real.

Os PRs abertos revisados antes desta alteracao foram #21, #20, #14 e #3. A recomendacao principal e nao mesclar nenhum deles automaticamente antes de uma reconciliacao manual, porque todos apresentam algum risco de conflito, regressao de arquitetura ou retorno de persistencia local/demo em areas que a Issue #22 pede para preservar como Supabase real.

## Avaliacao do PR #21 - Vercel / React Server Components CVE

Status observado:

- PR aberto, nao draft.
- `mergeable: false`.
- Deploy Vercel reportado como `Error` em 2026-05-22.
- Altera `next` de `15.3.2` para `15.3.8` no diff do PR.
- Tambem altera `@supabase/ssr` de `^0.10.3` para `^0.5.2` e muda `engines.node`.
- Base atual de `main` ja mostra `next: ^16.2.6`, `react: ^19.0.0` e `react-dom: ^19.0.0` em `package.json`.

Conclusao:

Nao recomendo mesclar o PR #21 primeiro no estado atual. Embora o objetivo de seguranca seja correto, o diff do PR esta defasado em relacao ao `main` atual e parece fazer downgrade pratico da linha Next 16 para Next 15.3.8. Como `main` ja declara Next 16, o caminho seguro e fechar/substituir o PR #21 por uma verificacao dedicada de lockfile/build, garantindo que `package.json` e `package-lock.json` apontem para uma versao de Next ja corrigida, sem alterar Supabase ou React por efeito colateral.

Acao recomendada:

1. Confirmar a versao efetivamente instalada no lockfile usado pela Vercel.
2. Regenerar `package-lock.json` em branch limpa com `npm install`/`npm ci` controlado.
3. Abrir PR separado apenas para seguranca de dependencias se ainda houver pacote vulneravel.
4. Nao mesclar #21 enquanto `mergeable=false` e deploy estiver falhando.

## Avaliacao do PR #20 - Studio 3D / plantas

Status observado:

- PR draft.
- `mergeable: false`.
- Deploy Vercel inicialmente falhou por cron acima do limite Hobby, depois houve comentario Vercel `Ready` em 2026-05-25.
- Reescreve `/pages/plantas.js` e adiciona `/api/render.js` com Gemini.
- Inclui hook `.claude/hooks/session-start.sh` que executa `npm install` e inicia servidor em ambiente Claude remoto.
- Altera `components/NewClientModal.tsx` para sempre salvar em `localStorage`, mesmo quando Supabase falha.

Conclusao:

O PR #20 tem partes aproveitaveis na experiencia de Studio 3D, mas nao deve ser mesclado integralmente. O ponto de maior risco para a Issue #22 e a mudanca em `NewClientModal.tsx`, que torna `localStorage` persistencia permanente e silenciosa. Isso conflita com a diretriz de manter Supabase real como fonte principal. Os hooks de ambiente remoto tambem nao pertencem ao runtime/produto sem revisao.

Acao recomendada:

- Separar apenas a melhoria visual de `/plantas` em PR novo.
- Remover persistencia primaria em `localStorage` de clientes.
- Manter fallback local apenas como estado temporario de UI, nunca como fonte canonical.
- Revisar variaveis de Gemini antes de ativar `/api/render.js` em producao.

## Avaliacao do PR #14 - RDO, Qualidade e Orcamento

Status observado:

- PR draft.
- `mergeable: false`.
- Deploy Vercel `Ready` em 2026-05-25.
- Base antiga em `588382e...`, anterior ao `main` atual.
- Introduz persistencia em `localStorage` para RDO e NCIs.
- Apaga/reestrutura arquivos sensiveis em `components`, `lib/supabase.ts` e hooks de auth no diff exibido.
- Inclui alteracao SQL em `current_role_acip()` com `row_security = off`.

Conclusao:

Nao deve ser mesclado como esta. Algumas ideias funcionais de UI podem ser reaproveitadas, mas a persistencia local para RDO/Qualidade conflita com a consolidacao Supabase real. A alteracao de RLS/security definer precisa de revisao especifica e nao deve entrar em PR de auditoria ou limpeza.

Acao recomendada:

- Fechar ou manter como referencia historica.
- Reimplementar RDO/Qualidade diretamente contra tabelas reais (`rdos`, `quality_nci` ou tabela confirmada) em PR novo.
- Nao aplicar SQL de bypass RLS sem revisao de seguranca e teste isolado.

## Avaliacao do PR #3 - Dashboard v6 / modulos / templates

Status observado:

- PR draft.
- `mergeable: false`.
- Base muito antiga em `7c505e...`.
- Adiciona muitos modulos, templates, paginas juridicas e design system.
- Altera `next.config.js` para redirecionar `/login` para `/dashboard.html` quando Supabase nao esta configurado.
- Atualiza `.env.example` tratando Supabase como opcional e plataforma em modo demo.

Conclusao:

Obsoleto para mescla direta. Ele contem material reaproveitavel de UX e templates, mas tambem reintroduz modo demo como caminho principal quando Supabase esta ausente. Isso contradiz o estado atual descrito na Issue #22 e no status report.

Acao recomendada:

- Nao mesclar #3.
- Extrair templates juridicos e melhorias de parsing de IA, se ainda forem necessarios, em PRs menores.
- Nao restaurar bypass de login nem redirecionamento para dashboard demo.

## Arquitetura observada

Com base nos arquivos atuais acessados pelo conector GitHub:

- O projeto usa Pages Router (`pages/*`) como roteamento principal.
- Foram identificadas rotas de pagina para `login`, `dashboard`, `vendas`, `qualidade`, `bim-ops`, `orcamento`, `rdo`, `projeto/[id]` e `cliente/[id]` no status report.
- `lib/supabase.ts` usa `createBrowserClient` de `@supabase/ssr` e retorna `null` quando as variaveis publicas nao existem.
- `next.config.js` ainda contem `typescript: { ignoreBuildErrors: true }`, o que mascara erros de TypeScript em build.
- `package.json` declara React 19, mas `@types/react` e `@types/react-dom` ainda estao em `^18`.
- `package-lock.json` observado nao esta consistente com `package.json`: ele lista dependencias raiz diferentes, incluindo React 18 e varias versoes divergentes. Isso precisa ser tratado antes de qualquer ajuste de dependencias.

## Supabase real e tabelas

A Issue #22 pede atencao especial para nao reintroduzir `localStorage`/demo como fonte principal. A base atual parece caminhar nessa direcao, mas ha um ponto de nomenclatura a resolver:

- A Issue #22 lista `quality_nci` como tabela esperada.
- `PLATFORM_STATUS_REPORT.md` e `pages/qualidade.tsx` atuais usam `ncis`.
- O status report tambem sugere criar `ncis` se necessario.

Recomendacao:

Antes de criar migration, confirmar no Supabase real qual tabela existe e qual sera canonical. Se `quality_nci` for o schema correto, ajustar a aplicacao para ler `quality_nci`. Se `ncis` ja estiver em producao com dados, documentar a decisao e evitar criar tabela duplicada.

## Vercel e build

Riscos atuais:

- `typescript.ignoreBuildErrors = true` em `next.config.js` permite deploy mesmo com erros de tipo.
- `package-lock.json` parece desatualizado em relacao ao `package.json`, o que pode gerar build diferente entre local, Vercel e instalacoes futuras.
- PR #21 tem deploy Vercel com erro e nao deve ser usado como comprovacao de correcao de seguranca.
- PRs draft #20, #14 e #3 tiveram previews Vercel `Ready`, mas isso nao valida aderencia a Supabase real nem ausencia de regressao funcional.

Recomendacao segura:

1. Regenerar lockfile em branch dedicada.
2. Rodar `npm ci`, `npm run build` e, se aplicavel, `npm run lint`.
3. Corrigir erros TypeScript reais.
4. So depois remover `ignoreBuildErrors` ou transformar isso em meta de PR separado.

## Duplicatas apontadas

A Issue #22 pede avaliar:

- `components/HelpButton.js`
- `components/LoginClient.js`
- `components/NewClientModal.js`
- `components/NewProjectModal.js`
- `components/PrintShareModal.js`
- `components/OrcamentoClient_backup.tsx`

Nao removi esses arquivos neste PR porque a validacao segura exige busca completa de imports e build local. A diretriz recomendada e:

1. Confirmar que existe equivalente `.tsx` ativo.
2. Confirmar que nenhum arquivo importa a versao `.js` ou `_backup.tsx`.
3. Remover em PR pequeno, com build passando.

## Rota tecnica `/admin/status`

Nao foi encontrada rota tecnica confirmada nos caminhos verificados (`pages/admin/status.tsx`, `pages/api/admin/status.ts`, `pages/api/agents/tasks.ts`). A criacao dessa rota e util, mas deve ser protegida por sessao/role antes de expor contagens de tabelas reais.

Requisitos minimos recomendados:

- exigir usuario autenticado;
- limitar a admin/diretor executivo;
- contar `projects`, `clients`, `documents`, `agent_tasks`, `prompt_versions`;
- exibir ultimo erro conhecido sem vazar stack trace sensivel;
- nunca retornar env vars ou secrets.

## Runtime minimo de agentes

A Issue #22 pede listar/criar `agent_tasks`, registrar resultado basico e listar `agent_events`. Como nao validei schema real via Supabase nesta auditoria, a recomendacao e criar isso em PR separado com contrato explicito:

- `GET /api/agents/tasks` lista tarefas do usuario/empresa.
- `POST /api/agents/tasks` cria tarefa com status inicial `queued`.
- `POST /api/agents/tasks/[id]/result` registra resultado e evento.
- `GET /api/agents/events` lista eventos recentes.

Sem schema confirmado, evitar migration destrutiva ou endpoint que assuma colunas inexistentes.

## Variaveis esperadas

Documentar no Vercel sem valores reais:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` como alias legado, se ainda necessario
- `ANTHROPIC_API_KEY`

Nao incluir valores de chaves em arquivos versionados.

## Testes e validacao

Nao rodei build/lint local porque o terminal desta sessao nao conseguiu iniciar no workspace informado pelo ambiente. A auditoria acima foi feita pelo conector GitHub, lendo a Issue #22, comentarios, PRs #21/#20/#14/#3 e arquivos relevantes da branch `main`.

Validacao recomendada para o proximo PR tecnico:

```bash
npm ci
npm run build
npm run lint
```

Se `npm ci` falhar por lockfile divergente, a primeira correcao deve ser regenerar `package-lock.json` a partir do `package.json` atual.

## Decisao recomendada sobre os PRs abertos

| PR | Decisao | Motivo |
| --- | --- | --- |
| #21 | Nao mesclar como esta | Defasado frente ao Next 16 em `main`, `mergeable=false`, deploy Vercel com erro |
| #20 | Nao mesclar integralmente | UX aproveitavel, mas reintroduz `localStorage` para clientes e inclui hooks de ambiente remoto |
| #14 | Nao mesclar integralmente | Draft antigo, persistencia local para RDO/NCIs e alteracao sensivel de RLS |
| #3 | Nao mesclar | Muito antigo, amplo demais e reintroduz modo demo/bypass de login |

## Proximos passos seguros

1. Criar PR separado para lockfile/dependencias: alinhar React 19, `@types/react` 19, `@types/react-dom` 19 e Next corrigido.
2. Confirmar tabela canonical de qualidade: `quality_nci` versus `ncis`.
3. Criar `/admin/status` protegido e somente leitura.
4. Criar runtime minimo de agentes em cima de schema confirmado.
5. Remover duplicatas somente apos busca de imports e build verde.
6. Fechar ou substituir PRs drafts obsoletos por PRs pequenos e focados.
