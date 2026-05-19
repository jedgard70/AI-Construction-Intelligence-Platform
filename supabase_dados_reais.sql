-- ============================================================
-- Dados reais para os 4 projetos + budget_items (Curva S)
-- Cole no SQL Editor do Supabase e execute
-- ============================================================

-- ─── 1. Atualiza KPIs dos projetos ───────────────────────────

UPDATE projects SET
  budget_planned   = 12400000,
  budget_actual    = 12100000,
  budget_earned    = 12900000,
  cpi              = 1.02,
  spi              = 1.04,
  eac              = 12200000,
  vac              = 200000,
  tcpi             = 0.98,
  completion_pct   = 82,
  esg_score        = 81
WHERE code = 'OBR-2026-001';

UPDATE projects SET
  budget_planned   = 18700000,
  budget_actual    = 20600000,
  budget_earned    = 16700000,
  cpi              = 0.81,
  spi              = 0.88,
  eac              = 23100000,
  vac              = -4400000,
  tcpi             = 1.18,
  completion_pct   = 55,
  esg_score        = 78
WHERE code = 'OBR-2026-002';

UPDATE projects SET
  budget_planned   = 9100000,
  budget_actual    = 9800000,
  budget_earned    = 9000000,
  cpi              = 0.92,
  spi              = 0.79,
  eac              = 9900000,
  vac              = -800000,
  tcpi             = 1.08,
  completion_pct   = 38,
  esg_score        = 69
WHERE code = 'OBR-2026-003';

UPDATE projects SET
  budget_planned   = 8100000,
  budget_actual    = 7900000,
  budget_earned    = 8000000,
  cpi              = 0.99,
  spi              = 0.97,
  eac              = 8200000,
  vac              = -100000,
  tcpi             = 1.01,
  completion_pct   = 71,
  esg_score        = 72
WHERE code = 'OBR-2026-004';

-- ─── 2. Insere budget_items (Curva S) para cada projeto ──────
-- Pega os IDs dos projetos para usar nas inserções

DO $$
DECLARE
  id1 UUID; id2 UUID; id3 UUID; id4 UUID;
