# For Joe's Claude: end of a six-week phase (idea from Jack, 14 Nov, 01:10)

Jack's words, cut down: every coach-built plan lasts six weeks and then needs a refresh. Start the clock the first time the player opens the plan. Towards the end, give the player a button that sends their six weeks to the coach, so it never feels like they have to "request" a new plan: it is the natural end of the phase. Coaches get an email about 3 days before the plan ends so the next phase is ready on time. Joe already has work on this, so it's yours to build. Jack's Claude has **not** changed any code.

## What Jack wants

1. **Phase clock.** The phase starts the first time the player opens it in the app. Week 6, day 7 is the end.
2. **Coach notice, 3 days before the end.** An email to the coach (or all three coaches): "<Player>'s phase <n> ends on <date>. Start their next plan." Also show it on the coach home / player dashboard.
3. **Player button near the end.** Jack's working wording: "Send final plan overview, ready for new phase". Suggested shorter version: **"Finish my phase: send my 6 weeks to my coach"**. It shows from about day 36 to day 42, or straight after the last weekly report. One tap sends a phase summary; afterwards it reads "Sent. Your coach is building your next phase."
4. **The phase summary ("magic button").** Everything the coach needs to build the next phase, with no typing from the player:
   - Gym: sessions done vs planned, kg lifted, predicted 1RM trends (plan-stats), swaps made.
   - Practice: sessions and games done, game scores and PBs, strokes gained a round per area at the start vs the end (My Numbers / `S.sgLog`, `MGNumbers.live`), test results.
   - Habits, plus the six weekly reports (`S.reviews`), with their answers.
   - **Compared with the previous phase**, if there was one: the same numbers side by side (phase 1 vs phase 2), what moved and what didn't.
   - Saved for the coach and loaded straight into the Plan Builder as the starting point for "Follow-up phase".

## Notes from the code (for whoever builds it)

- **The clock already half exists.** `templates/parts/20-core.html` sets `S.start = todayIso()` on first open (line ~233), and `planWeekOf()` / `weekDays()` run off it. But:
  - The player can change it (the "Plan start date" field).
  - It lives only in the player's record, so the coach and an email job can't see it.
  - On a **new phase** with the same 6-digit code, `S.start` would stay at phase 1's date. It needs resetting per phase, e.g. store `S.phaseStart[<plan id or published_at>]`.
- **Server-side start date.** Suggestion: record the first open per published plan on the server, for example `mg_coach_plans.started_at`, set by a small `mg_plan_started(code, pin)` call from `src/coach-plan.js` the first time a published plan loads. That gives the coach screens and the email job one date to work from.
- **Email.** Nothing in the repo sends email yet. Options:
  - (a) A Supabase scheduled Edge Function, daily, with an email service. Needs a secret key on Joe's side; never in the repo.
  - (b) Tag the coach's contact in Kajabi and let a Kajabi automation send the email.
  - (c) Just a "Plans ending soon" list on coach home (no email). Works today, but needs a coach to look.

  Joe to choose; (c) is worth doing in any case.
- **Summary storage.** For example `S.phaseSummary['p<n>'] = {at, from, to, gym, practice, sg, reviews}`, plus a coach-readable copy (an `mg_intake`-style row of kind `'phase-summary'`) so "Fill plan from answers" in the Plan Builder can use it for the follow-up phase.

## Not decided (ask Jack / Joe)

- The button text (Jack wasn't sure about his wording).
- Who gets the coach email: the plan's coach only, or all coaches.
- Whether the player's plan locks, keeps going or repeats week 6 if the next phase isn't ready on day 42.
