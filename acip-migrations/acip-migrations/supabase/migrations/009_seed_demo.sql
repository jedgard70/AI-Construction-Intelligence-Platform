-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 009: Seed de Demonstração
-- Dados para testar a plataforma localmente ou em ambiente de staging.
-- NÃO executar em produção.
-- ══════════════════════════════════════════════════════════════════════════════

-- Usuários de demonstração — criar via Supabase Auth primeiro, depois inserir perfis
-- Os UUIDs abaixo são fixos para facilitar testes locais.

do $$
begin
  -- Só executa se não for produção (convensão: database name contém 'prod')
  if current_database() like '%prod%' then
    raise exception 'SEED: não executar em produção! Banco atual: %', current_database();
  end if;
end;
$$;

-- Perfis de demonstração (inserção direta, sem passar por auth.users no seed)
-- Em produção use o convite via Supabase Dashboard ou Edge Function

insert into public.profiles (
  id, email, full_name, role, company, department, registration_id, is_active
) values
  (
    '00000000-0000-0000-0000-000000000001',
    'eng.campo@acip.demo',
    'Carlos Menezes',
    'engenheiro_campo',
    'Construtora ACIP Demo',
    'Obras',
    'CREA-SP 123456',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'coordenador@acip.demo',
    'Ana Paula Ferreira',
    'coordenador_projetos',
    'Construtora ACIP Demo',
    'Engenharia',
    'CREA-SP 234567',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'financeiro@acip.demo',
    'Roberto Lima',
    'gestor_financeiro',
    'Construtora ACIP Demo',
    'Financeiro',
    null,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'diretor@acip.demo',
    'Marcelo Andrade',
    'diretor_executivo',
    'Construtora ACIP Demo',
    'Diretoria',
    'CREA-SP 345678',
    true
  )
on conflict (id) do nothing;


-- Projeto de demonstração
insert into public.projects (
  id, name, code, description,
  address, city, state,
  owner_id, coordinator_id,
  status, execution_mode,
  start_date, end_date,
  budget_total, budget_spent,
  cpi, spi, safety_index,
  bim_enabled
) values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Residencial Parque das Flores — Fase 1',
  'OBR-2025-001',
  'Construção de 4 torres residenciais com 120 unidades cada. BIM Level 3.',
  'Av. das Flores, 1200',
  'São Paulo', 'SP',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  'em_andamento',
  'semi_autonomous',
  '2025-01-15', '2026-12-31',
  48000000.00, 18250000.00,
  0.94, 0.88, 0.97,
  true
) on conflict (id) do nothing;


-- Membros do projeto
insert into public.project_members (project_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','engenheiro_campo'),
  ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','coordenador_projetos'),
  ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','gestor_financeiro'),
  ('aaaaaaaa-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','diretor_executivo')
on conflict do nothing;


-- KPIs históricos
insert into public.project_kpis (project_id, period, cpi, spi, safety_index, quality_index, budget_variance, schedule_variance_days)
values
  ('aaaaaaaa-0000-0000-0000-000000000001','2025-01-31',1.02,0.99,0.98,0.95,  80000, -1),
  ('aaaaaaaa-0000-0000-0000-000000000001','2025-02-28',0.99,0.95,0.97,0.94, -50000, -3),
  ('aaaaaaaa-0000-0000-0000-000000000001','2025-03-31',0.97,0.91,0.98,0.96,-180000, -7),
  ('aaaaaaaa-0000-0000-0000-000000000001','2025-04-30',0.94,0.88,0.97,0.95,-300000,-12)
on conflict do nothing;


-- Ocorrência de campo de exemplo
insert into public.occurrences (
  project_id, reported_by,
  type, priority, severity,
  title, description, location,
  norms_violated, status
) values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'seguranca', 'level_1_seguranca', 'alto',
  'EPI não utilizado — Bloco A, 8º pavimento',
  'Trabalhador identificado sem capacete e sem cinto de segurança durante montagem de fôrmas.',
  'Bloco A — 8º pavimento',
  array['NR-18','NR-35'],
  'em_andamento'
) on conflict do nothing;
