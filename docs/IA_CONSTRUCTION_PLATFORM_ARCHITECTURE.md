# IA CONSTRUCTION PLATFORM ARCHITECTURE

Data de consolidacao: 2026-05-29
Escopo: arquitetura aprovada ate PACOTE MASTER 002-B (fase de planejamento tecnico)

## 1. Arquitetura de Alto Nivel

Camadas principais:

1. Interface e Experiencia
- Next.js pages e componentes operacionais (`/dashboard`, `/vendas`, `/juridico`, `/nova-analise`, `/mission-control`).

2. API Layer
- endpoints de dominio em `pages/api/*` para vendas, juridico, projetos, storage e agentes.

3. Core Services
- autenticao, RLS e persistencia Supabase;
- orquestracao IA (Anthropic, regras de fallback);
- assinaturas e PDF (Lumin).

4. Data Layer
- Supabase Postgres + Storage privado (`project-files`);
- tabelas de projeto, documentos, eventos de agente, leads e contratos;
- extensao planejada do CRM/Revenue (opportunities, proposals, services).

5. Governanca
- politicas de seguranca, regras operacionais, auditoria e documentacao obrigatoria.

## 2. Dominios Funcionais

1. Operacao de Projeto
- `projects`, `clients`, `documents`, `agent_events`, `project_members`.
- fluxo intake: `nova-analise -> projeto -> documentos -> eventos`.

2. Vendas e Captação
- base atual: `leads` + `/vendas` + APIs sales/campaign.
- alvo 002-A: `opportunities`, `pipeline_stages`, `proposals`, `campaign_runs`.

3. Juridico e Contratos
- analise contratual IA;
- geracao de contrato e PDF;
- assinatura digital e status;
- persistencia central em `contracts`.

4. Marketing e Go-to-Market
- website publico e landing pages no repositorio separado `apex-global-website`;
- plataforma privada mantem apenas rotas autenticadas, CRM/campanhas e modulos operacionais;
- campanhas por webhook e orquestracao de pipeline.

## 3. Modelo de Dados Aprovado (002-A)

Reuso obrigatorio:

- `leads`
- `contracts`
- `projects`
- `clients`
- `documents`
- `agent_events`
- `project_members`

Extensoes aprovadas:

- `pipeline_stages` (incluindo `proposal_review`)
- `opportunities` (com `country_code` e `market_region`)
- `opportunity_activities`
- `proposals` (com `proposal_type`)
- `services_catalog`
- `opportunity_services`
- `campaign_runs`
- `campaign_dispatches`
- `lead_scores`

## 4. Seguranca e Acesso

Princpios:

1. nenhuma chave privilegiada no frontend;
2. escrita sensivel via server-side/API;
3. acesso por owner, membro de projeto e papeis elevados;
4. catalogos com leitura autenticada e escrita restrita;
5. logs e trilha de auditoria persistidos.

## 5. Internacionalizacao Comercial

Padroes aprovados:

- `country_code` na oportunidade;
- `market_region` na oportunidade (`LATAM`, `NA`, `EU`);
- `currency_code` em oportunidades/propostas/itens/campanhas;
- catalogo de servicos por regiao (`available_in_regions`).

## 6. Integracoes Externas

Ativas:

- Anthropic (qualificacao/geracao de conteudo IA);
- Lumin (PDF e assinatura);
- Webhook comercial (`SALES_WEBHOOK_URL`).

Planejadas:

- conectores comerciais adicionais via camada adaptadora (sem quebrar APIs atuais).

## 7. Decisoes Arquiteturais Chave

1. Evoluir por extensao, sem recriar dominios equivalentes.
2. Priorizar compatibilidade com telas/APIs existentes.
3. Fechamento de sprint condicionado a atualizacao documental.
4. Operacao em workspace unico, sem clones paralelos.

## 8. Referencias de Execucao Atual

Documentos de referencia para proxima fase:

- `docs/PACOTE_MASTER_002_A_SCHEMA_FINAL.md`
- `docs/PACOTE_MASTER_002_B_PLANO_TECNICO.md`

Regra:

- implementacao (002-C) somente apos auditoria executiva do plano 002-B.
