# COVERAGE — every question of every TP

| Course | Source status |
|---|---|
| **Automatique linéaire échantillonnée** | ✅ **Checked against the PDF** (`handouts/Fascicule_TP_Automatique_Echantillonnee.pdf`, 18 pages, "Année Universitaire 2024-2025"), on 2026-11-24. **Complete: 4 TPs.** |
| **Traitement du signal** | ⏳ **The user does not have the PDF.** TP3–TP4 are second-hand transcriptions, flagged "énoncé non vérifié" in the app; TP1–TP2 have no statements and stay "needs handout". |

## Sources

| Tag | What it is | Trust |
|---|---|---|
| **[AE p.N]** | Automatique fascicule PDF, page N (the page number printed in the footer), read directly. | ✅ First-hand |
| **[TS-p5]**, **[TS-p6]** | *Traitement du signal* handout (`TP_Traitement_Signal_TP1-4-1.pdf`), pages 5 and 6: verbatim transcription. | Second-hand: re-check word for word against the PDF |
| **[SEC]** | Secondary hints, not verbatim quotes. | **Unverified.** Never used as a statement. |
| **NEEDS HANDOUT** | No source available. Nothing is guessed. | — |

The handout text is reproduced exactly, including its typos ("Malab", "Sumilink", "Qu'elle", "affin", "utilsant", "digramme"…). The typos are listed on the *Errata* page.

**Type**: `main` = calcul à la main · `MATLAB` · `Simulink` · `interp.` = interprétation / observation.

---

## Automatique linéaire échantillonnée [AE]

Cover: *Travaux Pratiques d'Automatique Echantillonnée*, Département Génie Physique et Instrumentation, Filière Informatique Industrielle et Automatique (IIA), 3ème année, INSAT, Année Universitaire 2024-2025.
**Table of contents [AE p.2]: TP1–TP4 only.** There is no TP5.

### TP1: Initialisation à Matlab Simulink [AE p.5–9]

**I. But** [p.5]: « Au cours de cette séance de TP on va se familiariser avec Matlab simulink, voir les différents blocs de cette interface et ces caractéristiques. De plus on va créer un model en utilisant Simulink d'un système du premier ordre dans le but de voir sa réponse temporelle. »

**II. Matlab Simulink** [p.5–8]: *1. Introduction* and *2. Utilisation de Matlab Simulink*. This is tutorial text: opening the Library Browser (Fig 1.1, 1.2), the Continuous / Sinks / Sources libraries (Fig 1.3), creating and running a `.slx` model (Fig 1.4), setting block parameters by double-click, in a MATLAB script or in the model Callbacks (Fig 1.5). **No questions.**

**III. Réponse d'un système du premier ordre avec Simulink** [p.9]

| # | Exact statement | Type | Notes |
|---|---|---|---|
| III.1 | « Faire le schéma bloc d'un système de fonction de transfert G(p) = 9/(s+9) en utilisant les blocs 'Transfer Fcn', 'Step','sum', 'mux' et 'Scope' (voir figure 6) » | Simulink | **Figure 1.6**: Step → Sum (+ −) → Transfer Fcn 9/(s+9) → Mux (with the Step) → Scope, **unity feedback**. The scope shows the step at t = 1 s and the output settling at 0.5. (E-AE15) |
| III.2 | « Faire varier la valeur finale du bloc step et voir la réponse du système » | Simulink, interp. | Linearity: the output scales with the step's final value. |

### TP2: Discrétisation d'un signal à temps continu [AE p.10–11]

**I. But** [p.10]: « Ce TP vise à étudier la discrétisation d'un signal à temps continu par un bloqueur d'ordre zéro, on va prendre comme exemple le système Moteur à courant continu (MCC) »

**II. Effet de la période d'échantillonnage** [p.10]

| # | Exact statement | Type | Missing data |
|---|---|---|---|
| II.1 | « Utiliser l'interface Simulink dans Matlab pour voir l'effet d'un bloqueur d'ordre zero (le bloc Zero order Hold dans Simulink) sur la discrétisation d'un signal sinusoïdal de fréquence 1 rad/sec. » | Simulink | **T not given**; "fréquence 1 rad/sec" (E-AE16) |
| II.2 | « Varier la période d'échantillonnage pour voir son effet sur la discrétisation de ce signal. » | Simulink, interp. | list of T values |

