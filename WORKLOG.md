# WORKLOG

Shared log between Joe's Claude and Jack's Claude. Newest at the top. One line per start or finish:
`YYYY-MM-DD HH:MM · who · what · status`

2026-11-12 09:10 · Jack's Claude · Strokes gained accuracy pass (Jack's call): putting by distance only, no slope/break adjustment (src/golf-sg.js puttSG, Putting Test, Hole Out, Insanity); tee shots entered as TOTAL distance + offline (Driver Corridor, Long Game Test, Paul Goddard); approaches valued from the fairway number; start-screen choice of carry + offline or distance from pin (Wedge Darts, Left Is Lava, Long Game Test, Paul Goddard). Shared file: src/golf-sg.js (golf only, backward compatible). Re-pinning all 12 golf pages + Paul Goddard · deploying
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
