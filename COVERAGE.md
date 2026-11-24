# COVERAGE — every question of every TP

Status of this file: **Phase 0 draft, built without the handout PDFs.**
Every statement below must be re-checked against the PDFs once they are in `./handouts/`.

## Sources

| Tag | What it is | Trust |
|---|---|---|
| **[TS-p5]**, **[TS-p6]** | *Traitement du signal* handout (`TP_Traitement_Signal_TP1-4-1.pdf`), pages 5 and 6: verbatim transcription. | Second-hand transcription: re-check word for word against the PDF. |
| **[AE-p13–15]**, **[AE-p16–18]** | *TP Automatique Echantillonnée, INSAT 2024-2025*, pages 13–15 (TP3) and 16–18 (TP4): verbatim transcription. | Same. |
| **[FIG]** | Scans of the handout figures (Fig 3.1, 3.2, 4.1, 4.2, 4.3), read directly. | First-hand, figures only. |
| **[SEC]** | Secondary hints, not verbatim quotes (e.g. "Tableau 2.1 gives 0.011 H"). | **Unverified.** Never used as a statement. |
| **NEEDS HANDOUT** | No source available. Nothing is guessed. | — |

The handout text is reproduced exactly, including its typos ("Malab", "Sumilink", "Qu'elle", "affin…"). The typos are listed on the *Errata* page.

**Type**: `main` = calcul à la main · `MATLAB` · `Simulink` · `interp.` = interprétation / observation.

---

## Traitement du signal

### TP 1: Signaux discrets — NEEDS HANDOUT (statements)

The exact statements and the question numbering are **not available yet**.

Provisional outline **[SEC]**: three parts, 1.1, 1.2 and 1.3. The values below are probably the handout's, but they are unconfirmed.

| Part | Provisional numbering | Subject and values (unconfirmed) | Type | Status |
|---|---|---|---|---|
| 1.1 | Q1–Q4 | Operations on signals: t from 0 to 30 s, step 0.01 s; cosine of period 5; square wave of period 3 built from the sign of a sine; their sum and its period; the three plots in one window. | MATLAB, interp. | needs handout |
| 1.2 | Q1–Q4 | Sampling: f0 = 1 kHz, 20 ms, a "continuous" grid of 20 µs; fe = 4, 2, 1.1 and 0.9 kHz; spectra with `freqz`; conclusion. | MATLAB, interp. | needs handout. **Sine or cosine is decisive at fe = 2 kHz** (see errata E-TS1). |
| 1.3 | Q1–Q5 | Quantization: Nyquist frequency fc; fe = 2·fc; linear quantizer on [−A, A] with N levels, q = 2A/N, N = 64 and 256; practical vs theoretical SNR. | main, MATLAB, interp. | needs handout. **Meaning of "fréquence de Nyquist"** (see E-TS2). |

### TP 2: Convolution des signaux numériques — NEEDS HANDOUT (statements)

The exact statements and the question numbering are **not available yet**.

| Part | Provisional numbering | Subject and values (unconfirmed) **[SEC]** | Type | Status |
|---|---|---|---|---|
| A | A.1–A.6 | Linear convolution of x(n) = 1 (0 ≤ n ≤ N−1) with g(n) = 0.7ⁿ (0 ≤ n ≤ M−1), N = 10, M = 2N. Flip-and-slide method (`fliplr`), result length, FFT method, comparison. Then f(n) = e^{0.1n}, h(n) = e^{−0.1n} with Nf = 3, Mh = 2Nf, by both methods and analytically. | main, MATLAB | needs handout |
| B | B.1–B.6 | Circular convolution, N = 10: direct formula, then FFT without zero-padding, result length. Then f and h with N = M = 3: direct, FFT and analytic. | main, MATLAB | needs handout |

### TP 3: Transformée de Fourier Discrète [TS-p5]

The handout numbers this section "2.1 / 2.2". **Section 1 of TP3 (probably a *rappel*) is not quoted anywhere → needs handout.**

