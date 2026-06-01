# ARCHVIS AI OPERATING SYSTEM

## Visao
O modulo Archvis transforma arquivos tecnicos e referencias em entregaveis visuais comerciais de alto valor, dentro do workspace do projeto Apex.

## Pipeline oficial
1. Plantas
2. Referencias
3. Previews IA
4. Refinamentos
5. Render Final
6. Prancha A1

## Fonte de dados
- `storage` via APIs seguras (`project-files`, `signed-url`, `upload`).
- `documents` como camada de metadata e rastreabilidade.

## Regras de operacao
- Um unico workspace oficial.
- Sem duplicacao de dados em base paralela.
- Sem bypass de autorizacao de projeto.
- Sem exposicao de path privado de storage.

## Modelo de classificacao inicial
Enquanto nao houver taxonomia obrigatoria de metadata:
- classificacao por nome de arquivo + mime type.
- fallback para categoria `referencias`.

## Evolucao planejada
- metadata estruturada por etapa no upload.
- prompts guiados por objetivo arquitetonico.
- pacote de comercializacao (Fachada IA Premium, Render + Prancha A1, Apresentacao Imobiliaria).
- exportacao A1 (HTML print-ready e PDF).
