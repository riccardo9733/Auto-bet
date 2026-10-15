# Analisi Tecnica e Architetturale: Stack Next.js + Supabase + OpenRouter (Jev) + Netlify

## 1. Architettura di Sistema e Stack Tecnologico

| Layer | Tecnologia | Ruolo nel Progetto |
| :--- | :--- | :--- |
| **Frontend & SSR** | **Next.js 15 (App Router)** + TypeScript | Rendering ibrido (React Server Components), gestione rotte protette e dashboard utente. |
| **UI & Styling** | **TailwindCSS** + **shadcn/ui** + Lucide Icons | Componenti accessibili, tema Dark/Light nativo, grafici Recharts per ROI e calibrazione. |
| **Hosting Frontend** | **Netlify** (`@netlify/plugin-nextjs`) | Deploy continuo da GitHub, Edge Middleware per autenticazione, CDN globale. |
| **Database & Auth** | **Supabase (PostgreSQL + Auth)** | Persistenza di match, quote, predizioni Jev, schedine e gestione utenti Email/Password con RLS. |
| **Background Engine** | **Supabase Edge Functions (Deno)** + **`pg_cron`** | Orchestrazione serverless senza i limiti di timeout (10s) del piano base Netlify. |
| **AI Gateway & Model** | **OpenRouter** (`typesafe/jev`) | Accesso unificato al modello *System One* Jev per decisioni strutturate (`noul`, `choice`, `score`). |
| **Data Providers** | **OpenFootAPI** + **The Odds API** | Statistiche calcistiche, classifiche, form, xG e quote reali dei bookmaker. |

---

## 2. Diagramma del Flusso Architetturale

```text
[Supabase pg_cron (08:30 UTC)]
       │
       ▼ (HTTP POST via pg_net)
[Supabase Edge Function: generate-daily-slip]
       ├──► 1. Fetch Fixtures & Stats ──► [OpenFootAPI]
       ├──► 2. Fetch Market Odds      ──► [The Odds API]
       ├──► 3. Parallel Evaluation    ──► [OpenRouter API (model: typesafe/jev)]
       └──► 4. Run Combinatorial Optimizer (Target Quota ~2.00)
                   │
                   ▼ (Upsert)
       [Supabase PostgreSQL DB] (Tables: matches, match_candidates, daily_slips)
                   ▲
                   │ (Server Components Query + RLS via @supabase/ssr)
       [Next.js App on Netlify] ◄───► [Utente Autenticato (Email/Password)]
```

---

## 3. Schema del Database (Supabase PostgreSQL + RLS)

Di seguito il DDL SQL da eseguire nel SQL Editor di Supabase per creare la struttura dati e attivare la sicurezza:

```sql
-- 1. Tabella Partite e Stato Iniziale
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_openfoot_id TEXT UNIQUE NOT NULL,
  competition TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff_at TIMESTAMPTZ NOT NULL,
  program_state JSONB NOT NULL, -- Stato strutturato (form, classifica, gol, xG) passato a Jev
  home_score INT,
  away_score INT,
  status TEXT DEFAULT 'SCHEDULED', -- SCHEDULED, FINISHED, POSTPONED
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabella Valutazioni Jev e Quote Mercato
CREATE TABLE public.match_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  market_type TEXT NOT NULL,        -- es. 'OVER_1_5', 'HOME_WIN', 'DOUBLE_CHANCE_1X'
  bookmaker_name TEXT NOT NULL,
  bookmaker_odd NUMERIC(5,2) NOT NULL,
  jev_probability NUMERIC(5,4) NOT NULL, -- es. 0.7640 (76.4%)
  jev_confidence NUMERIC(5,4) NOT NULL,  -- es. 0.8500
  upset_risk_score NUMERIC(3,2) NOT NULL,-- es. 1.80 (scala 1-5)
  expected_value NUMERIC(6,4) NOT NULL,  -- (jev_probability * bookmaker_odd) - 1
  raw_jev_response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabella Schedina Giornaliera (Il Raddoppio a Quota ~2.00)
CREATE TABLE public.daily_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'WON', 'LOST', 'NO_BET'
  leg_1_candidate_id UUID REFERENCES public.match_candidates(id),
  leg_2_candidate_id UUID REFERENCES public.match_candidates(id),
  total_odd NUMERIC(5,2),
  joint_probability NUMERIC(5,4),
  joint_ev NUMERIC(6,4),
  combined_score NUMERIC(6,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Abilitazione Row Level Security (RLS)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_slips ENABLE ROW LEVEL SECURITY;

-- Policy: Qualsiasi utente loggato (Supabase Auth) può leggere i dati
CREATE POLICY "Allow read to authenticated users" ON public.matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read to authenticated users" ON public.match_candidates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read to authenticated users" ON public.daily_slips
  FOR SELECT TO authenticated USING (true);
-- Nota: Le scritture avvengono solo tramite Edge Function con SUPABASE_SERVICE_ROLE_KEY (bypassa RLS).
```

