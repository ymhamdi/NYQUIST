/**
 * Errata du fascicule: inconsistencies and missing values of the handouts,
 * with the choice made and why. Source of truth: COVERAGE.md (English);
 * this is the French text shown on the site. Automatique entries are checked
 * against the PDF; Traitement du signal entries rest on a transcription.
 */
export interface Erratum {
  id: string
  where: string
  says: string
  issue: string
  choice: string
}

export const ERRATA_AE: Erratum[] = [
  { id: 'E-AE1', where: 'TP3, parties II et III', says: "« un temps d'échantillonnage T »", issue: "La période d'échantillonnage n'est jamais donnée, alors que G(z), le pôle et la valeur limite du gain en dépendent.", choice: "Curseur, avec par défaut T = τ/10 (τ : constante de temps du procédé, soit 0,1 s puis 5 s). La courbe Kmax(T) est toujours affichée." },
  { id: 'E-AE2', where: 'TP3, question II.6', says: '« voir la réponse de ce système »', issue: "Le gain K du contrôleur n'est pas donné.", choice: 'Curseur, K = 1 par défaut (contrôleur unitaire).' },
  { id: 'E-AE3', where: 'TP3, partie II', says: 'Les questions commencent à 3.', issue: "Il n'y a pas de questions 1 et 2 (vérifié dans le fascicule, p. 13).", choice: 'La numérotation du fascicule est conservée.' },
  { id: 'E-AE4', where: 'Figures 3.1 et 3.2', says: 'Contrôleur noté C(s), entre deux échantillonneurs.', issue: "Un contrôleur numérique est un calcul sur des échantillons : C(z), pas C(s).", choice: "On écrit C(z) = K. Comme c'est un gain pur, les deux échantillonneurs reviennent à un seul." },
  { id: 'E-AE5', where: 'Figures 3.2 et 4.2', says: 'Entrée notée Qₑ(S).', issue: "Qₑ est un débit (m³/s), alors que le comparateur le soustrait d'une hauteur H (m) ; « S » devrait être « s ».", choice: "L'entrée est une consigne de hauteur (2 m) ; c'est expliqué sur la page." },
  { id: 'E-AE6', where: 'TP3, question III.4', says: '« la valeur de K pour remplir 2m »', issue: "Avec un contrôleur proportionnel, H(∞) = 2·12,5K/(1 + 12,5K) reste sous 2 m : il faudrait K infini. Aucune tolérance n'est donnée.", choice: 'Curseur de tolérance (2 % par défaut) ; calcul du K minimal, comparé à Kmax(T), et de la période maximale.' },
  { id: 'E-AE7', where: 'Tableaux 2.1 et 4.1', says: 'L = 0,011 H (tableau 2.1) et L = 0,011 mH (tableau 4.1).', issue: "C'est le même moteur. Avec 0,011 mH, le pôle électrique est vers −72 700 rad/s (L/R ≈ 14 µs), invraisemblable pour J = 0,2 kg·m².", choice: 'Par défaut 0,011 H (tableau 2.1) ; un bouton donne la valeur imprimée. Le compte rendu cite les deux.' },
  { id: 'E-AE8', where: 'Tableaux 2.1 et 4.1', says: '« f = 1.10-2 N.m », « 1.91 SI ».', issue: "Unités incomplètes : f en N·m·s/rad, kem en V·s/rad, kc en N·m/A ; kem dans le tableau, ke sur la figure 4.3.", choice: 'Unités complètes affichées.' },
  { id: 'E-AE9', where: 'TP4, questions III.1 et IV.5', says: '« sans le régulateur PID »', issue: 'Deux lectures : boucle ouverte, ou retour unitaire avec C = 1.', choice: 'Les deux sont tracées et nommées.' },
  { id: 'E-AE10', where: 'TP4, questions III.2 et IV.6', says: '« une réponse désirée »', issue: "La réponse désirée n'est pas définie.", choice: "Cahier des charges explicite et modifiable : dépassement ≤ 5 %, erreur statique nulle, temps de réponse le plus court possible." },
  { id: 'E-AE11', where: 'TP4, questions III.4 et IV.8', says: '« la commande >>stepinfo »', issue: "Depuis MATLAB R2021a, stepinfo mesure le temps de réponse par rapport à |y∞ − y0| ; avant, par rapport à l'erreur maximale. GNU Octave n'a pas stepinfo.", choice: 'Les deux définitions sont calculées, avec la version de MATLAB indiquée.' },
  { id: 'E-AE12', where: 'Figure 4.3', says: 'Couple résistant cr.', issue: "Sa valeur n'est pas donnée.", choice: 'cr = 0 par défaut, curseur.' },
  { id: 'E-AE13', where: 'TP4, partie IV', says: '« 10 rad/s comme commande » et U = 10 V (tableau 4.1).', issue: 'U est comparée à Ω (rad/s) : c\'est une consigne de vitesse, pas une tension.', choice: 'U = 10 rad/s de consigne.' },
  { id: 'E-AE14', where: 'Figure 4.1', says: 'Bloc PID Controller de Simulink.', issue: 'Ce bloc filtre la dérivée (coefficient N = 100 par défaut) ; pid(kp, ki, kd) de MATLAB ne la filtre pas. Les courbes diffèrent dès que kd ≠ 0.', choice: 'Les deux sont modélisés et comparés.' },
  { id: 'E-AE15', where: 'TP1, question III.1, figure 1.6', says: '« G(p) = 9/(s+9) »', issue: "Mélange des variables p et s. Et la figure 1.6 boucle la sortie sur le comparateur : le Scope montre 9/(s+18), qui se stabilise à 0,5, et non G.", choice: 'Boucle ouverte et boucle de la figure 1.6 tracées ; valeur finale 0,5 démontrée.' },
  { id: 'E-AE16', where: 'TP2, question II.1', says: '« sinusoïdal de fréquence 1 rad/sec »', issue: 'Le rad/s est une pulsation : ω = 1 rad/s, soit f ≈ 0,159 Hz. La période T n\'est pas donnée.', choice: 'ω = 1 rad/s (le champ « Frequency » du bloc Sine Wave est bien en rad/s) ; curseur pour T.' },
  { id: 'E-AE17', where: 'TP2, partie III', says: 'G(s) = 9/(S+9), bloqueur (1−e^(−sT))/S.', issue: 'T non donnée ; « S » en majuscule.', choice: 'Curseur pour T, par défaut τ/10 = 0,01 s.' },
  { id: 'E-AE18', where: 'TP2, question III.2', says: '« les pôles et les zéros … en utilisant la commande >>rlocus »', issue: 'rlocus trace le lieu des racines ; les pôles et zéros de G en sont les points de départ et d\'arrivée.', choice: 'pole, zero et pzmap donnés en plus de rlocus.' },
  { id: 'E-AE19', where: 'TP2, question III.3', says: '« le bloc zéro-pole … déterminer le digramme des pôles et des zeros »', issue: 'Le bloc Zero-Pole définit un système par ses zéros, pôles et gain ; il ne trace rien.', choice: 'G saisie dans un bloc Zero-Pole (zéros [], pôle −9, gain 9), comparée à tf, et diagramme tracé par pzmap.' },
  { id: 'E-AE20', where: 'TP2, question III.6', says: "« la commande 'imp' »", issue: "Cette commande n'existe pas.", choice: "Lu comme c2d(G, T, 'impulse') : discrétisation sans bloqueur (invariance impulsionnelle), comparée à 'zoh'." },
  { id: 'E-AE21', where: 'TP2, partie IV, équation (2)', says: '« JsΩ(s) − kcI(s) − Cr − fΩ(s) = 0 »', issue: "Erreur de signe : cette équation contredit (2), Ω = (kcI − Cr)/(Js + f). L'équilibre correct est JsΩ = kcI − Cr − fΩ.", choice: "L'équation (2), cohérente avec la figure 4.3, est utilisée." },
  { id: 'E-AE22', where: 'TP2, partie IV', says: '« bobinage inducteur alimenté par une tension continue U »', issue: "Les équations décrivent le circuit d'induit, pas l'inducteur.", choice: 'Signalé (vocabulaire).' },
  { id: 'E-AE23', where: 'Tableaux 2.1 et 4.1', says: 'U = 200 V (TP2) et U = 10 (TP4).', issue: 'Rôles différents : tension d\'alimentation au TP2, consigne de vitesse au TP4.', choice: 'Chaque valeur gardée dans son TP, rôle expliqué.' },
  { id: 'E-AE24', where: 'TP2, partie IV', says: '« Déterminer la transformation en Z de ce système »', issue: 'T et Cr non donnés.', choice: 'Curseurs ; Cr = 0 et T = τ/10 = 2,5 ms par défaut.' },
  { id: 'E-AE25', where: 'TP2, question IV.3', says: '« attaqué par un signal discrétisé par un bloqueur »', issue: "Le signal n'est pas précisé. Avec un échelon de U, le bloqueur ne change rien : un échelon est déjà constant entre deux échantillons.", choice: 'Échelon de U = 200 V, avec cette remarque démontrée ; IV.4 compare à la discrétisation sans bloqueur.' },
  { id: 'E-AE26', where: 'TP2, question III.6', says: "c2d(G, T, 'impulse')", issue: "GNU Octave renvoie Z{g(kT)} ; la documentation de MATLAB ne dit pas s'il multiplie par T.", choice: 'Les deux conventions sont calculées ; une ligne à exécuter dans MATLAB tranchera.' },
  { id: 'E-AE27', where: 'TP4, « Vers le microcontrôleur » (hors fascicule)', says: 'Le fascicule ne parle pas de code embarqué.', issue: "Une carte a besoin d'une période d'échantillonnage et de bornes pour la commande, que le fascicule ne donne pas.", choice: "Te = constante de temps dominante/10 (temps de réponse à 2 %/40), arrondie à la série 1–2–2,5–5 ; débit du réservoir entre 0 et 0,5 ; tension du moteur entre −200 et 200 V (tension d'alimentation du Tableau 2.1). Tout est réglable." },
]

