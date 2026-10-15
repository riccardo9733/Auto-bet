Analisi Funzionale: Piattaforma Web "DoubleUp Jev"
​1. Executive Summary e Visione del Prodotto
​DoubleUp Jev è una piattaforma web SaaS/Dashboard che genera automaticamente una schedina calcistica giornaliera ("Raddoppio") composta da 2 selezioni con quota complessiva intorno a 2.00 (range 1.85 - 2.15).
​La piattaforma combina:
​Dati Calcistici Strutturati: forniti da OpenFootAPI (calendari, stato di forma, classifiche, xG, Elo) e The Odds API (quote reali dei bookmaker).
​Intelligenza Decisionale Calibrata via OpenRouter: Jev di TypeSafe AI (modello System One addestrato con RLCD), interrogato tramite il gateway unificato OpenRouter per ottenere probabilità calibrate, prive di allucinazioni e con latenza ultra-bassa.
​Web Platform & Cloud Automation: Interfaccia web moderna costruita con Next.js, TailwindCSS e shadcn/ui (ospitata su Netlify), supportata da un backend serverless su Supabase (PostgreSQL, Supabase Auth, Edge Functions e pg_cron per l'esecuzione automatica in background).
​2. Analisi SWOT dell'Infrastruttura e del Prodotto
​Punti di Forza (Strengths)
​Automazione Background Disaccoppiata (Supabase Cron + Edge Functions): L'ingestione dei dati e le chiamate a Jev via OpenRouter girano sulle Edge Functions di Supabase innescate da pg_cron. Questo evita i limiti di timeout delle funzioni serverless di frontend (es. il limite di 10s su Netlify Free) e garantisce che la schedina sia pronta ogni mattina nel DB.
​Integrazione Jev semplificata tramite OpenRouter: Passare da OpenRouter permette di chiamare Jev (typesafe/jev) tramite un endpoint REST standardizzato, monitorare in tempo reale i consumi di token dalla dashboard di OpenRouter e gestire i crediti da un unico punto senza dover integrare SDK proprietari complessi su Deno.
​Calibrazione Epistemica con Jev (RLCD): Jev restituisce distribuzioni di probabilità reali e punteggi di confidenza tramite le primitive noul, choice e score in 70-500ms, permettendo un calcolo rigoroso dell'Expected Value (EV).
​UX/UI Finanziaria con shadcn/ui: L'uso di TailwindCSS e shadcn/ui permette di esporre all'utente non solo "cosa giocare", ma una vera dashboard analitica con barre di confidenza, confronto tra probabilità di Jev e probabilità implicita del bookmaker, e storico del ROI.
​Costo Infrastrutturale Zero in Avvio: I tier gratuiti di Supabase, Netlify, OpenFootAPI e The Odds API, uniti al costo irrisorio di Jev su OpenRouter ($0.042/MTok input, output gratis), permettono di mandare in produzione l'intera piattaforma a $0/mese.
​Punti Deboli (Weaknesses) e Mitigazioni
​Matching tra OpenFootAPI e Quote Bookmaker:
​Problema: I nomi delle squadre tra OpenFootAPI e il provider delle quote possono differire leggermente (es. "Inter Milan" vs "FC Internazionale").
​Mitigazione: Tabella di mapping (team_aliases) su Supabase PostgreSQL + algoritmo di normalizzazione basato su orario di inizio (kickoff_at) e similarità stringa nella Edge Function.
​Gestione dei Limiti API nel Tier Free:
​Problema: Evitare che gli utenti che ricaricano la pagina su Next.js consumino le chiamate di OpenFootAPI o il credito di OpenRouter.
​Mitigazione: Separazione netta Lettura/Scrittura. Gli utenti su Next.js leggono esclusivamente dal database PostgreSQL di Supabase. Solo il Cronjob di Supabase chiama OpenFootAPI e OpenRouter (1-2 volte al giorno).
​3. Esperienza Utente (User Journey) e Schermate
​3.1. Autenticazione (Supabase Auth)
​Login / Registrazione: Accesso tramite Email e Password gestito da @supabase/ssr con sessioni basate su cookie HTTP-only sicuri e protezione delle rotte tramite Next.js Middleware.
​3.2. Dashboard Principale (/dashboard)
​Hero Card - "Il Raddoppio di Oggi" (shadcn Card, Badge, Separator):
​Mostra le 2 partite selezionate, il mercato consigliato (es. Over 1.5, 1X, 1 Fisso), la quota singola e la Quota Totale (~2.00).
​Per ogni evento mostra: Probabilità Jev (es. 76.4%) vs Probabilità Bookmaker (es. 69.0%), Valore Atteso (EV+) e Confidence Badge.
​Stato speciale "No Bet Day": Se nessun raddoppio supera i criteri di sicurezza di Jev, la card mostra un avviso giallo spiegando che oggi il mercato non offre valore matematico.
​Tabella "Pool delle Candidate" (DataTable shadcn):
​Lista delle altre singole analizzate nella giornata da Jev con i relativi punteggi (upset_risk_score, probabilità choice e noul), utile per chi vuole costruire varianti manuali.
​Sezione Analytics & Track Record (/analytics):
​Grafici (shadcn Charts / Recharts) con l'andamento del bankroll virtuale, Win Rate % dei raddoppi, ROI % e Brier Score (metrica che certifica quanto le probabilità di Jev si stanno dimostrando precise nella realtà).
​4. Flusso dei Job Automatici in Background (Supabase Cron)
​Il sistema opera in totale autonomia grazie a 3 job schedulati su Supabase:
​Job 1 - morning-ingestion-and-jev (Ore 08:30 UTC):
​Scarica le partite del giorno e le statistiche da OpenFootAPI + le quote reali.
​Invia lo stato strutturato di tutte le partite a Jev tramite OpenRouter.
​Salva le valutazioni nel DB e calcola la coppia ottimale per il Raddoppio a Quota 2.00, pubblicando la schedina del giorno.
​Job 2 - pre-match-lineup-check (Opzionale / Piano Dev - Ogni ora):
​Controlla eventuali crolli di quota o assenze critiche nelle formazioni ufficiali prima del match.
​Job 3 - nightly-settlement (Ore 01:30 UTC):
​Interroga OpenFootAPI per i risultati finali delle partite del giorno precedente.
​Aggiorna lo stato delle scommesse (WON, LOST, VOID) e ricalcola le statistiche di performance e calibrazione nel DB.
​5. Requisiti Funzionali (RF)
​RF-01 (Autenticazione e RLS): Solo gli utenti autenticati tramite Supabase Auth possono visualizzare la schedina del giorno e il pool di analisi di Jev (garantito da Row Level Security su PostgreSQL).
​RF-02 (Filtro Qualità Jev): Ammissione al raddoppio solo per selezioni con quota 1.28 - 1.60, confidenza Jev \ge 0.75, upset_risk_score \le 2.2 e EV > +2\%.
​RF-03 (Trigger Manuale Admin): Un utente con ruolo admin può forzare il ricalcolo della schedina dalla dashboard tramite un pulsante che invoca direttamente la Supabase Edge Function.
