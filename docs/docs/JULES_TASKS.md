
---

### 📄 File 4: `docs/JULES_TASKS.md` (Piano di Lavoro e Prompt per Google Jules)

Salva questo file nel repository: ti permette sia di dare a Jules una roadmap chiara, sia di copiare-incollare i singoli prompt nella finestra di Google Jules per fargli aprire Pull Request pulite e testate passo dopo passo.

```markdown
# JULES_TASKS.md — Roadmap di Implementazione per Google Jules

Questo documento suddivide la creazione della piattaforma **DoubleUp Jev** in **5 Task sequenziali** progettati specificamente per **Google Jules**. Esegui un task alla volta per garantire PR pulite e verificabili.

---

## Task 1: Scaffolding Next.js, Design Tokens (`DESIGN.md`) e App Shell

**Prompt da dare a Google Jules:**
> Leggi attentamente `AGENTS.md` e `DESIGN.md`. Inizializza e configura l'applicazione Next.js (App Router, TypeScript strict, Tailwind CSS, `shadcn/ui` stile `new-york`) e il file `netlify.toml`.
> 1. Configura `src/app/globals.css` con tutti i token colore HSL chiari e scuri (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `border`, `input`, `ring`, `sidebar`, `sidebar-accent`) esattamente come specificato in `DESIGN.md` §2 e §12, con `--radius: 0.25rem`.
> 2. Configura il font `Roboto` e il monospace in `src/app/layout.tsx` insieme al `ThemeProvider` (`next-themes`) per supportare chiaro/scuro alla pari.
> 3. Crea il registro centrale delle icone in `src/components/icons.tsx` usando `lucide-react` (`DESIGN.md` §7).
> 4. Costruisci l'App Shell in `src/app/(protected)/layout.tsx` seguendo `DESIGN.md` §8: Header fisso alto 48px (`bg-sidebar`), Sidebar comprimibile (256px / 48px solo icone con tooltip) e componente riutilizzabile `PageTitleBar` (sticky, min-h-16, bordo sotto, titolo 24px `font-normal` con azioni accanto al titolo).
> Verifica che non ci siano hex hardcoded, ombre sulle card o `font-bold`.

---

## Task 2: Database Schema, Tipi TypeScript e Autenticazione Supabase

**Prompt da dare a Google Jules:**
> Leggi `AGENTS.md`, `DESIGN.md` e `docs/DATABASE_AND_CRON.md`.
> 1. Crea la migrazione SQL in `supabase/migrations/20261015000000_init_schema.sql` copiando lo schema definito in `docs/DATABASE_AND_CRON.md`.
> 2. Crea i tipi TypeScript corrispondenti in `src/lib/types/database.types.ts` per le tabelle `matches`, `match_candidates`, `daily_slips`, `team_aliases` e la vista `analytics_summary`.
> 3. Implementa l'autenticazione Email/Password con `@supabase/ssr` (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts` e `src/middleware.ts`) proteggendo le rotte sotto `/dashboard` e `/analytics`.
> 4. Crea le pagine `/login` e `/register` in `src/app/(auth)/` rispettando rigorosamente `DESIGN.md` (card piatta con bordo 1px `border-border`, input alti 36px `rounded-md`, distanza tra campi 20px `gap-5`, un solo bottone primario per vista, gestione stati di errore in `text-destructive`).

---

## Task 3: Supabase Edge Functions (OpenFootAPI + The Odds API + Jev via OpenRouter)

