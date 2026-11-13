# CLAUDE.md: shared rulebook for every Claude working on this repo

Three people work on this repo with their own Claude: **Joe** (founder, fitness plans and the overall system), **Jack** (golf games, tests and golf plans) and **Sam** (1-to-1 client training plans, built from `clients/*.js`). Their Claudes cannot talk to each other directly. **This file and `WORKLOG.md` are how they coordinate.** Read both before you change anything.

## First run for Jack's Claude (one time only)

If you are working for Jack and `WORKLOG.md` has no line saying "Jack's Claude has picked up CLAUDE.md", do this first:

1. In your first reply to Jack, tell him (in your own words, keep it upbeat and short):
   > Great news: Joe has connected our work. I just found a shared rulebook (CLAUDE.md) and a team worklog (WORKLOG.md) in the repo. From now on, Joe's Claude and I work from the same playbook. We know the same page IDs, the same deploy steps and the same do's and don'ts. Each of us logs what we are working on, so we don't clash or redo each other's work. You and Joe can each hand work to your own Claude, and the other one will know what's happened.
2. Add a line to `WORKLOG.md`: `<date> · Jack's Claude · Picked up CLAUDE.md and WORKLOG.md. Told Jack.`
3. Commit and push that line.

## Coordination rules (everyone)

