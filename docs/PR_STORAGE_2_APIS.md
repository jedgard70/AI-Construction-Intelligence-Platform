# PR STORAGE-2 APIS

Data: 2026-06-01  
Branch: `feature/storage-secure-apis`  
Base: `origin/main` @ `84a3f66` (Storage-1)

## Endpoints criados

1. `POST /api/storage/upload`
2. `POST /api/storage/signed-url`
3. `GET /api/storage/project-files?project_id=`

Arquivos:
- `pages/api/storage/_access.ts`
- `pages/api/storage/upload.ts`
- `pages/api/storage/signed-url.ts`
- `pages/api/storage/project-files.ts`

## Autenticação

Padrão adotado:
- Reuso de `requireAuth` de `pages/api/crm/_auth.ts`.
- Sem token => `401`.
- Token inválido/fake => `401`.
- Service role usado somente server-side.

## Autorização

Regra implementada:
- Usuário precisa acesso ao `project_id`:
  - perfil elevado (`diretor_executivo`, `coordenador_projetos`) OU
  - vínculo em `project_members`.

## Payloads

### 1) POST `/api/storage/upload`

Request JSON:
```json
{
  "project_id": "<uuid>",
  "original_name": "arquivo.pdf",
  "mime_type": "application/pdf",
  "file_base64": "<base64>",
  "metadata": {"source": "storage-2"}
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "document_id": "<uuid>",
    "project_id": "<uuid>",
    "storage_bucket": "project-files",
    "storage_path": "projects/<project_id>/<document_id>/arquivo.pdf",
    "original_name": "arquivo.pdf",
    "mime_type": "application/pdf",
    "file_size": 12345
  },
  "error": null
}
```

Comportamento:
- Upload em bucket `project-files`.
- Inserção de metadata em `documents`.
- Em falha de insert metadata, remove o arquivo para evitar órfão.

### 2) POST `/api/storage/signed-url`

Request JSON:
```json
{
  "document_id": "<uuid>",
  "expires_in": 600
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "document_id": "<uuid>",
    "project_id": "<uuid>",
    "signed_url": "https://...",
    "expires_in": 600
  },
  "error": null
}
```

Comportamento:
- Resolve metadata em `documents`.
- Confirma bucket `project-files` e autorização do usuário no projeto.
- Gera signed URL apenas para usuário autorizado.

### 3) GET `/api/storage/project-files?project_id=<uuid>&page=1&limit=20`

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "<uuid>",
      "project_id": "<uuid>",
      "original_name": "arquivo.pdf",
      "mime_type": "application/pdf",
      "file_size": 12345,
      "storage_bucket": "project-files",
      "storage_path": "projects/...",
      "metadata": {},
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "error": null,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

## Testes executados

1. Build:
- `npm run build -- --webpack` ✅

2. Sem token (esperado 401):
- `GET /api/storage/project-files?project_id=<uuid>` ✅
- `POST /api/storage/signed-url` ✅
- `POST /api/storage/upload` ✅

3. Token fake (esperado 401):
- `GET /api/storage/project-files?project_id=<uuid>` ✅
- `POST /api/storage/signed-url` ✅
- `POST /api/storage/upload` ✅

4. Token real / upload real:
- pendente nesta etapa (requer sessão válida e projeto alvo de teste).

## Riscos e observações

1. `upload` usa JSON `file_base64` (simples e seguro para MVP), com limite de 25MB.
2. Endpoint `DELETE /api/storage/file` não implementado agora (evitar risco sem política completa de deleção).
3. Existe risco de sobreposição com policies legadas; sem bypass de segurança, mas recomenda-se harmonização no STORAGE-3.

## Pendências para STORAGE-3 UI

1. Integrar fluxo de upload real na UI de projeto.
2. Consumir listagem paginada de `project-files`.
3. Consumir signed URL para preview/download.
4. Adicionar UX de erro/autorização com mensagens claras.
