# Macro Golf trackers

Shared scripts for Macro Golf client training trackers (hosted pages on www.macro.golf).

- `src/module.js`, `src/module.css`: share-your-win graphics (MGS)
- `src/ux.js`, `src/ux.css`: in-gym logging helpers (RPE taps, same as last, ± weight, session done, bests, add to home screen)
- `src/adapters/`: per-plan hooks that decide when a win is shareable

Pages load these through jsDelivr, pinned to a tagged version:
`https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@<tag>/src/ux.js`

No secrets live here. The Supabase publishable key is designed to sit in web pages; all data access goes through PIN-checked database functions.
