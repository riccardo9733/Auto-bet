
---

### 📄 File 3: `docs/DATABASE_AND_CRON.md` (Specifica SQL completa per Supabase)

Questo file fornisce a Google Jules lo schema completo del database, la vista analitica per il **Brier Score** e il **ROI**, i permessi RLS e i job `pg_cron`.

```markdown
# DATABASE_AND_CRON.md — Schema SQL Supabase, RLS e Job Schedulati

Questo documento contiene la specifica SQL completa da salvare in `supabase/migrations/20261015000000_init_schema.sql`.

## 1. Migrazione SQL Completa (`20261015000000_init_schema.sql`)

```sql
-- Estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 1. Tabella Alias Squadre (per Entity Resolution tra OpenFootAPI e The Odds API)
CREATE TABLE public.team_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  openfoot_name TEXT UNIQUE NOT NULL,
  odds_api_name TEXT NOT NULL,
  competition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabella Partite (Matches)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_openfoot_id TEXT UNIQUE NOT NULL,
  competition TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff_at TIMESTAMPTZ NOT NULL,
  program_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  home_score INT,
  away_score INT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_kickoff ON public.matches(kickoff_at);
CREATE INDEX idx_matches_status ON public.matches(status);

-- 3. Tabella Valutazioni Jev e Quote Candidati (Match Candidates)
CREATE TABLE public.match_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  candidate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  market_type TEXT NOT NULL CHECK (market_type IN ('HOME_WIN', 'AWAY_WIN', 'OVER_1_5', 'DOUBLE_CHANCE_1X', 'DOUBLE_CHANCE_X2')),
  bookmaker_name TEXT NOT NULL,
  bookmaker_odd NUMERIC(5,2) NOT NULL,
  implied_probability NUMERIC(5,4) GENERATED ALWAYS AS (ROUND(1.0 / bookmaker_odd, 4)) STORED,
  jev_probability NUMERIC(5,4) NOT NULL CHECK (jev_probability >= 0 AND jev_probability <= 1),
  jev_confidence NUMERIC(5,4) NOT NULL CHECK (jev_confidence >= 0 AND jev_confidence <= 1),
  upset_risk_score NUMERIC(3,2) NOT NULL CHECK (upset_risk_score >= 1.0 AND upset_risk_score <= 5.0),
  expected_value NUMERIC(6,4) GENERATED ALWAYS AS (ROUND((jev_probability * bookmaker_odd) - 1.0, 4)) STORED,
  outcome TEXT NOT NULL DEFAULT 'PENDING' CHECK (outcome IN ('PENDING', 'WON', 'LOST', 'VOID')),
  brier_component NUMERIC(6,4), -- Calcolato al settlement: (jev_probability - actual_outcome)^2
  raw_jev_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(match_id, market_type)
);

CREATE INDEX idx_candidates_date ON public.match_candidates(candidate_date);
CREATE INDEX idx_candidates_ev ON public.match_candidates(expected_value DESC);

-- 4. Tabella Schedina Giornaliera (Il Raddoppio a Quota ~2.00)
CREATE TABLE public.daily_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WON', 'LOST', 'VOID', 'NO_BET')),
  leg_1_candidate_id UUID REFERENCES public.match_candidates(id),
  leg_2_candidate_id UUID REFERENCES public.match_candidates(id),
  total_odd NUMERIC(5,2),
  joint_probability NUMERIC(5,4),
  joint_confidence NUMERIC(5,4),
  joint_ev NUMERIC(6,4),
  optimizer_score NUMERIC(6,4),
  stake_units NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  profit_units NUMERIC(6,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_slips_date ON public.daily_slips(slip_date DESC);

-- 5. Vista Analitica KPI (ROI, Win Rate, Brier Score di Calibrazione Jev)
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT
  COUNT(*) FILTER (WHERE status IN ('WON', 'LOST')) AS total_settled_slips,
  COUNT(*) FILTER (WHERE status = 'WON') AS won_slips,
  COUNT(*) FILTER (WHERE status = 'LOST') AS lost_slips,
  COUNT(*) FILTER (WHERE status = 'NO_BET') AS no_bet_days,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'WON')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('WON', 'LOST')), 0)) * 100, 2
  ) AS win_rate_pct,
  COALESCE(SUM(profit_units) FILTER (WHERE status IN ('WON', 'LOST')), 0) AS net_profit_units,
  ROUND(
    (COALESCE(SUM(profit_units) FILTER (WHERE status IN ('WON', 'LOST')), 0) /
    NULLIF(SUM(stake_units) FILTER (WHERE status IN ('WON', 'LOST')), 0)) * 100, 2
  ) AS roi_pct,
  (
    SELECT ROUND(AVG(brier_component), 4)
    FROM public.match_candidates
    WHERE outcome IN ('WON', 'LOST') AND brier_component IS NOT NULL
  ) AS global_brier_score
FROM public.daily_slips;

-- 6. Sicurezza: Row Level Security (RLS)
ALTER TABLE public.team_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on team_aliases" ON public.team_aliases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on matches" ON public.matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on match_candidates" ON public.match_candidates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on daily_slips" ON public.daily_slips
  FOR SELECT TO authenticated USING (true);
