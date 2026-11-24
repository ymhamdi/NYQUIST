# Octave vs MATLAB

The scripts in `matlab/` are the files submitted: **plain MATLAB** (Control System Toolbox, Signal Processing Toolbox). The CI runs the same files in **GNU Octave 8.4** (control 4.0.1, signal 1.4.5) to generate `reference/*.json`. This file lists every place where the two differ and what was done about it. **The MATLAB behaviour is the one that counts.**

## To verify once in MATLAB

| # | What | One line to run in MATLAB | What to report |
|---|---|---|---|
| V1 | `c2d(G, T, 'impulse')` scaling (TP2 III.6, errata E-AE26). Octave returns Z{g(kT)} = 9z/(z − e^{−9T}); MathWorks does not document whether MATLAB multiplies it by T. | `G = tf(9,[1 9]); Gi = c2d(G, 0.01, 'impulse')` | The numerator: **9 z** (no factor) or **0.09 z** (× T). |

The TP2 script does not depend on the answer: it computes both conventions by hand, measures `facteur_c2d = dcgain(c2d(...))/dcgain(9z/(z−a))`, and sets `c2d_multiplie_par_T` accordingly. The answer only decides what the web page says MATLAB prints.

## Functions missing in Octave → shims in `matlab/compat/` (Octave only)

| Function | Used in | Shim |
|---|---|---|
| `stepinfo` | AE TP4 III.2–III.4, IV.6–IV.8 | `compat/stepinfo.m` implements the **MATLAB R2021a+** definitions: SettlingTime when \|y − y_final\| stays within 2 % of \|y_final − y_init\| (y_init = 0 for a model), RiseTime 10 → 90 %, Overshoot relative to y_final − y_init, and TransientTime (the pre-R2021a SettlingTime, 2 % of the peak error). Checked against closed forms: first order Ts = τ·ln 50 and Tr = τ·ln 9 to 7 digits; second order ζ = 0.5 overshoot 16.3034 %. Limits: PeakTime is on the simulation grid (not interpolated); the simulation horizon is 15 time constants of the slowest pole. |
| `order` | AE TP3 II.5 | `compat/order.m`: number of states, or the degree of the denominator. |

`compat/` is added to the path by `matlab/refs/export_refs.m` (CI) or `matlab/octave_setup.m` (run it once if you use Octave yourself). MATLAB never sees these files.

## Differences handled in the scripts (same code, same result in both)

| Difference | Where it mattered | How the scripts avoid it |
|---|---|---|
| `lsim` input interpolation: Octave interpolates the input **linearly** between time points; MATLAB picks zero-order hold for steps. A step or a held command is smoothed over one time step in Octave. | AE TP1 III.1–2 (step at t = 1 s), AE TP3 II.6 (held command), AE TP4 IV.5 (load-torque step). The first run gave a 6.7·10⁻⁴ error at the sampling instants in TP3 II.6. | No `lsim` on a continuous system with a discontinuous input. Steps use the step response shifted in time; the TP3 hybrid loop discretizes G1 exactly (`c2d`, zoh) on a grid 20× finer than T. The error is now 0. |
| Local functions at the end of a script: valid in MATLAB (R2016b+); Octave cannot call them. | TS TP3 Q11 (`exposant_puissance2`). | Kept at the end (MATLAB style). The harness (`refs/nyq_split.m`) writes them to their own files before running. |
| `pause(5)` (asked by TS TP4). | TS TP4 I.2–I.5. | Kept in the script; the CI shadows `pause` (`refs/shadow/pause.m`) so it does not wait. |
| `pid(...)` returns a `pid` object in MATLAB and a `tf` in Octave. | AE TP4. | Only used through `feedback(C*G, 1)` and `dcgain`, which give the same transfer function. Only the display differs. |
| `zpk(...)` returns a `zpk` object in MATLAB and a `tf` in Octave. | AE TP2 III.3. | Compared through `dcgain` and `pole`, not displayed coefficients. |
| `tfdata(sys, 'v')` may pad the numerator with leading zeros differently. | AE TP2, TP3 (hand vs `c2d` checks). | Hand and toolbox results are compared through poles and static gains, never coefficient by coefficient. |
| MATLAB-only functions: `xline`, `yline`, `sgtitle`, `tiledlayout`, `table`, `string`, `contains`. | — | Not used. |

## Differences that remain (display only)

- **Text display**: Octave prints transfer functions as `y1: ...` blocks and variables slightly differently. The values are the same.
- **Figures**: the CI draws with gnuplot (headless); colours, fonts and legend placement differ from MATLAB. Root loci (`rlocus`), `pzmap` and `zplane` look different but show the same poles and zeros.
- **`stepinfo` across MATLAB versions**: R2020b and earlier measure SettlingTime against the **peak error**. For a response starting at 0 without overshoot both definitions agree; they differ when the response starts with a jump (kd ≠ 0) or overshoots. The web page shows both and names the version (errata E-AE11).

## How the references are produced

```
octave-cli --eval "addpath('matlab/refs'); export_refs"      # writes reference/*.json and build/figures/
node tools/compare-refs.mjs reference regenerated            # CI: committed vs regenerated, rel 1e-9 / abs 1e-12
```
Each JSON file holds, for every `%%` cell (keyed by the handout's question number), every variable the cell creates or changes. Numbers are written with 12 significant digits; |x| < 1e-12 is written as 0, so round-off noise does not differ between machines.