export const ERRATA_TS: Erratum[] = [
  { id: 'E-TS1', where: 'TP1, partie 1.2', says: 'Signal de 1 kHz échantillonné à 2 kHz.', issue: "Sinus ou cosinus ? À fe = 2f₀, un sinus donne x[n] = 0 et un cosinus ±1 : conclusions opposées.", choice: 'Énoncé indisponible : choix laissé ouvert (sinus et cosinus).' },
  { id: 'E-TS2', where: 'TP1, partie 1.3', says: '« Fréquence de Nyquist fc »', issue: 'fe/2 (définition usuelle) ou 2·fmax (cadence de Nyquist) ? Cela change fe.', choice: 'Énoncé indisponible : les deux lectures.' },
  { id: 'E-TS3', where: 'TP3, question 8', says: '« effet du retard »', issue: 'Le −π/3 est un déphasage, équivalent à un retard de 1/600 s à 100 Hz.', choice: 'Les deux points de vue sont expliqués.' },
  { id: 'E-TS4', where: 'TP3, question 12', says: '« x5[n] = x4[n] si n ≤ N ; 0 si N ≤ n ≤ 2^p »', issue: 'Les deux intervalles se chevauchent en n = N, et la longueur serait 2^p + 1.', choice: 'Longueur 2^p.' },
  { id: 'E-TS5', where: 'TP3, question 1', says: '« sur une durée tmax = 0.1 s »', issue: 'N = 100 (n = 0 … N−1) ou 101 (t = 0:Te:tmax). Avec 101 points, 100 Hz tombe entre deux raies.', choice: 'N = 100 par défaut, bouton pour 101.' },
  { id: 'E-TS6', where: 'TP3, question 11', says: '« 2^p est la première valeur qui dépasse N »', issue: '« Dépasse » : strictement supérieur, contrairement à nextpow2 quand N est une puissance de 2.', choice: 'Strictement supérieur.' },
  { id: 'E-TS7', where: 'TP4, programme fourni', says: 'dfilt.df1, « %H=ft(…) », freqz(Num, Den, 1/Te).', issue: 'dfilt.df1 est ancien ; ft se lit tf ; le 3e argument de freqz est un nombre de points (100), pas Fe. Un numérateur en puissances de z doit être complété à gauche pour impz et freqz.', choice: 'Programme corrigé et expliqué.' },
  { id: 'E-TS8', where: 'TP4, partie II', says: 'Dénominateur 0.516z² − 1.2z + 1.', issue: "Pôles de module 1,392 : filtre instable, qu'on lise en z ou en z⁻¹. C'est z² − 1,2z + 0,516 écrit à l'envers ; inverser l'ordre inverse les pôles (module 0,718).", choice: 'Version stable par défaut, version imprimée en option.' },
  { id: 'E-TS9', where: 'TP4, question II.1', says: "« l'ordre du filtre N = 32 »", issue: "32 est le nombre d'échantillons de h[n] ; le filtre est d'ordre 2.", choice: 'Signalé.' },
  { id: 'E-TS10', where: 'TP3, question 8', says: '« comparées à X2(f) »', issue: 'x3 a une amplitude 1 et x2 une amplitude 3 : la comparaison mélange le retard et un facteur 1/3.', choice: 'Comparaison ajoutée avec 5 + cos(2π100nTe), qui isole le retard.' },
  { id: 'E-TS11', where: 'TP4, partie II, « Vers le microcontrôleur » (hors fascicule)', says: 'Le filtre RII est donné en fréquence normalisée.', issue: "Pour programmer une carte, il faut une fréquence d'échantillonnage Fe, non donnée.", choice: 'Fe = 1000 Hz par défaut, réglable ; la réponse est tracée de 0 à Fe/2.' },
]