**2.1 Objectifs**: « Étudier l'influence du choix de la fréquence d'échantillonnage et de la durée d'observation d'un signal sur ses caractéristiques temporelles et fréquentielles. »

**2.2**: « Le signal analogique x(t) = 3cos(2π100t) est échantillonné à la fréquence d'échantillonnage Fe = 1000 Hz pour donner le signal x1[n]. »

| # | Exact statement | Type |
|---|---|---|
| Q1 | « Générer le signal x1[n] sur une durée (temps d'acquisition) tmax = 0.1 s. » | MATLAB (N = 100 or 101: E-TS5) |
| Q2 | « Tracer sur la même figure que vous allez subdiviser sur deux lignes, la partie réelle et la partie imaginaire de la transformée de Fourier X1(f) de x1[n]. Utiliser la fonction fft pour le calcul de la transformée de Fourier, la fonction fftshift pour obtenir un spectre symétrique par rapport à f = 0 et la fonction stem pour tracer le spectre sous forme discrète. » | MATLAB |
| Q3 | « Tracer le spectre d'amplitude sur une nouvelle fenêtre. » | MATLAB |
| Q4 | « Que constatez-vous concernant l'amplitude des raies ? Que faut-il faire pour trouver les bonnes amplitudes et les bonnes fréquences ? » | main, interp. |
| Q5 | « Soit le signal discret x2[n] = 5 + x1[n]. Refaire les questions 1, 2, 3 et 4 pour le signal x2[n]. » | MATLAB |
| Q6 | « Quel est l'effet de la composante continue de x2[n]. » | interp. |
| Q7 | « Soit le signal discret x3[n] = 5 + cos[2π100nTe − π/3]. Tracer les parties réelle et imaginaire de X3(f) ainsi que le spectre d'amplitude. » | MATLAB |
| Q8 | « Quel est l'effet du retard sur les parties réelle et imaginaire du spectre (comparées à X2(f)) ainsi que sur le spectre d'amplitude ? » | main, interp. |
| Q9 | « Tracer le spectre du signal x4[n] = 5 + cos[2π105nTe]. Que constatez-vous ? » | MATLAB, interp. |
| Q10 | « Refaire la question 9) pour des temps d'acquisition tmax = 0.05 s et tmax = 0.2 s. Que constatez-vous ? Pourquoi ? » | MATLAB, main (Δf = 1/tmax), interp. |
| Q11 | « On se fixe un temps d'acquisition tmax = 0.05 s, programmer une fonction qui permet de déterminer l'indice p tel que 2^p est la première valeur qui dépasse le nombre d'échantillons N. » | MATLAB (function) |
| Q12 | « On considère un signal x5[n] tel que : x5[n] = x4[n] si n ≤ N ; 0 si N ≤ n ≤ 2^p. Tracer le spectre d'amplitude de x5[n]. Que constatez-vous ? Quelle est l'utilité de l'ajout des zéros. » | MATLAB, interp. |

### TP 4: Analyse des filtres numériques [TS-p6]

**Objectif (partie I)**: « L'objectif de cette partie du TP est de se familiariser avec quelques fonctions Matlab concernant la transformée en Z. Par exemple : la fonction tf (Num, Den, Te) ou dfilt.df1 ou freqz qui détermine la TF à partir des coefficients du numérateur et dénominateur de la TZ et la période d'échantillonnage Te ; les fonctions roots, pour calculer les zéros du numérateur ou dénominateur ; la fonction pzmap ou zplane pour localiser les zéros et les pôles dans le plan complexe ; la fonction impz pour calculer la transformée en Z inverse ; la fonction invfreqz pour déterminer le numérateur et le dénominateur en utilisant la TF (freqz). »

**Partie I, données**: « Prenons deux exemples de fonctions de transferts (TF) de la forme suivantes : H(z) = (z − 0.3) / (z² − 1.3z + 0.7) ; H(z) = (z² − 0.3) / (z³ − 1.3z² + 0.7z + 1.5). On donne Te = 0.01. »

The handout also contains a **"programme fourni"** (a given program). Only fragments are known **[SEC]**: `dfilt.df1(Num, Den)`, `%H=ft(Num,Den,Te)` and `[H, f] = freqz(Num, Den, 1/Te)`. **The full listing needs the handout.**

