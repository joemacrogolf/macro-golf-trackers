# Macro Golf trackers

Shared scripts for Macro Golf client training trackers (hosted pages on www.macro.golf).

- `src/module.js`, `src/module.css`: share-your-win graphics (MGS)
- `src/ux.js`, `src/ux.css`: in-gym logging helpers (RPE taps, same as last, ± weight, session done, bests, add to home screen)
- `src/adapters/`: per-plan hooks that decide when a win is shareable

Pages load these through jsDelivr, pinned to a commit (immutable):
`https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@<commit>/src/ux.js`

No secrets live here. The Supabase publishable key is designed to sit in web pages; all data access goes through PIN-checked database functions.

## Cloud sync (`src/sync.js`)

Load after the tracker script (needs its `S`, `KEY` and `save()` globals):

```html
<script src="https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@<commit>/src/sync.js"></script>
<script>MGSync.init({code:'836790', name:'Dan Jones'})</script>                      <!-- 1-to-1 page: code = Kajabi page number -->
<script>MGSync.init({plan:'pure-power-gym', planName:'Pure Power (gym)'})</script>  <!-- Pure plan: client signs in with email + PIN -->
<script>MGSync.init({plan:'golf-hole-out', planName:'Hole Out', group:'golf'})</script> <!-- golf game: one sign-in covers every golf page -->
```

- First open shows a PIN screen (Pure plans also ask for first name and email). "Not now" keeps it local-only and asks again after 3 days.
- Saves are debounced and pushed to Supabase; offline saves catch up when the connection returns.
- Coming back to the tab pulls changes from other devices. If both sides changed, they are merged (nothing is dropped; newer plain values win).
- A small pill bottom-left shows the state. Tap it to sync now or sign out on that device.
- `group` (optional, email + PIN pages only): pages in the same group remember the sign-in once per device, so the next page signs itself in. Each page still saves under its own code. Pages without `group` are unchanged.
- Each save carries a `_mgSummary` (sessions, dates, top bests) for the coach dashboard. `ux.js` must be loaded for bests.

## Week / month review (`src/review.js`)

Loaded by every tracker page after `sync.js`. Adds a "My review" tab above "My PBs" and a button in the bests screen. Clients pick Week or Month, step back through past periods, and tap Download PDF (A4, built in the browser with html2canvas + jsPDF from jsDelivr, loaded only when tapped). On phones the PDF goes to the share sheet; elsewhere it downloads.

## Coach dashboard (`coach.html`)

Put it on a hidden Kajabi page. The coach password is typed at runtime and never stored.

## Database (`supabase/`)

- `001-setup.sql`: tables, PIN-checked functions, first clients. Change the coach password line before running.
- `003-coach-lockout.sql`: same 8-tries / 15-minute lock for the coach password; returns `{rows:[...]}`.
- `002-pin-lockout-fix.sql`: wrong PINs now count toward the 15-minute lock (errors return `{"error": ...}` with HTTP 200 so the counter commits).

Add a 1-to-1 client:
```sql
insert into public.mg_clients(code,name,plan) values ('<page number>','<name>','<plan>') on conflict do nothing;
```
Reset a forgotten PIN (client sets a new one on next open):
```sql
update public.mg_clients set pin_hash = null, fails = 0, locked_until = null where code = '<code>';
```

## My Plan log-in (`pages/my-plan.html`, www.macro.golf/my-plan)

One page for every 1-to-1 client plan (the VidApp "My Plan" button). Not the same as Build My Plan.
- First time: email + plan code (the 6-digit code, e.g. 576900) + PIN. That links the email to the plan. If the client already set a PIN on their personal page, they use that PIN.
- After that: email + PIN. The device remembers them, so the button opens straight into their plan.
- It loads whatever loader is live on the client's own Kajabi page (`/p-<code>`, or `mg_clients.path` when different, e.g. Kevin `w-849288`), so new clients work without touching My Plan.
- Welcome message for a new client: "Open My Plan in the app, enter your email, tap First time here?, then your plan code <code> and a 4-digit PIN."
- Database: `supabase/005-myplan.sql` (`mg_clients.email`, `mg_clients.path`, `mg_myplan()`). Coaches don't need to enter emails. To fix a wrong one:
```sql
update public.mg_clients set email = null where code = '<code>';   -- client links again with the plan code
```

## Hosted pages (`pages/` + `src/mount.js`)

Full tracker pages live in `pages/`. A Kajabi Custom Code block only needs:

```html
<div id="mg-root"></div>
<script src="https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@<commit>/src/mount.js" data-page="pure-power-gym"></script>
```

`mount.js` fetches `pages/<data-page>.html` from the same commit, swaps `{{BASE}}` for that commit's URL, and runs the page's scripts in order. To ship a fix: commit, then change `<commit>` in the Kajabi block.

