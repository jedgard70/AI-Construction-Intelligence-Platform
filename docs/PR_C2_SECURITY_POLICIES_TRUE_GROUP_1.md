# PR C.2 Security P0 Policies True - First Group

Data de inicio: 2026-06-02
Base: `origin/main` em `b71c486031e4b7ba61b5ae5562ed54f58c06a0a3`

## Objetivo

Corrigir o primeiro grupo pequeno de policies permissivas `USING (true)` / `WITH CHECK (true)` sem hardening em lote, sem Revenue/Auth e sem UI.

## Grupo selecionado

Tabelas:
- `public.clients`
- `public.contracts`

## Motivo da selecao

Foram escolhidas por serem tabelas de baixo risco relativo dentro do conjunto P0 restante e por ja possuirem policies mais restritivas/escopadas que tornam possivel remover o fallback permissivo sem recriar o modelo inteiro.

## Mudanca aplicada

- removidas as policies amplas de `clients` para autenticos;
- removida a policy `auth_all_contracts`;
- adicionada policy `contracts_delete_scoped` com escopo por `created_by`, roles elevadas e membership de projeto.

## Garantias

- migration idempotente;
- sem apagar dados;
- sem Revenue/Auth;
- sem UI;
- sem package files;
- sem hardening em lote;
- sem alterar o restante do plano C.

## Validacoes previstas

- `supabase db push --linked`
- advisor remoto do Supabase
- `NEXT_DISABLE_BUILD_WORKER=1 npm run build -- --webpack`

## Risco

Baixo a medio. A reducao de permissividade pode restringir acesso anteriormente aberto por engano, mas o desenho ja tinha policies escopadas para os fluxos principais.

## Status

Concluido para o primeiro grupo.

## Evidencia obtida

- a migration foi aplicada no Supabase real com sucesso;
- o advisor de seguranca nao retornou mais `rls_policy_always_true` para `public.clients` e `public.contracts`;
- o primeiro grupo pequeno foi fechado sem mexer em Revenue/Auth, UI ou package files.
