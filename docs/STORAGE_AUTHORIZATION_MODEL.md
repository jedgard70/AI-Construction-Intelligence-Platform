# Storage Authorization Model

## Objetivo

Definir o modelo de autorizacao que servira de base para STORAGE-1, STORAGE-2 e STORAGE-3.

Documento de especificacao. Nenhuma alteracao de banco ou codigo foi aplicada.

## Principio

Toda operacao de Storage deve depender de acesso valido ao projeto associado.

Nao e suficiente estar autenticado.

## Entidades

### Projeto

Representa o contexto principal de autorizacao.

Campos relevantes:

- id
- created_by
- owner_id
- manager_id
- coordinator_id
- client_id

### Documento

Representa metadata do arquivo.

Campos relevantes:

- id
- project_id
- user_id
- uploaded_by
- file_path
- file_name
- mime_type

### Arquivo fisico

Objeto armazenado em:

- bucket: project-files

Path recomendado:

- projects/<project_id>/intake/<file>
- projects/<project_id>/files/<file>

## Modelo can_access_project

Entrada:

- project_id
- user_id

Resultado:

- true
- false

Acesso permitido quando qualquer uma das condicoes for verdadeira:

1. Usuario criou o projeto.
2. Usuario e owner do projeto.
3. Usuario e manager do projeto.
4. Usuario e coordinator do projeto.
5. Usuario consta em project_members.
6. Usuario possui papel elevado ativo aprovado.

## Papeis elevados

Elegiveis para governanca operacional:

- diretor executivo
- coordenador de projetos

Requisitos:

- perfil ativo
- validacao em profiles

## Guest

Guest nao possui acesso.

Resultado esperado:

- listar arquivos: negar
- upload: negar
- signed URL: negar
- download: negar

## Usuario autenticado sem projeto

Resultado esperado:

- listar arquivos: negar
- upload: negar
- signed URL: negar
- download: negar

## Membro do projeto

Resultado esperado:

- listar documentos: permitir
- visualizar metadata: permitir
- signed URL: permitir
- download: permitir

Upload pode depender de politica operacional.

## Owner Manager Coordinator

Resultado esperado:

- listar documentos: permitir
- upload: permitir
- signed URL: permitir
- download: permitir
- atualizar metadata: permitir

## Diretor executivo

Resultado esperado:

- acesso operacional por governanca.
- sem necessidade de participacao direta no projeto.

## Fluxo de Upload

1. Usuario autenticado.
2. API valida token.
3. API valida acesso ao projeto.
4. API grava objeto em project-files.
5. API registra metadata em documents.
6. API retorna resultado.

## Fluxo de Download

1. Usuario autenticado.
2. API valida token.
3. API carrega documento.
4. API valida acesso ao projeto.
5. API gera URL temporaria.
6. API retorna URL temporaria.

## Fluxo de Listagem

1. Usuario autenticado.
2. API valida token.
3. API valida acesso ao projeto.
4. API retorna somente documentos autorizados.

## Regras de Seguranca

- bucket permanece privado.
- service role somente server-side.
- path privado nao exposto desnecessariamente.
- URLs temporarias com expiracao curta.
- sem fallback fake.
- erros explicitos para autenticacao e autorizacao.

## Dependencia por fase

STORAGE-1
- foundation
- governanca
- autorizacao

STORAGE-2
- APIs

STORAGE-3
- UI

STORAGE-4
- E2E

## Status

Modelo aprovado para orientar implementacao futura.
