# VidApp push notifications: 4-week schedule (ready to paste)

Prepared by Jack's Claude, 13 Nov. **Not scheduled yet.** Each one goes to every app user who allows notifications, so Jack (and Joe, as the app also has fitness-only members) should OK the set before anyone creates them.

How VidApp push works (checked in the builder 13 Nov): Push Notifications › New Push Notification. Title max 42 characters, message max 150. Delivery: send now or at a particular time; per-user optimisation: tick **Send based on users timezone**. No recurring option and no per-person targeting in the form, so each one is created once, with its date and time. They also land in the app's Notifications Feed (can take up to 24 h).

Rhythm: Monday morning (plan), Wednesday evening (games / leaderboard), Friday evening (day streak), Sunday morning (weekend practice). Four a week at most; drop to two if people turn notifications off.

| # | Send | Time | Title | Message |
|---|---|---|---|---|
| 1 | Mon 16 Nov 2026 | 07:30 | New week, new plan 📋 | Your Practice Plan has this week's sessions ready. Tick off the first one today and get the week moving. |
| 2 | Wed 18 Nov 2026 | 18:00 | Who's top of Par 18? 🏆 | The leaderboards change every week. Play a round tonight and see where you land. |
| 3 | Fri 20 Nov 2026 | 18:00 | Keep your streak alive 🔥 | Open Macro Golf today to keep your day streak going. Even 5 minutes counts. |
| 4 | Sun 22 Nov 2026 | 10:00 | Weekend practice ⛳ | Got 45 minutes? Your plan's next session is built from your tests, so every ball counts. |
| 5 | Mon 23 Nov 2026 | 07:30 | Where are you losing shots? 📊 | Check My Numbers: your strokes gained by area, live from every game you've played. |
| 6 | Wed 25 Nov 2026 | 18:00 | Beat your PB tonight | Pick a game, warm up, and go after your personal best. A new PB gets its own celebration. |
| 7 | Fri 27 Nov 2026 | 18:00 | Don't break the chain 🔥 | Your day streak resets at midnight. Open Macro Golf today to keep it. |
| 8 | Sun 29 Nov 2026 | 10:00 | Challenge a mate 🤝 | Every game has Head to Head. Two players, one phone, one winner. Who's buying the coffee? |
| 9 | Tue 1 Dec 2026 | 07:30 | New month, new leaderboards 🏆 | December's boards are wide open. Post a score early and make them chase you. |
| 10 | Wed 2 Dec 2026 | 18:00 | Short game session? 🎯 | Tight lie strike, then the landing ladder: up and back down. Can you beat your best? |
| 11 | Fri 4 Dec 2026 | 18:00 | Keep your streak alive 🔥 | A few minutes in Macro Golf today keeps your day streak going. Don't let it reset. |
| 12 | Sun 6 Dec 2026 | 10:00 | Time to retest? 📈 | Six weeks since your last test? Retest to see how far you've come and get your next plan. |
| 13 | Mon 7 Dec 2026 | 07:30 | Plan your practice week 📋 | Open your Practice Plan and see this week's sessions. Most of the time goes to your biggest leak. |
| 14 | Wed 9 Dec 2026 | 18:00 | One putt from the top? ⛳ | Putting games move fast on the leaderboard. Try Hole Out or Money Stealers tonight. |
| 15 | Fri 11 Dec 2026 | 18:00 | Don't break the chain 🔥 | Your day streak resets at midnight. Open Macro Golf today to keep it. |
| 16 | Sun 13 Dec 2026 | 10:00 | Your numbers are moving 📊 | Every game you play moves your strokes gained in My Numbers. Have a look at your trend. |

Character counts are checked (all titles ≤ 42, all messages ≤ 150). The same list is in `vidapp-push-schedule.json` next to this file.

**Fitness-only members** get these too. If Joe wants, swap one a week for a training one, for example:
- `Train today 💪` / `Your training plan is ready in My Training. Log today's session and keep your week on track.`

**Logging:** each push created in VidApp gets its own WORKLOG line (title, send time), per CLAUDE.md.
