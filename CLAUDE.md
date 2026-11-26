# CLAUDE.md — Nyquist

Interactive MATLAB lab companion for INSAT IIA 3: *Traitement du signal* (TP1–TP4) and *Automatique linéaire échantillonnée* (every TP of the fascicule).
Credits: **Nyquist**, Youssef El Mhamdi, IIA 3/1, INSAT (no teammates). Confirmed 2026-11-24.
Repository: https://github.com/ymhamdi/NYQUIST (renamed from NYQUIST-lab. on 2026-11-26; the local remote still uses the old URL, which GitHub redirects)

## Status
- **Phase 0 done**: `COVERAGE.md` (inventory of every question + errata) and `PLAN.md` (stack, architecture, phases).
- **Phase 1 done**: `matlab/automatique/tp1..tp4`, `matlab/signal/tp3, tp4`; `matlab/compat/` (stepinfo R2021a+, order); `matlab/refs/` harness → `reference/*.json`; CI `.github/workflows/octave-refs.yml` + `tools/compare-refs.mjs`; `matlab/OCTAVE_VS_MATLAB.md`.
- **Phase 2 done**: `src/engine/` (poly, complex, linalg, lti, stepinfo, dsp, matlabScript, tp/<one model per script>); tests: `tests/reference/` (engine vs Octave JSON), `tests/engine/core.test.ts` (closed forms), `tests/sliders/` (random slider positions run in Octave in CI). Next: **Phase 3**, the AE TP3 page end to end (Astro + Svelte), then **stop for the user's review**.
- **Phase 3 done (2026-11-25), reviewed and merged into `main`** (branch `phase-3`). Astro 7 + Svelte 5 site: `/`, `/automatique/tp3/`, `/rapport/automatique/tp3/`, `/ds/automatique/`, `/errata/`. Lighthouse mobile 99-100 on every page (perf, a11y, BP, SEO); 375 px OK; hydration fix verified (islands hydrate with defaults, `tpStore.restore()` in an `$effect` applies URL/saved values). After the review: merge `phase-3` into `main`, then **Phase 4** on branch `phase-4` (other TP pages on the TP3 pattern, Simulink builder, microcontroller export, PWA, lint for hard-coded numbers).
- **Phase 4 done (2026-11-26)** on branch `phase-4`: pages + reports for AE TP1, TP2, TP4 and TS TP3, TP4; Mode DS Signal (`/ds/signal/`); TP switcher (`src/content/courses.ts`); Simulink builder `matlab/simulink/build_models.m` checked in CI by an Octave stand-in (`matlab/simulink/test/`); microcontroller export (`src/engine/mcu.ts`, `src/engine/codegen.ts`, `src/components/mcu/`, CI `mcu.yml`); own service worker (`tools/sw-integration.mjs`); number lint (`tools/lint-numbers.mjs`, in CI); errata numbers computed. Pyodide Run cut as planned. **Next: Phase 5** on branch `phase-5` (deploy: ask the user before making the repo public; Lighthouse; browser pass; similarity check and scorecard kept out of the repo).
- Known limits: AE TP4 with L = 0.011 mH recomputes in ≈ 0.9 s; the user must run `build_models` and the c2d 'impulse' line once in MATLAB.
- **Phase 5 done (2026-11-26)** on branch `phase-5`: Lighthouse mobile 95–100 (AE TP4 report 81: 16 stepinfo at load), desktop 99–100; browser pass 32/32; page budget in CI (`tools/check-budget.mjs`, 70 KiB JS gzip); projection mode (header button, P key); pole/zero explorer (TS TP4, `PzEditor.svelte`, on demand via `LazyPanel.svelte`); `.github/workflows/deploy.yml` (manual, base `/NYQUIST/`).
- **Decision 2026-11-26: the repository stays private.** Commits carry the user's school email; before ever making it public, offer to rewrite the history to the GitHub no-reply address (the only allowed exception to "main is never rewritten", and only with the user's explicit yes). The repository was renamed `NYQUIST` by the user.

- **Front-end redesign (2026-11-26), branch `redesign-front`, not merged, not deployed** (the user reviews first). Palette A chosen (ink blue; white graph paper in light); the phone hero stays taller than the screen.
  - Landing background: `src/scene/chain.ts`, one Canvas 2D, every curve from the engine (fft, c2dZoh, feedback, poles, stepDiscrete); pointer x = Fe (aliasing ghost = exact folded reconstruction), y or touch scroll = K, click = δ[n]. Started by `src/scene/start.ts` after first paint; pauses off-screen or hidden; DPR ≤ 2; reduced motion = one static frame; Pause remembered (`localStorage nyq-motion`).
  - `SceneHero.astro` (landing, and calm on the course pages `/automatique/`, `/signal/` via `CourseView.astro`), `CourseCard`/`TpCard` with build-time glyphs (`src/scene/glyphs.ts`, static SVG animated in CSS on hover/focus), palette tokens in `src/styles/scene.css` (`.bench`), loader inside `LazyPanel.svelte`, gate wipe = cross-document view transitions in `global.css` + `.vt-gate` in `Base.astro`.
  - Rules from the brief: TP pages stay static and plain; background module ≤ 15 KB gzip (now ≈ 10 KB with the engine parts); 60 fps, frame < 8 ms (measured ≈ 1 ms); nothing flashes more than 3 times per second (the gate clock slides, it does not blink); WCAG AA text over the canvas (scrim); Lighthouse at or above the previous scores; visual motifs to avoid: see CLAUDE.local.md.

