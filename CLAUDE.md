# CLAUDE.md: shared rulebook for every Claude working on this repo

Three people work on this repo with their own Claude: **Joe** (founder, fitness plans and the overall system), **Jack** (golf games, tests and golf plans) and **Sam** (1-to-1 client training plans, built from `clients/*.js`). Their Claudes cannot talk to each other directly. **This file and `WORKLOG.md` are how they coordinate.** Read both before you change anything.

## THE THREE TYPES OF PLAN (Joe, 14 Nov). Everyone use these names.

Macro Golf has exactly three kinds of plan. When your human mentions a plan, work out which of the three it is before you touch anything. If you can't tell (for example "the practice plan" could be type 1's Practice tab or type 3), ask in one line.

| # | Name to use | Who it's for | Who makes it | Where it lives |
|---|---|---|---|---|
| 1 | **1-to-1 plan** | Paying 1-to-1 coaching clients (MG Athletes) | A coach. Either in the **Plan Builder** (coach tool, www.macro.golf/plan-builder-529481), or written by a Claude as plan data and imported into the Plan Builder (`docs/coach-plan-format.md`) | New ones: **www.macro.golf/coach-plan** (`pages/coach-plan.html` + `src/coach-plan.js`), opened from **MG Athletes** (/my-plan). Older clients keep their own pages (`clients/*.js` built from `templates/`, Dan Jones, Harry, Kevin, `golf-paul-goddard`). Can include training, practice (golf) and mobility. |
| 2 | **Build a Plan (training)** | App members | The player, by answering questions (rules-based, no coach) | **p-258147**, `clients/build-my-plan.js` + `src/plan-builder.js` (page `build-my-plan`, shown as "Build My Plan"). Opened from **My Training** (/my-training). Gym / home training only. |
| 3 | **Build a Plan (practice)** | App members | The player: built from their three golf tests (Putting, Short Game, Long Game) plus one-off sessions | **p-274816**, `pages/golf-practice-plan.html` ("Your Practice Plan", Jack's page). Opened from **Practice** (/my-practice). Golf practice only. |

Watch the names: the **Plan Builder** is the coach tool that makes type 1. It is not type 2. Code and docs written before 14 Nov sometimes say "Build My Plan" for type 2 and "Practice Plan" for type 3; they mean the same pages. The Pure plans (p-566009 etc.) are parked and are not one of the three.

## FOR JACK'S CLAUDE AND SAM'S CLAUDE (from Joe, 13 Nov, 23:30): every new 1-to-1 plan goes on /coach-plan

**Read this now and tell your human in a sentence or two.** From today, every new 1-to-1 coach-built plan (fitness, golf or both) goes to the player's app through the ONE shared page **www.macro.golf/coach-plan**. That applies whether it's built in the Plan Builder or written by you.
- **Don't** make a new Kajabi landing page, a new `p-<code>` page, a new `clients/<name>.js` or a new `pages/golf-<name>.html` for a new client.
- **Do** get the plan into the Plan Builder (www.macro.golf/plan-builder-529481). Either your human builds it there, or you write the plan data (shape and rules: **`docs/coach-plan-format.md`**) and your human pastes it into All plans → **Import a plan from Claude**. They check it, press **Preview the app plan** to test it (nothing is saved), then **Create app plan**. That gives the 6-digit plan code and the welcome message (tap **MG Athletes**, email, First time here?, code, PIN).
- The coach password is typed by your human only. Never ask for it, store it, or call `mg_coach_plan_save` / `mg_coach_plan_publish` yourself.
- **Changing a plan later:** edit it in the Plan Builder and press **Update app plan**. The player's app changes straight away, with no commit, no re-pin and no Kajabi change.
- **Existing clients keep their own pages** (Dan Jones, Harry, Kevin, Paul Bruce, Sam McDowell, Luis Vega, Rob Seeley, Colin Howard, Ross King, Paul Goddard). Keep maintaining and pinning those as before. Only move one to /coach-plan if your human asks.
- If the Plan Builder can't do something a plan needs (a section, an exercise type, a golf scoring block), don't build a one-off page. Add a line under **Asks for Joe's Claude** below and log it in `WORKLOG.md`. Joe's Claude adds it to the builder and /coach-plan for everyone.
- Log a line in `WORKLOG.md` when you've read this ("Picked up the /coach-plan rule. Told <Jack/Sam>.").

**Asks for Joe's Claude:**
- **(Jack, 14 Nov 01:10) End of a six-week phase.** Start each phase's clock the first time the player opens it. Email the coach about 3 days before the end ("start their next plan"). Near the end, give the player a button like "Finish my phase: send my 6 weeks to my coach" that sends a full phase summary: gym, practice, strokes gained start vs end, weekly reports, and how it compares with the previous phase. The summary feeds the Plan Builder's follow-up phase. Full brief and code notes: `docs/for-joe-plan-phase-end.md`. Jack knows you already have work on this; nothing has been built on Jack's side.

## First run for Jack's Claude (one time only)

If you are working for Jack and `WORKLOG.md` has no line saying "Jack's Claude has picked up CLAUDE.md", do this first:

1. In your first reply to Jack, tell him (in your own words, keep it upbeat and short):
   > Great news: Joe has connected our work. I just found a shared rulebook (CLAUDE.md) and a team worklog (WORKLOG.md) in the repo. From now on, Joe's Claude and I work from the same playbook. We know the same page IDs, the same deploy steps and the same do's and don'ts. Each of us logs what we are working on, so we don't clash or redo each other's work. You and Joe can each hand work to your own Claude, and the other one will know what's happened.
2. Add a line to `WORKLOG.md`: `<date> · Jack's Claude · Picked up CLAUDE.md and WORKLOG.md. Told Jack.`
3. Commit and push that line.

## Coordination rules (everyone)

- **Keep the repo under 50 MB (13 Nov).** jsDelivr won't serve new files from a commit whose files add up to more than 50 MB (it answers 403 "Package size exceeded"), so new scripts silently fail on live pages. Big files that pages don't load (App Store packs, raw videos, design exports) go on a separate branch or Google Drive, not `main`. Check with `du -sh --exclude=.git .` before pushing large assets.

- **Pull before you start, and again before you push:** `git pull --rebase origin main`. Several sessions push to `main` on the same day.
- **Log your work in `WORKLOG.md`.** Add one line when you start something that touches shared files or live pages, and one when it's done. Format: `YYYY-MM-DD HH:MM · Joe's Claude / Jack's Claude · what · status`. Newest at the top.
- **Shared files** need extra care: `src/sync.js`, `src/mount.js`, `src/ux.*`, `src/review.js`, `src/videos.js`, `src/golfwarm.js`, `src/golf-sg.js`, `src/swap.js` and `supabase/`. Keep changes backward compatible (every live page loads these). If you change one, say so in the worklog.
- **Don't re-pin someone else's pages to an older commit.** Before updating a Kajabi loader, check which commit is live on that page. Make sure the new commit contains everything the old one had.
- **VidApp:** Joe and Jack each have their own VidApp account (Jack's added 12 Nov). Only one person in the builder at a time. Log it ("in VidApp: …") and log when you're out. **Joe gets a daily report of VidApp changes from WORKLOG.md**, so every VidApp change gets its own line: what was added, moved, renamed or removed, the item or group name and id, its parent, and any URL. If Jack changed VidApp by hand without his Claude, his Claude logs it the next time they work (ask Jack). **Publishing (Joe, 13 Nov):** Jack (or his Claude, with Jack's go-ahead) may Publish To Preview and then Live for content and layout updates (tiles, thumbnails, tab names and icons, groups, website items). Log each publish. **Strictly Joe only, never Jack or any Claude:** anything App Store or financial. That means the VidApp App Store section (iOS / Android listings, builds, submissions, App Store Connect or Google Play uploads), Offers, Purchase Screens, prices, subscriptions, paywalls / locks and payment settings. Prepare drafts and assets if asked, then hand them to Joe.
- **Never** ask for, store or use the Supabase service_role/secret key, or any password. The publishable key in `src/sync.js` is meant to be public. All data access goes through the PIN-checked database functions.
- Ask your human before deleting anything permanently (Kajabi pages, VidApp items, database rows).

## New client plan: always write the welcome message (everyone)

New 1-to-1 plans are made in the Plan Builder and open on /coach-plan (see the section at the top and `docs/coach-plan-format.md`). The Plan Builder writes the welcome message for you on Create app plan, so give that one to your human. For any other new client plan, finish by writing the client's welcome message and giving it to your human in your reply, ready to copy into WhatsApp or email. Don't send it yourself unless your human asks. The plan isn't finished until this message exists.

- Put the plan code on its own line, in bold, so the client can't miss it.
- Use the client's first name. Keep it short, warm and plain. No jargon.
- The plan code is the Kajabi page number: `p-482615` → **482615**.
- Check the code matches the Kajabi path `p-<code>`, the `@code` in `clients/<name>.js` (fitness) and the `mg_clients` row before you hand it over.
- **Golf personal plans** need a registry row so My Plan can find them (no PIN, no data; the client's games stay on their own email + PIN record):
  `insert into public.mg_clients(code, name, plan, kind, pin_hash) values ('<page number>', '<Full Name>', '<page name>', 'golf', crypt(gen_random_uuid()::text, gen_salt('bf')));`
  Ask your human to run it in the Supabase SQL editor if you can't. See `supabase/006-myplan-golf.sql`.
- Log in `WORKLOG.md` that the welcome message was written.

Template (fill in the brackets, keep the steps):

> Hi [First name],
>
> Your personalised Macro Golf [training / golf] plan is ready.
>
> Your plan code:
> **[123456]**
>
> To open it:
> 1. Open the Macro Golf app and tap **MG Athletes** at the bottom.
> 2. Enter your email address.
> 3. Tap **First time here?** and type your plan code: **[123456]**
> 4. Choose a 4-digit PIN you'll remember.
>
> That's it. From then on, tapping MG Athletes opens your plan straight away. If you change phones, just log in with your email and PIN.
>
> Every session you log saves automatically, and your coach can see how you're getting on.
>
> (Golf plans: "Every round you log saves automatically, and your coach can see how you're getting on.")
>
> Any questions, just reply to this message.
>
> [Coach name]

Golf personal plans use exactly the same message and the same MG Athletes button.

## App navigation (live 12 Nov 2026)

`docs/app-navigation-plan.md` has the background. Live in the app (13 Nov, reverted 20:45 by Jack): bottom tabs Home (content tab 312348) · MG Athletes (/my-plan) · Practice (/my-practice, header Your Practice Plan) · My Training (/my-training) · Playlists. A web homepage (/app-home, website tab 4183875) was tried 20:20-20:45 and parked in 'Not Active'. Build My Plan lives under My Training (Joe, 13 Nov), so that tab keeps a neutral name; one email + PIN across them (mg_whoami / mg_onepin). Still to do: coach dashboard view of each member's training and practice choice.

## How pages work (short version; README.md has the detail)

- Every tracker lives in `pages/<name>.html`. Kajabi pages hold only a loader:
  `<div id="mg-root"></div><script src="https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@<full commit hash>/src/mount.js" data-page="<name>"></script>`
- **To ship a change:**
  1. Commit and push.
  2. Update the Kajabi theme's code block to the new commit hash. Use `update_theme_content`, partial settings, and include `content_for_index: [<section id>]`.
  3. Check the live page loads the new hash (fetch `https://www.macro.golf/<path>?x=<timestamp>`).
- Tag pushes are blocked here, so always pin by full commit hash.
- **Test with Playwright before shipping.**
  1. Serve the repo at a fake host and mock `https://zhcgwtlyqriwlhbzkxcl.supabase.co/**`.
  2. Load the page through `src/mount.js`.
  3. Check for page errors.
- **Existing 1-to-1 client plans** (`clients/*.js`) are built with `node tools/build-clients.js`. Don't hand-edit those output pages. **New 1-to-1 plans don't get a `clients/*.js` or a Kajabi page:** they go through the Plan Builder onto /coach-plan.

## Shared scripts every page can use

| Script | What it does |
|---|---|
| `src/sync.js` | Cloud save. `MGSync.init({code})` for 1-to-1 pages. `MGSync.init({plan, planName, group})` for email + PIN pages. Saves send `_mgSummary`. |
| `src/ux.js` (inlined in older pages) | Same-as-last, session done, My PBs. |
| `src/review.js` | "Review" tab, week/month report with PDF. Also lifts floating buttons above in-app toolbars. |
| `src/videos.js` | ▶ Demo button on exercises (Wistia videos from the Team Macro Golf Exercise Library). `MGVideo.open(title, wistiaId)` opens any video. |
| `src/golfwarm.js` | Golf pages: Express 5-minute warm-up card. Also "How to play" for games with a video. |
| `src/golf-sg.js` | Golf pages: strokes gained. |
| `src/workout-selfie.js` | Personalised 1-to-1 plans and Build My Plan (not the parked Pure plans): "Post a selfie" on the Session done screen (total kg lifted + a fun equivalent; reps / time / metres / minutes when there are no weights). Load after the tracker. |
| `src/swap.js` | Training plans built from templates/: "Swap" button on each exercise (2 suggestions or type your own; just today or rest of the plan). Saves `S.swaps`; the coach dashboard flags 1-to-1 swaps. |
| `src/plan-stats.js` | Training plans built from templates/: predicted 1RM (Epley + RPE, 1-12 reps) under the main loaded lifts and a 'Predicted 1RM up' toast; 'Your progress' card on the Today page (sessions, kg, charts, 1RM trends). Reads S.logs / S.finished, stores nothing. |
| `src/weekly-review.js` | 1-to-1 plans built from templates/ (not Build My Plan): the Report tab becomes 'Weekly', a weekly review sent in the app (questions from the Google Form 'Macro Golf Weekly Check-In', minus what the app records). Saves `S.reviews['w<n>']={at,a,q}`; the coach dashboard shows it under the client's training and tags 'Weekly review in'. Yellow dot on the tab Fri-Sun until sent. |
| `src/workout-flow.js` | Every workout built from templates/ (1-to-1 plans incl. /coach-plan, and Build a Plan (training)): blocks fold up once all their sets have reps + RPE, later blocks stay folded until the earlier ones are done (names still show; arrow opens/closes any block). 'Copy my workout' button on the Session done screen and under a finished session copies the workout as text (for WHOOP's AI etc.). Stores nothing. |

**Exercise library (the planning database).** Google Drive file `Macro_Golf_VidApp_Library_Audited_v5.xlsm` (id `1EQjn4IPZn2Lz-Qeb-LpIS7wRAPoUNnzk`). One row per Kajabi exercise lesson with its Wistia video ID, the other names plans use for it, setting, default dose, rest, each side, easier and harder options, golf purpose and filming status. The suggested columns are rule-based drafts for coaches to check. Use it when choosing exercises and video IDs for any plan.

**One PIN for everything (live).** `mg_whoami` (009) returns `mixed:true` when an email's records use different PINs; My Training / My Practice then offer `mg_onepin` to set one PIN on all of them. If you replace `mg_whoami`, start from `supabase/009-one-pin.sql`.

**My Plan (live).** www.macro.golf/my-plan: one email + PIN log-in for every 1-to-1 plan and golf personal plan (first time adds the 6-digit plan code). It loads the loader live on the client's own page, so keep each client's page pinned as usual. Coach-built plans (`path = coach-plan`) all open on /coach-plan.

**Live strokes gained (13 Nov, Jack).** My Numbers and the Practice Plan show strokes gained a round per area as the player's tests moved by every practice shot since (`MGNumbers.live` in `src/golf-numbers.js`; tests keep 40%+, recent sessions count most, last 60 days). Every golf record can add rows to `S.sgLog` = `[{id, d:'YYYY-MM-DD', a:'Driving'|'Approach'|'Short game'|'Putting', n:shots, sum:strokes gained, hc}]`: games do it through `GSG.logRound` (`src/golf-sg.js`), the Practice Plan in `practice.sgLog`. **Coach-built golf plans (MG Athletes, like `golf-paul-goddard`) must do the same:** keep `S.sgLog` rows per session and area (see `logSG` in `pages/golf-paul-goddard.html`) and keep sessions in `S.history` as `{date, blocks}` so they count for the weekly streak. Use the same email + PIN record as the games so My Numbers finds it.

**Strokes gained explainer (13 Nov, Jack).** `assets/video/sg-explainer.mp4` (40 s; slowed 13 Nov so every caption can be read). `src/sg-intro.js` (loaded by `golfwarm.js` and My Numbers) **no longer auto-plays (13 Nov meeting)**; it only opens from My Numbers' 'What is strokes gained?' button. A shorter, bite-sized explainer is still to be designed. Seen = localStorage `mg-sgintro` or `S.sgIntro` on the record. `MGSGIntro.open()` replays it (My Numbers' 'What is strokes gained?' button). Games are also locked until the day's warm-up is confirmed (`golfwarm.js`, the Practice Plan's warm-up block counts), and games opened from the plan (`?from=plan`) return to it when the round ends (`src/plan-return.js`).

**Share and PBs on every golf game (13 Nov, Jack).** Every finished game, test and On-Course round has a "Share my score" button on the game-done screen (the MGS share card: game + score; `G.round()` in `mgsGolf`). A personal best gets `src/pb-party.js` (full-screen celebration, take a picture, gold PB border on the share picture via `MGPB.frame`). If the round is top 3 on the leaderboard (all time, or this week once `supabase/011-leaderboard-week.sql` is run; this month until then) the done screen shows it and the share picture gets a leaderboard badge (`MGBoard.rank()` in `src/leaderboard.js`, `w.rank`).

**Day streak (13 Nov, Jack).** `src/day-streak.js`: a bar at the top of the page with how many days in a row the player has opened Macro Golf (localStorage `mg-days`, copied to `S.appDays`). Loaded by `golfwarm.js` and directly by My Numbers, the Practice Plan, On-Course and the front doors (My Training, My Plan, My Practice, Warm Up, Coaching app). Add `<script src="{{BASE}}src/day-streak.js"></script>` to any other page so opening it counts too.

**Golf leaderboards (live).** Each golf page exposes `window.MG_SCORE()`; `summary()` sends it as `_mgSummary.golf` plus `lbHide`. `src/leaderboard.js` (loaded by `golfwarm.js`) shows a Leaders tab with This month / All time boards, read from the public read-only `mg_leaderboard` function (`supabase/004-leaderboard.sql`). `MGSync.init({…, fixedName:'Name'})` skips the name box on one-person plans.

## Intake forms, Plan Builder and TPI (13 Nov, Joe)

- **Player forms** replace the two Google Forms: Pre Match-Up Questionnaire (`pages/form-match-up.html`, www.macro.golf/match-up-questionnaire; `/match-up` is the Match Up Audit page) and Client Onboarding (`pages/form-onboarding.html`, www.macro.golf/onboarding). Shared engine `src/intake-form.js`. Answers go to `mg_intake` through the public `mg_intake_submit` (insert only). Add `?email=…&name=…` to a form link to fill those in. Keep each question's `k` value: the Plan Builder reads them.
- **Plan Builder** (`pages/plan-builder.html`, coach password, www.macro.golf/plan-builder-529481): six-week performance plans (initial or follow-up phase), saved in `mg_coach_plans`. "Fill plan from answers" maps the forms into the plan (`applyIntake`); the Physical section has **Generate a recommended plan** (goals, equipment, days, minutes, level, structure: supersets / circuit / straight sets, saved as `physical.gen` + `physical.mode`; "Fill from onboarding answers" reads `phys_sessions` and `gym`), built with the Build a Plan (training) engine `MGBuild.generate`, then edited by the coach; "Forms received, no plan yet" in All plans starts a plan from a form. Database: `supabase/012-intake-plans.sql`.
- **TPI results (no API).** When a coach asks for a player's TPI results, open pro.mytpi.com in their Chrome (Joe's account is signed in) → Clients → search the name (TPI records often have no email) → Screen History → newest Level 1 Screen. On the SCREEN tab each `.accordion-group-item` has an `.indicator` with class `passed`, `caution` or `failed`; clicking a row shows the criterion. The SWING tab lists likely swing characteristics with % and High / Moderate / Low. Give the coach this block to paste into the Plan Builder's TPI box (it parses it and saves a copy as an `mg_intake` 'tpi' row):
  ```
  TPI · Paul Bruce · Level 1 · 13 May 2026 · Fitness handicap 9
  Lower Quarter Rotation: Fail
  Pelvic Tilt: Caution - can't pelvic tilt both ways
  Setup Posture: Pass
  Swing: Loss of Posture 67% High; Early Extension 67% High; Sway 66% Moderate
  ```
  Read only: never create, edit, email or delete anything in TPI Pro.
- **Plan in the app (14 Nov, Joe).** "Create app plan" (Plan Builder, Review & create) calls `mg_coach_plan_publish`: the player gets a 6-digit plan code (new `mg_clients` row, `path = 'coach-plan'`, email set; or the code their email already has). My Plan then opens www.macro.golf/coach-plan (`pages/coach-plan.html`), ONE page for every coach-built plan: `src/coach-plan.js` signs in from the My Plan hand-off, loads the latest published plan with `mg_plan_content` (code + PIN) and runs the normal 1-to-1 engine on it (CLIENT/SESSIONS built from the plan; Practice tab with Start buttons for app games, `?from=plan` + `src/plan-return.js` tick the game off; mobility follow-along videos; coach's weekly check-in questions via `CLIENT.weeklyQuestions`). Coaches test a plan with 'Preview the app plan' (Review & create): /coach-plan?preview=1, this device only, no cloud save. Weekly report reminders: a pop-up on Sunday, and again Monday to Wednesday if that week's report isn't sent (once a day, after the check-in; `weeklyReminder` in `src/coach-plan.js`). Mobility uses only Follow Along videos (random each day, time each day or manual; `MGLib.mobDay`). **What the plan covers decides the front doors (14 Nov, Joe):** Create / Update app plan sets `mg_clients.includes` (`mg_plan_includes`, `supabase/018-coach-plan-includes.sql`): Physical days → `training`, Practice sessions or On-course games → `practice`. My Training hard-blocks when it includes training ("set by your coach"); My Practice soft-steers when it includes practice ("Build my own practice anyway"). Editing a plan and pressing Update app plan changes the player's app straight away, no commit or Kajabi change. `pages/coach-plan.html` is GENERATED: `node tools/build-coach-plan.js` after any change to `templates/parts`. Engine hook: `CLIENT.extraTabs=[{id,label,render(el)}]` in `templates/parts/20-core.html`. Database: `supabase/014-coach-plan-app.sql`.
- **Coach home + Player dashboard (14 Nov, Joe).** www.macro.golf/coach-home (`pages/coach-home.html`, coach password): home tiles to the Plan Builder, the Player dashboard and the classic training dashboard (coach-713580), plus 'Needs a nudge' (overdue tasks, players quiet for a week). Player dashboard: every 6-digit 1-to-1 / golf / coach-built player (`mg_coach_people` + `mg_coach_plans_list`), and a player view (this week rings, energy + motivation, gym by week, weight vs target, practice and drill PBs, latest weekly review), **1-to-1 notes** (shared with the player or coach-only) and an **accountability tracker** (tasks with due date, player or coach owner). Players see shared notes and their tasks in a 'From your coach' card on the Today tab of /coach-plan and tick their own tasks (`mg_player_board`, `mg_player_task_done`). Database: `supabase/016-player-notes-tasks.sql` (run 13 Nov). One sign-in per browser tab carries between Coach home and the Plan Builder (sessionStorage `mg-coach-s`); the builder opens `#plan=<id>` directly.
- **MG Athletes register + dashboards (14 Nov, Joe).** Coach home tiles: **MG Athlete dashboard** (1-to-1 clients only, in coach-home) and **Player dashboard** (coach-713580, `pages/coach.html`: every app user, MG Athletes included). An MG Athlete = a 1-to-1 client, with or without a 1-to-1 plan in the app: the `mg_athletes` register by email (`supabase/017-mg-athletes-docs.sql`, run 14 Nov), tagged from either dashboard (`mg_coach_athlete_set`; untag keeps the row inactive). Anyone on it gets the MG mark on the leaderboards (017's `mg_leaderboard` = 013 + the register; 013 itself no longer needs running). Athlete view: notes (types, pinning, search), documents (links, shared or coach-only, `mg_player_docs`), accountability, and the Player dashboard's full training/golf view embedded (`coach-713580?embed=1&person=<email>`). Notes/tasks/docs for an athlete without a plan are keyed `email:<email>` and follow them into their plan. **Client emails are personal data: never commit them to this public repo**; tag people in the dashboards or run inserts in the Supabase SQL editor.
- **Library for coach plans:** `src/mg-library.js`: `GAMES` (the app's golf games and their Kajabi paths; games added since live in `mg_app_games`, `supabase/015-app-games.sql`, merged in by `MGLib.loadGames()`), `DRILLS` (Macro Golf scored drills with no page of their own: Ladder up to 70 yds, Strike station, Landing ladder; played interactively inside the coach-plan Practice tab by `src/plan-drills.js`, Jack's drawings and scoring, PBs in `S.drillPB`), `MOB_VIDEOS` (154 follow-along mobility videos of 3+ minutes with equipment and body areas, from the exercise library; lengths from Wistia), `MOB_EX` (the shorter Follow Along mobility videos, under 3 minutes).
- **FOR JACK'S CLAUDE: new game suggestions.** When a coach puts a game that isn't in the app into a practice plan, it lands in `mg_game_suggestions`. At the start of each session with Jack, read them (public, no password): `fetch('https://zhcgwtlyqriwlhbzkxcl.supabase.co/rest/v1/rpc/mg_game_suggestions',{method:'POST',headers:{apikey:'<publishable key from src/sync.js>','Content-Type':'application/json'},body:'{}'})` (from Chrome on any page). Tell Jack about any with status `new`: name, description, which coach. Jack marks them Added to app / Decline in the Plan Builder (All plans, bottom). **When Jack adds any new game to the app** (suggested or not), register it in the Plan Builder: All plans → bottom → 'Added to app' on the suggestion, or 'Add a game Jack has put in the app' (name, page link www.macro.golf/p-…, area). That puts it in every coach's game dropdown and gives players a Start button straight away, no code change (`mg_coach_app_game_add`).

## Live Kajabi pages (site 2147673115)

| Page | Path | Theme | Section / block |
|---|---|---|---|
| Pure Muscle & Strength gym | p-566009 | 2168235333 | plan / plan_code |
| Pure Muscle & Strength home | p-380885 | 2168235379 | plan / plan_code |
| Pure Power gym | p-462183 | 2168235380 | plan / plan_code |
| Pure Power home | p-264152 | 2168235381 | plan / plan_code |
| Pure Sequencing gym | p-580535 | 2168235382 | plan / plan_code |
| Pure Sequencing home | p-429169 | 2168235384 | plan / plan_code |
| Dan Jones | p-836790 | 2168216833 | plan / mg_loader |
| Harry | p-472915 | 2168220626 | plan / mg_loader |
| Kevin | w-849288 | 2168218197 | tracker / mg_loader |
| Coach dashboard | coach-713580 | 2168236636 | plan / plan_code |
| Hole Out | p-151044 | 2168233619 | holeout / loader |
| Wedge Darts | p-386417 | 2168234180 | game / loader |
| Money Stealers | p-529063 | 2168234181 | game / loader |
| Lava (was Left Is Lava; page golf-left-is-lava) | p-740258 | 2168234183 | game / loader |
| Par 18 | p-615974 | 2168234184 | game / loader |
| Insanity | p-208731 | 2168234188 | game / loader |
| 3 Strikes | p-863140 | 2168234190 | game / loader |
| 50ft Bank | p-472096 | 2168234191 | game / loader |
| Driver Corridor | p-937452 | 2168234193 | game / loader |
| Putting Test | p-350829 | 2168234194 | game / loader |
| Short Game Test | p-791364 | 2168234195 | game / loader |
| Long Game Test | p-524617 | 2168234196 | game / loader |
| Paul Bruce (template build) | p-318462 | 2168241897 | plan / mg_loader |
| Sam McDowell (template build) | p-527903 | 2168241900 | plan / mg_loader |
| Luis Vega (template build) | p-694218 | 2168241902 | plan / mg_loader |
| Rob Seeley (template build) | p-741365 | 2168241904 | plan / mg_loader |
| Colin Howard (template build) | p-576900 | 2168250329 | plan / mg_loader |
| Ross King (template build) | p-538206 | 2168275462 | plan / mg_loader |
| Paul Goddard golf plan | p-482615 | 2168242786 | game / loader |
| On-Course Games (Worst Ball, PGA Tour Average; `pages/golf-on-course.html`) | p-631482 | 2168255012 | game / loader |
| Practice Plan (weekly plan from the three tests + one-off sessions; `pages/golf-practice-plan.html`) | p-274816 | 2168255841 | game / loader |
| My Plan log-in (all 1-to-1 and golf personal plans, `pages/my-plan.html`) | my-plan | 2168251504 | plan / mg_loader |
| Build My Plan (app users, `clients/build-my-plan.js` + `src/plan-builder.js`) | p-258147 | 2168251525 | plan / mg_loader |
| My Training front door (`pages/my-training.html`, uses `mg_whoami` (latest `supabase/009-one-pin.sql`); live in app) | my-training | 2168255763 | plan / mg_loader |
| My Practice front door (`pages/my-practice.html`, opens Practice Plan p-274816; uses `mg_whoami`; live in app) | my-practice | 2168256020 | plan / mg_loader |
| Warm Up front door (`pages/warm-up.html`, no sign-in, Warm Up and Recovery videos + short mobility) | warm-up | 2168256625 | plan / mg_loader |
| App homepage (`pages/app-home.html`, tried 13 Nov, NOT in the app now; images assets/web/home/) | app-home | 2168273668 | plan / mg_loader |
| Coaching app view (`pages/coaching-app.html`: live /coaching content, no header/menu, Back bar) | coaching-app | 2168257984 | plan / mg_loader |
| The App (website page: `pages/app.html`, own header + site nav, web images in `assets/web/`; not in the site menu until the app goes live) | app | 2168270657 | plan / mg_loader |
| App download page (`pages/download.html`: App Store + Google Play buttons; old Kajabi page 2149415389) | download | 2154094064 | plan / mg_loader |
| Pre Match-Up Questionnaire (`pages/form-match-up.html`; landing page 2152404882; published 13 Nov, hidden from search) | match-up-questionnaire | 2168274063 | plan / mg_loader |
| Client Onboarding form (`pages/form-onboarding.html`; landing page 2152404883; published 13 Nov, hidden from search) | onboarding | 2168274066 | plan / mg_loader |
| Plan Builder, coaches (`pages/plan-builder.html`; landing page 2152404884; published 13 Nov, hidden from search) | plan-builder-529481 | 2168274068 | plan / mg_loader |
| Coach-built plans in the app (`pages/coach-plan.html`, GENERATED; landing page 2152405286, hidden from search; opened by My Plan for every `path = coach-plan` client) | coach-plan | 2168278327 | plan / mg_loader |
| Coach home + Player dashboard (`pages/coach-home.html`; landing page 2152405391; published 13 Nov, hidden from search) | coach-home | 2168278926 | plan / mg_loader |


## VidApp (builder.vidapp.com, app MacroGolfStudios)

- **Coaching page in the app:** www.macro.golf/coaching-app loads the live /coaching page's Custom Code blocks each time (no copy to keep in step). If /coaching is rebuilt WITHOUT `.mgw` content blocks, check coaching-app still shows the content (it falls back to everything except header/footer/nav).
- **Tried and reverted 13 Nov (live 20:20-20:45, Jack didn't like it; website tab parked in Not Active):** Home (website 4183875 → www.macro.golf/app-home, `pages/app-home.html`: tiles like the old Home, quick Practice Plan / Training Plan buttons at the top, MG Athletes (MG mark) tile last, Testing / Practice › Games & Drills › Short / Long / Putting / Train sub-screens) · Practice · My Training · Playlists · Library (the old Home content tab 312348, renamed and moved to the end; nothing inside changed). MG Athletes tab 4183648 parked in 'Not Active'. Snapshot of the old set-up: docs/vidapp-snapshot-2026-11-13.md.
- **Bottom tabs (13 Nov, live before that):** Home · MG Athletes · Practice (/my-practice, header 'Your Practice Plan'; was 6 Week Plan) · My Training · Playlists. Earlier (12 Nov): Home · MG Athletes (/my-plan; header 'Macro Golf Athletes'; was Golf 1 on 1, before that My Coach) · My Training (/my-training; briefly 'Train 1 on 1', put back 12 Nov: it isn't 1-on-1 only) · 6 Week Plan (/my-practice, was My Practice) · Playlists. Tab titles max 12 characters; icons for the 1-on-1 tabs in assets/icons/ (black 400px PNG). Renamed by Jack's Claude 12 Nov, published live 12 Nov (Joe OK'd, Jack's go-ahead). Sub tabs can't open a website directly; bottom tabs can (Website type).
- **Home tiles:** My Numbers (website 4183747 → /my-numbers, first) · Testing · Practice (My Practice Plan → /my-practice + Games & Drills group 4183704) · Train (My Training Plan → /my-training + Training Library group 4183703) · Warm Up (website → /warm-up).
- New Website items can get a thumbnail by fetching an image (jsDelivr from `assets/thumbs/`, or the VidApp S3 `large_…` copy of an existing thumbnail) into the dialog's file input with DataTransfer.

- Practice (4182266) holds My Practice Plan (website 4183705 → /my-practice) + Games & Drills (group 4183704). Games & Drills contains the Putting 4182263, Short Game 4182264 and Long Game 4182265 groups and the Golf Drills module 2156869483.
  - Each game in the Putting / Short Game / Long Game groups is a **direct Website link** to its scoring page, with no group or "Start Scoring" step. The old per-game groups were deleted on 2026-11-12.
- Website items can't be edited. To change one:
  1. Create a new item with the right URL and thumbnail.
  2. Remove the old item from its parent.
  3. Save.
- **My Plan** button (Joe added it): a Website item opening www.macro.golf/my-plan, the log-in for every 1-to-1 and golf personal plan.
- Inner-page thumbnails (13 Nov): `assets/thumbs/v2/` (groups, every game, tests, train items), Home-tile style.
- Golf thumbnail style:
  - 1280×720 image, background `rgb(32,31,27)`.
  - Game name in Anton, near-white.
  - Yellow bar `rgb(255,218,0)` under the name.
