-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 008: Row Level Security (RLS)
-- Cada role enxerga apenas o que lhe é permitido conforme CORE_SYSTEM.json
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Helper: role do usuário logado ────────────────────────────────────────────
create or replace function public.current_role_acip()
returns public.user_role language sql stable security definer as $$
  select role from public.profiles where id = auth.uid()
$$;


-- ══════════════════════════════════════════════════════════════════════════════
-- PROFILES
-- ══════════════════════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;

-- Usuário lê e edita apenas o próprio perfil
create policy "profiles: leitura própria"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: edição própria"
  on public.profiles for update
  using (id = auth.uid());

-- Diretor vê todos os perfis
create policy "profiles: diretor vê todos"
  on public.profiles for select
  using (public.current_role_acip() = 'diretor_executivo');

-- Coordenador e acima vê membros de seus projetos
create policy "profiles: coordenador vê membros"
  on public.profiles for select
  using (
    public.current_role_acip() in ('coordenador_projetos','gestor_financeiro','diretor_executivo')
    and exists (
      select 1 from public.project_members pm
      where pm.user_id = profiles.id
        and pm.project_id in (
          select project_id from public.project_members where user_id = auth.uid()
        )
    )
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- PROJECTS
-- ══════════════════════════════════════════════════════════════════════════════
alter table public.projects enable row level security;

-- Todos os membros do projeto veem o projeto
create policy "projects: membros podem ler"
  on public.projects for select
  using (
    exists (
      select 1 from public.project_members
      where project_id = projects.id and user_id = auth.uid()
    )
    or owner_id = auth.uid()
  );

-- Coordenador e diretor criam projetos
create policy "projects: coordenador/diretor criam"
  on public.projects for insert
  with check (
    public.current_role_acip() in ('coordenador_projetos','diretor_executivo')
    and public.has_permission(auth.uid(), 'create_project')
  );

-- Apenas owner ou coordenador atualiza
create policy "projects: owner/coordenador atualizam"
  on public.projects for update
  using (
    owner_id = auth.uid()
    or coordinator_id = auth.uid()
    or public.current_role_acip() = 'diretor_executivo'
  );

-- Apenas diretor deleta
create policy "projects: somente diretor deleta"
  on public.projects for delete
  using (public.current_role_acip() = 'diretor_executivo');


-- ══════════════════════════════════════════════════════════════════════════════
-- PROJECT MEMBERS
-- ══════════════════════════════════════════════════════════════════════════════
alter table public.project_members enable row level security;

create policy "project_members: membros veem"
  on public.project_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.project_members pm2
      where pm2.project_id = project_members.project_id
        and pm2.user_id = auth.uid()
    )
  );

create policy "project_members: coordenador/diretor gerenciam"
  on public.project_members for all
  using (public.current_role_acip() in ('coordenador_projetos','diretor_executivo'));


-- ══════════════════════════════════════════════════════════════════════════════
-- BIM DOCUMENTS
-- ══════════════════════════════════════════════════════════════════════════════
alter table public.bim_documents enable row level security;

-- Membros do projeto com leitura_bim podem ver
create policy "bim: membros com permissão leem"
  on public.bim_documents for select
  using (
    public.has_permission(auth.uid(), 'leitura_bim')
    and exists (
      select 1 from public.project_members
      where project_id = bim_documents.project_id and user_id = auth.uid()
    )
  );

-- Upload apenas para quem tem permissão
create policy "bim: upload com permissão"
  on public.bim_documents for insert
  with check (
    public.has_permission(auth.uid(), 'upload_bim')
    and exists (
      select 1 from public.project_members
      where project_id = bim_documents.project_id and user_id = auth.uid()
    )
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- OCCURRENCES
-- ══════════════════════════════════════════════════════════════════════════════
alter table public.occurrences enable row level security;

create policy "occurrences: membros do projeto leem"
  on public.occurrences for select
  using (
    exists (
      select 1 from public.project_members
      where project_id = occurrences.project_id and user_id = auth.uid()
    )
  );

create policy "occurrences: campo/coordenador registram"
  on public.occurrences for insert
  with check (
    public.has_permission(auth.uid(), 'registro_ocorrencias')
    and exists (
      select 1 from public.project_members
      where project_id = occurrences.project_id and user_id = auth.uid()
    )
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG
-- ══════════════════════════════════════════════════════════════════════════════
alter table public.audit_log enable row level security;

-- Usuário vê apenas o próprio log
create policy "audit: usuário vê o próprio"
  on public.audit_log for select
  using (user_id = auth.uid());

-- Coordenador e diretor veem todo o log
create policy "audit: gestores veem tudo"
  on public.audit_log for select
  using (
    public.has_permission(auth.uid(), 'visualizar_audit_log')
  );

-- Ninguém pode deletar ou atualizar o audit_log
create policy "audit: imutável — sem delete"
  on public.audit_log for delete
  using (false);

create policy "audit: imutável — sem update"
  on public.audit_log for update
  using (false);


-- ══════════════════════════════════════════════════════════════════════════════
-- MEMORY
-- ══════════════════════════════════════════════════════════════════════════════
alter table public.memory_short_term enable row level security;
alter table public.memory_long_term  enable row level security;

create policy "memory_st: usuário acessa a própria"
  on public.memory_short_term for all
  using (user_id = auth.uid());

create policy "memory_lt: qualquer membro do projeto lê"
  on public.memory_long_term for select
  using (
    project_id is null
    or exists (
      select 1 from public.project_members
      where project_id = memory_long_term.project_id and user_id = auth.uid()
    )
  );

create policy "memory_lt: diretor gerencia"
  on public.memory_long_term for all
  using (public.current_role_acip() = 'diretor_executivo');


-- ══════════════════════════════════════════════════════════════════════════════
-- ROLES / PERMISSIONS (leitura pública autenticada — sem exposição de segredos)
-- ══════════════════════════════════════════════════════════════════════════════
alter table public.roles       enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

create policy "roles: autenticados leem"
  on public.roles for select using (auth.uid() is not null);

create policy "permissions: autenticados leem"
  on public.permissions for select using (auth.uid() is not null);

create policy "role_permissions: autenticados leem"
  on public.role_permissions for select using (auth.uid() is not null);

-- Só diretor altera roles e permissões
create policy "roles: diretor gerencia"
  on public.roles for all
  using (public.current_role_acip() = 'diretor_executivo');

create policy "role_permissions: diretor gerencia"
  on public.role_permissions for all
  using (public.current_role_acip() = 'diretor_executivo');
