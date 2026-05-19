-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 004: Roles e Permissions
-- Estrutura baseada em user_roles e priority_system do CORE_SYSTEM.json
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 4.1  Definição de roles ───────────────────────────────────────────────────
create table public.roles (
  id                 public.user_role primary key,
  label              text        not null,
  description        text,
  response_format    public.response_format not null,
  priority_access    int[]       not null default '{}',  -- levels 1-5 que pode fazer override
  context_priority   text[]      not null default '{}',  -- context_management.context_priority
  is_active          boolean     not null default true,
  created_at         timestamptz not null default now()
);

comment on table public.roles is
  'Roles do sistema conforme CORE_SYSTEM.json > user_roles';

-- ── 4.2  Catálogo de permissões disponíveis ───────────────────────────────────
create table public.permissions (
  id          serial primary key,
  code        text        not null unique,   -- ex: 'leitura_bim'
  label       text        not null,
  module      text        not null,          -- ex: 'bim', 'financeiro', 'projetos'
  description text,
  created_at  timestamptz not null default now()
);

comment on table public.permissions is
  'Catálogo de todas as permissões disponíveis na plataforma ACIP';

-- ── 4.3  Vínculo role ↔ permissão ─────────────────────────────────────────────
create table public.role_permissions (
  role_id       public.user_role not null references public.roles(id)       on delete cascade,
  permission_id int              not null references public.permissions(id)  on delete cascade,
  granted_by    uuid             references public.profiles(id),
  granted_at    timestamptz not null default now(),
  primary key (role_id, permission_id)
);

comment on table public.role_permissions is
  'Permissões atribuídas a cada role';

-- ── 4.4  Permissões extras por usuário (override individual) ──────────────────
create table public.user_permissions (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  permission_id int  not null references public.permissions(id) on delete cascade,
  granted       boolean     not null default true,  -- false = revogação explícita
  granted_by    uuid        references public.profiles(id),
  expires_at    timestamptz,                         -- permissão temporária
  reason        text,
  granted_at    timestamptz not null default now(),
  primary key (user_id, permission_id)
);

comment on table public.user_permissions is
  'Permissões extras ou restrições específicas por usuário (override do role)';

-- ── Índices ───────────────────────────────────────────────────────────────────
create index idx_role_permissions_role on public.role_permissions(role_id);
create index idx_user_permissions_user on public.user_permissions(user_id);
create index idx_permissions_module    on public.permissions(module);

-- ── View: permissões efetivas por usuário ─────────────────────────────────────
create or replace view public.v_user_permissions as
select
  p.id          as user_id,
  p.email,
  p.role,
  pm.code       as permission_code,
  pm.module,
  coalesce(up.granted, true) as granted,
  up.expires_at
from public.profiles p
join public.role_permissions rp  on rp.role_id = p.role
join public.permissions      pm  on pm.id = rp.permission_id
left join public.user_permissions up
  on up.user_id = p.id and up.permission_id = pm.id
where p.is_active = true
  and (up.expires_at is null or up.expires_at > now());

comment on view public.v_user_permissions is
  'Permissões efetivas de cada usuário: role base + overrides individuais';

