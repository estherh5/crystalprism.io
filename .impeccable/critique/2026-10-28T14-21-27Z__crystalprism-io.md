---
target: crystalprism.io whole app
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-10-28T14-21-27Z
slug: crystalprism-io
---
Method: dual-agent (A: design review · B: detector full-parse + browser overlay + audit), final confirming run after two fix rounds

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Every list shows Loading then failure + Retry; banner duplicates them |
| 2 | Match System / Real World | 3 | Paint names now plain ("Paint red") |
| 3 | User Control and Freedom | 3 | Modal close/arrows/Esc work at 390 with banner; focus returns |
| 4 | Consistency and Standards | 2 | Privacy page has its own header; account flow still mixes shells |
| 5 | Error Prevention | 3 | Signed-out visitors get inline sign-in prompts; double-submit guarded |
| 6 | Recognition Rather Than Recall | 2 | Splash facets unlabeled until hover/focus on desktop |
| 7 | Flexibility and Efficiency | 3 | Full keyboard path on the homepage |
| 8 | Aesthetic and Minimalist Design | 3 | Specific world intact; modal arrows crowd text at 390 |
| 9 | Error Recovery | 3 | Inline errors and Retry everywhere; no native dialogs |
| 10 | Help and Documentation | 2 | Game intros only |
| **Total** | | **27/40** | **Acceptable** |

Technical audit: 16/20 (from 8/20). Detector full-parse: 0 findings on 9 of 15 pages; remaining are known false positives (JS-filled images, print-only tiny text, style-block leading) plus cramped-padding on legacy panels.

## Design Specificity Verdict

Specific: diamond splash with facet circles, night view, per-app hand-made worlds, tiles cut from real screenshots. The shared failure+Retry states are the one generic layer, consistent across apps.

## Priority Issues

- [P1, fixed in this run] canvashare "Create new drawing" FAB option at ~1.3:1 resting contrast → .menu-option opacity 1, icon #595959.
- No other P0/P1. P2/P3 fixed after the run: modal arrows overlapping text at 390, translucent modal body, my-account clipped when the banner shows, vicarious Retry focus, rhythm legend contrast, small tap targets, logos.woff2 404.

## Persona Red Flags

- Recruiter on phone: splash doesn't say what's tappable (labels shown at rest only on hover:none devices).
- Keyboard user: homepage path good — rings, focus trap, focus return.

## Questions to Consider

- Should Rhythm of Life on phones offer its leaderboard and demo video instead of the "larger window" wall?
- Should the privacy page adopt the shared fleet header?
