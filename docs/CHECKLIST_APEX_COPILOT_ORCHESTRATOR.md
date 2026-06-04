# Checklist - Apex Copilot Orchestrator

Data: 04/06/2026
Status: checklist operacional

## Escopo Deste Checkpoint

- [x] Criar plano do Apex Copilot Orchestrator.
- [x] Criar roteador de motores Codex/Claude/Qwen/Copilot.
- [x] Criar fluxo de checkpoints.
- [x] Criar checklist operacional.
- [x] Nao implementar codigo.
- [x] Nao alterar Mission Control ainda.
- [x] Nao alterar Supabase.
- [x] Nao alterar package files.
- [x] Nao mexer no website publico.

## Checklist Para A Apex Copilot

### Criacao Do Checkpoint

- [ ] Criar ID unico do checkpoint.
- [ ] Declarar objetivo verificavel.
- [ ] Declarar Owner/responsavel.
- [ ] Declarar status inicial.
- [ ] Registrar data.

### Definicao De Escopo

- [ ] Listar arquivos permitidos.
- [ ] Listar arquivos proibidos.
- [ ] Confirmar se ha migrations.
- [ ] Confirmar se ha login/auth.
- [ ] Confirmar se ha website publico.
- [ ] Confirmar se ha package files.
- [ ] Confirmar se ha risco de secrets.

### Escolha De Motor

- [ ] Aplicar `APEX_COPILOT_ENGINE_ROUTER.md`.
- [ ] Declarar motor escolhido.
- [ ] Declarar motivo.
- [ ] Declarar motor auxiliar quando aplicavel.
- [ ] Registrar gates obrigatorios.

### Handoff

- [ ] Gerar handoff copy-paste-ready.
- [ ] Incluir contexto.
- [ ] Incluir objetivo.
- [ ] Incluir escopo permitido.
- [ ] Incluir proibicoes.
- [ ] Incluir criterios de aceite.
- [ ] Incluir validacoes obrigatorias.
- [ ] Exigir relatorio final.

### PR

- [ ] Registrar branch.
- [ ] Registrar PR.
- [ ] Listar arquivos alterados.
- [ ] Confirmar que nao ha arquivos fora do escopo.
- [ ] Confirmar draft/ready.
- [ ] Registrar decisao de merge.

### Build

- [ ] Rodar build local quando aplicavel.
- [ ] Registrar resultado.
- [ ] Separar falha nova de falha pre-existente.
- [ ] Nao declarar 100% com build falhando.

### GitHub Actions

- [ ] Listar checks reais.
- [ ] Registrar check falho, skipped ou pending.
- [ ] Capturar erro real quando houver.
- [ ] Aguardar checks obrigatorios.

### Vercel

- [ ] Registrar status Vercel.
- [ ] Registrar preview URL quando existir.
- [ ] Bloquear merge se Vercel falhar em mudanca frontend/API.
- [ ] Declarar N/A apenas quando justificavel.

### Supabase

- [ ] Confirmar se ha migration.
- [ ] Confirmar se Supabase Preview rodou.
- [ ] Registrar PASS/FAIL/SKIPPED/CANCELLED.
- [ ] Nao executar `supabase db push` sem autorizacao.
- [ ] Bloquear 100% se migration obrigatoria nao foi validada.

### Declaracao De 100%

- [ ] PR mergeado ou pronto para merge.
- [ ] Build/checks obrigatorios verdes.
- [ ] Vercel validado ou N/A.
- [ ] Supabase validado ou N/A.
- [ ] Evidencias documentadas.
- [ ] Mission Control atualizado quando estado real mudou.
- [ ] Riscos residuais declarados.

## Criterios De Aceite Deste PR

- [ ] Os quatro docs existem em `docs/`.
- [ ] Nenhum codigo foi alterado.
- [ ] Nenhuma migration foi criada.
- [ ] Nenhum package file foi alterado.
- [ ] `npm run build` passa.
- [ ] PR aberto.
- [ ] Checks acompanhados.
- [ ] Merge somente se checks obrigatorios estiverem verdes.

## Resultado Esperado

Apex Copilot passa a ter um contrato operacional para conduzir checkpoints com rigor:

- cria checkpoint;
- escolhe motor;
- gera handoff;
- acompanha PR/build/Vercel/Supabase;
- declara `100%` somente com evidencia;
- atualiza Mission Control apenas quando o estado real muda.