- **Pull before you start, and again before you push:** `git pull --rebase origin main`. Several sessions push to `main` on the same day.
- **Log your work in `WORKLOG.md`.** Add one line when you start something that touches shared files or live pages, and one when it's done. Format: `YYYY-MM-DD HH:MM · Joe's Claude / Jack's Claude · what · status`. Newest at the top.
- **Shared files** need extra care: `src/sync.js`, `src/mount.js`, `src/ux.*`, `src/review.js`, `src/videos.js`, `src/golfwarm.js`, `src/golf-sg.js` and `supabase/`. Keep changes backward compatible (every live page loads these). If you change one, say so in the worklog.
- **Don't re-pin someone else's pages to an older commit.** Before updating a Kajabi loader, check which commit is live on that page. Make sure the new commit contains everything the old one had.
- **VidApp:** Joe and Jack each have their own VidApp account (Jack's added 12 Nov). Only one person in the builder at a time. Log it ("in VidApp: …") and log when you're out. **Joe gets a daily report of VidApp changes from WORKLOG.md**, so every VidApp change gets its own line: what was added, moved, renamed or removed, the item or group name and id, its parent, and any URL. If Jack changed VidApp by hand without his Claude, his Claude logs it the next time they work (ask Jack). **Publishing (Joe, 13 Nov):** Jack (or his Claude, with Jack's go-ahead) may Publish To Preview and then Live for content and layout updates (tiles, thumbnails, tab names and icons, groups, website items). Log each publish. **Strictly Joe only, never Jack or any Claude:** anything App Store or financial. That means the VidApp App Store section (iOS / Android listings, builds, submissions, App Store Connect or Google Play uploads), Offers, Purchase Screens, prices, subscriptions, paywalls / locks and payment settings. Prepare drafts and assets if asked, then hand them to Joe.
- **Never** ask for, store or use the Supabase service_role/secret key, or any password. The publishable key in `src/sync.js` is meant to be public. All data access goes through the PIN-checked database functions.
- Ask your human before deleting anything permanently (Kajabi pages, VidApp items, database rows).

## New client plan: always write the welcome message (everyone)

Whenever you create a new client plan, fitness or golf (a new `clients/*.js`, a new golf personal plan page like `golf-paul-goddard`, a new 6-digit page code, a new Kajabi page), finish by writing the client's welcome message and giving it to your human in your reply, ready to copy into WhatsApp or email. Don't send it yourself unless your human asks. The plan isn't finished until this message exists.

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
> 1. Open the Macro Golf app and tap **My Plan**.
> 2. Enter your email address.
> 3. Tap **First time here?** and type your plan code: **[123456]**
> 4. Choose a 4-digit PIN you'll remember.
>
> That's it. From then on, tapping My Plan opens your plan straight away. If you change phones, just log in with your email and PIN.
>
> Every session you log saves automatically, and your coach can see how you're getting on.
>
> (Golf plans: "Every round you log saves automatically, and your coach can see how you're getting on.")
>
> Any questions, just reply to this message.
>
> [Coach name]

Golf personal plans use exactly the same message and the same My Plan button.

## App navigation (live 12 Nov 2026)

`docs/app-navigation-plan.md` has the background. Live in the app: bottom tabs Home · MG Athletes (/my-plan) · My Training (/my-training) · 6 Week Plan (/my-practice) · Playlists. Build My Plan lives under My Training (Joe, 13 Nov), so that tab keeps a neutral name; one email + PIN across them (mg_whoami / mg_onepin). Still to do: coach dashboard view of each member's training and practice choice.

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
- **1-to-1 client plans** (`clients/*.js`) are built with `node tools/build-clients.js`. Don't hand-edit those output pages.

## Shared scripts every page can use

| Script | What it does |
|---|---|
| `src/sync.js` | Cloud save. `MGSync.init({code})` for 1-to-1 pages. `MGSync.init({plan, planName, group})` for email + PIN pages. Saves send `_mgSummary`. |
| `src/ux.js` (inlined in older pages) | Same-as-last, session done, My PBs. |
| `src/review.js` | "Review" tab, week/month report with PDF. Also lifts floating buttons above in-app toolbars. |
| `src/videos.js` | ▶ Demo button on exercises (Wistia videos from the Team Macro Golf Exercise Library). `MGVideo.open(title, wistiaId)` opens any video. |
| `src/golfwarm.js` | Golf pages: Express 5-minute warm-up card. Also "How to play" for games with a video. |
| `src/golf-sg.js` | Golf pages: strokes gained. |

**Exercise library (the planning database).** Google Drive file `Macro_Golf_VidApp_Library_Audited_v5.xlsm` (id `1EQjn4IPZn2Lz-Qeb-LpIS7wRAPoUNnzk`). One row per Kajabi exercise lesson with its Wistia video ID, the other names plans use for it, setting, default dose, rest, each side, easier and harder options, golf purpose and filming status. The suggested columns are rule-based drafts for coaches to check. Use it when choosing exercises and video IDs for any plan.

**One PIN for everything (live).** `mg_whoami` (009) returns `mixed:true` when an email's records use different PINs; My Training / My Practice then offer `mg_onepin` to set one PIN on all of them. If you replace `mg_whoami`, start from `supabase/009-one-pin.sql`.

**My Plan (live).** www.macro.golf/my-plan: one email + PIN log-in for every 1-to-1 plan and golf personal plan (first time adds the 6-digit plan code). It loads the loader live on the client's own page, so keep each client's page pinned as usual. New client plans need nothing extra; see README.

**Golf leaderboards (live).** Each golf page exposes `window.MG_SCORE()`; `summary()` sends it as `_mgSummary.golf` plus `lbHide`. `src/leaderboard.js` (loaded by `golfwarm.js`) shows a Leaders tab with This month / All time boards, read from the public read-only `mg_leaderboard` function (`supabase/004-leaderboard.sql`). `MGSync.init({…, fixedName:'Name'})` skips the name box on one-person plans.

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
| Paul Goddard golf plan | p-482615 | 2168242786 | game / loader |
| On-Course Games (Worst Ball, PGA Tour Average; `pages/golf-on-course.html`) | p-631482 | 2168255012 | game / loader |
| Practice Plan (weekly plan from the three tests + one-off sessions; `pages/golf-practice-plan.html`) | p-274816 | 2168255841 | game / loader |
| My Plan log-in (all 1-to-1 and golf personal plans, `pages/my-plan.html`) | my-plan | 2168251504 | plan / mg_loader |
| Build My Plan (app users, `clients/build-my-plan.js` + `src/plan-builder.js`) | p-258147 | 2168251525 | plan / mg_loader |
| My Training front door (`pages/my-training.html`, uses `mg_whoami` (latest `supabase/009-one-pin.sql`); live in app) | my-training | 2168255763 | plan / mg_loader |
| My Practice front door (`pages/my-practice.html`, opens Practice Plan p-274816; uses `mg_whoami`; live in app) | my-practice | 2168256020 | plan / mg_loader |
| Warm Up front door (`pages/warm-up.html`, no sign-in, Warm Up and Recovery videos + short mobility) | warm-up | 2168256625 | plan / mg_loader |
| Coaching app view (`pages/coaching-app.html`: live /coaching content, no header/menu, Back bar) | coaching-app | 2168257984 | plan / mg_loader |


## VidApp (builder.vidapp.com, app MacroGolfStudios)

- **Coaching page in the app:** www.macro.golf/coaching-app loads the live /coaching page's Custom Code blocks each time (no copy to keep in step). If /coaching is rebuilt WITHOUT `.mgw` content blocks, check coaching-app still shows the content (it falls back to everything except header/footer/nav).
- **Bottom tabs (13 Nov):** Home · MG Athletes · Practice (/my-practice, header 'Your Practice Plan'; was 6 Week Plan) · My Training · Playlists. Earlier (12 Nov): Home · MG Athletes (/my-plan; header 'Macro Golf Athletes'; was Golf 1 on 1, before that My Coach) · My Training (/my-training; briefly 'Train 1 on 1', put back 12 Nov: it isn't 1-on-1 only) · 6 Week Plan (/my-practice, was My Practice) · Playlists. Tab titles max 12 characters; icons for the 1-on-1 tabs in assets/icons/ (black 400px PNG). Renamed by Jack's Claude 12 Nov, published live 12 Nov (Joe OK'd, Jack's go-ahead). Sub tabs can't open a website directly; bottom tabs can (Website type).
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
