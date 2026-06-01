# PR STORAGE-3 UI PROJECT WORKSPACE

Data: 2026-06-01  
Branch: `feature/storage-ui-project-workspace`  
Base: `origin/main` em `143a995`

## Arquivos alterados

1. `pages/nova-analise.tsx`
2. `pages/projeto/[id].tsx`
3. `docs/PR_STORAGE_3_UI_PROJECT_WORKSPACE.md`

## Fluxos implementados

### 1) `/nova-analise`

- Mantido fluxo de criação de projeto.
- Integração de upload via API segura:
  - `POST /api/storage/upload`
  - usa Bearer token da sessão atual.
- Metadados enviados para `documents` via API de storage.
- Em falha de upload:
  - criação de projeto não é bloqueada;
  - aviso explícito é exibido na UI.

Decisão adotada:
- Upload tratado como etapa opcional não-bloqueante após criação de projeto para reduzir risco de falha transacional na entrada.

### 2) `/projeto/[id]`

- Listagem de arquivos do projeto via:
  - `GET /api/storage/project-files?project_id=...`
- Download de arquivo via:
  - `POST /api/storage/signed-url`
- Exibição de:
  - nome (`original_name`)
  - tipo (`mime_type`)
  - tamanho (`file_size` formatado)
  - data de criação
- `storage_path` não é exposto na UI.
- Tratamento de estados:
  - loading
  - vazio
  - erro/permissão

## UX

- Uploader preserva simplicidade do fluxo existente.
- Feedback claro em erro de upload/listagem/download.
- Compatível com ApexShell (rotas e layout preservados).
- Não houve alteração nas abas do Project Workspace fora do necessário.

## Testes executados

1. Build
- `npm run build -- --webpack` ✅

2. Smoke de páginas
- `/nova-analise` ✅ (compila e responde 200 em start local)
- `/projeto/test-id` ✅ (compila e responde 200 em start local)

3. Sem token (APIs Storage)
- validado no ciclo STORAGE-2 e mantido comportamento 401.

4. Com token real
- pendente neste ciclo (depende de sessão real e projeto válido para teste manual guiado).

## Riscos

1. Upload em base64 no fluxo atual pode pesar em arquivos grandes (limite da API já protege backend).
2. Diferenças entre registros legados de `documents` e novos metadados podem exigir harmonização no STORAGE-4.
3. Download depende de autorização por `project_members`; usuários sem vínculo verão erro de permissão (comportamento esperado).

## Pendências para STORAGE-4 E2E

1. Teste autenticado ponta a ponta:
- criar projeto em `/nova-analise`
- upload real
- verificar `documents`
- listar em `/projeto/[id]`
- baixar via signed URL

2. Validar UX para múltiplos arquivos e paginação longa.
3. Revisar convergência de registros legados `documents` no workspace.
