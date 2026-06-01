# AUDITORIA DE PRs ANTIGOS — GITHUB

Base auditada: `origin/main` (repositório `jedgard70/AI-Construction-Intelligence-Platform`)  
Data: 2026-06-01

PRs auditados:
- #21 — Vercel/react server components CVE vu 7445pg
- #20 — Studio 3D: rewrite plantas.js with complete 5-tab visualizer
- #14 — feat(etapa-2): real data persistence for RDO, Qualidade and Orçamento
- #3 — feat: dashboard v6.0 — all modules + contract templates + plant analysis

## Tabela executiva

| PR | TÍTULO | STATUS | CONTEÚDO ÚTIL | RISCO | RECOMENDAÇÃO | AÇÃO SUGERIDA |
|---|---|---|---|---|---|---|
| #21 | Vercel/react server components CVE vu 7445pg | Aberto antigo | Baixo/Condicional (update de dependências) | Alto (upgrade cego de `package.json`/`package-lock`) | Não mergear como está | Extrair correção CVE em PR novo mínimo, com scanner e teste |
| #20 | Studio 3D: rewrite plantas.js with complete 5-tab visualizer | Aberto antigo | Parcial (alguns artefatos/documentos históricos) | Alto (mistura massiva: docs, patches, revenue legado, package lock, APIs) | Fechar PR legado | Reaproveitar apenas itens específicos em PRs limpos por pacote |
| #14 | feat(etapa-2): real data persistence for RDO, Qualidade and Orçamento | Aberto antigo | Parcial (alguns componentes/ideias) | Muito alto (altera dezenas de áreas, remove/move arquivos, inclui pasta indevida) | Fechar PR legado | Se necessário, recuperar trechos pontuais por arquivo em branch limpa |
| #3 | feat: dashboard v6.0 — all modules + contract templates + plant analysis | Aberto antigo | Baixo/Parcial (alguns ajustes antigos de páginas/APIs) | Alto (base antiga `.js`, drift com arquitetura atual, package/config antigos) | Fechar PR legado | Reaproveitar somente snippets úteis após auditoria técnica pontual |

## Detalhamento por PR

### PR #21
1. Branch origem (ref GitHub): `refs/pull/21/head` (auditado localmente como `pr-21`)
2. Arquivos alterados:
- `package.json`
- `package-lock.json`
3. Conflito com main atual:
- Conflito textual automático não detectado;
- risco semântico alto por atualização não contextualizada.
4. Código útil:
- potencialmente útil somente se realmente corrigir CVE específico.
5. Docs úteis:
- não há docs.
6. Obsolescência:
- parcialmente obsoleto (sem evidência de validação no contexto atual).
7. Substituído por main:
- não substituído diretamente, mas pipeline atual exige validação mais rigorosa.
8. Risco de merge:
- alto (quebra indireta de dependências/build).
9. Recomendação:
- **não mergear**; abrir PR novo mínimo de segurança com escopo preciso.

### PR #20
1. Branch origem (ref GitHub): `refs/pull/20/head` (`pr-20`)
2. Arquivos alterados:
- grande conjunto heterogêneo: docs, patches, revenue, páginas, APIs, package lock, scripts `.claude`, etc.
3. Conflito com main atual:
- sem conflito textual imediato, mas alta divergência de intenção e escopo.
4. Código útil:
- pode haver utilidade pontual em `plantas.js`/alguns componentes.
5. Docs úteis:
- há docs históricas, porém muitas já foram substituídas por fluxo atual de governança.
6. Obsolescência:
- alta (PR agrega múltiplos temas já tratados em pacotes posteriores).
7. Substituído por main:
- boa parte (especialmente revenue/governança) já entrou em `main` por PRs mais novos.
8. Risco de merge:
- alto (reintrodução de legado e drift de escopo).
9. Recomendação:
- **fechar PR** e recuperar apenas partes úteis em PRs segmentados.

### PR #14
1. Branch origem (ref GitHub): `refs/pull/14/head` (`pr-14`)
2. Arquivos alterados:
- mudanças extensas em componentes, páginas, APIs, package files, wasm, e deleções de arquivos; inclui artefato indevido `ai-construction-intelligence-platform`.
3. Conflito com main atual:
- sem conflito textual automático, porém conflito arquitetural forte.
4. Código útil:
- possível utilidade parcial em componentes específicos.
5. Docs úteis:
- praticamente não orientado à governança atual.
6. Obsolescência:
- muito alta.
7. Substituído por main:
- várias frentes já evoluíram por PRs recentes e arquitetura atual.
8. Risco de merge:
- muito alto.
9. Recomendação:
- **fechar PR** e reaproveitar apenas recortes bem delimitados, se necessário.

