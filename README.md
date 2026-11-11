# Macro Golf trackers

Shared scripts for Macro Golf client training trackers (hosted pages on www.macro.golf).

- `src/module.js`, `src/module.css`: share-your-win graphics (MGS)
- `src/ux.js`, `src/ux.css`: in-gym logging helpers (RPE taps, same as last, ± weight, session done, bests, add to home screen)
- `src/adapters/`: per-plan hooks that decide when a win is shareable

Pages load these through jsDelivr, pinned to a commit (immutable):
`https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@<commit>/src/ux.js`

No secrets live here. The Supabase publishable key is designed to sit in web pages; all data access goes through PIN-checked database functions.

## Cloud sync (`src/sync.js`)

Load after the tracker script (needs its `S`, `KEY` and `save()` globals):

```html
<script src="https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@<commit>/src/sync.js"></script>
<script>MGSync.init({code:'836790', name:'Dan Jones'})</script>                      <!-- 1-to-1 page: code = Kajabi page number -->
<script>MGSync.init({plan:'pure-power-gym', planName:'Pure Power (gym)'})</script>  <!-- Pure plan: client signs in with email + PIN -->
```

- First open shows a PIN screen (Pure plans also ask for first name and email). "Not now" keeps it local-only and asks again after 3 days.
- Saves are debounced and pushed to Supabase; offline saves catch up when the connection returns.
- Coming back to the tab pulls changes from other devices. If both sides changed, they are merged (nothing is dropped; newer plain values win).
- A small pill bottom-left shows the state. Tap it to sync now or sign out on that device.
- Each save carries a `_mgSummary` (sessions, dates, top bests) for the coach dashboard. `ux.js` must be loaded for bests.

## Coach dashboard (`coach.html`)

Put it on a hidden Kajabi page. The coach password is typed at runtime and never stored.

## Database (`supabase/`)

- `001-setup.sql`: tables, PIN-checked functions, first clients. Change the coach password line before running.
- `002-pin-lockout-fix.sql`: wrong PINs now count toward the 15-minute lock (errors return `{"error": ...}` with HTTP 200 so the counter commits).

Add a 1-to-1 client:
```sql
insert into public.mg_clients(code,name,plan) values ('<page number>','<name>','<plan>') on conflict do nothing;
```
Reset a forgotten PIN (client sets a new one on next open):
```sql
update public.mg_clients set pin_hash = null, fails = 0, locked_until = null where code = '<code>';
```

## Hosted pages (`pages/` + `src/mount.js`)

Full tracker pages live in `pages/`. A Kajabi Custom Code block only needs:

```html
<div id="mg-root"></div>
<script src="https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@<commit>/src/mount.js" data-page="pure-power-gym"></script>
```

`mount.js` fetches `pages/<data-page>.html` from the same commit, swaps `{{BASE}}` for that commit's URL, and runs the page's scripts in order. To ship a fix: commit, then change `<commit>` in the Kajabi block.

| Page | File |
|---|---|
| Pure Muscle & Strength (gym / home) | `pure-muscle-strength-gym`, `pure-muscle-strength-home` |
| Pure Power (gym / home) | `pure-power-gym`, `pure-power-home` |
| Pure Sequencing (gym / home) | `pure-sequencing-gym`, `pure-sequencing-home` |