| # | Exact statement | Type |
|---|---|---|
| I.1 | « Déclarer la période d'échantillonnage, les coefficients du numérateur de la TZ et les coefficients du dénominateur de la TZ. » | MATLAB |
| I.2 | « Déterminer la TZ. Ici il ne faut pas mettre le point-virgule afin de visualiser l'expression de la TZ dans l'invite Matlab (insérer une pause de 5s). » | MATLAB |
| I.3 | « Localiser les zéros et les pôles dans le plan complexe (sans le point-virgule et une pause de 5s). » | MATLAB, main (roots), interp. (stability) |
| I.4 | « Calculer la transformée en Z inverse et visualiser sa forme (stem) (pause de 5s). » | MATLAB, main (first samples by long division) |
| I.5 | « Calculer la TF en utilisant la fonction freqz et représenter sa réponse en amplitude et sa réponse en phase (pause de 5s) dans la même figure. » | MATLAB |
| — | `invfreqz` is named in the objective but no question uses it. I'll add it as an optional exercise, clearly marked as not part of the handout. | — |

**Partie II**: « La fonction de transfert du filtre passe-bas RII du second ordre est de la forme : H(z) = (0.079z² + 0.158z + 0.079) / (0.516z² − 1.2z + 1) » (denominator as printed: see E-TS8).

| # | Exact statement | Type |
|---|---|---|
| II.1 | « Générer et tracer la réponse impulsionnelle du filtre RII par l'utilisation de la fonction impz. On donne l'ordre du filtre N = 32. » | MATLAB |
| II.2 | « Calculer la réponse en fréquence de nombre de points L = 256 et représenter la réponse en amplitude (échelle logarithmique) et la réponse en phase. » | MATLAB, interp. |
| II.3 | « Représenter les pôles et les zéros dans le plan z. » | MATLAB, main |

---

## Automatique linéaire échantillonnée

**Fascicule structure:** TP3 is on pages 13–15 and TP4 on pages 16–18. Pages 1–12 hold **at least TP1 and TP2**. TP2 reportedly has DC-motor equations (eq. 1–2) and a motor parameter table, "Tableau 2.1", with L = 0.011 H **[SEC]**. Whether there are **TPs after page 18 is unknown.**

### TP 1 — NEEDS HANDOUT
Nothing is known. Not even the title.

### TP 2 — NEEDS HANDOUT
Known only from hints **[SEC]**: a DC motor (MCC) with electrical and mechanical equations (eq. 1–2) and a parameter table, Tableau 2.1. No statement is available.

### TP 5 and later — NEEDS HANDOUT (existence unknown)

### TP 3: Stabilité et précision d'un système échantillonné asservi [AE-p13–15]

**I. But**: « Dans ce TP on va étudier la stabilité d'un système Echantillonné en tenant compte de l'effet de la période d'échantillonnage ainsi que du contrôleur numérique proportionnel. »

**Questions 1 and 2 are missing.** The available transcription starts part II at question 3. Either the handout's numbering really starts at 3 (a typo), or questions 1–2 exist and were not transcribed. **Needs handout.**

**II.** « Soit un système échantillonné dont la fonction de transfert est donnée par » G1(s) = 1/(s + 1) « et le schéma bloc est représenté ci-dessous : » **Figure 3.1** [FIG] « On donne » C(s) = K « qui est un contrôleur numérique proportionnel et la fonction de transfert du bloqueur d'ordre zéro » B0(s) « est » (1 − e^{−Ts})/s.

| # | Exact statement | Type | Missing data |
|---|---|---|---|
| 3 | « Calculer la transformation en z G(z) en boucle fermé de ce système. » | main | **T not given** (E-AE1) |
| 4 | « Vérifier par Matlab votre calcule par les commandes tf, c2d et feedback » | MATLAB | T, K |
| 5 | « Déterminer l'ordre de ce système ainsi que les pôles et les zéros et vérifier la stabilité de ce système en utilisant la commande rlocus. » | main, MATLAB, interp. | T |
| 6 | « Utiliser l'interface Simulink dans Matlab pour voir la réponse de ce système. » | Simulink | T, **K not given** (E-AE2) |
| 7 | « Vérifier la stabilité du système pour différent valeur de K et indiquer la valeur limite de K. » | main (Kmax(T)), MATLAB/Simulink, interp. | T |

