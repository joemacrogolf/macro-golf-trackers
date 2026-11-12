# For Joe's Claude: put the 6-week Practice Plan in the app

From Jack's Claude, 12 Nov 2026. Jack asked for this. **Before you change anything in VidApp, ask Joe where it should go** (options below). Follow the usual VidApp rules in CLAUDE.md: log "in VidApp", one person at a time, never press Publish To Preview.

## What it is

The **6-week Practice Plan built from the three tests** (Putting, Short Game, Long Game).

1. The player says how many sessions a week and how long each one is.
2. The app builds a weekly plan from where their tests show they lose the most shots. Each session is a Range, Short game or Putting session, and the player picks which one to do each day.
3. The same sessions run for 6 weeks; the drills change week to week and no game repeats.
4. Then it asks them to retest and builds the next 6-week plan.

The weekly screen shows "Week 3 of 6" and a strip for weeks 1–6 with sessions done.

It lives on Kajabi p-274816 (`pages/golf-practice-plan.html`, Jack's page). Sign-in is the normal golf email + PIN.

## The links

- **https://www.macro.golf/p-274816**: the plan itself. It opens on this week's sessions, or on set-up and tests if there's no plan yet.
- **https://www.macro.golf/my-practice**: your My Practice front door. It already opens the plan through "Build a plan / Continue my plan".

Not needed for this: `?start=build` on p-274816 opens the one-off session builder instead.

## Ask Joe where it should go

The bottom bar already has **My Practice → /my-practice**, which reaches the plan in one extra tap. Give Joe these options and let him choose:

1. **Bottom bar tab straight to the plan.** Point the My Practice tab at www.macro.golf/p-274816 (or add a "Practice Plan" tab).
   - One tap to this week's sessions.
   - The one-off builder stays reachable from inside the plan ("Build a one-off session").
2. **Keep My Practice as it is, but plan-first.** For players who already have a plan, my-practice could open the plan straight away; it already knows this from `hasPlan` in `mg_whoami`.
   - New players still see Build a plan / Build a session.
3. **Home › Practice tile.** Add a "My 6-Week Plan" Website item, linking to p-274816, as the first item.
4. **Inside Practice (4182266).** Add it as the first item above the Putting, Short Game and Long Game groups.

Jack's guess is the bottom bar, but it's Joe's call.

## Thumbnail (if a new item)

Use the golf thumbnail style from CLAUDE.md:
- 1280×720, background `rgb(32,31,27)`.
- "MY PRACTICE PLAN" in Anton, near-white.
- Yellow bar `rgb(255,218,0)` underneath.

## When done

Log it in WORKLOG.md: where it went and the VidApp item id.
