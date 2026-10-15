# DESIGN.md — Standard UI e Design System di Progetto

Standard di design per l'applicazione web **DoubleUp Jev**, **indipendente dallo stack**. Da dare a un'IA (es. Google Jules) o a uno sviluppatore quando crea l'applicazione o una schermata, e quando fa la review della UI.

Descrive *cosa* si vede (colori, forme, gerarchia, comportamento), non *come* si implementa.
Per questo progetto lo stack utilizza **Tailwind CSS + shadcn/ui** con una mappatura pronta in §12.

**Carattere in una riga:** console amministrativa e analitica sobria (stile Google Cloud Console) — superfici piatte, bordi sottili grigio-blu, angoli quasi squadrati, un solo colore d'accento blu, titoli leggeri, densità medio-alta, tema chiaro e scuro alla pari.

---

## 1. Principi

1. **Token, non colori.** Ogni colore viene da un token semantico (§2). Mai un hex o un colore di palette scritto nel componente.
2. **Chiaro e scuro alla pari.** Ogni schermata funziona in entrambi i temi cambiando solo i valori dei token, senza eccezioni per componente.
3. **Piatto.** Le zone si separano con bordi da 1px, non con ombre o sfondi colorati. Le ombre sono riservate a ciò che galleggia sopra la pagina (overlay).
4. **Un solo accento.** Il blu `primary` indica l'azione e la selezione. Rosso/verde/arancio solo per stati (errore/scommessa persa, successo/scommessa vinta o EV+, avviso/No Bet), mai decorativi.
5. **Leggero.** Titoli di peso normale, niente grassetti pesanti; la gerarchia si fa con dimensione e colore del testo.
6. **Riuso prima di tutto.** Se un componente o un pattern di pagina esiste già nel progetto, si usa quello. Due schermate che fanno la stessa cosa devono apparire uguali.
7. **Niente decorazione.** Nessuna animazione d'ingresso, nessun gradiente, nessuna illustrazione nelle schermate operative.

---

## 2. Colori

Ogni token ha una coppia sfondo/testo (`X` / `X-foreground`) dove serve. I valori HSL sono la fonte; l'hex è indicativo.

| Token | Chiaro | Scuro | Uso |
|---|---|---|---|
| `background` | `#FFFFFF` (0 0% 100%) | `#0E1320` (222 40% 9%) | Sfondo pagina |
| `foreground` | `#0F1729` (222 47% 11%) | `#F9FAFB` (210 20% 98%) | Testo principale |
| `card` | `#FFFFFF` | `#161D2D` (222 35% 13%) | Card, pannelli |
| `popover` | `#FFFFFF` | `#161D2D` (222 35% 13%) | Menu, popover, toast |
| `primary` | `#2963E0` (221 75% 52%) | `#5A8AF2` (221 85% 65%) | CTA, link, selezione, focus |
| `primary-foreground` | `#FFFFFF` | `#0F1729` | Testo su primary |
| `secondary` | `#F3F4F6` (220 14% 96%) | `#202B3C` (217 30% 18%) | Chip, track di progress |
| `muted` | `#F3F4F6` (220 14% 96%) | `#1F2633` (217 25% 16%) | Hover righe, sfondi tenui |
| `muted-foreground` | `#6B7280` (220 9% 46%) | `#98A3B3` (217 15% 65%) | Label, testo secondario, meta |
| `accent` | `#F3F4F6` (220 14% 96%) | `#222B39` (217 25% 18%) | Hover di voci/bottoni neutri |
| `destructive` | `#F44034` (4 90% 58%) | `#E44E44` (4 75% 58%) | Errori, eliminazione, esito LOST |
| `success` | `#4CAE4F` (122 39% 49%) | `#4B9B4D` (122 35% 45%) | Esiti positivi, esito WON, EV+ |
| `warning` | `#DB7706` (32 95% 44%) | `#F6AE31` (38 92% 58%) | Avvisi, stato PENDING / NO BET |
| `border` / `input` | `#E5E7EB` (220 13% 91%) | `#263040` (217 25% 20%) | Bordi, bordi dei campi |
| `ring` | = primary | = primary | Anello di focus |
| `sidebar` | `#F5F9FF` (216 100% 98%) | `#161D2D` (222 35% 13%) | Sidebar e header app |
| `sidebar-accent` | `#E4EEFB` (215 75% 94%) | `#263040` (217 25% 20%) | Voce di menu attiva/hover |
| `sidebar-accent-foreground` | = primary | `#89ABF5` (221 85% 75%) | Testo voce attiva |

Testo su `destructive` / `success` / `warning` pieni: bianco.

