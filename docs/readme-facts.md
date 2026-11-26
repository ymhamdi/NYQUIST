# README facts: every number and claim, with its source

The root `README.md` uses only facts from this table. Each row gives the value, where it comes from (a file on `main`, or the exact command that produced it) and its status:

- **main**: in a file on `main` @ `db58b44`.
- **run 26 Nov**: produced by the command shown, on 26 Nov 2026, on `main` @ `db58b44`, on the author's Windows laptop.
- **CI 26 Nov**: printed by GitHub Actions on `main` @ `db58b44`, runs [45839810932](https://github.com/ymhamdi/NYQUIST/actions/runs/45839810932) (Octave references) and [45839811207](https://github.com/ymhamdi/NYQUIST/actions/runs/45839811207) (microcontroller code). The repository is private: these links open only for its members.
- **capture**: read on a screenshot taken for this README (file given).

Kinds of numbers, never mixed: **measured** (a run or a capture), **computed** (the engine or Octave, from the scripts' defaults), **checked** (a test or CI comparison that passed), **counted** (files, entries, lines).

## The project

| # | Claim | Value | Source | Status |
|---|---|---|---|---|
| P1 | Author and class | Youssef El Mhamdi, IIA 3/1, INSAT; no teammates | `CLAUDE.md` line 4 ("Confirmed 2026-11-24") | main |
| P2 | Courses | *Traitement du signal* (TP1–TP4) and *Automatique linéaire échantillonnée* (TP1–TP4: the fascicule has no TP5) | `COVERAGE.md` lines 3–6, 26 | main |
| P3 | Automatique handout | 18-page fascicule, "Année Universitaire 2024-2025"; every question checked word for word on 2026-11-24 | `COVERAGE.md` line 5 | main |
| P4 | Signal handout | not available to the author: TP1–TP2 "needs handout" (no page), TP3–TP4 built from a second-hand transcription, flagged "énoncé non vérifié" | `COVERAGE.md` line 6; `src/content/courses.ts` | main |
| P5 | License | MIT, "Copyright (c) 2026 Youssef Mhamdi" | `LICENSE` lines 1–3 | main |
| P6 | Repository | `ymhamdi/NYQUIST`, **private**, default branch `main`, no homepage, GitHub Pages not configured (API 404), no release | `gh repo view`, `gh api repos/ymhamdi/NYQUIST/pages`, `gh release list` | run 26 Nov |
| P7 | Deploy | manual workflow (`workflow_dispatch`), base path `/NYQUIST/`; never run | `.github/workflows/deploy.yml` lines 9–10, 38 | main |
| P8 | Commits | 33 commits on `main`, all by Youssef El Mhamdi (one as "Youssef Mhamdi"); 0 carry a `Co-authored-by` trailer | `git log main --oneline \| wc -l`; `git log main --format=%an \| sort \| uniq -c`; `git log main -i --grep="Co-authored-by: Claude" --oneline \| wc -l` | run 26 Nov |

## Coverage

| # | Claim | Value | Source | Status |
|---|---|---|---|---|
| C1 | Automatique questions | **33** (TP1 2, TP2 12, TP3 11, TP4 8); 18 involve Simulink, 12 a hand calculation | `COVERAGE.md` "Automatique: question count"; `src/content/aeTp1.ts`…`aeTp4.ts` (2 + 12 + 11 + 8 question entries) | main, counted |
| C2 | Signal questions on the site | **20** (TP3 Q1–Q12, TP4 I.1–I.5 and II.1–II.3), statements not verified | `src/content/tsTp3.ts` (12 `q(...)`), `tsTp4.ts` (8) | main, counted |
| C3 | Signal TP1–TP2 | not built: no handout | `COVERAGE.md` lines 146–165 | main |
| C4 | Pages built | **18**: home, 2 course pages, 6 TP pages, 6 comptes rendus, 2 Mode DS, Errata | `npm run build` ("18 page(s) built") | run 26 Nov, CI 26 Nov |
| C5 | MATLAB scripts | **6** (`matlab/automatique/tp1…tp4`, `matlab/signal/tp3, tp4`), one `%%` cell per handout question | `git ls-files matlab/automatique matlab/signal` | main, counted |
| C6 | Sliders | **42** `% @param` lines across the 6 scripts (Automatique TP1 3, TP2 7, TP3 8, TP4 18; Signal TP3 3, TP4 3) | `grep -h -E "^\s*[A-Za-z_][A-Za-z0-9_]*\s*=.*%\s*@param" matlab/*/*.m \| wc -l` | run 26 Nov, counted |
| C7 | Errata entries | **38**: 27 Automatique (E-AE1…E-AE27), 11 Signal (E-TS1…E-TS11) | `src/content/errata.ts` (`id: 'E-…'`, 38 unique) | main, counted |
| C8 | Simulink diagrams built from code | 9 models (figure 1.6, the TP2 hold and motor, figures 3.1, 3.2, 4.1, 4.2, 4.3) | `matlab/simulink/build_models.m`; C13 | main |

## Correctness

| # | Claim | Value | Source | Status |
|---|---|---|---|---|
| K1 | Octave environment | GNU Octave 8.4.0, control 4.0.1, signal 1.4.5 | `reference/*.json` field `generator`; `docker/octave.Dockerfile` | main |
| K2 | Reference values | 6 JSON files, **60** cells, **384** recorded variables, written by Octave only | `reference/*.json` (`cells`, counted with node) | main, counted |
| K3 | Committed references vs a fresh Octave run | "OK: 6 reference files match (rel 1e-9, abs 1e-12)" | `node tools/compare-refs.mjs reference regenerated` | CI 26 Nov, checked |
| K4 | Engine tests (local, fresh clone of this branch) | **130 passed, 2 skipped** (132) in 10 files, as in CI. The skipped ones compare random slider positions with Octave output, which only CI produces. (In a working copy that still holds an old `build/variants/` folder, the same command lists 62 skipped of 192.) | `npm ci && npm test` in a fresh `git clone` | run 26 Nov, checked |
| K4b | README commands re-run locally on a fresh clone | `npm ci`; `npm run typecheck` (clean); `npm run lint:numbers`; `npm test`; Docker `export_refs('regenerated')` + `compare-refs` ("OK: 6 reference files match"); `check_models` ("15 signals in 9 models match"); codegen test + `check-c.mjs` in the container ("8 generated C files reproduce the engine"); `astro dev` serves the pages (on port 4401: 4321 was taken). Not re-run: `docker build` (the `nyq-octave` image was built earlier from the same Dockerfile) | the commands of README "Quick start" and "Other commands" | run 26 Nov, checked |
| K5 | Engine tests (CI) | 130 passed, 2 skipped (132) | octave-refs.yml, step "Engine tests against the references" | CI 26 Nov, checked |
| K6 | Random slider positions | **36** per CI run (6 per script × 6 scripts), written with the site's own `substitute`, run in Octave; the engine matched: 38 passed, 1 skipped (39) | octave-refs.yml, steps "Random slider positions…"; `NYQ_VARIANTS_PER_SCRIPT: 6` | CI 26 Nov, checked |
| K7 | The comparison is not vacuous | a test moves T by 0.1 % and requires the comparison to fail | `tests/reference/aeTp3.test.ts` line 21 | main |
| K8 | Simulink stand-in | "check_models: 15 signals in 9 models match their calculation" | `matlab/simulink/test/check_models.m`; octave-refs.yml | CI 26 Nov, checked |
| K9 | Number lint | "lint-numbers: no hand-typed number in the prose" | `npm run lint:numbers` (`tools/lint-numbers.mjs`) | CI 26 Nov, checked |
| K10 | Mode DS checks | 6 exercise kinds; Automatique 3 kinds × 200 seeds, Signal 3 kinds × 300 seeds: **1 500** generated subjects checked against the hand derivations or closed forms | `tests/exercises/ae.test.ts` lines 10–13; `ts.test.ts` lines 9–12 | main, checked |
| K11 | Generated C = engine | "check-c: 8 generated C files reproduce the engine" (gcc, double; fixed point: identical integers) | `node tools/check-c.mjs` in mcu.yml | CI 26 Nov, checked |
| K12 | STM32 build | 8 files compile with `arm-none-eabi-gcc -mcpu=cortex-m4 … -Wall -Wextra -Werror -Wdouble-promotion` | mcu.yml, step "STM32 - arm-none-eabi-gcc" | CI 26 Nov, checked |
| K13 | Arduino Uno build | 8 sketches compile (arduino-cli, `arduino:avr:uno`); 1 706 to 2 642 bytes of 32 256 of program storage | mcu.yml, step "Arduino Uno - arduino-cli" | CI 26 Nov, checked |
| K14 | Not checked by any machine | the real Simulink run of `build_models` and the MATLAB scaling of `c2d(…, 'impulse')`: to run once in MATLAB | `matlab/OCTAVE_VS_MATLAB.md` "To verify once in MATLAB"; `PLAN.md` §5 item 4 | main |
| K15 | Tank and motor tunings (computed) | tank PI kp = 1, ki = 0.02: overshoot 0 %, settling 15.65 s; motor PID kp = 2, ki = 60, kd = 0.02: overshoot 1.77 %, settling 0.0856 s | `reference/automatique_tp4_regulation_pid.json`, `III.2.info_ki[1]` = [0, 15.648…, 0], `IV.6.info_kdm[2]` = [1.772…, 0.08558…, 0] | main, computed |
| K16 | Script bug found by the random-slider test | AE TP4: below a 1.6 m setpoint the overflow time was the log of a negative number (a complex time); now `Inf` | `matlab/OCTAVE_VS_MATLAB.md` "Bugs the random-slider test found" | main |

## The site

| # | Claim | Value | Source | Status |
|---|---|---|---|---|
| S1 | Stack | Astro 7.4.10 (static), Svelte 5.57.3 islands, TypeScript 6.0.3, Vitest 5.1.0; own SVG plots, own MathML builder, own service worker | `package.json`; `CLAUDE.md` "Stack" | main |
| S2 | Engine | plain TypeScript, no runtime dependency; 15 files in `src/engine/`, one model per script in `src/engine/tp/` | `git ls-files src/engine` | main, counted |
| S3 | JavaScript per page | 0 (Errata) to **69.9 KiB** gzip (Automatique TP4 report); CI limit 70 KiB; the 60 KiB target of `PLAN.md` is met by **14 of 18** pages (over it: Automatique TP4 67.0, its report 69.9, Automatique TP2 report 62.6, Signal TP4 report 60.4) | `npm run check:budget` | run 26 Nov, CI 26 Nov, measured |
| S4 | Landing and course pages | 9.9 KiB JS gzip each (4 files), the background scene included | `npm run check:budget` | run 26 Nov, measured |
| S5 | Offline | the service worker precaches 87 files | `npm run build` ("sw.js: 87 files precached") | run 26 Nov |
| S6 | Landing background | one Canvas 2D; every curve from the engine (fft, c2dZoh, feedback, poles, stepDiscrete); pointer x = Fe, y = K, click = δ[n]; reduced motion = one static frame | `src/scene/chain.ts`, `src/scene/start.ts`; `CLAUDE.md` "Front-end redesign" | main |
| S7 | Lighthouse 12, mobile (simulated throttling) | performance 95–100 (100 on 8 pages, 99 on 5, 98 on 2, 97 on 1, 95 on 2: the comptes rendus of Automatique TP2 and TP4); accessibility, best practices and SEO 100 on all 18; LCP 0.9–2.1 s; CLS 0 | `tools/lh.sh http://localhost:4321 <out> mobile <18 routes>` on `npm run build && npm run preview`, one run per page | run 26 Nov, measured |
| S7b | Lighthouse 12, desktop | 100 / 100 / 100 / 100 on all 18 pages; LCP 0.2–0.5 s; CLS 0 except Mode DS Automatique 0.056 | same, `desktop` | run 26 Nov, measured |
| S7c | Lighthouse varies between runs | the Automatique TP4 report scored 81 in the Phase 5 run (95 in this one) | `docs/overview.md` (old README, "Phase 5") | main |
| S8 | Anti-windup example | tank, Te = 0,25 s, inflow limited to 0 … 0,5: "la hauteur dépasse la consigne de 8,3 % ; avec l'anti-windup … 0 %" | `assets/readme/mcu-tank-antiwindup.jpg`; the panel's text read by the capture script | capture |
| S9 | Offline | after one online visit, 6 routes (2 TP pages, 1 TP page with a URL value, Mode DS, a report, Errata) load with the network off; cache holds 87 entries | puppeteer probe kept outside the repo (`offline.cjs`) on the local build | run 26 Nov, checked |
| S10 | Home-page scene readings | Shannon: Fe = 4,3 Hz ≥ 2·fmax = 1,7 Hz, K = 0,399, \|z\|max = 0,802. Aliasing: Fe = 1 Hz < 1,7 Hz. Unstable: K = 6,4, \|z\|max = 1,09. Hero: Fe = 2,7 Hz ≥ 1,7 Hz | `assets/readme/scene-*-band.jpg` (cropped from 1600×900 captures), `hero-landing-dark.jpg` | capture |
| S11 | Kmax at T = 0,1 s | 20,017 (a = 0,904837), on the TP3 page | `assets/readme/question-after.jpg`; closed form (1 + e^−0.1)/(1 − e^−0.1) = 20.0167 | capture, computed |
| S12 | Prediction kinds | a number (with tolerance) or a choice; no "pick the curve" kind | `src/components/Predict.svelte` line 13 | main |
| S13 | Slow case | Automatique TP4 with L = 0.011 mH recomputes in about 0.9 s | `PLAN.md` §5 item 5; `CLAUDE.md` "Known limits" | main |
| S14 | Test tolerances | rel 1e-9 (`TIGHT`); rel 1e-6 for values read off a simulated response (`GRID`) | `tests/helpers/reference.ts` line 31; `tests/reference/allTps.test.ts` line 15 | main |
| S15 | Captures | Chrome (puppeteer-core), local production build of `main` @ `db58b44`, 1920×1080 written at 1600 px; element views at their real size; phone 390×844 at 2× | capture script kept outside the repo (`readme2-shots.cjs`) | run 26 Nov |

## Contradictions found (docs vs code); not fixed here

"Old `README.md`" is the README of `main` @ `db58b44`, kept as written in `docs/overview.md` (its line numbers there are shifted by the new header).

| # | Where | Says | Code or run says |
|---|---|---|---|
| X1 | old `README.md` lines 120 and 219 | "37 handout issues" | 38 errata entries (`src/content/errata.ts`) |
| X2 | old `README.md` line 91 | 8.99 % overshoot without anti-windup | the page shows 8,3 % (capture of 26 Nov, S8), as did `docs/screenshots/mcu.jpg` |
| X3 | old `README.md` lines 51–57; `CLAUDE.md` Phase 5 | 16 pages, 32/32 browser checks, 150 anchors, JS 30–66 KiB, 60 KiB met by 13 of 16 | 18 pages since the redesign; JS 0–69.9 KiB; 14 of 18 within 60 KiB |
| X4 | `tools/check-budget.mjs` line 12 (comment) | "met by 13 of 16 pages" | 14 of 18 |
| X5 | old `README.md` line 11 | "Phase 5 done, site ready to publish"; no redesign | the redesign is merged into `main` |
| X6 | `CLAUDE.md` "Front-end redesign" | "branch `redesign-front`, not merged" | merged: `main` = `redesign-front` = `db58b44` |
| X7 | `PLAN.md` §1 | Astro 5, Temml, @vite-pwa/astro (Workbox), Playwright, Lighthouse CI, a `web` CI job, release PDFs | as built: Astro 7, own MathML builder, own service worker, puppeteer scripts outside the repo, no Lighthouse in CI, tests and build inside `octave-refs`, no release |
| X8 | `package.json` line 30 | dependency `temml` 0.14.0 | not imported anywhere in `src/` (`grep -rl temml src` is empty) |
| X9 | `PLAN.md` §3 | Errata "E-AE1…14 and E-TS1…9"; `python/` folder; e2e tests | E-AE1…27, E-TS1…11; no `python/`; no e2e suite in the repo |
| X10 | `COVERAGE.md` line 273 | "Only E-AE7 (default L) needs your decision" | decided on 2026-11-24 (same file, row E-AE7) |
| X11 | old `README.md` line 88 | the Simulink stand-in "catches a flipped sign (mutation test)" | no mutation test in the repo: it was a one-off local check |
| X12 | old `README.md` line 190 | "38 key results checked against closed forms; all 38 match" | no file lists them |
| X13 | old `README.md` lines 51–54 | browser pass (console, scroll, focus, anchors) | done with puppeteer scripts kept outside the repo: not reproducible from `main` |
| X14 | `src/scene/chain.ts` line 547 (code, not a doc) | — | in 1 of 7 capture runs the home page logged "Failed to execute 'arc' … The radius provided (−0.70875) is negative"; not reproduced in the 6 others. A negative `zone.s` would also stop the animation loop, since the exception is thrown before the next frame is requested |

The README uses none of X1–X13 as stated: where a number is needed it takes the code's value above. The old README is kept as written in `docs/overview.md`, with a note pointing here.