## Engine conventions
- Microcontroller code (`mcu.ts` → `codegen.ts`): the generated C performs the same operations in the same order as mcu.ts; `tools/check-c.mjs` compiles it with gcc in double and requires an exact match (fixed point: identical integers). Change both together. Defaults not in the handout live in `src/content/mcu.ts` (errata E-AE27, E-TS11).
- Simulink builder: only the API calls the stand-in knows (new_system, add_block, add_line, set_param, save_system, sim with ReturnWorkspaceOutputs); a new block type needs its entry in `matlab/simulink/test/stub/nyq_sl.m`.
- Polynomials in descending powers (MATLAB order). `tf` = {num, den, Ts}; no automatic cancellation (feedback keeps cancelled poles, like MATLAB).
- `pid(kp, ki, kd, Tf)` builds only the existing terms (integrator only if ki ≠ 0, filter only if kd ≠ 0).
- `tf2ss` returns a **balanced** companion form (needed for the stiff motor with L = 0.011 mH).
- No `Math.max(...bigArray)`: use `maxOf` / `minOf` (stepinfo can have 400 001 samples).
- Each `src/engine/tp/*.ts` model mirrors its script **cell by cell with the same variable names**; tests compare by name. When a script changes, change its model and regenerate the references.
- Test tolerances: rel 1e-9 (norm-wise for arrays); stepinfo-derived values rel 1e-6 (grid interpolation); `ecart_*` round-off measures skipped for random variants; PeakTime ignored when there is no overshoot.
- Handouts live in `./handouts/` and are **git-ignored** (the professor's documents; never commit them).
  - Automatique fascicule: **received** (`handouts/Fascicule_TP_Automatique_Echantillonnee.pdf`, 18 pages, 2024-2025 edition). All 4 TPs (33 questions) checked word for word on 2026-11-24. There is no TP5.
  - Traitement du signal handout: **the user does not have it**. TS TP1/TP2 stay "needs handout" (no scripts, no guessing). TS TP3/TP4 are built from the second-hand transcription and flagged "énoncé non vérifié". If the PDF ever arrives, write TS TP1/TP2 and re-check TS TP3/TP4.

## User decisions (2026-11-24)
- Deadline: a few days, so follow the full plan phase by phase; stop after Phase 3 for review.
- Motor inductance (E-AE7): default **L = 0.011 H** (Tableau 2.1), with a toggle to the printed 0.011 mH.
- Deployment: make the repo **public at deploy time** (Phase 5), and **ask the user once more** right before switching visibility.
- Sampling-period defaults (the handout gives none): T = τ_dominant/10, rounded down to the 1–2–2.5–5 series.

## Rules
- **Never invent handout content.** A missing value gets "needs handout" or a documented default exposed as a slider, plus an entry on the Errata page.
- **Every number on screen comes from the engine.** No numeric literals in French prose (CI lint), except inside verbatim handout quotes.
- The MATLAB scripts in `matlab/` are the **source of truth**: one `%%` cell per handout question, **French comments**. Reference values come only from Octave CI (`reference/*.json`), never typed by hand.
- Where Octave and MATLAB differ, the **MATLAB behaviour is the one submitted**; Octave gets shims in `matlab/compat/` (added to the path only under Octave). Document every difference in `matlab/OCTAVE_VS_MATLAB.md`.
- Language: UI text in French with the handouts' terminology; code and comments in English, except the MATLAB scripts (French comments).
- Commit after each phase with clear messages.
- If time runs short, cut from the bottom of the priority list (PLAN.md §4). Never cut correctness or coverage.

## Stack (decided in PLAN.md §1)
As built: Astro 7 (static) · Svelte 5 islands · own SVG plotting module · own MathML builder · TypeScript engine with no dependencies · own service worker (the PWA plugin for Astro 7 rested on a 0.0.x core) · Vitest · Chrome checks with puppeteer scripts (scratchpad) · Lighthouse 12 · GitHub Actions (Octave refs + Simulink stand-in + number lint; microcontroller code).

## Environment notes
- Octave runs in Docker: `docker build -t nyq-octave -f docker/octave.Dockerfile docker/` (Ubuntu 24.04, Octave 8.4.0, control 4.0.1, signal 1.4.5, gnuplot, fonts-freefont-otf, xvfb). CI installs the same packages.
- Headless figures in Octave: `graphics_toolkit('gnuplot')` + `set(0,'defaultfigurevisible','off')`. This **needs `fonts-freefont-otf`**, otherwise "ft_text_renderer: invalid bounding box".
- Octave lacks `stepinfo`, `order`, `xline` and `yline`, and cannot call local functions defined at the end of a script.
- On Windows Git Bash, `#/route` and `/c/...` arguments passed to Windows executables get rewritten: use `MSYS_NO_PATHCONV=1` and `C:/...` paths for node, docker `-v` and Chrome.
- Line endings are pinned to LF (`.gitattributes`): scripts and `.m` files run in Linux containers.
- Pyodide 0.27.7 + micropip installs python-control 0.10.2 (verified); ≈ 45 MB download, so it must stay opt-in.

## MATLAB `stepinfo` definition used (R2021a+)
SettlingTime: first T such that |y − y_final| ≤ 2 % · |y_final − y_init| for all t ≥ T (y_init = 0 for a model). RiseTime: 10 → 90 % of y_final − y_init. Overshoot: 100·(y_max − y_final)/(y_final − y_init). R2020b and earlier measured the band against the peak error: show both and name the version.

## MATLAB script conventions
- One `%%` cell per handout question; the first word after `%%` is the handout number (`II.3`, `Q7`), used as the key in `reference/*.json`.
- Tunable values on their own line: `T = 0.1;   % @param T [s] description`. The site rewrites these right-hand sides (code follows sliders).
- No `lsim` on a continuous system with a discontinuous input (Octave interpolates linearly): use a shifted `step`, or `c2d` on a finer grid.
- Compare hand vs toolbox results through poles and `dcgain`, never through `tfdata` coefficient vectors.
- Avoid MATLAB-only functions (xline, yline, sgtitle, tiledlayout, table, string, contains). Local functions go at the end (the harness extracts them for Octave).
- Never `clear all` (it would wipe the harness state); `clear; close all; clc;` is fine.

## Commands
- Octave refs: `MSYS_NO_PATHCONV=1 docker run --rm -v "C:/Users/.../Nyquist:/w" -w /w nyq-octave octave-cli --eval "addpath('matlab/refs'); export_refs"` (about 15 s; figures in `build/figures/` as SVG)
- Staleness check (what CI does): `export_refs('regenerated')`, then `node tools/compare-refs.mjs reference regenerated`
- Engine: `npm test` (reference + core + slider generator checks), `npm run typecheck`
- Random slider positions (what CI does, 6 per script; locally 10 takes ~6 min in Octave):
  `NYQ_VARIANTS=generate NYQ_VARIANTS_PER_SCRIPT=10 npx vitest run tests/sliders` → Octave `export_refs('build/variants-out', 'build/variants/list.txt')` → `NYQ_VARIANTS=compare npx vitest run tests/sliders`
- Octave in Bash: put test code in a `.m` file. Quoting `.'` inside `bash -c '...'` breaks.
- Web: `npm ci`, `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint:numbers`, `npm run build`, `npm run preview` (browser checks: puppeteer scripts in the session scratchpad, not in the repo)
- Lighthouse batch: `tools/lh.sh <base-url> <outdir> mobile|desktop <routes…>`; phone/offline probe: `node tools/probe.cjs <base> <shotdir> <routes…>`
- Number lint: `npm run lint:numbers` (exceptions with a reason in `tools/lint-numbers.allow.json`)
- Simulink stand-in (what CI does): `docker run … nyq-octave octave-cli --eval "addpath('matlab/simulink/test'); check_models"` (≈ 75 s)
- Generated C: `npx vitest run tests/engine/codegen.test.ts` writes `build/mcu/`; then `node tools/check-c.mjs` (needs gcc; locally: in the nyq-octave container after `apt-get install gcc libc6-dev nodejs`). STM32: arm-none-eabi-gcc with `-I tests/mcu/stub`; Arduino: `arduino-cli compile --fqbn arduino:avr:uno build/mcu/arduino/<name>`
- Shell edits: do not pass template literals (`${…}`, backticks) through bash -c / node -e; write an edit script file or use the editor.

## Decisions log
- 2026-11-24: stack chosen (PLAN.md §1). Octave-in-Docker environment validated (headless figures OK). Pyodide + python-control verified.

## Branches (user request, 2026-11-25)
- One branch per phase: `phase-0` … `phase-5`. Each branch ends at the last commit of its phase and contains the earlier phases.
- Work on the current phase's branch; when the phase is complete (and reviewed when required), merge it into `main` (fast-forward) and start the next branch from `main`.
- `main` is never rewritten (no force push).
