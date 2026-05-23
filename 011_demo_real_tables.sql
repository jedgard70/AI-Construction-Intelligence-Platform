-- ============================================================
-- Migration 011 — Tabelas para módulos DEMO·REAL → PRONTOS
-- ============================================================

-- ============================================================
-- 1. INVESTIMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS investments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text NOT NULL,
  vgv           numeric(12,2) NOT NULL DEFAULT 0,
  roi           numeric(6,2)  NOT NULL DEFAULT 0,
  tir           numeric(6,2)  NOT NULL DEFAULT 0,
  noi           numeric(12,2) NOT NULL DEFAULT 0,
  cap_rate      numeric(6,2)  NOT NULL DEFAULT 0,
  esg           integer       NOT NULL DEFAULT 0 CHECK (esg BETWEEN 0 AND 100),
  status        text          NOT NULL DEFAULT 'planejamento'
                  CHECK (status IN ('planejamento','em_andamento','concluido','suspenso')),
  fase          text,
  descricao     text,
  pitch_gerado  text,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

-- Seed inicial
INSERT INTO investments (nome, vgv, roi, tir, noi, cap_rate, esg, status, fase) VALUES
  ('Edifício Horizonte — Torre A', 48.2,  24.3, 19.8, 3.2, 6.7, 82, 'em_andamento', 'Fundação — 34%'),
  ('Complexo Industrial Norte',    87.5,  31.2, 22.1, 6.8, 7.8, 71, 'em_andamento', 'Estrutura — 58%'),
  ('Condomínio Vale Verde',        29.4,  18.6, 15.3, 1.9, 6.5, 91, 'planejamento',  'Aprovação prefeitura'),
  ('Cerrado Sul Fase II',         112.0,  28.9, 21.4, 8.4, 7.5, 78, 'planejamento',  'Terreno adquirido')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. RDO — Relatório Diário de Obra
-- ============================================================
CREATE TABLE IF NOT EXISTS rdo_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects(id) ON DELETE SET NULL,
  project_name    text NOT NULL,
  data_relatorio  date NOT NULL DEFAULT CURRENT_DATE,
  clima           text DEFAULT 'ensolarado',
  temperatura     integer,
  responsavel     text,
  equipe_count    integer DEFAULT 0,
  atividades      text,
  ocorrencias     text,
  materiais       text,
  equipamentos    text,
  progresso_pct   numeric(5,2) DEFAULT 0,
  status          text DEFAULT 'rascunho' CHECK (status IN ('rascunho','finalizado','aprovado')),
  conteudo_ia     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. ARCHVIS — Visualização Arquitetônica
-- ============================================================
CREATE TABLE IF NOT EXISTS archvis_projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  tipo         text DEFAULT 'residencial',
  descricao    text,
  status       text DEFAULT 'ativo',
  thumbnail    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS archvis_renders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES archvis_projects(id) ON DELETE CASCADE,
  titulo       text,
  prompt       text,
  resultado    text,  -- análise IA gerada
  tipo_render  text DEFAULT 'externo',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Seed
INSERT INTO archvis_projects (nome, tipo, descricao, status) VALUES
  ('Residência Alphaville', 'residencial', 'Casa de alto padrão, estilo contemporâneo', 'ativo'),
  ('Centro Empresarial BRT', 'comercial',  'Torre comercial 18 andares, certificação LEED', 'ativo'),
  ('Condomínio Eco Verde',   'residencial','Condomínio sustentável com áreas verdes', 'ativo')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. DIRECTOR CUT — Projetos de Vídeo