### PR #3
1. Branch origem (ref GitHub): `refs/pull/3/head` (`pr-3`)
2. Arquivos alterados:
- páginas/API/config antigas, scripts setup, ajustes de login/plantas.
3. Conflito com main atual:
- sem conflito textual automático, com alto risco de regressão funcional/tecnológica.
4. Código útil:
- baixo; pode haver ideias reaproveitáveis, não código pronto.
5. Docs úteis:
- não relevante para baseline atual.
6. Obsolescência:
- alta (PR muito antigo versus stack atual).
7. Substituído por main:
- em grande parte, sim.
8. Risco de merge:
- alto.
9. Recomendação:
- **fechar PR**; eventual reaproveitamento apenas por cherry-pick manual de trechos.

## Plano de recuperação limpa (quando houver conteúdo útil)

1. Não reaproveitar PR legado inteiro.
2. Criar branch limpa por tema:
- `feature/recover-cve-deps-minimal` (se #21 confirmar CVE real);
- `feature/recover-plantas-ui-targeted` (se #20 tiver ganho real de UX);
- `feature/recover-rdo-qualidade-targeted` (se #14 tiver algo aproveitável).
3. Para cada branch de recuperação:
- selecionar arquivos pontuais;
- ajustar para arquitetura atual;
- rodar build/testes;
- abrir PR com escopo estrito e relatório.

## Priorização de risco

1. **Segurança** (PR #21): tratar primeiro, mas em PR novo mínimo e auditável.
2. **Legado massivo** (PR #14/#20): não mergear; recuperar somente trechos de valor.
3. **PR muito antigo** (PR #3): encerrar para reduzir passivo.

## Conclusão operacional

- PRs recomendados para **fechar**: #20, #14, #3.
- PR para **reaproveitar parcialmente**: #21 (apenas se CVE comprovada) + trechos pontuais de #20/#14.
- PRs para **revisão manual adicional**: #21 (validação de CVE e impacto de dependências).
- Próxima ação segura:
  1. abrir issue/mini-plano de recuperação por PR antigo;
  2. fechar #20/#14/#3 com motivo registrado;
  3. iniciar PR novo mínimo para CVE (#21) com scanner + validação de build.

## Execução de limpeza da fila

Status desta execução:
- Documentação de limpeza preparada.
- Comentário padrão de fechamento definido.
- Fechamento remoto dos PRs bloqueado neste ambiente por ausência de autenticação GitHub CLI.

PRs alvo para fechamento controlado (sem merge):

1. PR #20 — Studio 3D: rewrite plantas.js with complete 5-tab visualizer
- Motivo: obsoleto em relação ao estado atual de `main` e governança vigente; escopo misto e alto risco de regressão.
- Conteúdo útil potencial: parcial (trechos visuais/técnicos), somente por recuperação limpa em branch nova.
- Risco evitado: merge direto de legado heterogêneo com drift arquitetural.

2. PR #14 — feat(etapa-2): real data persistence for RDO, Qualidade and Orçamento
- Motivo: obsoleto e de alto risco, com volume de mudanças amplo e divergente da linha atual.
- Conteúdo útil potencial: parcial, apenas por extração pontual auditada.
- Risco evitado: regressão funcional e conflito de estrutura em módulos centrais.

3. PR #3 — feat: dashboard v6.0 — all modules + contract templates + plant analysis
- Motivo: PR antigo com baseline desatualizada frente ao `main` atual.
- Conteúdo útil potencial: baixo/parcial (ideias ou snippets), sem aproveitamento direto.
- Risco evitado: reintrodução de padrões antigos e quebra de compatibilidade.

PR mantido aberto nesta etapa:
- PR #21 — segurança/CVE: **não fechar ainda**; seguir plano específico em `docs/PR21_SECURITY_CVE_RECOVERY_PLAN.md`.

Comentário padrão a ser publicado em cada PR (#20/#14/#3) antes de fechar:

\"Fechando este PR antigo por estar obsoleto em relação ao estado atual de main e à nova governança do projeto. O conteúdo útil será reaproveitado apenas por recuperação limpa, em branches novas, com escopo reduzido, auditoria e build. Nenhum merge direto será feito para evitar conflitos e regressões.\"
