# WORKLOG

Shared log between Joe's, Jack's and Sam's Claude. Newest at the top. One line per start or finish:
`YYYY-MM-DD HH:MM · who · what · status`

2026-11-12 11:10 · Sam's Claude · Colin Howard plan live: Kajabi page p-576900 (theme 2168250329) pinned to 32bb190, Supabase mg_clients row added. Demo videos still missing for Deep Banded Backswing, Dumbbell Rotations, Glute Bridge, Wide Stance Dumbbell Deadlift, Freestanding Dumbbell Row (Sam emailing Joe); re-pin Colin once they are in videos.js · live
2026-11-12 11:20 · Jack's Claude · Distance from pin now typed in feet (Wedge Darts, Lava, Long Game Test, Paul Goddard); Wedge Darts yardages in a mixed order with no 10-yd steps · live
2026-11-12 11:01 · Joe's Claude · VidApp: Publish To Live Apps pressed (Joe's call). Members get the direct-link Practice games next time they open the app · live
2026-11-12 11:05 · Joe's Claude · VidApp: pressed Publish To Preview (Joe's call) so the direct-link Practice games reach the preview app. Did NOT press Publish To Live Apps. Sam invited to Supabase (Developer, pending his accept); SamMacroGolf already a GitHub collaborator · done
2026-11-12 11:05 · Sam's Claude · Built Colin Howard 1-to-1 plan (clients/colin-howard.js, code 576900, 2 workouts, daily mobility, gratitude journal habit). Pushed, tested in Playwright. Not on Kajabi yet; waiting on Sam to confirm assumptions and 5 demo video matches · built
2026-11-12 11:55 · Joe's Claude · Leaderboard SQL (supabase/004-leaderboard.sql) run in Supabase, RPC answering; 12 golf pages + Paul Goddard re-pinned to 8fe53e3 (contains dd4f926 + 8826d04) and checked live. Deleted Jack's test row on Paul Goddard's plan (pure:golf-paul-goddard:jack@macro.golf, Joe's call). Left the paul@ row (created 2026-11-11 21:40, no sessions) until Joe says whether it is Paul or a test · live
2026-11-12 11:00 · Joe's Claude · Golf leaderboards (Joe's spec: This month + All time, one board, all 12 golf pages, "First L." names with hide option): supabase/004-leaderboard.sql (mg_leaderboard RPC, read-only), src/leaderboard.js (loaded by golfwarm.js), sync.js summary adds lbHide + new MGSync option fixedName (Paul Goddard page now uses it, workaround removed). All golf pages + Paul Goddard re-pinned · live
2026-11-12 10:46 · Sam's Claude · Picked up CLAUDE.md and WORKLOG.md · done
2026-11-12 10:45 · Joe's Claude · mount.js (shared): hides the Kajabi theme's own header/footer outside #mg-root (Paul Bruce, Dan and Paul Goddard themes were showing an unstyled Blog/Get started menu on phones). Re-pinned Paul Bruce, Dan, Paul Goddard · live
2026-11-12 10:35 · Joe's Claude · Emailed Sam (sam@macro.golf) a set-up prompt so Sam's Claude can build 1-to-1 client plans (template engine, Supabase client row, Kajabi page). Sam's GitHub access and Supabase invite pending · waiting on Sam
2026-11-12 10:28 · Jack's Claude · Lava rename live: p-740258 + Putting/Short/Long tests re-pinned to 8826d04 (contains dd4f926), Kajabi page title now Lava · done
2026-11-12 10:35 · Jack's Claude · Renamed Left Is Lava to "Lava" (Jack's call): page text, share card, report, test suggestions, Kajabi page title, CLAUDE.md/README rows. File, plan code and data unchanged (still golf-left-is-lava) so saved games carry over. VidApp item name not changed (Joe's builder). · live
2026-11-12 09:10 · Jack's Claude · Strokes gained accuracy pass (Jack's call): putting by distance only, no slope/break adjustment (src/golf-sg.js puttSG, Putting Test, Hole Out, Insanity); tee shots entered as TOTAL distance + offline (Driver Corridor, Long Game Test, Paul Goddard); approaches valued from the fairway number; start-screen choice of carry + offline or distance from pin (Wedge Darts, Left Is Lava, Long Game Test, Paul Goddard). Shared file: src/golf-sg.js (golf only, backward compatible). All 12 golf pages + Paul Goddard re-pinned to dd4f926 (contains fde58bd) · live
2026-11-12 08:40 · Joe's Claude · Demo video matches for Sam McDowell, Luis Vega, Rob Seeley (confirmed by Joe) in videos.js; re-pinned those 3 pages · live
2026-11-11 22:58 · Joe's Claude · Warm-up card removed from putting + short-game pages (Joe's call); they keep a slim How to play card where a video exists (golfwarm.js). Re-pinned those 8 pages · live
2026-11-11 22:30 · Jack's Claude · Golf leaderboard prep: window.MG_SCORE() on all 12 golf pages + `golf` field in sync.js summary() (shared file: one field added, nothing else changed); all 12 golf loaders re-pinned from d41fac8 to d0a77ca (contains d41fac8) · live
2026-11-11 22:25 · Jack's Claude · Picked up CLAUDE.md and WORKLOG.md. Told Jack. · done
2026-11-11 22:10 · Joe's Claude · Golf pages: floating buttons lifted above VidApp's toolbar (golfwarm.js); all 12 golf pages re-pinned · live
2026-11-11 22:15 · Joe's Claude · Template client plans (Paul Bruce, Sam McDowell, Luis Vega, Rob Seeley) get demo videos (templates/parts/70-tail.html + rebuild); slimmer header for returning 1-to-1 clients (review.js); CLAUDE.md theme IDs for newest pages · live
2026-11-11 21:58 · Joe's Claude · Added CLAUDE.md (shared rulebook) and this worklog · done
2026-11-11 21:47 · Joe's Claude · Emailed Jack the golf leaderboard prep prompt (MG_SCORE() on all 12 golf pages, `_mgSummary.golf` in sync.js) · waiting on Jack's Claude
2026-11-11 21:40 · Joe's Claude · VidApp: every game under Practice now opens its scoring page directly. Old game groups detached, not deleted. Joe still needs to press Publish To Preview · done
2026-11-11 21:26 · Joe's Claude · Demo video matches confirmed by Joe (Harry, Kevin, Dan); How to play videos on Hole Out, Money Stealers, Insanity, 50ft Bank, Par 18 · live (00ccca6)
2026-11-11 20:52 · Joe's Claude · All 12 golf pages and 9 fitness pages pinned to a1cbc58: warm-up card, demo videos, Pure plan layout · live
2026-11-11 20:20 · Joe's Claude · review.js (week/month review + PDF), videos.js (demo videos), lift floating buttons above in-app toolbars · live
