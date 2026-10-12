# Design

**First read `~/Developer/DESIGN.md`** — fleet-wide conventions (icons, FAB placement,
hover states, mobile rules, pre-ship checklist). Hard requirements for all UI work here.

## App notes

- Portal hub for the fleet. The homepage, legacy apps and account pages draw their header and
  footer from `common.js`, which mounts the fleet kit (`fleet-menu.js` + `fleet.css`, both
  byte-identical copies: never edit them here alone) per "Fleet menu + footer" in the fleet guide.
  Tokens are `--fleet-*` in `common.css`; a dark page overrides them in its own stylesheet
  (timespace), and `common.css` shields the kit from the legacy pages' bare `a`/`button` rules.
- Header is icon-only (no "Crystal Prism" wordmark next to it): the diamond home mark leads, the
  fleet trigger trails.
- Embedded app frames should use the available width — no wide empty side gutters.