**III.** « Dans cette partie on essaye de faire la simulation d'un système hydraulique qui comporte un réservoir d'eau de section constant. Le réservoir est alimenté par un débit Qe(t). H est la hauteur de 20 m d'eau dans le réservoir. » « La fonction de transfert de ce système est » G1(s) = H(s)/Qe(s) = 12.5/(50s + 1). « Ce système est contrôlé par contrôleur numérique C(s) = K avec un temps d'échantillonnage T. La fonction de transfert du bloqueur d'ordre zéro est » B0(s). « Le schéma bloc est représenté ci-dessous : » **Figure 3.2** [FIG]

| # | Exact statement | Type | Missing data |
|---|---|---|---|
| 1 | « Calculer la transformation en z G(z) en boucle fermé de ce système. » | main | T (E-AE1) |
| 2 | « Vérifier par Matlab votre calcule par les commandes tf, c2d et feedback » | MATLAB | T, K |
| 3 | « Utiliser l'interface Simulink dans Matlab pour voir la réponse de ce système pour différent période d'échantillonnage T. » | Simulink, interp. | list of T values, K |
| 4 | « Qu'elle est la valeur de K pour remplir 2m (consigne) de la hauteur du réservoir. » | main, interp. | **tolerance not given**: a P controller never reaches exactly 2 m (E-AE6) |
| 5 | « Déterminer les pôles et les zéros et vérifier la stabilité de ce système en utilisant la commande rlocus. » | main, MATLAB | T |
| 6 | « Qu'elle est l'erreur statique de ce système. » | main, MATLAB | K |

### TP 4: Asservissement des systèmes continus par régulateur PID [AE-p16–18]

**I. But**: « Dans ce TP on va étudier la régulation des systèmes asservis par un régulateur PID. »

**II. Rappel** (text, then **Figure 4.1** [FIG], which shows a Simulink PID built from P, I and D branches with gains 1, 2 and 1, plus the `PID Controller` block):
« La régulation des systèmes regroupe l'ensemble des moyens matériels et techniques mis en œuvre pour maintenir une grandeur physique à régler, égale à une valeur désirée, appelée consigne. » « Un régulateur PID est un organe de contrôle qui permet d'effectuer une régulation en boucle fermée d'un système. » « Le PID contient trois actions en fonction de l'erreur : » *Une action proportionnelle*: « l'erreur est multipliée par un gain kp »; *Une action intégrale*: « l'erreur est intégrée par un intervalle de temps, puis multiplié par un gain ki. »; *Une action dérivée*: « l'erreur est dérivée suivant un temps, puis multipliée par un gain kd. » « Chaque fonction dans le PID joue un rôle important dans l'optimisation des performances du système (stabilité, rapidité et précision). » « Pour insérer le régulateur PID dans l'interface Sumilink on peut insérer chaque fonction du PID séparément ou on utilise directement le bloc PID Controller comme indique le schéma suivant : »

**III.** « Considérons le schéma fonctionnel d'un réservoir d'eau suivant : » **Figure 4.2** [FIG] (Qe(S) → comparator → PID → 12.5/(50s+1) → H(s), unity feedback) « On choisi 2 m comme consigne: le régulateur PID vise à réguler la hauteur de l'eau dans le réservoir. »

| # | Exact statement | Type | Missing data |
|---|---|---|---|
| 1 | « Faire le schéma bloc de ce réservoir dans Simulink sans et avec le régulateur PID. » | Simulink | meaning of "sans PID" (E-AE9) |
| 2 | « Faire varié la valeur du gain kp, ki et kd affin d'obtenir une réponse désirée » | Simulink/MATLAB | **"réponse désirée" not specified** (E-AE10) |
| 3 | « Qu'elle est l'effet de chaque gain sur la stabilité, rapidité et précision du système. » | interp. | — |
| 4 | « Déterminer l'erreur statique, le temps de réponse et le dépassement avant et après l'utilisation du régulateur PID avec Simulink et avec la commande >>stepinfo dans Malab » | MATLAB, Simulink, main (static error) | stepinfo definition depends on the MATLAB version (E-AE11) |