| Page | File |
|---|---|
| Pure Muscle & Strength (gym / home) | `pure-muscle-strength-gym`, `pure-muscle-strength-home` |
| Pure Power (gym / home) | `pure-power-gym`, `pure-power-home` |
| Pure Sequencing (gym / home) | `pure-sequencing-gym`, `pure-sequencing-home` |
| Dan Jones / Harry / Kevin (1-to-1) | `dan-jones`, `harry`, `kevin` |
| Coach dashboard | `coach` |
| Golf games (Jack): Hole Out, Wedge Darts, Money Stealers, Lava, Par 18, Insanity, 3 Strikes, 50ft Bank, Driver Corridor | `golf-hole-out`, `golf-wedge-darts`, `golf-money-stealers`, `golf-left-is-lava`, `golf-par-18`, `golf-insanity`, `golf-three-strikes`, `golf-fifty-ft-bank`, `golf-driver-corridor` |
| Golf tests (Jack): Putting, Short Game, Long Game | `golf-putting-test`, `golf-short-game-test`, `golf-long-game-test` |
| Paul Goddard golf plan (Jack): round day warm-ups, range practice, SG vs scratch, weekly report | `golf-paul-goddard` |

`src/golf-sg.js` (golf pages only) adds strokes gained alongside each golf game's own score: a running total on the board, each shot's strokes gained in the result flash, a per-shot card on the results and a line in the coach report. The baseline is Mark Broadie's strokes-to-hole-out data adjusted by handicap, the same model as the Long Game Test. Each golf page passes its own shot list with `GSG.init({target, shots, note})`.

## 1-to-1 client plans (`clients/` + `templates/` + `tools/build-clients.js`)

New 1-to-1 trackers are built from one shared engine rather than copied pages. Each client is a small config file in `clients/<page>.js` (plan, habits, which features are on), and the build writes `pages/<page>.html`:

```
node tools/build-clients.js            # build every client
node tools/build-clients.js rob-seeley # build one
```

First line of each config: `// @code <6-digit page number>  @name <Client Name>`. The code is the cloud-sync code and the Kajabi page path (`/p-<code>`).

Features (`CLIENT.features`): `checkin` (energy + motivation 1–10, unlocks the day), `weight` (kg weigh-ins with trend), `alcohol` (daily yes/no), `cardio` (logged sessions with type + minutes, counts toward the week), `mobility` (daily tick + which video, remembers past videos). `weeks: 0` makes the plan open-ended.

Exercises use `x(id, name, {sets, reps, rpe, side, kind, inc, note, slot})`. `reps`/`rpe` can be arrays per set (pyramids), `rpe: MAX` is max-intent power work, `rpe: null` means no RPE target. Exercises in a block that share a `slot` become a pick-one dropdown; each choice keeps its own logs and bests.

| Client | Page | Code |
|---|---|---|
| Paul Bruce | `paul-bruce` | 318462 |
| Sam McDowell | `sam-mcdowell` | 527903 |
| Luis Vega | `luis-vega` | 694218 |
| Rob Seeley | `rob-seeley` | 741365 |
| Colin Howard | `colin-howard` | 576900 |

## Build My Plan (`src/plan-builder.js` + `clients/build-my-plan.js`)

For paying app users. A questionnaire (name, goals, equipment, level, days, session length, pain screen, daily trackers, mobility) builds a plan with fixed rules, no AI, so the same answers always give the same plan. Clients sign in with email + PIN.

How a plan is built:
- **Days** pick the split by golf power source: 2 = two full-body days, 3 = Arm Chop / Vertical / Wrist Release + Rotation + Lateral, 4 = Arm Chop / Vertical / Wrist Release / Rotation + Lateral, 5 = the 4-day split plus a Movement, Sequencing + Core day.
- **Session length** keeps the first 2, 3 or 4 pairs of each day (30 / 45 / 60 min).
- **Goals** decide each pair: strength + speed = strength + power; strength = strength + strength; speed = power-led; sequencing adds a strength + sequencing pair; longevity adds a strength + core pair and swaps jumps for low-impact power. Sequencing or longevity without strength or speed uses straight sets at RPE 7.
- **Level**: beginner = 1 fewer set, +2 reps and 1 lower RPE on strength work, +15s rest, easier versions; advanced = 1 more strength set, harder versions.
- **Equipment** picks the best version of each exercise from the slot lists (gym, then dumbbells + bands, then bands / bodyweight). Exercises are never repeated within a session.

Edit `EX` (exercise library), `SLOT` (options per movement), `PAIRS` / `DAYS` / `SPLIT` (session design), `LEVELS`, `TRACKERS` and `MOBILITY` (10 Minute Mobility Routines from VidApp, tagged by body part) in `src/plan-builder.js`. `NEW_IDS` lists exercises that need a demo video in the app. "Speak to a coach" goes to `MGB_COACH` in `clients/build-my-plan.js`.

Retaking the questions starts a new plan at week 1. Old sessions are kept in `S.archive`; habits, check-ins and weigh-ins carry on.
