# Coach-built plan data (for Jack's and Sam's Claude)

Every new 1-to-1 plan (fitness, golf or both) goes to the player's app through ONE page: **www.macro.golf/coach-plan**.
No new Kajabi landing page, no new `clients/*.js`, no new `pages/golf-<name>.html`. The player opens it from **MG Athletes**
(www.macro.golf/my-plan) with their email + plan code + their own PIN.

## Two ways to make one

1. **Your human builds it in the Plan Builder** (www.macro.golf/plan-builder-529481, coach password, which they type, never you).
2. **You write it, they import it.** Write the plan as JSON in the shape below and give it to your human. In the Plan Builder:
   All plans → bottom → **Import a plan from Claude** → paste → **Import plan**. It opens as a draft. They check it, then
   Review & create → **Preview the app plan** (to test it, nothing saved) → **Create app plan**. That gives the 6-digit plan code
   and the welcome message. If your human has the Plan Builder open and signed in in Chrome, you can paste it for them, but
   only with their go-ahead, and they press Create app plan.

Never call `mg_coach_plan_save` / `mg_coach_plan_publish` yourself: they need the coach password, and Claudes never ask for,
store or use passwords.

## Shape

Only `playerName` is required. Anything you leave out gets the Plan Builder's default (habits, KPIs, check-in questions and so on),
so leave out what you don't want to change. Drop all `id`s: they are made on import.

```json
{
  "playerName": "Dan Banbury",
  "playerEmail": "dan@example.com",
  "coach": "Sam",
  "phase": 1,
  "isFirst": true,
  "startDate": "2026-11-16",
  "weeks": 6,
  "include": {"habits": true, "practice": true, "oncourse": true, "physical": true, "mobility": true,
              "weight": true, "stats": true, "recovery": false, "checkin": true},

  "focus": {"outcome": "Break 80 consistently", "outcomeDetail": "", "whyNow": "", "progressByReview": ""},
  "priorities": [{"title": "Driver start line", "start": "", "why": "", "change": ""}],

  "habits": [{"name": "Meditation", "detail": "", "dose": "10 min minimum"}],
  "weekly": {"practice": 2, "physical": 2, "oncourse": 1, "connected": ""},

  "practice": {"intro": "", "sessions": [
    {"name": "Session 1", "warmup": "Golf Warm Up in the app, then 10-15 balls building speed.", "close": "", "drills": [
      {"env": "Technical", "name": "Gate drill", "detail": "How to do it", "volume": 15, "unit": "balls", "attention": 25},
      {"env": "Game", "game": "p-740258", "name": "Lava", "volume": 1, "unit": "rounds", "attention": 80},
      {"env": "Game", "game": "drill-ladder", "name": "Ladder up to 70 yds", "volume": "5", "unit": "mins", "attention": 80}
    ]}
  ]},

  "oncourse": {"games": [{"name": "Mulligan", "holes": "9", "detail": "One mulligan per hole.", "target": "", "attention": 75}],
               "intention": "", "strategy": "", "preround": "", "postround": ""},

  "physical": {"days": 2, "rest": "45-60s between rounds", "dayList": [
    {"title": "Full body A", "pairs": [
      {"a": {"name": "Trap bar deadlift", "type": "Strength", "reps": "", "each": false},
       "b": {"name": "Med ball scoop toss", "type": "Power", "reps": "", "each": true}}
    ]}
  ]},

  "mobility": {"frequency": "Daily", "when": "Evenings before sleep", "mode": "random",
               "areas": ["Hips", "Upper back"], "equip": ["Foam roller"], "count": 3, "minutes": 10, "items": []},

  "weight": {"unit": "kg", "start": "84", "target": "82", "direction": "Lose", "frequency": "Weekly", "day": "Monday"},
  "stats": [{"name": "Scoring average", "baseline": "82", "target": "79", "how": ""}],
  "checkin": {"day": "Sunday", "questions": [{"q": "Did you vary from your plan this week?", "type": "Yes / No"}]}
}
```

## Rules for the values

- **Practice games:** `env` is `Technical` or `Game`. For a game in the app, `game` is its Kajabi path (`MGLib.GAMES` in
  `src/mg-library.js`, plus any added in the Plan Builder's "Games in the app"). This gives the player a Start button. Jack's scored drills
  (played interactively in the plan's Practice tab) are `drill-ladder`, `drill-strike` and `drill-landing-ladder` (`MGLib.DRILLS`). A game that isn't
  in the app: `"newGame": true` with a `name` and a `detail`. It's sent to Jack as a suggestion. `attention` is 0 (internal) to 100 (external).
- **Physical:** `type` is one of `Strength`, `Power`, `Accessory`, `Core`, `Stability`, `Mobility`. Blank `reps` uses the plan's
  scheme (strength 12/10/8 @ RPE 7/8/9, power 3 x 5 @ max intent). Use exercise names from the exercise library
  (Drive `Macro_Golf_VidApp_Library_Audited_v5.xlsm`) so the Demo videos match.
- **Mobility:** Follow Along videos only. `mode` is `random` (`count` videos a day, a new mix daily), `time` (`minutes` a day, filled
  with one or more videos) or `manual` (`items`: `{"kind": "video", "name": <exact name from MGLib.MOB_VIDEOS>, "wistia": <id>, "mins": <n>}`).
  `areas` come from `MGLib.AREAS`. `equip` is only `Foam roller`, `Massage ball` or `Resistance band` (no-equipment videos are always in).
- **Check-in questions:** `type` is `Yes / No`, `Text` or `1–10`.

The player's app shows Today (daily check-in first), Gym, Practice, Weight and Weekly, with reminders for the weekly report on Sunday and again Monday-Wednesday.