**III. Discrétisation d'un signal à temps continu** [p.10]: « Un système continu de fonction de transfert G(s) = 9/(S+9) discrétisé par un bloqueur d'ordre zero dont l'équation de transfert est (1−e^{−sT})/S avec T est la période d'échantillonnage. »

| # | Exact statement | Type | Missing data / notes |
|---|---|---|---|
| III.1 | « En utilisant la commande >>tf dans Matlab, créer un système continu de premier ordre » | MATLAB | — |
| III.2 | « Déterminer les pôles et les zéros de ce système en utilisant la commande >>rlocus. » | MATLAB, main | rlocus draws the root locus (E-AE18) |
| III.3 | « En utilsant le bloc zéro-pole dans l'interface Simulink déterminer le digramme des pôles et des zeros. » | Simulink | the block defines a system; it draws nothing (E-AE19) |
| III.4 | « En utilisant la commande >>c2d dans Matlab déterminer la transformation en Z G(Z) de la fonction G(s). » | MATLAB, main | **T not given** (E-AE17) |
| III.5 | « Faire le schéma bloc par simulink nécessaire pour créer ce système continu. » | Simulink | — |
| III.6 | « Comparer la discrétisation de ce système sans la présence du bloqueur d'ordre zéro en utilisant la commande 'imp' » | MATLAB, main, interp. | no command 'imp' (E-AE20) |

**IV. Discrétisation d'un signal à temps continu : Moteur à Courant Continu** [p.11]

« Un moteur à courant continu est constitué d'un bobinage inducteur alimenté par une tension continue U réglable. Il en résulte une vitesse de rotation Ω. »
« La transformation de Laplace de l'équation électrique trouvée : U(s) = RI(s) +Ls I(s) + kemΩ(s) » — « I(s) = (U(s)−kemΩ)/(Ls+R) (1) »
« Avec kem est la constant de la force électromotrice induite, L est l'inductance, R est la résistance et U est la tension d'alimentation »
« La transformation de la Place pour l'équation mécanique trouvée : JsΩ(s) - kcI(s) – Cr – fΩ(s) =0 » — « Ω(s) = (kcI(s)−Cr)/(Js+f) (2) » (sign inconsistency: E-AE21)
« Avec kc est la constante du couple électromagnétique, f est le coefficient de frottement et J est le moment d'inertie »

| # | Exact statement | Type | Missing data |
|---|---|---|---|
| IV.1 | « Créer le schéma bloc de ce système en utilisant Simulink » | Simulink | Cr (E-AE24) |
| IV.2 | « Déterminer la transformation en Z de ce système » | main, MATLAB | **T not given** (E-AE24) |
| IV.3 | « Ce système est attaqué par un signal discrétisé par un bloqueur d'ordre zéro, déterminer la réponse du système dans ce cas en utilisant simulink. » | Simulink, interp. | T, input signal (step of U?) |
| IV.4 | « Déterminer sa réponse en cas d'absence du bloqueur d'ordre zero. » | Simulink/MATLAB, interp. | — |

« Les paramètres utilisés sont résumés dans ce tableau »: **Tableau 2.1**: L = **0.011 H** · R = 0.8 Ω · J = 0.2 kg.m² · f = 1.10⁻² N.m · k_em = 1.91 SI · k_c = 1.91 SI · U = **200 V**.

### TP3: Stabilité et précision d'un système échantillonné asservi [AE p.13–15]

**I. But** [p.13]: « Dans ce TP on va étudier la stabilité d'un système Echantillonné en tenant compte de l'effet de la période d'échantillonnage ainsi que du contrôleur numérique proportionnel. »

**II. Stabilité d'un système Echantillonné par un contrôleur numérique** [p.13–14]: « Soit un système échantillonné dont la fonction de transfert est donnée par G1(s) = 1/(S+1) et le schéma bloc est représenté ci-dessous : » **Figure 3.1** (e(t) → comparator → sampler → C(s) → sampler → B0(s) → G1(s) → S(t), unity feedback). « On donne C(s) =K qui est un contrôleur numérique proportionnel et la fonction de transfert du bloqueur d'ordre zéro B0(s) est (1−e^{−sT})/s »

