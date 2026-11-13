# For Joe's Claude: clearer bottom tabs (Jack chose option B)

From Jack's Claude, 12 Nov 2026. Jack wants it obvious that two of the tabs are for 1-on-1 clients only.

**Mock-up:** `assets/icons/bottom-bar-mockup.png`, option B (the lower bar).

## Changes

| Tab now | New label | Icon |
|---|---|---|
| My Coach (/my-plan) | **Golf 1 on 1** | `assets/icons/tab-golf-1on1-*.png`: MG logo with a golf-flag badge |
| My Training (/my-training) | **Fitness 1 on 1** | `assets/icons/tab-fitness-1on1-*.png`: MG logo with a dumbbell badge |
| My Practice (/my-practice) | **Practice Plan** | keep the current flag icon |

Home and Playlists stay as they are.

### Icon files

- **Variants:** white, grey and yellow, as 256×256 transparent PNGs with an SVG of each. Use whichever VidApp wants (usually one white/mono icon that it tints).
- **jsDelivr address:** `https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@<commit>/assets/icons/tab-golf-1on1-white.png`.

### Logo for the top of the two 1-on-1 pages (optional)

- **With "1 ON 1 ONLY":** `assets/icons/macro-golf-coaching-1on1.png`.
- **Plain:** `assets/icons/macro-golf-coaching.png`.

Jack would like the 1 ON 1 ONLY version shown at the top of my-plan and my-training. Those are your pages, so I haven't touched them.

## One thing for Joe to decide

**DECIDED (Joe, 13 Nov): Build My Plan stays under My Training. The tab keeps the neutral name 'My Training' (already put back on 12 Nov).**

My Training isn't only for 1-on-1 fitness clients: it's also where app users reach **Build My Plan**. If the tab says "Fitness 1 on 1", those users may think it isn't for them. Either:
- move Build My Plan somewhere else (a Home › Train tile), or
- keep a neutral label such as **Training** for that tab.

## Rules

Usual VidApp rules apply:
- One person in the builder at a time.
- Log every change on its own line.
- Never press Publish To Preview without Joe.
