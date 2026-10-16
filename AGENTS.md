
---

### 📄 File 2: `AGENTS.md` (Il file guida primario per Google Jules)

IMPORTANTE - REGOLE ANTI-BLOCCO TERMINALE:
1. NON eseguire MAI `npx create-next-app` o `npx shadcn init` da terminale (la directory non è vuota e le CLI interattive bloccano la tua shell in attesa di input).
2. Inizializza il progetto scrivendo direttamente i file di configurazione sul filesystem usando i tuoi file tools.

Esegui esattamente questi passaggi:
1. Crea `package.json` con Next.js 15, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/postcss`), `lucide-react`, `next-themes`, `clsx`, `tailwind-merge` e `class-variance-authority`.
2. Crea `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` e `netlify.toml`.
3. Crea `src/lib/utils.ts` (con la funzione `cn`), `src/components/icons.tsx` (esportando le icone base da `lucide-react`), `src/app/globals.css` (con i token HSL chiari/scuri di `DESIGN.md` §2 e §12) e `src/app/layout.tsx` + `src/app/page.tsx` (con un semplice redirect o pagina placeholder).
4. Solo DOPO aver scritto tutti questi file, esegui nel terminale `npm install --no-audit --no-fund` e verifica con `npx tsc --noEmit`.
5. Non eseguire mai `npm run dev` (blocca il processo). Usa solo `npm run build` per testare, poi fai il commit.
6. 

Metti questo file nella **root del progetto**. Google Jules e gli altri coding agent leggono automaticamente `AGENTS.md` per capire contesto, vincoli architetturali e standard qualitativi.

```markdown
# AGENTS.md — Istruzioni Operative per Google Jules (Coding Agent)

Benvenuto nel repository di **DoubleUp Jev**. Prima di scrivere, modificare o revisionare qualsiasi file, **DEVI leggere e rispettare rigorosamente** questo documento e i file di specifica associati:
1. `DESIGN.md` — Sistema di design, token colore HSL, layout estilo Cloud Console, tipografia e regole UI/UX.
2. `docs/analisi_funzionale.md` — Logica di business, strategia del Raddoppio a quota 2.00 e requisiti funzionali.
3. `docs/analisi_tecnica.md` — Architettura Next.js + Supabase + OpenFootAPI + OpenRouter (`typesafe/jev`).
4. `docs/DATABASE_AND_CRON.md` — Schema SQL, RLS policies e job schedulati `pg_cron`.

---

## 1. Architettura e Regole Inviolabili (Hard Constraints)

### 1.1. Disaccoppiamento Frontend / Background Engine
- **DIVIETO ASSOLUTO di chiamare API esterne dal Frontend Next.js:** Le API di `OpenFootAPI`, `The Odds API` e `OpenRouter (typesafe/jev)` **NON** devono mai essere chiamate dentro React Server Components, Client Components o API Routes di Next.js (per evitare il timeout di 10s di Netlify Free e non bruciare i rate-limit).
- **Lettura Pura su Next.js:** L'app Next.js legge esclusivamente dal database PostgreSQL di Supabase usando `@supabase/ssr` con sessione autenticata.
- **Scrittura nelle Supabase Edge Functions:** Tutta la logica di ingestione dati, invocazione parallela di `typesafe/jev` tramite OpenRouter e calcolo combinatorio della schedina a quota ~2.00 risiede in `supabase/functions/` ed è attivata da `pg_cron` (o da un trigger manuale riservato agli admin che invoca la Edge Function).