**The numbering really starts at 3**: page 13 goes straight from the statement to question 3. No questions are missing (E-AE3).

| # | Exact statement | Type | Missing data |
|---|---|---|---|
| 3 | « Calculer la transformation en z G(z) en boucle fermé de ce système. » | main | **T not given** (E-AE1) |
| 4 | « Vérifier par Matlab votre calcule par les commandes tf, c2d et feedback » | MATLAB | T, K |
| 5 | « Déterminer l'ordre de ce système ainsi que les pôles et les zéros et vérifier la stabilité de ce système en utilisant la commande rlocus. » | main, MATLAB, interp. | T |
| 6 | « Utiliser l'interface Simulink dans Matlab pour voir la réponse de ce système. » | Simulink | T, **K not given** (E-AE2) |
| 7 | « Vérifier la stabilité du système pour différent valeur de K et indiquer la valeur limite de K. » | main (Kmax(T)), MATLAB/Simulink, interp. | T |

**III. Stabilité d'un système Echantillonné par un contrôleur numérique : Réservoir d'eau** [p.14–15]: « Dans cette partie on essaye de faire la simulation d'un système hydraulique qui comporte un réservoir d'eau de section constant. Le réservoir est alimenté par un débit Qe(t). H est la hauteur de 20 m d'eau dans le réservoir. » « La fonction de transfert de ce système est G1(s) = H(s)/Qe(s) = 12.5/(50s+1) » « Ce système est contrôlé par contrôleur numérique C(s) =K avec un temps d'échantillonnage T. La fonction de transfert du bloqueur d'ordre zéro est (1−e^{−sT})/s. » « Le schéma bloc est représenté ci-dessous : » **Figure 3.2** (Qe(S) → comparator → ε → sampler → C(s) → sampler → B0(s) → G1(s) → H(s), unity feedback)

| # | Exact statement | Type | Missing data |
|---|---|---|---|
| 1 | « Calculer la transformation en z G(z) en boucle fermé de ce système. » | main | T (E-AE1) |
| 2 | « Vérifier par Matlab votre calcule par les commandes tf, c2d et feedback » | MATLAB | T, K |
| 3 | « Utiliser l'interface Simulink dans Matlab pour voir la réponse de ce système pour différent période d'échantillonnage T. » | Simulink, interp. | list of T values, K |
| 4 | « Qu'elle est la valeur de K pour remplir 2m (consigne) de la hauteur du réservoir. » | main, interp. | **tolerance not given** (E-AE6) |
| 5 | « Déterminer les pôles et les zéros et vérifier la stabilité de ce système en utilisant la commande rlocus. » | main, MATLAB | T |
| 6 | « Qu'elle est l'erreur statique de ce système. » | main, MATLAB | K |

### TP4: Asservissement des systèmes continus [AE p.16–18]

**I. But** [p.16]: « Dans ce TP on va étudier la régulation des systèmes asservis par un régulateur PID. »

**II. Rappel** [p.16–17]: « La régulation des systèmes regroupe l'ensemble des moyens matériels et techniques mis en œuvre pour maintenir une grandeur physique à régler, égale à une valeur désirée, appelée consigne. » « Un régulateur PID est un organe de contrôle qui permet d'effectuer une régulation en boucle fermée d'un système. » « Le PID contient trois actions en fonction de l'erreur : » « Une action proportionnelle : l'erreur est multipliée par un gain kp » « Une action intégrale : l'erreur est intégrée par un intervalle de temps, puis multiplié par un gain ki. » « Une action dérivée : l'erreur est dérivée suivant un temps, puis multipliée par un gain kd. » « Chaque fonction dans le PID joue un rôle important dans l'optimisation des performances du système (stabilité, rapidité et précision). » « Pour insérer le régulateur PID dans l'interface Sumilink on peut insérer chaque fonction du PID séparément ou on utilise directement le bloc PID Controller comme indique le schéma suivant : » **Figure 4.1**: Gain (1), Integrator 1/s → Gain1 (2), Derivative du/dt → Gain2 (1), summed; next to them, the `PID Controller` block.

