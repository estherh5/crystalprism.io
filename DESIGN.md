# Design

**First read `~/Developer/DESIGN.md`** — fleet-wide conventions (icons, FAB placement,
hover states, mobile rules, pre-ship checklist). Hard requirements for all UI work here.

## App notes

- Portal hub for the fleet. The shared menu + footer live ONLY here and on legacy pages
  (`common.js`); per-app embedding was tried and removed — don't reintroduce it.
- Header is icon-only (no "Crystal Prism" wordmark next to it).
- Embedded app frames should use the available width — no wide empty side gutters.