-- ── Função helper: verifica se usuário tem permissão ─────────────────────────
create or replace function public.has_permission(
  p_user_id   uuid,
  p_permission text
)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.v_user_permissions
    where user_id = p_user_id
      and permission_code = p_permission
      and granted = true
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: dados iniciais dos roles (espelham exatamente o CORE_SYSTEM.json)
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.roles (id, label, description, response_format, priority_access, context_priority)
values
  (
    'engenheiro_campo',
    'Engenheiro de Campo',
    'Responsável por registro de ocorrências, aprovação de RDO e leitura de modelos BIM no campo',
    'operational_responses',
    '{}',
    array['active_project','safety_alerts','daily_tasks']
  ),
  (
    'coordenador_projetos',
    'Coordenador de Projetos',
    'Gestão de cronograma, aprovação de compras e geração de relatórios técnicos',
    'technical_responses',
    '{3}',
    array['active_project','critical_risks','resource_efficiency']
  ),
  (
    'gestor_financeiro',
    'Gestor Financeiro',
    'Controle de orçamento, aprovação de pagamentos e gestão de contratos',
    'executive_responses',
    '{4}',
    array['financial_performance','budget_variance','forecast']
  ),
  (
    'diretor_executivo',
    'Diretor / C-Level',
    'Acesso total à plataforma, decisões estratégicas e override de qualquer nível',
    'executive_responses',
    '{3,4,5}',
    array['portfolio_status','critical_risks','executive_decisions']
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: catálogo de permissões (baseado em user_roles.permissions)
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.permissions (code, label, module) values
  -- BIM
  ('leitura_bim',              'Leitura de modelos BIM',          'bim'),
  ('upload_bim',               'Upload de arquivos BIM',           'bim'),
  ('clash_detection',          'Execução de clash detection',      'bim'),
  ('quantity_takeoff',         'Extração de quantitativos',        'bim'),
  ('simulacao_4d',             'Simulação 4D',                     'bim'),
  ('analise_5d',               'Análise de custos 5D',             'bim'),

  -- Obras e Campo
  ('registro_ocorrencias',     'Registro de ocorrências',          'campo'),
  ('aprovacao_rdo',            'Aprovação de RDO',                 'campo'),
  ('checklist_seguranca',      'Checklist NR-18 / NR-35',         'campo'),

  -- Projetos
  ('edicao_cronograma',        'Edição de cronograma',             'projetos'),
  ('aprovacao_compras',        'Aprovação de compras',             'projetos'),
  ('geracao_relatorios',       'Geração de relatórios',            'projetos'),
  ('create_project',           'Criação de projetos',              'projetos'),
  ('delete_project',           'Exclusão de projetos',             'projetos'),

  -- Financeiro
  ('leitura_orcamento',        'Leitura de orçamento',             'financeiro'),
  ('aprovacao_pagamentos',     'Aprovação de pagamentos',          'financeiro'),
  ('controle_contratos',       'Controle de contratos',            'financeiro'),
  ('roi_analysis',             'Análise de ROI',                   'financeiro'),
  ('valuation',                'Valuation de ativos',              'financeiro'),
  ('capital_raising',          'Estratégias de captação',          'financeiro'),

  -- Administrativo
  ('gestao_usuarios',          'Gestão de usuários',               'admin'),
  ('aprovacao_estrategica',    'Aprovação estratégica',            'admin'),
  ('override_decisions',       'Override de decisões',             'admin'),
  ('acesso_total',             'Acesso total à plataforma',        'admin'),
  ('configurar_agentes_ia',    'Configurar agentes IA',            'admin'),
  ('visualizar_audit_log',     'Visualizar log de auditoria',      'admin');


-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: atribuição de permissões por role
-- ─────────────────────────────────────────────────────────────────────────────

-- engenheiro_campo
insert into public.role_permissions (role_id, permission_id)
select 'engenheiro_campo', id from public.permissions
where code in ('leitura_bim','registro_ocorrencias','aprovacao_rdo','checklist_seguranca');

-- coordenador_projetos
insert into public.role_permissions (role_id, permission_id)
select 'coordenador_projetos', id from public.permissions
where code in (
  'leitura_bim','upload_bim','clash_detection','quantity_takeoff',
  'edicao_cronograma','aprovacao_compras','geracao_relatorios',
  'create_project','leitura_orcamento','visualizar_audit_log'
);

-- gestor_financeiro
insert into public.role_permissions (role_id, permission_id)
select 'gestor_financeiro', id from public.permissions
where code in (
  'leitura_orcamento','aprovacao_pagamentos','controle_contratos',
  'roi_analysis','valuation','capital_raising','geracao_relatorios',
  'visualizar_audit_log'
);

-- diretor_executivo — acesso total
insert into public.role_permissions (role_id, permission_id)
select 'diretor_executivo', id from public.permissions;
