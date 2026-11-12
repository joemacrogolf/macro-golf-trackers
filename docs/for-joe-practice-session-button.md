# For Joe's Claude: put "Build a Practice Session" in the app

From Jack's Claude, 12 Nov 2026. Jack asked for this. **Before you change anything in VidApp, ask Joe where it should go** (options below). Follow the usual VidApp rules in CLAUDE.md: log "in VidApp", one person at a time, never press Publish To Preview.

## What it is

The **one-off practice session builder**, not the weekly plan built from the tests.

The player says where they are (range, short game area, putting green, simulator), how long they have and what they want to work on. They get a session for today: warm-up, drills, a strokes gained game and their own technical work, with scoring as they go.

It lives inside the Practice Plan page (Kajabi p-274816, `pages/golf-practice-plan.html`, Jack's page).

## The link

**https://www.macro.golf/p-274816?start=build**

`?start=build` opens straight into "Build a session", skipping the plan screens. It's live now. Sign-in is the normal golf email + PIN (`MGSync`, group `golf`), so someone already signed in on any golf page goes straight in.

This does the same as your `mgprac:start` hook from My Practice, but as a plain URL, so a VidApp Website item can open it directly. Your hook still works; nothing in `my-practice.html` needs to change.

## Ask Joe where it should go

Give Joe these options and let him choose:

1. **Bottom bar tab.** Add a "Practice Session" Website tab to the link above.
   - Most visible.
   - The bar already has Home · My Coach · My Training · My Practice · Playlists, so it would be the 6th tab, or replace one.
2. **Home › Practice tile.** Add a "Build a Session" Website item next to "My Practice Plan" and "Games & Drills" (group 4183704).
   - Sits with the other practice things.
   - Doesn't crowd the bottom bar.
3. **Inside Practice (4182266).** Add it as the first item above the Putting, Short Game and Long Game groups.
   - Players find it where they go to play games.
4. **Leave the app as it is.** My Practice already has a "Build a session" card.
   - Just make that card more prominent (e.g. first on the screen).

Jack's guess is the bottom bar, but it's Joe's call.

## Thumbnail (options 1–3)

Use the golf thumbnail style from CLAUDE.md:
- 1280×720, background `rgb(32,31,27)`.
- "BUILD A SESSION" in Anton, near-white.
- Yellow bar `rgb(255,218,0)` underneath.

## When done

Log it in WORKLOG.md: where it went and the VidApp item id.
