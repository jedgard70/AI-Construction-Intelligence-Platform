-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — Migration 002: ENUMs  (espelham exatamente o CORE_SYSTEM.json)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Perfis de usuário (user_roles) ────────────────────────────────────────────
create type public.user_role as enum (
  'engenheiro_campo',
  'coordenador_projetos',
  'gestor_financeiro',
  'diretor_executivo'
);

-- ── Formato de resposta preferido por role ────────────────────────────────────
create type public.response_format as enum (
  'operational_responses',
  'technical_responses',
  'executive_responses'
);

-- ── Nível de prioridade do sistema (priority_system) ─────────────────────────
create type public.priority_level as enum (
  'level_1_seguranca',
  'level_2_viabilidade',
  'level_3_precisao',
  'level_4_financeiro',
  'level_5_escalabilidade'
);

-- ── Status de projeto ─────────────────────────────────────────────────────────
create type public.project_status as enum (
  'planejamento',
  'em_andamento',
  'pausado',
  'concluido',
  'cancelado'
);

-- ── Modo de execução da IA (execution_protocols) ─────────────────────────────
create type public.execution_mode as enum (
  'manual_assist',
  'semi_autonomous',
  'fully_autonomous'
);

-- ── Severidade de erro (error_handling) ──────────────────────────────────────
create type public.error_severity as enum (
  'baixo',
  'medio',
  'alto',
  'critico'
);

-- ── Tipo de evento no audit_log ───────────────────────────────────────────────
create type public.audit_action as enum (
  'login',
  'logout',
  'login_failed',
  'password_reset',
  'profile_update',
  'role_change',
  'project_create',
  'project_update',
  'project_delete',
  'document_upload',
  'bim_analysis',
  'financial_report',
  'permission_granted',
  'permission_revoked',
  'override_decision',
  'ai_agent_trigger',
  'error_critico',
  'error_alto'
);

-- ── Formatos BIM suportados (bim_intelligence) ────────────────────────────────
create type public.bim_format as enum (
  'IFC',
  'NWC',
  'NWD',
  'BCF',
  'RCS',
  'RCP',
  'RVT',
  'DWG'
);

-- ── Tipo de memória (memory_system) ───────────────────────────────────────────
create type public.memory_type as enum (
  'project_memory',
  'technical_knowledge_base',
  'historical_decisions',
  'construction_standards'
);

-- ── Canais de notificação (error_handling.notification_channels) ──────────────
create type public.notification_channel as enum (
  'email',
  'sms',
  'push_notification',
  'whatsapp',
  'dashboard_log'
);