**III. Asservissement de la hauteur d'eau d'un réservoir par un régulateur PID** [p.17]: « Considérons le schéma fonctionnel d'un réservoir d'eau suivant : » **Figure 4.2** (Qe(S) → comparator → ε → PID → 12.5/(50s+1) → H(s), unity feedback) « On choisi 2 m comme consigne: le régulateur PID vise à réguler la hauteur de l'eau dans le réservoir. »

| # | Exact statement | Type | Missing data |
|---|---|---|---|
| 1 | « Faire le schéma bloc de ce réservoir dans Simulink sans et avec le régulateur PID. » | Simulink | meaning of "sans PID" (E-AE9) |
| 2 | « Faire varié la valeur du gain kp, ki et kd affin d'obtenir une réponse désirée » | Simulink/MATLAB | **"réponse désirée" not specified** (E-AE10) |
| 3 | « Qu'elle est l'effet de chaque gain sur la stabilité, rapidité et précision du système. » | interp. | — |
| 4 | « Déterminer l'erreur statique, le temps de réponse et le dépassement avant et après l'utilisation du régulateur PID avec Simulink et avec la commande >>stepinfo dans Malab » | MATLAB, Simulink, main | stepinfo version (E-AE11) |

**IV. Asservissement de la vitesse d'un MCC** [p.18]: « Considérons le schéma fonctionnel d'un moteur à courant continu suivant : » **Figure 4.3** (U → comparator → PID → comparator → 1/(Ls+R) → kc → comparator with load torque cr → 1/(Js+f) → Ω; inner feedback through ke; unity outer feedback) « On choisi 10 rad/s comme commande : le régulateur PID vise à réguler la vitesse du moteur en prenant l'erreur comme entrée et fournit la tension nécessaire au moteur. »

| # | Exact statement | Type | Missing data |
|---|---|---|---|
| 5 | « Faire le schéma bloc du MCC dans Simulink sans et avec le régulateur PID. » | Simulink | value of cr (E-AE12) |
| 6 | « Faire varié la valeur du gain kp, ki et kd affin d'obtenir une réponse désirée » | Simulink/MATLAB | "réponse désirée" (E-AE10) |
| 7 | « Qu'elle est l'effet de chaque gain sur la stabilité, rapidité et précision du système » | interp. | — |
| 8 | « Déterminer l'erreur statique, le temps de réponse et le dépassement avant et après l'utilisation du régulateur PID avec simulink et avec la commande >>stepinfo dans Malab » | MATLAB, Simulink | L (E-AE7) |

« Les paramètres utilisés sont résumés dans ce tableau »: **Tableau 4.1**: L = **0.011 mH** · R = 0.8 Ω · J = 0.2 kg.m² · f = 1.10⁻² N.m · k_em = 1.91 SI · k_c = 1.91 SI · U = **10 V**.

### Automatique: question count
| TP | Questions | involving Simulink | involving a hand calculation |
|---|---|---|---|
| TP1 | 2 (III.1–III.2) | 2 | 0 |
| TP2 | 12 (II.1–2, III.1–6, IV.1–4) | 7 | 4 |
| TP3 | 11 (II.3–7, III.1–6) | 3 | 7 |
| TP4 | 8 (III.1–4, IV.5–8) | 6 | 1 |
| **Total** | **33** | **18** | **12** |

---

## Traitement du signal — ⏳ PDF not received

### TP 1: Signaux discrets — NEEDS HANDOUT (statements)

The exact statements and the question numbering are **not available yet**.

Provisional outline **[SEC]**: three parts, 1.1, 1.2 and 1.3. The values below are probably the handout's, but they are unconfirmed.

| Part | Provisional numbering | Subject and values (unconfirmed) | Type | Status |
|---|---|---|---|---|
| 1.1 | Q1–Q4 | Operations on signals: t from 0 to 30 s, step 0.01 s; cosine of period 5; square wave of period 3 built from the sign of a sine; their sum and its period; the three plots in one window. | MATLAB, interp. | needs handout |
| 1.2 | Q1–Q4 | Sampling: f0 = 1 kHz, 20 ms, a "continuous" grid of 20 µs; fe = 4, 2, 1.1 and 0.9 kHz; spectra with `freqz`; conclusion. | MATLAB, interp. | needs handout. **Sine or cosine is decisive at fe = 2 kHz** (E-TS1). |
| 1.3 | Q1–Q5 | Quantization: Nyquist frequency fc; fe = 2·fc; linear quantizer on [−A, A] with N levels, q = 2A/N, N = 64 and 256; practical vs theoretical SNR. | main, MATLAB, interp. | needs handout. **Meaning of "fréquence de Nyquist"** (E-TS2). |

