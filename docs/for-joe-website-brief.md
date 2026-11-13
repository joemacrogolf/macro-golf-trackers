# For Joe's Claude: make the website show the whole app system (from Jack, 13 Nov)

Jack's request: the website (www.macro.golf) should fully show how the Macro Golf app works as one system.
**My Numbers is the main highlight**, shown with positive charts and a player improving over time.
Head-to-head, personalised planning and all of the testing must be on there too.

This is Joe's site, so it's your call how to build it. Please check the layout with Joe before you publish anything.

## The story to tell (in this order)

1. **Test.** Three tests show where you gain and lose shots:
   - the Long Game Test (driving and approach);
   - the Short Game Test;
   - the Putting Test.

   Each test unlocks its areas in My Numbers.
2. **My Numbers (the hero section).**
   - Strokes gained a round against your target handicap, area by area: Driving, Approach, Short game, Putting.
   - It shows your biggest leak and your biggest strength.
   - It's live: every game and plan session after a test moves the numbers.
   - The trend chart shows the player climbing over months.
   - Use positive, believable demo data. For example, strokes gained a round going from −3.1 in June to +0.4 in November ("+3.5 shots a round better since June"), with green bars and up-arrows. The "Your trend" card and the "Last test results" fold-out are good to show.
3. **Your personalised plan.**
   - The weekly Practice Plan is built from your tests. Most of the time goes to the biggest leak.
   - Every range session keeps some irons and driving sharp.
   - If you miss one way, it adds Lava-style ideas.
   - The warm-up is built in.
   - Games open from the plan and come straight back to it ("Continue with plan").
   - MG Athletes: coach-built 1-to-1 plans, like Paul Goddard's, with the same tools.
4. **Games that make practice count.** 9 scored games:
   - Putting: Hole Out, Insanity, Money Stealers.
   - Short game: Par 18, 50ft Bank.
   - Long game: Lava, Wedge Darts, Driver Corridor, 3 Strikes.

   Plus On-Course Games (Worst Ball, PGA Tour Average). Every shot is strokes-gained scored.
5. **Compete.**
   - **Head to head:** every game has a "Single player / Head to head" option. Two players play one round each on one phone, and the result screen shows who won.
   - **Leaderboards:** monthly and all-time boards per game. A top-3 finish shows on the result screen and on the share picture.
6. **Celebrate and stay consistent.**
   - **Personal bests** get a full-screen celebration. The player can take a picture, which gets a gold PB border to share.
   - Every game can be shared ("Share my score").
   - **Streaks:** the day streak shows at the top of every page, and there's a weekly practice streak with rain weeks.
7. **Understand it.** A 40-second "What is strokes gained?" video plays the first time a player opens a golf page.
8. **Call to action:** get the Macro Golf app.

## Assets you can use (all in this repo, served by jsDelivr)

- **Advert (25 s, 9:16, with music):** `assets/video/macro-golf-ad.mp4`. Its scenes:
  - "Stop hitting balls. Start gaining shots."
  - My Numbers
  - "Watch your game climb" trend
  - the plan
  - games
  - every shot measured
  - PB with Jack's selfie share picture
  - leaderboard and streak
  - end card
- **Strokes gained explainer (40 s):** `assets/video/sg-explainer.mp4`, poster `assets/video/sg-explainer.jpg`.
- **Game, test and group tiles (1920×1080, Home-tile style):** `assets/thumbs/v2/`.
- **Live UI:** the real components can be rendered with demo data:
  - `MGNumbers.sgCard`, `trendsCard` and `streakCard` in `src/golf-numbers.js`;
  - the PB share picture via `MGPB.frame` in `src/pb-party.js`.

## Words to keep

- "Strokes gained" against **your target handicap**: plus means you beat a golfer of that handicap from the same spots.
- Putting uses the average strokes from each distance only, with no extras for slope or break.
- Don't promise App Store dates or prices (Joe only).