### 1.2. Regole di Design System (`DESIGN.md`)
- **Zero colori hardcoded:** Non usare mai classi Tailwind come `bg-blue-600`, `text-gray-500`, `bg-white`, `bg-black` o codici hex nei componenti. Usa **esclusivamente** i token semantici definiti in `DESIGN.md` (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-success`, `text-destructive`, `text-warning`).
- **Niente ombre sulle Card:** Le card usano `rounded-lg border border-border bg-card p-4` senza alcuna classe `shadow-*`.
- **Niente grassetti pesanti:** Non usare mai `font-bold` (700) o `font-extrabold` (800). Usa solo `font-normal` (400), `font-medium` (500) o `font-semibold` (600). I titoli di pagina sono sempre `text-2xl font-normal`.
- **Raggi squadrati:** `--radius: 0.25rem` (4px per card/dialog con `rounded-lg`, 2px per bottoni/input con `rounded-md`).
- **Registro Centrale delle Icone:** Non importare mai icone da `lucide-react` direttamente nelle pagine o nei componenti. Esporta tutte le icone necessarie da `src/components/icons.tsx` e importale da lì.
- **Bordi espliciti (Tailwind v4):** Scrivi sempre `border border-border` o `border border-input`, mai `border` da solo.

### 1.3. Type-Safety e Modellazione Jev (OpenRouter)
- `strict: true` in `tsconfig.json`. Nessun uso di `any` (`noImplicitAny`).
- Quando chiami `typesafe/jev` su OpenRouter (`https://openrouter.ai/api/v1/chat/completions`), usa sempre `temperature: 0` e `response_format: { type: "json_schema", json_schema: { strict: true, ... } }`.
- Valida tutti gli input provenienti da API esterne tramite **Zod**.

---

## 2. Convenzioni di Codice e Struttura Directory

```text
/
├── AGENTS.md                        # Questo file (istruzioni per l'agente)
├── DESIGN.md                        # Regole rigorose di UI/UX e token CSS
├── netlify.toml                     # Configurazione deploy Netlify (@netlify/plugin-nextjs)
├── docs/
│   ├── analisi_funzionale.md
│   ├── analisi_tecnica.md
│   ├── DATABASE_AND_CRON.md
│   └── JULES_TASKS.md
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 20261015000000_init_schema.sql
│   └── functions/
│       ├── _shared/
│       │   ├── supabase-admin.ts    # Client con SUPABASE_SERVICE_ROLE_KEY
│       │   ├── openfoot.ts          # Fetcher tipizzato per OpenFootAPI
│       │   ├── odds-api.ts          # Fetcher tipizzato per The Odds API
│       │   ├── openrouter-jev.ts    # Client per typesafe/jev via OpenRouter
│       │   └── optimizer.ts         # Algoritmo combinatorio Raddoppio Quota ~2.00
│       ├── generate-daily-slip/
│       │   └── index.ts             # Edge Function mattutina (08:30 UTC)
│       └── settle-daily-slip/
│           └── index.ts             # Edge Function notturna (01:30 UTC)
└── src/
    ├── app/
    │   ├── globals.css              # Token HSL :root e .dark come da DESIGN.md §2 e §12
    │   ├── layout.tsx               # Font Roboto + ThemeProvider (next-themes)
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   └── (protected)/
    │       ├── layout.tsx           # App Shell: Header fisso 48px + Sidebar 256px/48px
    │       ├── dashboard/page.tsx   # Vista principale: Schedina del Giorno + Tabella Candidate
    │       └── analytics/page.tsx   # KPI Cards (ROI, Win Rate, Brier Score) + Storico
    ├── components/
    │   ├── icons.tsx                # Registro unico icone Lucide
    │   ├── ui/                      # Componenti shadcn/ui conformi a DESIGN.md
    │   ├── layout/
    │   │   ├── app-header.tsx       # Header 48px (bg-sidebar)
    │   │   ├── app-sidebar.tsx      # Sidebar comprimibile
    │   │   └── page-title-bar.tsx   # Barra titolo sticky >= 64px con azioni accanto al titolo
    │   └── betting/
    │       ├── daily-slip-card.tsx  # Card del Raddoppio (o banner warning "No Bet Day")
    │       ├── candidates-table.tsx # Tabella densa delle singole valutate da Jev
    │       └── match-drawer.tsx     # Drawer laterale flottante (rounded-2xl) con JSON e metriche Jev
    └── lib/
        ├── supabase/
        │   ├── client.ts
        │   ├── server.ts
        │   └── middleware.ts
        ├── types/
        │   └── database.types.ts
        └── utils.ts