### TP 2: Convolution des signaux numériques — NEEDS HANDOUT (statements)

The exact statements and the question numbering are **not available yet**.

| Part | Provisional numbering | Subject and values (unconfirmed) **[SEC]** | Type | Status |
|---|---|---|---|---|
| A | A.1–A.6 | Linear convolution of x(n) = 1 (0 ≤ n ≤ N−1) with g(n) = 0.7ⁿ (0 ≤ n ≤ M−1), N = 10, M = 2N. Flip-and-slide method (`fliplr`), result length, FFT method, comparison. Then f(n) = e^{0.1n}, h(n) = e^{−0.1n} with Nf = 3, Mh = 2Nf, by both methods and analytically. | main, MATLAB | needs handout |
| B | B.1–B.6 | Circular convolution, N = 10: direct formula, then FFT without zero-padding, result length. Then f and h with N = M = 3: direct, FFT and analytic. | main, MATLAB | needs handout |

### TP 3: Transformée de Fourier Discrète [TS-p5]

The handout numbers this section "2.1 / 2.2". **Section 1 of TP3 (probably a *rappel*) is not transcribed → needs handout.**

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

## Missing values and inconsistencies (feed the *Errata du fascicule* page)

Each entry will get, in the app: what the handout says, why it is a problem, the choice made, and why. The choice is always exposed as a slider or toggle. The defaults below are proposals, to be finalized in Phase 1 from computations rather than taste.

### Automatique (checked against the PDF)

