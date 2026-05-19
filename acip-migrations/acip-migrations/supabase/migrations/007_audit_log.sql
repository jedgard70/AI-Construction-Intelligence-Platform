-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 007: Audit Log
-- Rastreia todas as ações críticas conforme dead_letter_queue e error_handling
-- ══════════════════════════════════════════════════════════════════════════════

create table public.audit_log (
  id          bigserial primary key,

  -- Quem fez
  user_id     uuid        references public.profiles(id) on delete set null,
  user_email  text,                           -- denormalizado: preserva após exclusão
  user_role   public.user_role,

  -- O que fez
  action      public.audit_action not null,
  description text,

  -- Em qual recurso
  resource_type  text,                        -- 'project' | 'profile' | 'bim_document' ...
  resource_id    text,                        -- UUID ou ID do recurso afetado
  resource_label text,                        -- nome legível do recurso

  -- Contexto técnico
  ip_address  inet,
  user_agent  text,
  session_id  text,

  -- Dados antes/depois (para ações de update)
  old_data    jsonb,
  new_data    jsonb,

  -- Severidade e notificação (error_handling)
  severity    public.error_severity not null default 'baixo',
  notified    boolean not null default false,
  notified_at timestamptz,

  created_at  timestamptz not null default now()
);

comment on table public.audit_log is
  'Log imutável de auditoria. Nunca atualizar ou deletar linhas existentes.';

-- Índices para consulta rápida
create index idx_audit_user      on public.audit_log(user_id);
create index idx_audit_action    on public.audit_log(action);
create index idx_audit_resource  on public.audit_log(resource_type, resource_id);
create index idx_audit_severity  on public.audit_log(severity);
create index idx_audit_created   on public.audit_log(created_at desc);

-- Índice composto para relatórios de segurança
create index idx_audit_security  on public.audit_log(user_id, action, created_at desc)
  where action in ('login_failed','override_decisions','permission_granted','permission_revoked');


-- ── Função helper: registra evento no audit_log ────────────────────────────────
create or replace function public.log_audit(
  p_user_id      uuid,
  p_action       public.audit_action,
  p_description  text    default null,
  p_resource_type text   default null,
  p_resource_id  text    default null,
  p_resource_label text  default null,
  p_old_data     jsonb   default null,
  p_new_data     jsonb   default null,
  p_severity     public.error_severity default 'baixo',
  p_ip_address   inet    default null,
  p_session_id   text    default null
)
returns bigint language plpgsql security definer as $$
declare
  v_id bigint;
  v_email text;
  v_role  public.user_role;
begin
  select email, role into v_email, v_role
  from public.profiles where id = p_user_id;

  insert into public.audit_log (
    user_id, user_email, user_role,
    action, description,
    resource_type, resource_id, resource_label,
    old_data, new_data,
    severity, ip_address, session_id
  ) values (
    p_user_id, v_email, v_role,
    p_action, p_description,
    p_resource_type, p_resource_id, p_resource_label,
    p_old_data, p_new_data,
    p_severity, p_ip_address, p_session_id
  )
  returning id into v_id;

  return v_id;
end;
$$;


-- ── Trigger: audit automático em profiles ─────────────────────────────────────
create or replace function public.audit_profile_changes()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'UPDATE' then
    -- Detecta mudança de role (ação sensível)
    if old.role <> new.role then
      perform public.log_audit(
        new.id,
        'role_change',
        format('Role alterado de %s para %s', old.role, new.role),
        'profile', new.id::text, new.email,
        to_jsonb(old), to_jsonb(new),
        'alto'
      );
    else
      perform public.log_audit(
        new.id,
        'profile_update',
        'Perfil atualizado',
        'profile', new.id::text, new.email,
        null, null,
        'baixo'
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_audit_profiles
  after update on public.profiles
  for each row execute procedure public.audit_profile_changes();


-- ── View: resumo de alertas críticos ─────────────────────────────────────────
create or replace view public.v_audit_alerts as
select
  al.id,
  al.user_email,
  al.user_role,
  al.action,
  al.description,
  al.resource_label,
  al.severity,
  al.ip_address,
  al.created_at
from public.audit_log al
where al.severity in ('alto', 'critico')
  and al.created_at > now() - interval '7 days'
order by al.created_at desc;

comment on view public.v_audit_alerts is
  'Alertas críticos e altos dos últimos 7 dias — para dashboard de segurança';