---

## 4. Integrazione di Jev tramite OpenRouter (nella Supabase Edge Function)

Usando **OpenRouter** dentro la Edge Function Deno di Supabase, possiamo invocare `typesafe/jev` sfruttando le chiamate parallele `fetch` native o l'SDK OpenAI configurato con il `baseURL` di OpenRouter (`https://openrouter.ai/api/v1`).

### Esempio di Client OpenRouter per Jev (`supabase/functions/_shared/openrouter-jev.ts`)

```typescript
export interface MatchProgramState {
  matchId: string;
  competition: string;
  homeTeam: {
    name: string;
    tablePosition: number;
    last5Form: string;
    goalsScoredAvg: number;
    goalsConcededAvg: number;
    xgAvg?: number;
  };
  awayTeam: {
    name: string;
    tablePosition: number;
    last5Form: string;
    goalsScoredAvg: number;
    goalsConcededAvg: number;
    xgAvg?: number;
  };
}

export interface JevEvaluationResult {
  match_outcome_1x2: {
    value: "HOME_WIN" | "DRAW" | "AWAY_WIN";
    probabilities: { HOME_WIN: number; DRAW: number; AWAY_WIN: number };
    confidence: number;
  };
  over_1_5_goals: { probability: number; confidence: number };
  double_chance_1x: { probability: number; confidence: number };
  upset_risk_score: { score: number; confidence: number };
}

export async function evaluateMatchWithJev(
  state: MatchProgramState,
  openRouterApiKey: string
): Promise<JevEvaluationResult> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://doubleup-jev.netlify.app", // Richiesto da OpenRouter per il ranking/tracking
      "X-Title": "DoubleUp Jev Betting Engine",
    },
    body: JSON.stringify({
      model: "typesafe/jev",
      // Passiamo lo stato del match e lo schema delle primitive System One (choice, noul, score)
      messages: [
        {
          role: "system",
          content: "Evaluate the football match state using calibrated probabilities (noul, choice, score)."
        },
        {
          role: "user",
          content: JSON.stringify(state)
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "jev_match_decision",
          strict: true,
          schema: {
            type: "object",
            properties: {
              match_outcome_1x2: {
                type: "object",
                description: "primitive:choice - 1X2 match winner distribution",
                properties: {
                  value: { type: "string", enum: ["HOME_WIN", "DRAW", "AWAY_WIN"] },
                  probabilities: {
                    type: "object",
                    properties: {
                      HOME_WIN: { type: "number" },
                      DRAW: { type: "number" },
                      AWAY_WIN: { type: "number" }
                    },
                    required: ["HOME_WIN", "DRAW", "AWAY_WIN"],
                    additionalProperties: false
                  },
                  confidence: { type: "number" }
                },
                required: ["value", "probabilities", "confidence"],
                additionalProperties: false
              },
              over_1_5_goals: {
                type: "object",
                description: "primitive:noul - Will total match goals be 2 or more?",
                properties: {
                  probability: { type: "number" },
                  confidence: { type: "number" }
                },
                required: ["probability", "confidence"],
                additionalProperties: false
              },
              double_chance_1x: {
                type: "object",
                description: "primitive:noul - Will home team win or draw?",
                properties: {
                  probability: { type: "number" },
                  confidence: { type: "number" }
                },
                required: ["probability", "confidence"],
                additionalProperties: false
              },
              upset_risk_score: {
                type: "object",
                description: "primitive:score(1..5) - Risk of unexpected upset or high variance",
                properties: {
                  score: { type: "number" },
                  confidence: { type: "number" }
                },
                required: ["score", "confidence"],
                additionalProperties: false
              }
            },
            required: [
              "match_outcome_1x2",
              "over_1_5_goals",
              "double_chance_1x",
              "upset_risk_score"
            ],
            additionalProperties: false
          }
        }
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter Jev Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as JevEvaluationResult;
}
```

