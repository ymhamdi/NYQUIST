# Nyquist

Interactive companion for the INSAT IIA 3 MATLAB labs:
**Traitement du signal** (TP1–TP4) and **Automatique linéaire échantillonnée** (every TP of the fascicule).

Youssef El Mhamdi, IIA 3/1, INSAT. MIT License.

[![Octave references](https://github.com/ymhamdi/NYQUIST-lab./actions/workflows/octave-refs.yml/badge.svg)](https://github.com/ymhamdi/NYQUIST-lab./actions/workflows/octave-refs.yml)

> **Status: Phase 2 done: the engine.** A dependency-free TypeScript engine reproduces every value of the six MATLAB scripts, as checked against GNU Octave in CI, including at random slider positions. Next: Phase 3, the Automatique TP3 page end to end, then a stop for your review.

**Contents:** [Phase 2: the engine](#phase-2-the-engine) · [Phase 1: the MATLAB scripts](#phase-1-the-matlab-scripts) · [Phase 0: what was done](#phase-0-what-was-done) · [The plan](#the-plan-what-comes-next) · [What I need from you](#what-i-need-from-you) · [Repository layout](#repository-layout)

---

## Phase 2: the engine

[`src/engine/`](src/engine/) is plain TypeScript with no dependencies, written from scratch. It is what the website will compute with, so every number on screen will come from here.

| Module | What it does |
|---|---|
| [`poly.ts`](src/engine/poly.ts), [`complex.ts`](src/engine/complex.ts) | Polynomials in MATLAB's order, with roots by Aberth–Ehrlich iteration (exact conjugate pairs, exact roots at 0). |
| [`linalg.ts`](src/engine/linalg.ts) | LU solve, matrix exponential (Padé 6 with scaling and squaring), balancing (LAPACK-style), characteristic polynomial. |
| [`lti.ts`](src/engine/lti.ts) | Transfer functions with MATLAB's semantics: `feedback` keeps cancelled poles, and `pid` builds only the terms that exist. `c2d` by zero-order hold and by impulse invariance, exact step responses, `filter`, `impz`. |
| [`stepinfo.ts`](src/engine/stepinfo.ts) | MATLAB R2021a+ definitions, plus TransientTime (the pre-2021 SettlingTime). |
| [`dsp.ts`](src/engine/dsp.ts) | FFT of any length (radix-2, or Bluestein otherwise), `fftshift` axes, DTFT, `freqz`, `conv`, circular convolution. |
| [`matlabScript.ts`](src/engine/matlabScript.ts) | Reads the TP scripts themselves: the `%%` cells and the `@param` lines (value, unit, range or choices). `substitute` rewrites values; this is what makes the shown code follow the sliders. |
| [`tp/`](src/engine/tp/) | One model per TP script. Each mirrors its script **cell by cell, with the script's variable names**. |

**How it is proven: 120 tests, in three layers**
1. **Engine vs Octave at the scripts' defaults** ([tests/reference/](tests/reference/)). Every cell of every script is compared with `reference/*.json` at 10⁻⁹. Each cell must compare a minimum number of variables, so a renamed variable cannot skip its check. A meta-test changes T by 0.1 % and checks that the comparison **fails**.
2. **Engine vs closed forms** ([tests/engine/core.test.ts](tests/engine/core.test.ts)), independent of Octave so that a mistake shared by both cannot hide. It covers the FFT against the DFT definition for N = 8, 50, 64, 100, 101, ZOH and impulse discretization, the matrix exponential, the root finder, `stepinfo`, and the script parser.
3. **"The code follows the sliders"** ([tests/sliders/](tests/sliders/)). Random slider positions are drawn within each `@param` range and written into copies of the scripts with the same `substitute` the site uses. GNU Octave runs them, and the engine must reproduce every result at those positions. CI runs 36 random positions on every push; I ran 60 locally.

**What the random-slider test caught** (all fixed)
- **A bug in the TP4 script.** For a setpoint below 1.6 m, the tank never overflows, but the script computed the overflow time with the log of a negative number. MATLAB and Octave silently return a **complex** time (45.4 − 157.1j s). The script now returns Inf in that case.
- **An engine crash.** With the printed L = 0.011 mH, `stepinfo` simulates 400,001 points, and `Math.max(...array)` overflowed the call stack. It would have frozen the page.
- **Two engine accuracy issues with the stiff motor** (poles −22.9 and −72,700 rad/s). The companion-form realization was ill-conditioned until it was balanced. A pole mapped to e^{−3155} = 0 left an exact z/z factor that Octave cancels.
- **Two behaviours to match MATLAB.** `pid(kp, 0, 0)` is a plain gain, not 2s/s with a spurious pole at 0. The derivative filter Tf disappears when kd = 0.

---

## Phase 1: the MATLAB scripts

These are the files to submit. Open one in MATLAB and run it cell by cell (Ctrl+Enter), or all at once (F5).

| Script | Cells (handout numbering) |
|---|---|
| [automatique/tp1_simulink_premier_ordre.m](matlab/automatique/tp1_simulink_premier_ordre.m) | III.1, III.2 |
| [automatique/tp2_discretisation.m](matlab/automatique/tp2_discretisation.m) | II.1–II.2, III.1–III.6, IV.1–IV.4 |
| [automatique/tp3_stabilite_precision.m](matlab/automatique/tp3_stabilite_precision.m) | II.3–II.7, III.1–III.6 |
| [automatique/tp4_regulation_pid.m](matlab/automatique/tp4_regulation_pid.m) | III.1–III.4, IV.5–IV.8 |
| [signal/tp3_tfd.m](matlab/signal/tp3_tfd.m) *(statement not verified)* | Q1–Q12 |
| [signal/tp4_filtres_numeriques.m](matlab/signal/tp4_filtres_numeriques.m) *(statement not verified)* | I.1–I.5, invfreqz (outside the handout), II.1–II.3 |

**How each script is written**
- French comments that give the reasoning and the hand calculation (for example G(z) = (1 − a)/(z − a) with a = e^{−T}). MATLAB's result is checked against the hand result in the same cell.
- Every value the handout leaves open is on a line tagged `% @param` and explained: T = τ/10, K = 1, the 2 % tolerance, Cr = 0, L = 0.011 H… These are the lines the website's sliders will rewrite (Phase 3).
- Defaults are computed, not guessed. The "réponse désirée" of TP4 is a stated spec (overshoot ≤ 5 %, zero static error), and both default tunings meet it. Tank: PI kp = 1, ki = 0.02, which cancels the plant pole (0 % overshoot, Ts = 15.6 s). Motor: PID kp = 2, ki = 60, kd = 0.02 (1.8 % overshoot, Ts = 0.086 s).

**How correctness is proven**
- [`matlab/refs/export_refs.m`](matlab/refs/export_refs.m) runs every script in GNU Octave **cell by cell**. For each question it records every variable the cell creates and writes it to [`reference/*.json`](reference/). This takes about 15 s for all six scripts.
- The [CI job](.github/workflows/octave-refs.yml) re-runs the scripts on every push and [compares](tools/compare-refs.mjs) the result with the committed JSON (relative tolerance 1e-9). A script changed without regenerating its references turns CI red. The comparator was tested both ways: it passes on a fresh run and catches a 10⁻⁶ change.
- 38 key results were checked against closed forms computed independently, for example Kmax(0.1 s) = (1 + e^{−0.1})/(1 − e^{−0.1}) = 20.0167, the tank's settling time τ·ln 50, and the DFT line 150 = N·A/2. All 38 match.
- Every Octave/MATLAB difference found is documented in [matlab/OCTAVE_VS_MATLAB.md](matlab/OCTAVE_VS_MATLAB.md). Octave lacks `stepinfo` and `order`, so `matlab/compat/` has shims that MATLAB never sees. Octave's `lsim` interpolates steps linearly, so the scripts avoid relying on it. One point needs **one line run in MATLAB**: the `'impulse'` method of `c2d`.

**What running them found** (now in the scripts' comments and the errata)
- With the default T = 5 s, the tank **cannot** reach 2 m within 2 % with a P controller. It needs K ≥ 3.92 but Kmax(5 s) = 1.60, so T must be below 2.04 s. The script computes this.
- In Signal TP3, zero-padding moves the peak toward the continuous spectrum's peak (107.9 Hz), **not** toward 105 Hz. With 50 samples, the DC component's lobe biases it.
- Signal TP3 Q8 compares signals of amplitudes 1 and 3 (new errata E-TS10).

---

## Phase 0: what was done

### 1. Inventory of every handout question → [COVERAGE.md](COVERAGE.md)

Each known question is listed with its handout number, its exact statement (typos included), its type (calcul à la main / MATLAB / Simulink / interprétation) and the handout page it comes from. Nothing is guessed: anything without a source is marked **needs handout**.

| Course | TP | Questions | Source |
|---|---|---|---|
| Automatique | TP1 Initialisation à Matlab Simulink | **III.1–III.2** | ✅ checked against the PDF (p. 5–9) |
| | TP2 Discrétisation d'un signal à temps continu | **II.1–2, III.1–6, IV.1–4** + Tableau 2.1 | ✅ checked against the PDF (p. 10–11) |
| | TP3 Stabilité et précision d'un système échantillonné asservi | **II.3–II.7, III.1–III.6** (the handout's numbering really starts at 3) | ✅ checked against the PDF (p. 13–15) |
| | TP4 Asservissement des systèmes continus | **III.1–III.4, IV.5–IV.8** + Tableau 4.1 | ✅ checked against the PDF (p. 16–18) |
| Traitement du signal | TP1 Signaux discrets | Outline only (1.1, 1.2, 1.3) | ⏳ exact statements and numbering need the PDF |
| | TP2 Convolution | Outline only (parts A and B) | ⏳ exact statements and numbering need the PDF |
| | TP3 TFD | 2.1 + **Q1–Q12** (p. 5) | ⏳ second-hand; §1 missing |
| | TP4 Filtres numériques | **I.1–I.5, II.1–II.3** (p. 6) | ⏳ second-hand; full "programme fourni" missing |

The Automatique fascicule has **exactly 4 TPs and 33 questions**, 18 of them involving Simulink.

### 2. Errata du fascicule: 37 issues found → [COVERAGE.md, last section](COVERAGE.md#missing-values-and-inconsistencies-feed-the-errata-du-fascicule-page)

These will become a visible *Errata* page in the app. For each issue it gives what the handout says, why it is a problem, the choice made and why. The choice is always exposed as a slider or toggle. The most important ones:

- **The sampling period T is never given**, neither in Automatique TP2 nor in TP3, yet every result depends on it (G(z), Kmax, stability). → slider, default from the rule T ≈ τ/10, and the Kmax(T) curve always shown.
- **"K pour remplir 2 m"** (TP3 III.4): a proportional controller never reaches exactly 2 m, and no tolerance is given. → tolerance slider plus the derivation K ≥ (1−ε)/(12.5ε), checked against Kmax(T).
- **The same motor has two inductances**: Tableau 2.1 (TP2) says L = 0.011 **H**, Tableau 4.1 (TP4) says 0.011 **mH**. With 0.011 mH the electrical pole lands near −72 700 rad/s, which is implausible. → proposed default 0.011 H, with a toggle to the printed value (your decision).
- **TP2's mechanical equation has a sign error**: « JsΩ − kcI − Cr − fΩ = 0 » contradicts its own eq. (2), Ω = (kcI − Cr)/(Js+f). → eq. (2) is used.
- **TP2 asks for a command 'imp' that does not exist**. The most likely meaning is `c2d(G, T, 'impulse')`, i.e. discretization *without* a hold, compared with `'zoh'`. → both derived and compared.
- **TP2 says "sinusoïdal de fréquence 1 rad/sec"**: rad/s is a pulsation (ω = 1 rad/s, f ≈ 0.159 Hz). **TP1 writes "G(p) = 9/(s+9)"**, and its Figure 1.6 actually closes the loop, so the scope shows 9/(s+18) settling at 0.5.
- **Units**: f is printed "N.m" (should be N·m·s/rad); the motor setpoint is "10 V" in the table but "10 rad/s" in the text; the tank setpoint is labelled Qe (an inflow) while it is compared with a height.
- **The PID in Simulink ≠ `pid()` in MATLAB**: the Simulink `PID Controller` block filters the derivative (N = 100 by default), so the curves differ as soon as kd ≠ 0. → both modelled and compared.
- **`stepinfo` changed definition in MATLAB R2021a** (settling band measured against |y_final − y_init| instead of the peak error). → both implemented; the version is named on screen.
- **The IIR filter of Signal TP4 is unstable as printed** (denominator 0.516z² − 1.2z + 1: |poles| = 1.392, in z or in z⁻¹). It is z² − 1.2z + 0.516 with its coefficients reversed; reversing them inverts the poles (|p| = 0.718). → use the stable one and show the printed one as an errata toggle.
- **The program given in Signal TP4** uses `freqz(Num, Den, 1/Te)`, where 100 is read as a *number of points*, not a frequency. A numerator written in powers of z must be left-padded for `impz`/`freqz`.
- Ambiguities to settle with the PDF: sine or cosine in Signal TP1 1.2 (at fe = 2f₀ a sine gives only zeros, a cosine gives ±1); the meaning of "fréquence de Nyquist" (fe/2 or 2·fmax); N = 100 or 101 samples in Signal TP3 Q1.

### 3. The tool chain was set up and validated

- **GNU Octave in Docker** ([docker/octave.Dockerfile](docker/octave.Dockerfile)): Ubuntu 24.04, Octave 8.4.0, control 4.0.1, signal 1.4.5. It is the same environment the CI will use to generate every reference value.
- **Headless figures work.** It took two discoveries: Octave needs the `fonts-freefont-otf` package (otherwise "invalid bounding box, cannot render"), and `gnuplot` or `xvfb` to draw without a screen.
- **Octave vs MATLAB differences found so far.** `stepinfo`, `order`, `xline` and `yline` do not exist in Octave, and Octave cannot call local functions placed at the end of a script. → Octave-only shims in `matlab/compat/`. The submitted scripts stay pure MATLAB.
- **MATLAB's exact `stepinfo` definitions** were checked in the MathWorks documentation (R2021a+ and R2020b).
- **The Python "Run" button is feasible.** Pyodide 0.27.7 loads python-control 0.10.2 in the browser, and its results match Octave: c2d of 1/(s+1) at T = 0.1 s gives 0.09516/(z − 0.90484), and the tank's PI loop gives a 3.888 % overshoot. Its weak point is size (≈ 45 MB), so it will be an opt-in button. One quirk: `step_info` needs an explicit time vector.
- **Measurement scripts** in [tools/](tools/): a Lighthouse batch runner and a phone (375 px) / offline probe. They will check the performance and accessibility targets.

### 4. The stack was chosen → [PLAN.md §1](PLAN.md#1-stack-chosen-on-its-merits)

---

## The plan: what comes next

Full details: [PLAN.md](PLAN.md).

### Priorities (in this order)
1. **Complete coverage**: every question of every TP, with the handout's numbering. Nothing left "à venir".
2. **Proven correctness**: one clean MATLAB script per TP (one `%%` cell per question, French comments) is the source of truth. A GitHub Actions job runs them in Octave and writes every reference number to JSON, and the web engine's tests compare against that JSON. No hand-typed values. A CI badge will go in this README.
3. **Code that follows the sliders**: the MATLAB shown is the submitted script's cell with the current slider values, so pasting it into MATLAB reproduces the plot on screen. CI proves it by running the substituted cells in Octave. Stretch: a Python "Run" button (Pyodide).
4. **Learning**: "predict first" on every question, step-by-step hand derivations, and a **Mode DS** of generated exercises with auto-correction and a full correction.
5. **The deliverable**: a "Générer le compte rendu" button that produces a print-quality PDF lab report per TP: cover page, Q&A, derivations, figures at the current parameters, observations, and a MATLAB annex.
6. **Industrial side**: a MATLAB script that builds the handout's Simulink models from code. "Vers le microcontrôleur" exports C for Arduino/STM32 (difference equation, timer, saturation, anti-windup, fixed-point note), and CI compiles it.
7. **Polish**: Lighthouse ≥ 95 (performance and accessibility), offline (PWA), phone, keyboard, dark/light themes, SVG figures with clickable blocks, the Errata page, and this README with screenshots.

### Stack
| Part | Choice | Why |
|---|---|---|
| Pages | **Astro 5** (static) | Pages are pre-rendered HTML, so they display fast even on a phone; only the interactive parts load JavaScript |
| Interactive parts | **Svelte 5** | Tiny runtime; one slider updates figure, formula, code and derivation at once |
| Figures | **Own SVG plotting module** (~10 kB) | Light (a general charting library weighs ~1.4 MB), crisp in the PDF report, follows the theme |
| Formulas | **Temml → MathML** | Native browser math; no fonts to download |
| Engine | **TypeScript, no dependencies** | Tested against the Octave JSON; shared by pages, exercises, report and C export |
| Offline | **PWA (Workbox)** | Works with no network after the first visit |
| Tests | **Vitest, Playwright + axe, Lighthouse CI** | Correctness, phone/keyboard/offline, performance budgets enforced |

### Architecture
```
matlab/        source of truth: the scripts submitted (+ Simulink builder, Octave shims, reference exporter)
reference/     JSON generated by Octave in CI, never edited by hand
src/engine/    control + signal computations, hand derivations, exercise generators, MATLAB/C code generation
src/content/   handout statements (verbatim, with source) + French explanations
src/components/, src/pages/   Svelte widgets and Astro pages (TPs, Mode DS, report, errata)
tests/         engine vs Octave, end-to-end (phone, keyboard, offline), "no hard-coded numbers" check
```
One parameter store per TP feeds the engine. Every view (figure, formula, derivation, code, report, C export) reads the engine's results, and **no number on screen is typed by hand**: a CI check rejects numeric literals in the French text.

### Phases
| Phase | Content | Estimate |
|---|---|---|
| **1** ✅ | MATLAB scripts for the 4 Automatique TPs and Signal TP3–TP4 (Signal TP1–TP2 once its PDF arrives) + Octave shims + the CI job that generates `reference/*.json` + the Octave vs MATLAB notes | done |
| **2** ✅ | Engine (control + signal), tests against the JSON, "code follows sliders" check in CI (the step-by-step derivations come with each page) | done |
| **3** | **Automatique TP3 end to end** (figures, live code, predict first, derivations, Mode DS, report), then **stop for your review** | 3 h |
| **4** | The other TPs on the same pattern (Automatique TP1, TP2, TP4; Signal TP1–TP4), the Simulink builder, C export, PWA, themes, errata page | 10 h |
| **5** | Deploy to GitHub Pages, Lighthouse, check every page at phone and desktop width, originality check, final scorecard | 1.5 h |

Honest total: **≈ 20–22 h**. If time runs short, cuts come from the bottom of the priority list: Python Run first, then the README GIF, the STM32 variant, Mode DS breadth, the "pick the curve" exercises, and report extras. **Correctness and coverage are never cut.**

---

## What I need from you
Decisions already taken (2026-11-24): deadline in a few days (full plan); motor default **L = 0.011 H** with a toggle to the printed 0.011 mH; credits **Nyquist, Youssef El Mhamdi, IIA 3/1**; the repo goes public only at deployment, after one more confirmation. Phase 1 has started.

Still open:
1. **The *Traitement du signal* handout PDF.** You don't have it, so Signal TP1/TP2 stay "needs handout" and TP3/TP4 are built from an unverified transcription. If you ever get it, put it in [handouts/](handouts/). PDFs there stay local: they are git-ignored, as they are the professor's documents.
2. **One line to run in MATLAB at school**, to settle an Octave/MATLAB difference (TP2 III.6, the `'impulse'` method): see [matlab/OCTAVE_VS_MATLAB.md](matlab/OCTAVE_VS_MATLAB.md).

## Repository layout
| Path | Content |
|---|---|
| [matlab/](matlab/) | The TP scripts (submitted), the Octave shims (`compat/`), the reference exporter (`refs/`), [OCTAVE_VS_MATLAB.md](matlab/OCTAVE_VS_MATLAB.md) |
| [reference/](reference/) | Reference values generated by Octave from the scripts, per question. Never edited by hand. |
| [src/engine/](src/engine/) | The computation engine (control, signal, script parser, one model per TP) |
| [tests/](tests/) | Engine vs Octave references, vs closed forms, and at random slider positions (`npm test`) |
| [COVERAGE.md](COVERAGE.md) | Every handout question, its source, type and status, plus the errata list |
| [PLAN.md](PLAN.md) | Stack, architecture, requirements → design → targets, phases, cut order |
| [CLAUDE.md](CLAUDE.md) | Conventions, commands and decisions, for continuing the work |
| [docker/octave.Dockerfile](docker/octave.Dockerfile) | Local copy of the CI Octave environment |
| [tools/](tools/) | Reference comparator (CI), Lighthouse batch runner, phone/offline probe |
| [handouts/](handouts/) | Where the handout PDFs go (kept local, git-ignored) |

### Run the scripts in Octave and regenerate the references
```bash
docker build -t nyq-octave -f docker/octave.Dockerfile docker/
docker run --rm -v "$PWD:/w" -w /w nyq-octave octave-cli --eval "addpath('matlab/refs'); export_refs"
node tools/compare-refs.mjs reference regenerated   # what CI does, after export_refs('regenerated')
```
(On Windows Git Bash, prefix with `MSYS_NO_PATHCONV=1` and use a `C:/...` path for `-v`.) To use the scripts in your own Octave, run `matlab/octave_setup.m` once.
