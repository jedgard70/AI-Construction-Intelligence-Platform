-- ══════════════════════════════════════════════════════════════════════════════
-- ACIP — AI Construction Intelligence Platform  |  v5.1 Enterprise
-- Migration 001: Extensões PostgreSQL necessárias
-- ══════════════════════════════════════════════════════════════════════════════

-- UUIDs para todas as PKs
create extension if not exists "uuid-ossp";

-- Criptografia: hash de tokens, senhas auxiliares
create extension if not exists "pgcrypto";

-- Pesquisa full-text em pt-BR (normas, projetos, ocorrências)
create extension if not exists "pg_trgm";

-- Estatísticas de queries (análise de performance)
create extension if not exists "pg_stat_statements";