**IV.** « Considérons le schéma fonctionnel d'un moteur à courant continu suivant : » **Figure 4.3** [FIG] (U → comparator → PID → comparator → 1/(Ls+R) → kc → comparator with load torque cr → 1/(Js+f) → Ω; inner feedback through ke; unity outer feedback) « On choisi 10 rad/s comme commande : le régulateur PID vise à réguler la vitesse du moteur en prenant l'erreur comme entrée et fournit la tension nécessaire au moteur. »

« Les paramètres utilisés sont résumés dans ce tableau »: **Tableau 4.1**: L = 0.011 mH · R = 0.8 Ω · J = 0.2 kg.m2 · f = 1.10-2 N.m · k_em = 1.91 SI · k_c = 1.91 SI · U = 10 V. (As printed. Units: see E-AE7, E-AE8.)

| # | Exact statement | Type | Missing data |
|---|---|---|---|
| 5 | « Faire le schéma bloc du MCC dans Simulink sans et avec le régulateur PID. » | Simulink | value of cr (load torque) not given (E-AE12) |
| 6 | « Faire varié la valeur du gain kp, ki et kd affin d'obtenir une réponse désirée » | Simulink/MATLAB | "réponse désirée" (E-AE10) |
| 7 | « Qu'elle est l'effet de chaque gain sur la stabilité, rapidité et précision du système » | interp. | — |
| 8 | « Déterminer l'erreur statique, le temps de réponse et le dépassement avant et après l'utilisation du régulateur PID avec simulink et avec la commande >>stepinfo dans Malab » | MATLAB, Simulink | L (E-AE7) |

---

## Missing values and inconsistencies (feed the *Errata du fascicule* page)

Each entry will get, in the app: what the handout says, why it is a problem, the choice made, and why. The choice is always exposed as a slider or toggle. The proposed defaults below will be finalized in Phase 1, from computations rather than taste.

