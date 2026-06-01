# Storage Integration Map

## Objetivo

Mapear as integracoes existentes e futuras do pacote Storage antes de implementar APIs ou UI.

Este documento nao altera banco, API ou interface.

## Fluxo alvo

Login -> Projeto -> Upload -> Metadata -> Workspace -> Link temporario -> Download.

## Nova Analise

Arquivo: `pages/nova-analise.tsx`

Estado atual:

- seleciona arquivo local;
- valida extensao;
- cria projeto;
- calcula `file_path`;
- registra metadata em `documents`;
- envia usuario para `/projeto/[id]`.

Gap:

- ainda nao envia o arquivo para o bucket `project-files`.

Integracao futura:

- chamar `POST /api/storage/upload` depois de criar o projeto;
- associar resposta ao registro de metadata;
- em caso de falha, exibir erro claro e evitar falso sucesso de upload.

## Projeto Workspace

Arquivo: `pages/projeto/[id].tsx`

Estado atual:

- carrega projeto;
- carrega documentos por `project_id`;
- mostra aba Arquivos.

Gap:

- ainda nao baixa arquivo por link temporario;
- ainda nao usa API Storage centralizada.

Integracao futura:

- listar arquivos via `GET /api/storage/project-files?project_id=`;
- solicitar download via `POST /api/storage/signed-url`;
- abrir somente link temporario autorizado.

## Documents

Responsabilidade:

- metadata do arquivo;
- vinculo com projeto;
- vinculo com usuario/uploader;
- estado de processamento;
- caminho privado no storage.

Nao deve:

- substituir validacao de acesso;
- expor caminho privado como download publico.

## Bucket project-files

Responsabilidade:

- armazenar objetos privados de projeto.

Padrao recomendado:

- `projects/<project_id>/intake/<filename>`;
- `projects/<project_id>/files/<filename>`.

## APIs previstas

STORAGE-2 deve criar:

- `POST /api/storage/upload`;
- `POST /api/storage/signed-url`;
- `GET /api/storage/project-files`.

DELETE fisico deve ficar fora do primeiro ciclo ou ser tratado com aprovacao explicita.

## Autorizacao compartilhada

Todas as APIs devem validar:

- token presente;
- token valido;
- projeto acessivel;
- documento pertence ao projeto;
- path pertence ao projeto correto.

## Fora do escopo

- Ebook;
- Revit;
- CRM/Revenue;
- Help AI;
- delete destrutivo.

## Conclusao

As integracoes atuais ja preparam metadata, mas Storage real so deve iniciar apos foundation de acesso e APIs server-side.
