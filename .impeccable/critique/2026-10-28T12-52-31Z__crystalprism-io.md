---
target: crystalprism.io whole app
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 6
timestamp: 2026-10-28T12-52-31Z
slug: crystalprism-io
---
Method: dual-agent (A: design review · B: detector + browser + audit) + C: async-state code audit

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Vicarious spins forever; no list fetch shows a loading state; modal gives no focus feedback |
| 2 | Match System / Real World | 3 | Mostly plain; privacy page says Google sign-in while legacy sign-in asks for username/password |
| 3 | User Control and Freedom | 2 | Rhythm of Life on phone is a dead end; modal has Esc but no focus return |
| 4 | Consistency and Standards | 1 | Sign-in, register, privacy are three different shells; profile tabs show two selected |
| 5 | Error Prevention | 2 | Signed-out visitors can compose comments/posts, then get an alert; double-submit on delete-account, password verify, likes |
| 6 | Recognition Rather Than Recall | 1 | 27 project tiles and splash circles name themselves only on hover |
| 7 | Flexibility and Efficiency | 2 | Arrow keys + Esc in modal; nothing else |
| 8 | Aesthetic and Minimalist Design | 3 | Specific, colorful, real screenshots; modal text 140ch centered |
| 9 | Error Recovery | 1 | ~68 native alert/confirm; "refresh the page" with no in-slot Retry |
| 10 | Help and Documentation | 2 | Game intros, Learn More |
| **Total** | | **18/40** | **Poor** |

Technical audit (audit.md): Accessibility 1, Performance 2, Responsive 2, Theming 1, Integrity 2 = 8/20 (Poor).

## Design Specificity Verdict

LLM: specific. The faceted diamond menu, per-section accents and real app screenshots could only be this site; each legacy app is its own world. The thread between them is only the shared chrome, and the account flow speaks three visual languages.

Deterministic scan (full-parse mode, one file per run): real findings on rhythm-of-life (#56d056 on #e8e8e8 1.6:1), canvashare (#00cb96 plus icon 2.1:1), sign-in/my-account (#ff0000 4.0:1, h1→h4 skips), my-account (white on pastel swatches). False positives: broken-image on JS-filled imgs (index, vicarious, canvashare), tight-leading on <style>, 253 "cyan neon" overlay hits on the homepage modal (identity, not a defect). Overlay injection succeeded on 5 pages.

## Priority Issues

- [P0] Vicarious unusable: storeImages() catch calls $(error).modal('show') on the Error object, leaving a bare .modal-backdrop over the page and the spinner running forever. Fix: show #error, clear dimmer, add Retry.
- [P1] Homepage keyboard-dead: splash SVG circles and 27 .project-listing divs are not focusable; hidden modals sit at -9999px leaving 177 invisible links in tab order; project modal has no dialog role, focus move, trap or labels. Fix: buttons, display:none/inert for closed modals, dialog semantics.
- [P1] Focus and names: outline:none on button:focus (style.css), :focus (vicarious) and thought-writer; editor toolbar's 16 icon buttons unnamed; sign-in/my-account fields captioned by h2/div, no label/autocomplete; 13/14 pages lack lang and <main>. Fix: :focus-visible rings, aria-labels, real labels.
- [P1] Async states: no list fetch shows loading; failures say "refresh the page" with the only Retry in a global banner (click-only <text>); pingServer has no timeout; delete-account, password verify, likes, download-data allow double-submit; editor/easel busy has no label. Fix: shared slot-loading + in-slot Retry helper with timeout; busy helper on controls.
- [P1] Text contrast: #about-page accent rgb(127,209,59) 1.89:1, Projects active nav rgb(30,191,232) 2.17:1, rhythm #systolic/#diastolic 1.62:1, canvashare #plus-icon 2.1:1 and yellow error 1.4:1, easel selected tab 2.4:1, timespace footer 2.1:1, account #ff0000 4.0:1.
- [P1] Names on hover only: .project-title opacity:0 at rest; on phone 27 unnamed screenshots, imgs without alt.
- [P1] Native alert/confirm for errors and auth gating (~68 calls); comment box and editor offered to signed-out visitors.

## Persona Red Flags

- Sam (keyboard/screen reader): cannot reach Projects from splash; tabs into invisible modal links; editor toolbar of buttons named "submit".
- Casey (390px): tile names invisible; Rhythm of Life "switch to a larger window" with no header; 24px nav buttons; modal arrows overlap text.
- Jordan (first-timer): splash diamond with no words; legacy sign-in contradicts the Google-only privacy page.

## Minor Observations

- P2: modal text 15px centered 140ch, 300px-wide modal on phone with 27x24 arrows over text; 100vw causes 15-17px horizontal scroll on home/post/editor; Rhythm of Life throws ~100 TypeErrors per load on production; tap targets under 44px on phone in many places; profile tabs lack role/aria-selected, two look selected; footer paints over third drawing at 390; 83 eager images, 27 videos, 950KB browserstack.svg; duplicate ids on rhythm.
- P3: 10px text (timespace #quote, post #edit/#delete); transition: all; reduced-motion only in fleet.css; About "Skills" labels collide with chips; Gmail address shown on public profile.

## Questions to Consider

- Should a portfolio whose job is persuasion hide every project name behind hover?
- Are the legacy sign-in/my-account pages still worth keeping, or should they redirect to auth.crystalprism.io like /create-account/?
- On a phone, is Rhythm of Life better served by a leaderboard and demo video than a "switch windows" wall?
