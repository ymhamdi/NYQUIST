# Nyquist

Interactive companion for the INSAT IIA 3 MATLAB labs:
**Traitement du signal** (TP1–TP4) and **Automatique linéaire échantillonnée** (every TP of the fascicule).

Youssef El Mhamdi [+ teammates], IIA 3/[GROUP], INSAT. MIT License.

> **Status: Phase 0 done (inventory, environment, plan).** The **Automatique fascicule has been read and every statement checked** against the PDF (4 TPs, 33 questions). Waiting for the *Traitement du signal* handout and your OK on the plan before Phase 1.

**Contents:** [Phase 0: what was done](#phase-0-what-was-done) · [The plan](#the-plan-what-comes-next) · [What I need from you](#what-i-need-from-you) · [Repository layout](#repository-layout)

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

### 2. Errata du fascicule: 34 issues found → [COVERAGE.md, last section](COVERAGE.md#missing-values-and-inconsistencies-feed-the-errata-du-fascicule-page)

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
- **The IIR filter of Signal TP4 is unstable as printed** (denominator 0.516z² − 1.2z + 1: |poles| = 1.392). The stable version z² − 1.2z + 0.516 has |poles| = 0.718 and a DC gain of exactly 1. → use the stable one and show the printed one as an errata toggle.
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
| **1** | MATLAB scripts for the 4 Automatique TPs and Signal TP3–TP4 (Signal TP1–TP2 once its PDF arrives) + Octave shims + the CI job that generates `reference/*.json` + the Octave vs MATLAB notes | 3 h |
| **2** | Engine (control + signal + derivations), tests against the JSON, "code follows sliders" check in CI | 2.5 h |
| **3** | **Automatique TP3 end to end** (figures, live code, predict first, derivations, Mode DS, report), then **stop for your review** | 3 h |
| **4** | The other TPs on the same pattern (Automatique TP1, TP2, TP4; Signal TP1–TP4), the Simulink builder, C export, PWA, themes, errata page | 10 h |
| **5** | Deploy to GitHub Pages, Lighthouse, check every page at phone and desktop width, originality check, final scorecard | 1.5 h |

Honest total: **≈ 20–22 h**. If time runs short, cuts come from the bottom of the priority list: Python Run first, then the README GIF, the STM32 variant, Mode DS breadth, the "pick the curve" exercises, and report extras. **Correctness and coverage are never cut.**

---

## What I need from you
1. **The *Traitement du signal* handout PDF** in [handouts/](handouts/). It is needed for the Signal TP1/TP2 statements and to re-check the TP3/TP4 quotes. (The Automatique fascicule is received and checked. PDFs in `handouts/` stay local: they are git-ignored, as they are the professor's documents.)
2. **Your decision on the motor inductance** (E-AE7): default 0.011 H (Tableau 2.1) with a toggle to the printed 0.011 mH?
3. Your **group** (IIA 3/?) and **teammates** for the credits.
4. Your **OK on the plan** to start Phase 1.
5. Before Phase 1's CI can be pushed: run `gh auth refresh -s workflow` once (the current login cannot push GitHub Actions files).
6. For deployment: GitHub Pages on a private repo needs GitHub Pro (free with the Student Developer Pack); otherwise the repo must be public.

## Repository layout
| Path | Content |
|---|---|
| [COVERAGE.md](COVERAGE.md) | Every handout question, its source, type and status, plus the errata list |
| [PLAN.md](PLAN.md) | Stack, architecture, requirements → design → targets, phases, cut order |
| [CLAUDE.md](CLAUDE.md) | Conventions, commands and decisions, for continuing the work |
| [docker/octave.Dockerfile](docker/octave.Dockerfile) | Local copy of the CI Octave environment |
| [tools/](tools/) | Lighthouse batch runner, phone/offline probe |
| [handouts/](handouts/) | Where the handout PDFs go (kept local, git-ignored) |

### Run Octave locally
```bash
docker build -t nyq-octave -f docker/octave.Dockerfile docker/
docker run --rm -v "$PWD:/w" nyq-octave octave-cli --eval "pkg load control signal; ver"
```
(On Windows Git Bash, prefix with `MSYS_NO_PATHCONV=1` and use a `C:/...` path for `-v`.)