**Colori derivati, senza inventarne di nuovi:**
- Tinte: il token con opacità (`primary` al 10–15% per evidenziare, `destructive` al 10% per sfondi d'errore).
- Grafici: un solo colore (`primary`) a intensità decrescente (100% / 60% / 30%); aree al 15%.
- Avvisi/toast colorati: sfondo = 14% del colore di stato mescolato con `popover`, bordo e testo al 60%. Evita il fill pieno con testo bianco, che scende sotto il contrasto 4.5:1.
- Overlay dei modali: nero al 50%. È l'unico nero ammesso.
- Colore senza token (es. sfondo header `#F5F9FF`): ammesso solo se ha il suo valore esplicito anche per il tema scuro. Se si usa più di una volta, diventa un token.

---

## 3. Tipografia

Font: **Roboto**, fallback `system-ui, -apple-system, 'Segoe UI', sans-serif`, antialiasing attivo. Monospace (per quote numeriche, ID, probabilità e JSON): `source-code-pro, Menlo, Monaco, Consolas`.

| Ruolo | Dimensione | Peso | Colore |
|---|---|---|---|
| Titolo pagina | 24px | 400 (normale) | foreground, una riga troncata |
| Numero KPI (es. Quota Totale, ROI%) | 24px | 400 | foreground |
| Titolo dialog | 18px, interlinea 1 | 600 | foreground |
| Titolo card | 16px (14px per card KPI) | 600 (500 per KPI, colore muted) | foreground |
| Corpo, controlli, celle | 14px | 400 | foreground |
| Label di un campo | 14px | 500 | foreground |
| Label chiave/valore in lettura | 12px | 400 | muted-foreground, sopra il valore |
| Intestazione tabella | 12px | 500 | muted-foreground, no a capo |
| Descrizioni, placeholder, meta | 14px / 12px | 400 | muted-foreground |
| Errore di un campo | 14px | 400 | destructive |
| Badge | 12px, interlinea 20px | 500 | secondo variante |

Pesi ammessi: 400, 500, 600. **Mai 700+.** Titoli di pagina mai in grassetto.

---

## 4. Forma

**Raggi** (base 4px):

| Valore | Dove |
|---|---|
| 4px | Card, dialog, alert, contenitore tabella |
| 2px | Bottoni, campi, select, popover, menu, tooltip, voci di sidebar |
| 0 | Voci dentro un menu a tendina |
| pill | Badge, bottoni solo-icona (tondi), progress, spinner |
| 12px | Solo l'angolo in alto a sinistra del contenuto accanto alla sidebar |
| 16px | Solo il drawer laterale flottante |

**Bordi:** sempre 1px, colore `border` (contenitori) o `input` (campi). Separano header/contenuto, toolbar/tabella, righe di tabella, footer.

**Ombre:** nessuna su card e superfici in pagina. Solo sugli overlay: media per menu e tooltip, grande per popover, dialog e drawer.

**Spaziature** (griglia da 4px):

| Contesto | Valore |
|---|---|
| Padding orizzontale pagina | 24px |
| Distanza tra blocchi di pagina | 16px |
| Padding card | 16px (il contenuto dopo l'header non ha padding superiore) |
| Padding dialog | 24px, 16px tra le parti |
| Padding drawer | 16px |
| Tra un campo e l'altro in un form | 20px |
| Label → controllo | 6px |
| Chiave → valore in lettura | 4px; 20px tra le coppie |
| Tra bottoni | 8px (footer), 6px (azioni in header) |
| Tra badge in una lista | 4px, a capo libero |
| Celle tabella | 12px orizzontale, 8px verticale; header alto 40px |

**Altezze:** controlli 36px (bottoni, campi, select, bottone icona 36×36), bottoni piccoli e voci di sidebar 32px, header app 48px, barra titolo pagina almeno 64px.

---

## 5. Stati di interazione

| Stato | Regola |
|---|---|
| Hover bottone pieno | stesso colore al 90% |
| Hover bottone neutro / voce di menu | sfondo `accent` |
| Hover riga tabella | `muted` al 50%; riga selezionata `muted` pieno |
| Hover icona / chiudi | opacità 70% → 100% |
| Focus bottoni | anello `ring` 2px con offset 1px, solo da tastiera (`:focus-visible`) |
| Focus campi | bordo `ring` + anello `ring` al 50%, 2px |
| Disabilitato | opacità 50%, nessuna interazione; cursore "not-allowed" sui campi |
| Errore campo | bordo `destructive` + messaggio sotto in `destructive` |
| Voce di sidebar attiva | sfondo `sidebar-accent`, testo `sidebar-accent-foreground`, peso 500 |
| Caricamento bottone | icona che ruota dentro il bottone, bottone disabilitato |
| Caricamento pagina | spinner tondo 40px (bordo `border`, arco `primary`), centrato |
| Caricamento tabella | righe scheletro pulsanti (sfondo `accent`, alte 16px) |
| Vuoto | messaggio centrato in `muted-foreground`, 32px di padding verticale |

Transizioni: solo colore e opacità, durata breve (~150ms); sidebar 200ms lineare. Ammesse anche rotazione (spinner) e pulsazione (scheletro). **Nessuna animazione d'ingresso** (fade, slide, zoom).

---

## 6. Componenti

Descrizione di aspetto e uso; in shadcn ogni voce corrisponde al componente omonimo.

**Bottone** — testo 14px peso 500, icona prima del testo, 8px tra icona e testo.

| Variante | Aspetto | Quando |
|---|---|---|
| Primario | fondo `primary`, testo `primary-foreground` | L'azione principale: **una per vista** |
| Outline | bordo `input`, fondo trasparente | Annulla, azioni secondarie |
| Ghost | solo testo/icona, hover `accent` | Toolbar, header, bassa enfasi |
| Distruttivo | fondo `destructive` | Solo per confermare un'eliminazione |
| Link | testo `primary`, sottolineato all'hover | Link nel testo |

Taglie: normale 36px (padding 16px), piccolo 32px (padding 12px), solo-icona 36×36 tondo.
Azioni nella barra titolo della pagina: outline piccolo con testo `primary` (rosso `destructive` per le azioni distruttive, restano outline).

**Badge** — pill, bordo 1px, padding 10px × 2px, 12px peso 500. Varianti: *primario* (fondo pieno), *secondario* (chip grigio: mercati, competizioni, tag), *outline* (etichetta neutra: quote, contatori).

**Card** — fondo `card`, bordo `border`, raggio 4px, **nessuna ombra**. Header e contenuto con padding 16px.

**Campi** — alti 36px, bordo `input`, fondo trasparente, raggio 2px, padding 12px, testo 14px, placeholder `muted-foreground`. Select con chevron piccolo a destra. Checkbox 16px colorata `primary`. Campo con icona: icona `muted-foreground` a sinistra, a 12px dal bordo.
Multi-selezione: trigger come bottone outline che mostra i valori scelti come badge secondari; elenco a comparsa largo quanto il trigger, max 256px con scroll, righe con checkbox.

**Overlay**

| Componente | Aspetto | Uso |
|---|---|---|
| Dialog | centrato, max 512px, fondo `background`, bordo, raggio 4px, ombra grande, padding 24px; velo nero 50% | Conferme brevi |
| Drawer laterale | da destra, flottante (8px dai bordi), max 448px, raggio 16px, bordo, ombra grande; velo nero 50% | Dettaglio JSON Jev / Form di configurazione |
| Popover | fondo `popover`, bordo, raggio 2px, ombra grande, padding 4px, min 192px | Contenuti a comparsa, filtri |
| Menu a tendina | fondo `popover`, bordo, ombra media, min 160px; voci 14px con padding 8×6px, hover `accent`; voce distruttiva in rosso | Azioni su un elemento |
| Tooltip | **invertito**: fondo `foreground`, testo `background`, 12px, raggio 2px, freccia | Etichette di bottoni-icona, spiegazione metriche (EV, Brier Score) |
| Toast | tinta del tipo su `popover` (§2) | Esito di un'azione |

Footer di dialog e drawer: bottoni allineati a destra, [Annulla outline] poi [azione primaria o distruttiva]; su mobile impilati, azione in alto. Chiusura: icona "×" in alto a destra, opacità 70%.

Ordine di sovrapposizione: header app < drawer < dialog/popover/menu/tooltip/toast. Un overlay non deve mai finire sotto un altro livello dell'app.

**Tabella** — testo 14px, righe separate da bordo `border`, hover `muted` 50%, intestazioni 12px `muted-foreground`. Nessun bordo esterno, nessuna riga zebrata. Contenitore con scroll orizzontale proprio. Le liste complete hanno: toolbar con ricerca (bordo sotto), scheletro in caricamento, stato vuoto, footer di paginazione (bordo sopra, 12px `muted-foreground`, a destra).

**Altri** — Alert: bordo, raggio 4px, padding 16×12px, fondo `card`; variante errore = solo testo rosso. Progress: track 8px pill `secondary`, barra `primary`. Separatore: linea 1px `border`.

---

## 7. Icone

- **Una sola libreria di icone per applicazione**, stile coerente (`lucide-react`).
- Icone esportate da una mappa/registro centrale del progetto (`src/components/icons.tsx`), non importate sparse nei file.
- Colore ereditato dal testo; icone di supporto in `muted-foreground`.
- Dimensioni: piccole (~12px) in bottoni compatti e chevron, ~14px in toolbar e campi, 16px nelle voci di menu laterale.
- Bottone solo-icona: sempre con etichetta accessibile (`aria-label`) e tooltip.
- Icone ricorrenti con significato fisso: chiudi, espandi, cerca, aggiorna (che ruota = caricamento), menu, indietro, sole/luna (tema), avviso, spunta, info.

---

## 8. Layout e pattern di pagina

```text
┌───────────────────────────────────────────────────────────────┐
│ Header app 48px, fisso, fondo sidebar  logo · ambiente · tema · utente
├─────────────┬─────────────────────────────────────────────────┤
│ Sidebar     │ ┌ Barra titolo (sticky, ≥64px, bordo sotto) ────┐│
│ 256px, o    │ │ ☰  Titolo 24px normale  [Azione] [Azione]     ││ azioni accanto al
│ 48px solo   │ └───────────────────────────────────────────────┘│ titolo, non a destra
│ icone       │   padding 24px ai lati, 16px sopra e tra i blocchi│
│ bordo destro│   [Card] [Card]   /   Tabella                     │
└─────────────┴─────────────────────────────────────────────────┘