BEGIN

  SELECT id INTO id1 FROM projects WHERE code = 'OBR-2026-001';
  SELECT id INTO id2 FROM projects WHERE code = 'OBR-2026-002';
  SELECT id INTO id3 FROM projects WHERE code = 'OBR-2026-003';
  SELECT id INTO id4 FROM projects WHERE code = 'OBR-2026-004';

  -- ── Ponte Av. Central (OBR-2026-001) ──────────────────────
  INSERT INTO budget_items (project_id, period, pv, ev, ac, cost_labor, cost_materials, cost_equipment, cost_third_party, cost_other)
  VALUES
    (id1, '2026-01-01', 1500000, 1450000, 1400000, 700000, 450000, 150000, 80000, 20000),
    (id1, '2026-02-01', 3200000, 3100000, 3000000, 1500000, 950000, 320000, 180000, 50000),
    (id1, '2026-03-01', 5800000, 5700000, 5600000, 2800000, 1700000, 580000, 320000, 100000),
    (id1, '2026-04-01', 8900000, 8800000, 8600000, 4300000, 2600000, 890000, 510000, 100000),
    (id1, '2026-05-01', 12400000, 12900000, 12100000, 6000000, 3700000, 1240000, 1260000, 200000)
  ON CONFLICT (project_id, period) DO UPDATE SET
    pv=EXCLUDED.pv, ev=EXCLUDED.ev, ac=EXCLUDED.ac,
    cost_labor=EXCLUDED.cost_labor, cost_materials=EXCLUDED.cost_materials,
    cost_equipment=EXCLUDED.cost_equipment, cost_third_party=EXCLUDED.cost_third_party,
    cost_other=EXCLUDED.cost_other;

  -- ── Torre B Comercial (OBR-2026-002) ──────────────────────
  INSERT INTO budget_items (project_id, period, pv, ev, ac, cost_labor, cost_materials, cost_equipment, cost_third_party, cost_other)
  VALUES
    (id2, '2026-01-01', 2000000, 1800000, 2100000, 1000000, 600000, 200000, 250000, 50000),
    (id2, '2026-02-01', 4500000, 4000000, 5000000, 2200000, 1400000, 500000, 800000, 100000),
    (id2, '2026-03-01', 8000000, 7000000, 9000000, 4000000, 2500000, 800000, 1500000, 200000),
    (id2, '2026-04-01', 13000000, 11000000, 15000000, 6500000, 4000000, 1300000, 2900000, 300000),
    (id2, '2026-05-01', 18700000, 16700000, 20600000, 9000000, 5800000, 1870000, 3630000, 300000)
  ON CONFLICT (project_id, period) DO UPDATE SET
    pv=EXCLUDED.pv, ev=EXCLUDED.ev, ac=EXCLUDED.ac,
    cost_labor=EXCLUDED.cost_labor, cost_materials=EXCLUDED.cost_materials,
    cost_equipment=EXCLUDED.cost_equipment, cost_third_party=EXCLUDED.cost_third_party,
    cost_other=EXCLUDED.cost_other;

  -- ── Usina Hidrelétrica Paraná (OBR-2026-003) ──────────────
  INSERT INTO budget_items (project_id, period, pv, ev, ac, cost_labor, cost_materials, cost_equipment, cost_third_party, cost_other)
  VALUES
    (id3, '2026-01-01', 1200000, 900000, 1100000, 550000, 350000, 180000, 120000, 0),
    (id3, '2026-02-01', 2800000, 2000000, 2700000, 1300000, 800000, 400000, 200000, 0),
    (id3, '2026-03-01', 5000000, 3800000, 5200000, 2500000, 1500000, 700000, 500000, 0),
    (id3, '2026-04-01', 7200000, 5800000, 7600000, 3600000, 2200000, 1000000, 800000, 0),
    (id3, '2026-05-01', 9100000, 7000000, 9800000, 4600000, 2800000, 1400000, 1000000, 0)
  ON CONFLICT (project_id, period) DO UPDATE SET
    pv=EXCLUDED.pv, ev=EXCLUDED.ev, ac=EXCLUDED.ac,
    cost_labor=EXCLUDED.cost_labor, cost_materials=EXCLUDED.cost_materials,
    cost_equipment=EXCLUDED.cost_equipment, cost_third_party=EXCLUDED.cost_third_party,
    cost_other=EXCLUDED.cost_other;

  -- ── BR-163 Trecho 4 (OBR-2026-004) ───────────────────────
  INSERT INTO budget_items (project_id, period, pv, ev, ac, cost_labor, cost_materials, cost_equipment, cost_third_party, cost_other)
  VALUES
    (id4, '2026-01-01', 900000, 870000, 850000, 400000, 280000, 120000, 50000, 0),
    (id4, '2026-02-01', 2100000, 2050000, 1980000, 950000, 650000, 280000, 100000, 0),
    (id4, '2026-03-01', 3800000, 3750000, 3600000, 1700000, 1200000, 500000, 200000, 0),
    (id4, '2026-04-01', 5800000, 5700000, 5500000, 2600000, 1800000, 800000, 300000, 0),
    (id4, '2026-05-01', 8100000, 8000000, 7900000, 3600000, 2500000, 1100000, 800000, 0)
  ON CONFLICT (project_id, period) DO UPDATE SET
    pv=EXCLUDED.pv, ev=EXCLUDED.ev, ac=EXCLUDED.ac,
    cost_labor=EXCLUDED.cost_labor, cost_materials=EXCLUDED.cost_materials,
    cost_equipment=EXCLUDED.cost_equipment, cost_third_party=EXCLUDED.cost_third_party,
    cost_other=EXCLUDED.cost_other;

END $$;

-- ─── 3. Verifica resultados ───────────────────────────────────
SELECT code, completion_pct, cpi, spi, budget_planned, budget_actual, eac, vac
FROM projects ORDER BY code;

SELECT p.code, bi.period_label, bi.pv, bi.ev, bi.ac
FROM budget_items_view bi
JOIN projects p ON p.id = bi.project_id
ORDER BY p.code, bi.period;