---

## 5. Automazione con `pg_cron` e Formula Combinatoria

### 5.1. Schedulazione in PostgreSQL (`pg_cron` + `pg_net`)
Abilitando le estensioni `pg_cron` e `pg_net` su Supabase, si programma il trigger mattutino:

```sql
SELECT cron.schedule(
  'generate-daily-doubleup',
  '30 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/generate-daily-slip',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 5.2. Ottimizzazione Combinatoria per Quota 2.00
Una volta che la Edge Function ha ottenuto in parallelo (`Promise.all`) le valutazioni di Jev da OpenRouter per le partite del giorno:
1. Filtra le singole valide con:
   * Quota bookmaker $Q(e) \in [1.28, 1.60]$
   * Confidenza $C_{Jev}(e) \ge 0.75$
   * Rischio sorpresa $\text{upset\_risk\_score} \le 2.2$
   * Valore Atteso singolo $EV(e) = (P_{Jev}(e) \times Q(e)) - 1 > 0.02$
2. Calcola per ogni coppia di partite distinte $(e_i, e_j)$ con $Q_{tot} = Q(e_i) \times Q(e_j) \in [1.85, 2.15]$:
   $$\text{Score}(e_i, e_j) = EV_{tot} \times \sqrt{C_{Jev}(e_i) \cdot C_{Jev}(e_j)} - 0.15 \cdot |Q_{tot} - 2.00|$$
3. Salva la coppia con lo Score più alto nella tabella `daily_slips`.

---

## 6. Struttura del Progetto Next.js + shadcn/ui + Supabase

```text
doubleup-jev/
├── netlify.toml                          # Configurazione build e plugin Next.js per Netlify
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 20261015000000_init_schema.sql # Tabelle, RLS e pg_cron
│   └── functions/
│       ├── _shared/
│       │   └── openrouter-jev.ts         # Client tipizzato per chiamare typesafe/jev su OpenRouter
│       ├── generate-daily-slip/          # Edge Function mattutina (OpenFoot + Odds + OpenRouter)
│       │   └── index.ts
│       └── settle-daily-slip/            # Edge Function notturna (Risultati e calcolo ROI)
│           └── index.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx            # Form Email/Password con shadcn Form + Supabase Auth
│   │   │   └── register/page.tsx
│   │   ├── (protected)/
│   │   │   ├── dashboard/page.tsx        # Server Component: mostra la Schedina del Giorno
│   │   │   └── analytics/page.tsx        # Storico scommesse, Win Rate e Brier Score
│   │   ├── auth/callback/route.ts        # Gestione conferma email Supabase
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                           # Componenti shadcn/ui (card, badge, progress, table...)
│   │   ├── slip-card.tsx                 # Visualizzatore del Raddoppio a Quota 2.00
│   │   └── candidate-table.tsx           # Tabella di tutte le partite valutate da Jev
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # createBrowserClient (@supabase/ssr)
│   │   │   ├── server.ts                 # createServerClient per RSC e Server Actions
│   │   │   └── middleware.ts             # Refresh token e protezione rotte /dashboard
│   │   └── types/
│   │       └── database.types.ts         # Tipi generati automaticamente da Supabase CLI
│   └── middleware.ts                     # Next.js Middleware per reindirizzare utenti non loggati
├── package.json
└── tsconfig.json
```

---

## 7. Configurazione Deploy e Variabili d'Ambiente

### `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "22"
```

### Variabili d'Ambiente:
* **Su Netlify (Frontend Next.js):**
  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* **Su Supabase Secrets (`supabase secrets set ...` per le Edge Functions):**
  * `OPENFOOT_API_KEY`
  * `THE_ODDS_API_KEY`
  * `OPENROUTER_API_KEY` *(usata per chiamare `typesafe/jev`)*
  * `SUPABASE_SERVICE_ROLE_KEY`