-- ============================================================
CREATE TABLE IF NOT EXISTS video_projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  cliente      text,
  tipo         text DEFAULT 'institucional',
  duracao      integer,  -- segundos
  status       text DEFAULT 'em_producao',
  descricao    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_analyses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES video_projects(id) ON DELETE CASCADE,
  tipo_analise text,
  prompt       text,
  resultado    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO video_projects (nome, cliente, tipo, status) VALUES
  ('Lançamento Torre Alpha',      'Construtora Apex',    'marketing',     'em_producao'),
  ('Tour Virtual Casa Modelo',    'JEDGARD Engenharia',  'institucional', 'em_producao'),
  ('BIM 4D — Construção Visível', 'Apex Global',         'tecnico',       'em_producao')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. PLATFORM — Módulos da Plataforma
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_modules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text UNIQUE NOT NULL,
  label        text NOT NULL,
  descricao    text,
  categoria    text DEFAULT 'core',
  status       text DEFAULT 'ativo' CHECK (status IN ('ativo','beta','desativado')),
  icon         text,
  ordem        integer DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_modules (code, label, descricao, categoria, status, icon, ordem) VALUES
  ('core_engine',     'CORE ENGINE',       'Motor central de inteligência artificial', 'core',         'ativo', '⚙️',  1),
  ('bim_ops',         'BIM-OPS',           'Gestão BIM e operações em campo',          'gestao',       'ativo', '🏗️',  2),
  ('investimentos',   'INVESTIMENTOS',     'ROI, TIR, ESG e análise de portfólio',     'financeiro',   'ativo', '📈',  3),
  ('juridico',        'JURÍDICO',          'Contratos, compliance e due-diligence',    'legal',        'ativo', '⚖️',  4),
  ('director_cut',    'DIRECTOR CUT',      'Produção audiovisual e vídeos 4K',         'midia',        'ativo', '🎬',  5),
  ('archvis',         'ARCH-VIS',          'Visualização arquitetônica com IA',        'design',       'ativo', '🏛️',  6),
  ('us_brand',        'US BRAND',          'Identidade e ativos de marca EUA',         'marketing',    'ativo', '🇺🇸', 7),
  ('plantas',         'PLANTAS',           'Editor de plantas e floor plans',          'design',       'ativo', '📐',  8),
  ('bim_3d',          'BIM-3D',            'Modelo 3D com análise IA',                 'engenharia',   'ativo', '🔷',  9),
  ('rdo',             'RDO',               'Relatório Diário de Obra automatizado',    'gestao',       'ativo', '📋', 10)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 6. US BRAND — Ativos de Marca
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text NOT NULL,  -- 'color','font','logo','guideline','copy','social'
  nome         text NOT NULL,
  valor        text,           -- hex color, font-family, URL, etc.
  descricao    text,
  metadata     jsonb DEFAULT '{}',
  ativo        boolean DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO brand_assets (tipo, nome, valor, descricao) VALUES
  ('color', 'Primary Blue',    '#1E4B8F', 'Cor principal da marca'),
  ('color', 'Construction Red','#C0392B', 'Cor de destaque'),
  ('color', 'Concrete Gray',   '#7F8C8D', 'Cor neutra'),
  ('color', 'Safety Yellow',   '#F39C12', 'Cor de alerta'),
  ('font',  'Primary Font',    'Inter',   'Fonte principal'),
  ('font',  'Display Font',    'Playfair Display', 'Fonte de títulos'),
  ('guideline', 'Tagline EN',  'Building Tomorrow, Today', 'Tagline em inglês'),
  ('guideline', 'Tagline PT',  'Construindo o Amanhã, Hoje', 'Tagline em português')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. BIM-3D — Análises IA
-- ============================================================
CREATE TABLE IF NOT EXISTS bim3d_analyses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES projects(id) ON DELETE SET NULL,
  model_name   text,
  tipo_analise text,  -- 'clash','structural','sustainability','cost'
  prompt       text,
  resultado    text,
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. PLANTAS — Floor Plans
-- ============================================================
CREATE TABLE IF NOT EXISTS floor_plans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES projects(id) ON DELETE SET NULL,
  nome         text NOT NULL DEFAULT 'Planta Baixa',
  andar        integer DEFAULT 1,
  area_total   numeric(10,2),
  escala       text DEFAULT '1:50',
  elementos    jsonb DEFAULT '[]',  -- walls, doors, windows, rooms
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. JURÍDICO — Contratos e Análises
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           text NOT NULL,
  tipo             text DEFAULT 'servicos',
  partes           jsonb DEFAULT '[]',
  valor_contrato   numeric(15,2),
  data_inicio      date,
  data_fim         date,
  status           text DEFAULT 'rascunho' CHECK (status IN ('rascunho','ativo','vencido','cancelado')),
  conteudo         text,
  analise_ia       text,
  jurisdicao       text DEFAULT 'BR',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS due_diligence (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_nome     text NOT NULL,
  tipo_analise     text DEFAULT 'completa',
  resultado        text,
  score_risco      integer DEFAULT 0 CHECK (score_risco BETWEEN 0 AND 100),
  recomendacoes    text,
  status           text DEFAULT 'pendente',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_checks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa          text,
  norma            text,
  resultado        text,
  score            integer DEFAULT 0,
  itens            jsonb DEFAULT '[]',
  status           text DEFAULT 'pendente',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS básico — anon pode ler, autenticado pode tudo
-- ============================================================
ALTER TABLE investments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdo_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE archvis_projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE archvis_renders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analyses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_modules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim3d_analyses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_diligence      ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks  ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para usuários autenticados
DO $$ 
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['investments','rdo_reports','archvis_projects','archvis_renders',
    'video_projects','video_analyses','platform_modules','brand_assets','bim3d_analyses',
    'floor_plans','contracts','due_diligence','compliance_checks']
  LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "auth_all_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY IF NOT EXISTS "anon_read_%s" ON %I FOR SELECT TO anon USING (true)', tbl, tbl);
  END LOOP;
END $$;