| Id | Where | Issue | Proposed handling |
|---|---|---|---|
| E-AE1 | TP3 II and III | Sampling period **T never given**. | Slider. Default from the rule T ≈ τ/10 (τ = 1 s for II, 50 s for III). Kmax(T) shown for every T. |
| E-AE2 | TP3 II.6 | **K not given** for the Simulink response. | Slider; default K = 1. |
| E-AE3 | TP3 II | Numbering starts at **3**; there are no questions 1–2 (checked in the PDF, p.13). | Keep the handout's numbering, with a note. |
| E-AE4 | Fig 3.1 / 3.2 | The digital controller is drawn as **C(s)** between two samplers. | Explain it is C(z) = K; with a pure gain both samplers are equivalent to one. |
| E-AE5 | Fig 3.2 / 4.2 | The setpoint is labelled **Qe(S)** (an inflow, m³/s) but compared with a height H(s) (m); also "S" instead of "s". | Label it "consigne Hc (m)" and explain. |
| E-AE6 | TP3 III.4 | "K pour remplir 2 m": with a P controller, H(∞) = 2·12.5K/(1+12.5K) < 2. **No tolerance is given.** | Tolerance slider, derivation K ≥ (1−ε)/(12.5ε), compared with Kmax(T). |
| E-AE7 | Tableau 2.1 vs 4.1 | **Same motor, two values: L = 0.011 H (Tableau 2.1, p.11) and 0.011 mH (Tableau 4.1, p.18).** With 0.011 mH the electrical pole is near −72 700 rad/s (L/R ≈ 14 µs); with 0.011 H, L/R ≈ 14 ms, which is plausible for a motor with J = 0.2 kg·m². **Decided (user, 2026-11-24): default 0.011 H** (consistent with Tableau 2.1), with a toggle to the printed 0.011 mH. Both are shown in the report. |
| E-AE8 | Tableaux 2.1 / 4.1 | Units: f is printed "N.m" (should be N·m·s/rad); k_em and k_c are "SI" (V·s/rad, N·m/A); `k_em` in the tables vs `ke` in Fig 4.3. | Correct the units in the UI; note it. |
| E-AE9 | TP4 III.1 / IV.5 | "**sans PID**": open loop, or unity feedback with C = 1? | Show both, labelled. |
| E-AE10 | TP4 III.2 / IV.6 | "**réponse désirée**" is not specified. | Explicit, editable spec (e.g. D% ≤ 5 %, tr5% ≤ …, εs = 0), checked automatically. |
| E-AE11 | TP4 III.4 / IV.8 | `stepinfo`: MATLAB R2021a+ measures the 2 % band against \|y_final − y_init\|, R2020b and earlier against the peak error. Octave has no `stepinfo`. | Implement both; name the version. |
| E-AE12 | Fig 4.3 | The load torque **cr** appears in the figure; its value is not given. | Default cr = 0, slider. |
| E-AE13 | Fig 4.3 / IV text | U = 10 **V** in Tableau 4.1, but "10 **rad/s** comme commande", and U is compared with Ω. | Treat U as a speed setpoint of 10 rad/s; explain. |
| E-AE14 | Fig 4.1 | The Simulink `PID Controller` block filters the derivative (N = 100 by default); `pid(kp,ki,kd)` does not. Curves differ when kd ≠ 0. Fig 4.1's hand-built PID uses gains 1, 2, 1. | Model both; the Simulink builder sets N explicitly. |
| E-AE15 | TP1 III.1, Fig 1.6 | "G(**p**) = 9/(**s**+9)" mixes the variables p and s. The question speaks of the system G, but **Figure 1.6 closes the loop** (Sum + unity feedback), so the scope shows 9/(s+18): final value 0.5 for a unit step, τ = 1/18 s. | Show the open loop and the loop of Fig 1.6, and derive the final value 0.5. |
| E-AE16 | TP2 II.1 | "signal sinusoïdal de **fréquence 1 rad/sec**": rad/s is a *pulsation*, ω = 1 rad/s (f = 1/2π ≈ 0.159 Hz, period 2π s). The Simulink Sine Wave block's "Frequency" field is indeed in rad/s. **T not given.** | Slider for T (with T compared with the period 2π s); explain ω vs f. |
| E-AE17 | TP2 III | **T not given** for c2d; "S" written in capitals in G(s) = 9/(S+9) and in B0. | Slider for T; derivation of G(z) = (1−e^{−9T})/(z−e^{−9T}). |
| E-AE18 | TP2 III.2 | `rlocus` draws the root locus; the open-loop poles and zeros are its start (×) and end (○) points. `pole`, `zero` and `pzmap` give them directly. | Show both. |
| E-AE19 | TP2 III.3 | The Simulink **Zero-Pole** block *defines* a system from its zeros, poles and gain; it does not draw a diagram. | Enter G as a Zero-Pole block (zeros [], pole −9, gain 9), check it matches `tf`, and draw the diagram with `pzmap`. |
| E-AE20 | TP2 III.6 | "la commande **'imp'**": no such command. Most likely `c2d(G, T, 'impulse')` (impulse-invariant discretization = sampling **without** a hold), to compare with `'zoh'`. | Implement `'impulse'` vs `'zoh'`, derive both G(z), and state the interpretation. |
| E-AE21 | TP2 IV, eq. (2) | **Sign error**: « JsΩ(s) − kcI(s) − Cr − fΩ(s) = 0 » contradicts eq. (2) Ω = (kcI − Cr)/(Js+f). The correct balance is JsΩ = kcI − Cr − fΩ. Also "transformation de la Place". | Use eq. (2) (consistent with Fig 4.3); note it. |
| E-AE22 | TP2 IV | "bobinage **inducteur** alimenté par U": the equations model the armature (**induit**) circuit. | Note (terminology). |
| E-AE23 | TP2 IV | U = **200 V** (Tableau 2.1) as the supply voltage, vs U = 10 (Tableau 4.1) as a speed setpoint. | Keep both, per TP; explain the different roles. |
| E-AE24 | TP2 IV | **T and Cr not given** for the Z-transform and the responses. | Sliders; default Cr = 0. |
| E-AE25 | TP2 IV.3 | "attaqué par un signal discrétisé par un bloqueur": **the signal is not specified.** With a step of U (200 V), a zero-order hold changes nothing: a step is already constant between samples. | Default: a step of U = 200 V (Tableau 2.1), with this observation derived; option: the sine of part II. IV.4 then compares with the discretization *without* a hold (`'impulse'`, as in III.6). |
| E-AE27 | TP4 (microcontroller export, outside the handout) | A board needs a sampling period and command limits, which the handout does not give. | Te = dominant time constant / 10 (2 % settling time / 40), rounded to the 1–2–2.5–5 series; tank inflow 0 … 0.5; motor voltage ±200 V (Tableau 2.1 supply). All adjustable. |
| E-AE26 | TP2 III.6 | Octave's `c2d(G,T,'impulse')` returns Z{h(kT)}; MathWorks does not document whether MATLAB multiplies it by T. | Derive both conventions by hand; one line to run in MATLAB settles it (matlab/OCTAVE_VS_MATLAB.md). |
| E-x | everywhere | Typos: "Malab", "Sumilink", "Qu'elle", "affin", "calcule", "boucle fermé", "utilsant", "digramme", "constant de la force", "On choisi". | Quoted as is, with [sic]. |