**Prompt da dare a Google Jules:**
> Leggi `AGENTS.md`, `docs/analisi_tecnica.md` e `docs/DATABASE_AND_CRON.md`. Implementa il backend serverless in `supabase/functions/`:
> 1. `_shared/openfoot.ts`: Client tipizzato per scaricare le partite del giorno, classifiche e stato di forma da `OpenFootAPI` (`OPENFOOT_API_KEY`).
> 2. `_shared/odds-api.ts`: Client tipizzato per scaricare le quote dei mercati principali (`h2h`, `totals`) da `The Odds API` (`THE_ODDS_API_KEY`) filtrando quote nel range `[1.28, 1.60]`.
> 3. `_shared/openrouter-jev.ts`: Client che chiama `https://openrouter.ai/api/v1/chat/completions` con modello `typesafe/jev`, `temperature: 0` e `response_format` di tipo `json_schema` (`strict: true`) per ottenere probabilità calibrate (`1X2`, `over_1_5_goals`, `double_chance_1x`) e `upset_risk_score` (1-5).
> 4. `_shared/optimizer.ts`: Algoritmo combinatorio che filtra i candidati con `jev_confidence >= 0.75`, `upset_risk_score <= 2.2`, `expected_value > 0.02` e trova la coppia $(e_1, e_2)$ di partite diverse con quota totale $Q_1 \times Q_2 \in [1.85, 2.15]$ che massimizza lo score combinato. Se nessuna coppia è valida, imposta lo stato della schedina su `NO_BET`.
> 5. `generate-daily-slip/index.ts` e `settle-daily-slip/index.ts`: Entrypoint HTTP delle due Edge Functions che salvano e refertano i dati su Supabase PostgreSQL usando `SUPABASE_SERVICE_ROLE_KEY`.

---

## Task 4: Dashboard Operativa (`/dashboard`) — Raddoppio del Giorno e Ispezione Jev

**Prompt da dare a Google Jules:**
> Leggi `AGENTS.md` e `DESIGN.md` (§2, §3, §4, §6, §8, §12). Costruisci la pagina `src/app/(protected)/dashboard/page.tsx` (Server Component che legge da Supabase):
> 1. Barra titolo (`PageTitleBar`) con titolo "Raddoppio del giorno", badge outline della data corrente e bottone outline piccolo `[Aggiorna valutazione]` accanto al titolo.
> 2. Riga KPI in alto con 4 Card piatte (`Quota totale`, `Probabilità congiunta Jev`, `Expected Value congiunto`, `Indice di confidenza`): titolo 14px `text-muted-foreground font-medium`, valore 24px `font-normal` in monospace.
> 3. Componente `DailySlipCard`: mostra le 2 selezioni della schedina (Squadre, Competizione, Mercato, Quota Bookmaker vs Probabilità Calibrata Jev con barra `Progress` alta 8px, badge EV+ in tinta `success`). Se lo stato è `NO_BET`, mostra un componente `Alert` sobrio con tinta `warning` spiegando perché oggi non c'è valore matematico.
> 4. Componente `CandidatesTable`: tabella conforme a `DESIGN.md` §6 (header alto 40px, testo 12px `muted-foreground`, celle `px-3 py-2`, nessun bordo esterno, hover `bg-muted/50`, toolbar con filtro di ricerca) che elenca tutte le partite analizzate oggi da Jev.
> 5. Cliccando su una riga della tabella, apri un `MatchDrawer` laterale flottante (`DESIGN.md` §6 e §12: `inset-y-2 right-2 rounded-2xl border sm:max-w-md`) che mostra le coppie chiave/valore dello stato inviato a OpenFootAPI e il dettaglio completo delle probabilità calibrate restituite da `typesafe/jev`.

---

## Task 5: Pagina Analytics & Calibrazione (`/analytics`) + UI Audit Finale

**Prompt da dare a Google Jules:**
> Leggi `AGENTS.md` e `DESIGN.md`. Costruisci la pagina `src/app/(protected)/analytics/page.tsx`:
> 1. Interroga la vista `public.analytics_summary` e lo storico di `public.daily_slips`.
> 2. Mostra le Card KPI per `ROI %`, `Win Rate %`, `Profitto Netto (Unità)` e `Brier Score di Calibrazione Jev` (con `Tooltip` invertito `bg-foreground text-background` che spiega cosa misura il Brier Score).
> 3. Aggiungi un grafico dell'andamento del bankroll usando Recharts, rigorosamente monocromatico con il token `primary` (linea 100%, area 15% di opacità) come imposto da `DESIGN.md` §2.
> 4. Aggiungi la tabella storica delle schedine passate con badge di stato (`WON` in tinta `success`, `LOST` in tinta `destructive`, `NO_BET` in tinta `warning`).
> 5. Esegui la **Review della UI** completa su tutto il codice del repository seguendo i 9 punti di `DESIGN.md` §11 e correggi ogni eventuale violazione prima di chiudere il task.
