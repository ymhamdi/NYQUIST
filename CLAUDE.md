# CLAUDE.md — Nyquist

Interactive MATLAB lab companion for INSAT IIA 3: *Traitement du signal* (TP1–TP4) and *Automatique linéaire échantillonnée* (every TP of the fascicule).
Author: Youssef El Mhamdi [+ teammates], IIA 3/[GROUP], INSAT. (Group and teammates still to be confirmed.)
Repository: https://github.com/ymhamdi/NYQUIST-lab

## Status
- **Phase 0 done**: `COVERAGE.md` (inventory of every question + errata) and `PLAN.md` (stack, architecture, phases). Next: Phase 1 after the user's OK.
- Handout PDFs: **not yet received**. They go in `./handouts/`. Once they arrive, re-check every statement in COVERAGE.md word for word.

## Rules
- **Never invent handout content.** A missing value gets "needs handout" or a documented default exposed as a slider, plus an entry on the Errata page.
- **Every number on screen comes from the engine.** No numeric literals in French prose (CI lint), except inside verbatim handout quotes.
- The MATLAB scripts in `matlab/` are the **source of truth**: one `%%` cell per handout question, **French comments**. Reference values come only from Octave CI (`reference/*.json`), never typed by hand.
- Where Octave and MATLAB differ, the **MATLAB behaviour is the one submitted**; Octave gets shims in `matlab/compat/` (added to the path only under Octave). Document every difference in `matlab/OCTAVE_VS_MATLAB.md`.
- Language: UI text in French with the handouts' terminology; code and comments in English, except the MATLAB scripts (French comments).
- Commit after each phase with clear messages.
- If time runs short, cut from the bottom of the priority list (PLAN.md §4). Never cut correctness or coverage.

## Stack (decided in PLAN.md §1)
Astro 5 (static) · Svelte 5 islands · own SVG plotting module · Temml → MathML · TypeScript engine with no dependencies · @vite-pwa/astro · Vitest · Playwright + axe-core · Lighthouse CI · GitHub Actions (Octave refs, web, deploy).

## Environment notes
- Octave runs in Docker: `docker build -t nyq-octave -f docker/octave.Dockerfile docker/` (Ubuntu 24.04, Octave 8.4.0, control 4.0.1, signal 1.4.5, gnuplot, fonts-freefont-otf, xvfb). CI installs the same packages.
- Headless figures in Octave: `graphics_toolkit('gnuplot')` + `set(0,'defaultfigurevisible','off')`. This **needs `fonts-freefont-otf`**, otherwise "ft_text_renderer: invalid bounding box".
- Octave lacks `stepinfo`, `order`, `xline` and `yline`, and cannot call local functions defined at the end of a script.
- On Windows Git Bash, `#/route` and `/c/...` arguments passed to Windows executables get rewritten: use `MSYS_NO_PATHCONV=1` and `C:/...` paths for node, docker `-v` and Chrome.
- Line endings are pinned to LF (`.gitattributes`): scripts and `.m` files run in Linux containers.
- Pyodide 0.27.7 + micropip installs python-control 0.10.2 (verified); ≈ 45 MB download, so it must stay opt-in.

## MATLAB `stepinfo` definition used (R2021a+)
SettlingTime: first T such that |y − y_final| ≤ 2 % · |y_final − y_init| for all t ≥ T (y_init = 0 for a model). RiseTime: 10 → 90 % of y_final − y_init. Overshoot: 100·(y_max − y_final)/(y_final − y_init). R2020b and earlier measured the band against the peak error: show both and name the version.

## Commands (to be filled in during Phase 1–2)
- Octave refs: `MSYS_NO_PATHCONV=1 docker run --rm -v "<repo>:/w" nyq-octave octave-cli --eval "cd /w/matlab/refs; export_refs"`
- Web: `npm ci`, `npm run dev`, `npm test`, `npm run build`, `npm run e2e`, `npm run lh`
- Lighthouse batch: `tools/lh.sh <base-url> <outdir> mobile|desktop <routes…>`; phone/offline probe: `node tools/probe.cjs <base> <shotdir> <routes…>`

## Decisions log
- 2026-11-24: stack chosen (PLAN.md §1). Octave-in-Docker environment validated (headless figures OK). Pyodide + python-control verified.
