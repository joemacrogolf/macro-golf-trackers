# App navigation plan: 1-to-1 Coaching, My Training, My Practice

Status: **steps 1-4 and 6 done; live in the app 2026-11-12** (Joe published). Bottom tabs: Home · My Coach · My Training · My Practice · Playlists. Step 5 (coach dashboard) still to do. Agreed with Joe on 2026-11-12. No VidApp changes until Joe says so (he presses Publish To Preview).

## What members will see

**Bottom tabs (VidApp max 5):** Home · My Training · My Practice · Search · Playlists
(Schedule and My Profile tabs go; account settings stay on the profile icon top right. Check Schedule usage first.)

**Top sub tab: 1-to-1 Coaching**
- 1-to-1 client: signs in, sees their full 6-week plan, check-ins and coach contact (today's My Plan page).
- Everyone else: what 1-to-1 coaching is, and an **Enquire about coaching** button → `https://www.macro.golf/coaching` (for now).

**Home** keeps the Testing Centre, practice games and training games as they are.

## The two front doors

Both are one page each on macro.golf, opened by a VidApp Website item. Same shell, same sign-in.

### My Training (`pages/my-training.html`, BUILT 2026-11-12: Kajabi draft `my-training`, `mg_whoami` live)
After sign-in:
1. **1-to-1 client** → "Your training is set by your coach." Button: **Open my 1-to-1 plan**. Note: "If you want to do something outside your plan, head back to the Home page or use Search." (No self-built plan for 1-to-1 clients.)
2. **Has a training plan** (built or ready-made) → opens it straight away. Small **Change plan** link.
3. **No plan yet** → **Build a plan** (Build My Plan questionnaire, `build-my-plan`). No ready-made choice: Joe has decided the six Pure plans are obsolete.
4. **Existing Pure plan user** → "Continue your current plan" (history intact) plus **Build a new plan**. Pure pages stay live for them; don't delete any page without asking Joe.

### My Practice (`pages/my-practice.html`, BUILT 2026-11-12 on Jack's Practice Plan p-274816: Kajabi draft `my-practice`)
After sign-in:
1. **1-to-1 client whose plan includes practice** → same message as above, button to their 1-to-1 plan. If their plan doesn't include practice, they use My Practice like everyone else.
2. **First time:** **Build a plan** (a weekly practice plan) or **Build a session** (just today).
3. **Has a practice plan:** **Continue my plan** or **Build a session**.
- **Build a session** asks: where are you (range, short-game area, putting green, course, home), how long have you got, what do you want to work on. It builds one session from Jack's games and drills, with rules and no AI, the same approach as Build My Plan.

## Background work, in order

### 1. One sign-in for everything (BUILT 2026-11-12: mg_whoami + mg_onepin, supabase/007-009; offered on My Training / My Practice)
Today each page signs in on its own (1-to-1 by plan code + PIN; Pure and Build My Plan by email + PIN per plan).
- Add a sign-in group (e.g. `group:'macro'`) so one email + PIN on any of the three pages signs that phone into all of them. `sync.js` already has groups; extend it so a 1-to-1 code page can join through the existing `mgsync-handoff`.
- **What a 1-to-1 plan includes:** every 6-week plan states clearly which areas it covers. Store it on the client's registry row: new column `mg_clients.includes` (e.g. `{training,practice}`), set by whoever creates the plan (Sam's / Jack's Claude) alongside `@code`; `clients/*.js` gets a matching `CLIENT.includes`. When this is built, add it to the welcome-message checklist in CLAUDE.md.
- New Supabase function `mg_whoami(email, pin)` (file `supabase/007-whoami.sql`): after the PIN check, returns what this email has: 1-to-1 plan (code, path, does it include practice), training plan (build-my-plan or which Pure plan), practice plan. Only names and paths, never other people's data.
- **PINs:** a member may already have different PINs on different records (1-to-1 code vs Pure plan). Rule: the PIN that matches any of their records signs them in, and the first successful sign-in offers to set one PIN for all.
- Backward compatible: pages without the group behave exactly as now.

### 2. My Training page
- Routing above, using `mg_whoami`.
- Opens the plan in place through `mount.js` (same as My Plan does today), so each plan page stays pinned as usual.
- No ready-made picker (Pure plans are obsolete for new members).
- **Existing Pure users:** `mg_whoami` finds their existing `pure:<plan>:<email>` record and offers Continue (history intact, no data move) or Build a new plan.
- Build My Plan: `onRebuild` / Change plan stays inside the plan; "Change plan" on the hub can also switch between built and ready-made.

### 3. 1-to-1 Coaching tab (BUILT 2026-11-12: my-plan.html 'I'm a client' / 'About coaching', live)
- Reuse `pages/my-plan.html` (owned by Joe's other session: coordinate in WORKLOG before changing it).
- Add the non-client view: short coaching intro + **Enquire about coaching** → macro.golf/coaching.
- Later: one "Speak to a coach" / enquiry page shared by all plans (see the reminder for Joe on 13 Nov).

### 4. My Practice page (Jack's side for content)
- We provide: the page shell, sign-in group, routing (1-to-1 / first time / continue), and the session record.
- Jack's Claude provides: the practice plan builder, the **Build a session** questions and rules, which games/drills fit each location, time and focus, and how a session links to the existing golf game pages (scores still save on each game page).
- Brief for Jack's Claude is in WORKLOG (2026-11-12 entry). Agree the data shape (`S.practice`) before building.

### 5. Coach dashboard
- Show each member's training choice (built answers or Pure plan) and practice plan alongside their sessions.

### 6. VidApp (Joe, last)
- New bottom tabs (Home, My Training, My Practice, Search, Playlists) as Website items to the new pages, top sub tab **1-to-1 Coaching**, lock to paid members, then Publish To Preview. Joe's call; log "in VidApp" / "out of VidApp".

## Decisions (Joe, 2026-11-12)
- Pure plans: obsolete as ready-made options. Existing users can continue; new members build.
- Free members: can see My Training / My Practice tabs but can't enter (VidApp paid lock shows the upgrade prompt).
- 1-to-1 client with no practice in their plan: uses the self-built My Practice.
- Every 6-week plan states which areas it includes (`includes`), which drives the routing above.
- "Enquire about coaching" → macro.golf/coaching for now.
