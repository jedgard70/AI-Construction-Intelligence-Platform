# Storage Policy Gap Analysis

## Objetivo

Comparar o comportamento atual observado com o comportamento desejado para o pacote Storage.

Documento de auditoria apenas.

## Documents

### Estado atual observado

- RLS habilitado.
- Existencia de regras amplas para usuarios autenticados.

### Risco

- Usuario autenticado pode obter visibilidade maior do que o necessario.

### Estado desejado

- Acesso somente por projeto autorizado.
- Acesso por uploader.
- Acesso por owner/manager/coordinator.
- Acesso por membro do projeto.
- Acesso por papel elevado ativo aprovado.

### Acao futura

- Substituir leitura ampla por verificacao de projeto.

---

## Projects

### Estado atual observado

- Regras amplas para autenticados.

### Risco

- Projetos podem ser enumerados indevidamente.
- Impacto indireto sobre documentos.

### Estado desejado

- Projeto visivel apenas para participantes autorizados.

### Acao futura

- Centralizar validacao por funcao de acesso ao projeto.

---

## Project Members

### Estado atual observado

- Politicas amplas detectadas durante auditoria.

### Risco

- Exposicao de participacoes de projeto.

### Estado desejado

- Usuario ve apenas participacoes relevantes.
- Gestao por papeis autorizados.

### Acao futura

- Remover dependencias de leitura ampla.

---

## Storage Objects

### Estado atual observado

- Controle baseado em path.
- Bucket project-files existente.

### Risco

- Validacao inconsistente de path.

### Estado desejado

- Path padronizado por projeto.
- Verificacao de acesso ao projeto antes de qualquer operacao.

### Acao futura

- Alinhar policies ao helper central de autorizacao.

---

## Signed URL

### Estado atual observado

- Nao encontrado fluxo dedicado.

### Estado desejado

- Geracao apenas por API autenticada.
- Expiracao curta.
- Sem exposicao de caminho privado.

### Acao futura

- Implementar em STORAGE-2.

---

## Upload

### Estado atual observado

- Metadata preparada.
- Upload real nao identificado.

### Estado desejado

- Upload server-side validado por projeto.

### Acao futura

- Implementar API dedicada antes da UI.

---

## Download

### Estado atual observado

- Fluxo completo nao identificado.

### Estado desejado

- Download apenas por URL temporaria autorizada.

### Acao futura

- Integrar signed URL e workspace.

---

## Decisao

Antes da migration STORAGE-1, toda permissao ampla deve possuir substituto funcional baseado em projeto e papel autorizado.

Nenhum hardening deve ser aplicado sem manter compatibilidade operacional para Owner, Manager, Coordinator e membros de projeto.