### Traitement du signal (second-hand until the PDF arrives)

| Id | Where | Issue | Proposed handling |
|---|---|---|---|
| E-TS1 | TP1 1.2 | Sine or cosine? At fe = 2f0 a sine gives x[n] ≡ 0 while a cosine gives ±1. | Needs handout. Until then, a toggle. |
| E-TS2 | TP1 1.3 | "Fréquence de Nyquist": fe/2 (usual definition) or 2·fmax (Nyquist rate)? This changes fe. | Needs handout. Until then, a toggle. |
| E-TS3 | TP3 Q8 | "retard": the −π/3 is a phase shift (a delay of 1/600 s at 100 Hz). | Explain both views. |
| E-TS4 | TP3 Q12 | "x5[n] = x4[n] si n ≤ N ; 0 si N ≤ n ≤ 2^p": the ranges overlap at n = N, and the length is 2^p or 2^p + 1. | Use length 2^p; note it. |
| E-TS5 | TP3 Q1 | tmax = 0.1 s gives N = 100 (`0:N-1`) or 101 (`t = 0:Te:tmax`). With 101 samples, 100 Hz is off-bin and leaks. | Toggle; default N = 100, with the leakage shown for N = 101. |
| E-TS6 | TP3 Q11 | "première valeur qui **dépasse** N": strictly greater. This differs from `nextpow2` when N is a power of 2. | Implement "strictly greater"; note it. |
| E-TS7 | TP4 I | Given program: `dfilt.df1` (legacy), `%H=ft(...)` (typo for `tf`), `freqz(Num,Den,1/Te)` (100 read as a number of points). The numerator in powers of z must be left-padded for `impz`/`freqz`. | Correct it and explain; needs the full listing. |
| E-TS8 | TP4 II | Denominator printed **0.516z² − 1.2z + 1**: its poles have \|p\| = 1.392, so the filter is unstable whether the coefficients are read in z or in z⁻¹. It is z² − 1.2z + 0.516 with its coefficients **reversed** (a z / z⁻¹ mix-up); reversing them inverts the poles: \|p\| = 1/1.392 = 0.718. (Both versions have H(1) = 0.316/0.316 = 1, so the DC gain does not tell them apart.) | Use the stable version; show the printed one as an errata toggle. |
| E-TS10 | TP3 Q8 | "effet du retard … comparées à X2(f)": x3 = 5 + cos(…) has amplitude **1**, x2 = 5 + 3cos(…) has amplitude **3**. Compared with X2, the delay's effect is mixed with a factor 1/3 on the lines. | Also compare with 5 + cos(2π100nTe) (amplitude 1) to isolate the delay: same modulus, phase −π/3. |
| E-TS9 | TP4 II.1 | "ordre du filtre N = 32": 32 is the **number of samples** of h[n]; the filter's order is 2. | Note it. |
| E-TS11 | TP4 II (microcontroller export, outside the handout) | The IIR filter is given in normalized frequency; programming a board needs a sampling frequency. | Fe = 1000 Hz by default, adjustable. |

## What is still blocked

1. **Traitement du signal handout (PDF)**: TP1 and TP2 statements and numbering, TP3 §1, the full TP4 "programme fourni", and a word-for-word check of TP3–TP4.
2. Automatique: **nothing blocked.** Only E-AE7 (default L) needs your decision.