| Id | Where | Issue | Proposed handling |
|---|---|---|---|
| E-AE1 | AE TP3 II and III | Sampling period **T never given**. | Slider. Default from the rule T ≈ τ/10 (τ = 1 s for II, 50 s for III). Kmax(T) is shown for every T. |
| E-AE2 | AE TP3 II.6 | **K not given** for the Simulink response. | Slider; default K = 1 (unity controller). |
| E-AE3 | AE TP3 | Numbering starts at 3. | Keep the handout's numbering; ask for the PDF. |
| E-AE4 | Fig 3.1 / 3.2 | The digital controller is drawn as **C(s)** between two samplers. | Explain it is C(z) = K; with a pure gain both samplers are equivalent to one. |
| E-AE5 | Fig 3.2 / 4.2 | The setpoint is labelled **Qe(S)** (an inflow, m³/s) but compared with a height H(s) (m); also "S" instead of "s". | Label it "consigne Hc (m)" and explain. |
| E-AE6 | AE TP3 III.4 | "K pour remplir 2 m": with a P controller, H(∞) = 2·12.5K/(1+12.5K) < 2. **No tolerance is given.** | Tolerance slider, with the derivation K ≥ (1−ε)/(12.5ε), compared with Kmax(T). |
| E-AE7 | Tableau 4.1 | **L = 0.011 mH** gives an electrical pole near −72 700 rad/s; Tableau 2.1 reportedly says 0.011 H **[SEC]**. | Toggle with both values. The default is decided once the PDF confirms Tableau 2.1. |
| E-AE8 | Tableau 4.1 | Units: f is printed "N.m" (should be N·m·s/rad); k_em and k_c are "SI" (V·s/rad, N·m/A); `k_em` in the table vs `ke` in Fig 4.3. | Correct the units in the UI; note it. |
| E-AE9 | AE TP4 III.1 / IV.5 | "**sans PID**": open loop, or unity feedback with C = 1? | Show both, labelled. |
| E-AE10 | AE TP4 III.2 / IV.6 | "**réponse désirée**" is not specified. | Make the spec explicit and editable (e.g. D% ≤ 5 %, tr5% ≤ …, εs = 0) and check it automatically. |
| E-AE11 | AE TP4 III.4 / IV.8 | `stepinfo`: MATLAB R2021a+ measures the 2 % band against \|y_final − y_init\|, while R2020b and earlier used the peak error. Octave has no `stepinfo`. | Implement the R2021a+ definition; note the version. |
| E-AE12 | Fig 4.3 | The load torque **cr** appears in the figure; its value is not given. | Default cr = 0, slider. |
| E-AE13 | Fig 4.3 / IV text | U = 10 **V** in the table, but "10 **rad/s** comme commande", and U is compared with Ω. | Treat U as a speed setpoint of 10 rad/s; explain. |
| E-AE14 | Fig 4.1 | The Simulink `PID Controller` block filters the derivative (N = 100 by default); `pid(kp,ki,kd)` does not. When kd ≠ 0 the curves differ. | Show both; the Simulink builder sets N explicitly. |
| E-TS1 | TS TP1 1.2 | Sine or cosine? At fe = 2f0 a sine gives x[n] ≡ 0 while a cosine gives ±1. | Needs handout. Until then, a toggle. |
| E-TS2 | TS TP1 1.3 | "Fréquence de Nyquist": fe/2 (usual definition) or 2·fmax (Nyquist rate)? This changes fe. | Needs handout. Until then, a toggle. |
| E-TS3 | TS TP3 Q8 | "retard": the −π/3 is a phase shift (a delay of 1/600 s at 100 Hz). | Explain both views. |
| E-TS4 | TS TP3 Q12 | "x5[n] = x4[n] si n ≤ N ; 0 si N ≤ n ≤ 2^p": the ranges overlap at n = N, and the length is 2^p or 2^p + 1. | Use length 2^p; note it. |
| E-TS5 | TS TP3 Q1 | tmax = 0.1 s gives N = 100 (`0:N-1`) or 101 (`t = 0:Te:tmax`). With 101 samples, 100 Hz is off-bin and leaks. | Toggle; default N = 100, with the leakage shown for N = 101. |
| E-TS6 | TS TP3 Q11 | "première valeur qui **dépasse** N": strictly greater. This differs from `nextpow2` when N is a power of 2. | Implement "strictly greater"; note it. |
| E-TS7 | TS TP4 I | Given program: `dfilt.df1` (legacy), `%H=ft(...)` (typo for `tf`), `freqz(Num,Den,1/Te)` (100 read as a number of points). The numerator in powers of z must be left-padded for `impz`/`freqz`. | Correct it and explain; needs the full listing. |
| E-TS8 | TS TP4 II | Denominator printed **0.516z² − 1.2z + 1**: its poles have \|p\| = 1.392 (unstable). With z² − 1.2z + 0.516: \|p\| = 0.718 and DC gain exactly 1 (0.316/0.316). | Use the stable version; show the printed one as an errata toggle. |
| E-TS9 | TS TP4 II.1 | "ordre du filtre N = 32": 32 is the **number of samples** of h[n]; the filter's order is 2. | Note it. |
| E-x | everywhere | Typos: "Malab", "Sumilink", "Qu'elle", "affin", "calcule", "boucle fermé". | Quoted as is, with [sic]. |

## Summary of what is blocked on the PDFs

1. **Automatique**: TP1, TP2 (all questions), TP3 questions 1–2, and whether a TP5+ exists.
2. **Traitement du signal**: TP1 and TP2, the exact wording and numbering of every question, and TP3 §1.
3. **Every quoted statement above**: a second-hand quote to re-check word for word.
4. The full "programme fourni" of TS TP4, and Tableau 2.1.

→ Please put both PDFs in `./handouts/`.
