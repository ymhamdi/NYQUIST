%% TP2 : Discrétisation d'un signal à temps continu
% Automatique linéaire échantillonnée - IIA 3, INSAT
% Youssef El Mhamdi, IIA 3/1 - projet Nyquist
%
% Les questions "Simulink" sont vérifiées ici avec les commandes MATLAB qui
% donnent le même résultat que le Scope ; les modèles Simulink se construisent
% avec matlab/simulink/build_models.m.
% La période d'échantillonnage T n'est jamais donnée (errata E-AE16, E-AE17,
% E-AE24) : on applique la règle T = tau/10 (tau : constante de temps
% dominante du système échantillonné). Les lignes "@param" sont réglables.
clear; close all; clc;

%% II.1 Bloqueur d'ordre zéro sur une sinusoïde de pulsation 1 rad/s
% « fréquence 1 rad/sec » : c'est une pulsation (errata E-AE16).
%   w = 1 rad/s, f = w/(2*pi) = 0.159 Hz, période 2*pi = 6.28 s.
% Simulink : Sine Wave (Frequency = 1 rad/sec) -> Zero-Order Hold (T) -> Scope.
% Le bloqueur maintient x(kT) pendant toute la période [kT, (k+1)T[.
w = 1;                          % pulsation (rad/s)
T_sin = 0.5;                    % @param T_sin [s] 0.05..4 période d'échantillonnage (environ 12 points par période)
t = linspace(0, 4*pi, 4001);    % deux périodes, grille fine = signal « continu »
x = sin(w*t);
k = 0:floor(t(end)/T_sin);
tk = k*T_sin;
xk = sin(w*tk);                 % échantillons x(kT)
x_bloque = sin(w*T_sin*floor(t/T_sin));   % sortie du bloqueur d'ordre zéro
erreur_max = max(abs(x - x_bloque))       % écart maximal signal / signal bloqué
borne_erreur = w*T_sin                    % |x(t) - x(kT)| <= w*T (pente maximale w)

figure('Name', 'II.1 - Bloqueur d''ordre zéro');
plot(t, x, 'LineWidth', 1.2); hold on;
stairs(tk, xk, 'LineWidth', 1.5);
stem(tk, xk, 'filled'); hold off; grid on;
xlabel('t (s)'); ylabel('amplitude');
legend('sin(t)', 'sortie du bloqueur', 'échantillons x(kT)', 'Location', 'southwest');
title(sprintf('Bloqueur d''ordre zéro, T = %g s', T_sin));

%% II.2 Effet de la période d'échantillonnage
% Plus T est grand, plus l'escalier s'écarte du signal :
%  - l'erreur maximale croît comme w*T ;
%  - le bloqueur retarde le signal d'environ T/2 en moyenne ;
%  - Shannon : il faut T < pi/w = 3.14 s (au moins 2 points par période),
%    sinon la sinusoïde n'est plus reconstituable.
T_liste = [0.1 0.5 1 2];        % @param T_liste [s] périodes comparées
erreurs = zeros(size(T_liste));
points_par_periode = 2*pi ./ (w*T_liste);
retard_moyen = T_liste / 2;
T_shannon = pi / w              % limite de Shannon
figure('Name', 'II.2 - Effet de T');
for i = 1:numel(T_liste)
    Ti = T_liste(i);
    xb = sin(w*Ti*floor(t/Ti));
    erreurs(i) = max(abs(x - xb));
    subplot(2, 2, i);
    plot(t, x, t, xb, 'LineWidth', 1.2); grid on;
    title(sprintf('T = %g s (%.1f points/période)', Ti, points_par_periode(i)));
    xlabel('t (s)');
end
erreurs

%% III.1 Système continu du premier ordre avec tf
% G(s) = 9/(s+9) : gain statique 1, constante de temps 1/9 s.
G = tf(9, [1 9])

%% III.2 Pôles et zéros avec rlocus
% rlocus trace le lieu des racines de 1 + K*G(s) = 0 : ses points de départ
% (croix) sont les pôles de G, ses points d'arrivée (ronds) ses zéros.
% pole et zero donnent les mêmes valeurs directement (errata E-AE18).
poles_G = pole(G)               % -9
zeros_G = zero(G)               % aucun zéro (vide)
figure('Name', 'III.2 - Lieu des racines de G');
rlocus(G); grid on;
title('Lieu des racines de G(s) = 9/(s+9)');

%% III.3 Bloc Zero-Pole de Simulink
% Le bloc Zero-Pole DÉFINIT un système par ses zéros, ses pôles et son gain ;
% il ne trace rien (errata E-AE19). Pour G : Zeros = [], Poles = [-9], Gain = 9.
% On vérifie qu'il représente bien le même système, puis on trace le diagramme.
Gzp = zpk([], -9, 9)
ecart_zp_tf = abs(dcgain(Gzp) - dcgain(G)) + max(abs(pole(Gzp) - pole(G)))   % 0 : même système
figure('Name', 'III.3 - Diagramme pôles-zéros');
pzmap(Gzp); grid on;
title('Pôles et zéros de G (bloc Zero-Pole)');

%% III.4 Transformée en Z G(z) avec c2d (bloqueur d'ordre zéro)
% Calcul à la main : G(z) = (1 - z^-1) Z{ G(s)/s }
%   G(s)/s = 9/(s(s+9)) = 1/s - 1/(s+9)
%   Z{.}   = z/(z-1) - z/(z-a),  avec a = exp(-9T)
%   G(z)   = (z-1)/z * [z/(z-1) - z/(z-a)] = (1 - a)/(z - a)
T = 0.01;                       % @param T [s] 0.001..0.2 période d'échantillonnage (non donnée : tau/10 = 1/90 s)
a = exp(-9*T);
Gz = c2d(G, T, 'zoh')
Gz_main = tf(1 - a, [1 -a], T);
ecart_c2d_main = abs(dcgain(Gz) - dcgain(Gz_main)) + abs(pole(Gz) - pole(Gz_main))   % 0 (aux arrondis près)
pole_z = pole(Gz)               % = exp(-9T) : le pôle s = -9 devient z = exp(-9T)
gain_statique_z = dcgain(Gz)    % 1, comme G(0)

%% III.5 Schéma bloc du système continu (Simulink : Step -> Transfer Fcn -> Scope)
% Avec un bloqueur d'ordre zéro, la réponse indicielle de G(z) donne
% EXACTEMENT les valeurs de la réponse continue aux instants kT : un échelon
% est déjà constant entre deux échantillons, le bloqueur ne le modifie pas.
tc = linspace(0, 1, 2001);
yc = step(G, tc).';             % réponse continue (Scope du modèle continu)
kz = 0:round(1/T);
yz = step(Gz, kz*T).';          % réponse du modèle discret aux instants kT
yc_kT = 1 - exp(-9*kz*T);       % réponse continue exacte aux mêmes instants
ecart_zoh_instants = max(abs(yz - yc_kT))     % 0 aux arrondis près
figure('Name', 'III.5 - Réponse continue et échantillonnée');
plot(tc, yc, 'LineWidth', 1.5); hold on;
stairs(kz*T, yz, 'LineWidth', 1.2); hold off; grid on;
xlabel('t (s)'); ylabel('sortie');
legend('G(s) continu', 'G(z) avec bloqueur', 'Location', 'southeast');
title('Réponse indicielle : continu et discret (bloqueur d''ordre zéro)');

%% III.6 Discrétisation sans bloqueur d'ordre zéro : méthode 'impulse'
% La commande « 'imp' » n'existe pas (errata E-AE20) : il s'agit de
% c2d(G, T, 'impulse'), la discrétisation par invariance impulsionnelle, qui
% échantillonne la réponse impulsionnelle g(t) = 9 exp(-9t) SANS bloqueur :
%   Z{ g(kT) } = 9 z/(z - a)
% Selon la convention, le résultat est parfois multiplié par T pour que la
% réponse discrète approche la réponse continue (errata E-AE26 : à vérifier
% dans MATLAB). On calcule les deux et on détecte celle que c2d utilise.
Gz_imp = c2d(G, T, 'impulse')
Gz_imp_main = tf([9 0], [1 -a], T);            % Z{g(kT)}
facteur_c2d = dcgain(Gz_imp) / dcgain(Gz_imp_main)   % 1 ou T selon la convention
c2d_multiplie_par_T = abs(facteur_c2d - T) < abs(facteur_c2d - 1)   % vrai si c2d inclut le facteur T
Gz_imp_T = T * Gz_imp_main;                    % version multipliée par T
gain_statique_zoh = dcgain(Gz)                 % 1 : le bloqueur conserve le gain
gain_statique_imp_T = dcgain(Gz_imp_T)         % 9T/(1-a), proche de 1 seulement si T << 1/9
gain_statique_imp = dcgain(Gz_imp_main)        % 9/(1-a), environ 1/T
yi_T = step(Gz_imp_T, kz*T).';
ecart_imp_continu = max(abs(yi_T - yc_kT))     % différent de 0 : sans bloqueur, ce n'est pas exact
figure('Name', 'III.6 - Avec et sans bloqueur');
plot(tc, yc, 'LineWidth', 1.5); hold on;
stairs(kz*T, yz, 'LineWidth', 1.2);
stairs(kz*T, yi_T, '--', 'LineWidth', 1.2); hold off; grid on;
xlabel('t (s)'); ylabel('sortie');
legend('continu', 'bloqueur (zoh)', 'sans bloqueur (impulse, x T)', 'Location', 'southeast');
title('Réponse indicielle avec et sans bloqueur d''ordre zéro');

%% IV.1 Schéma bloc du moteur à courant continu
% Équation électrique (1) : I(s) = (U(s) - kem*Omega(s)) / (Ls + R)
% Équation mécanique  (2) : Omega(s) = (kc*I(s) - Cr(s)) / (Js + f)
% (L'équation « JsW - kcI - Cr - fW = 0 » de l'énoncé a une erreur de signe,
%  errata E-AE21 ; on utilise (2), cohérente avec la figure 4.3.)
% Boucle interne par kem (force contre-électromotrice) :
%   Omega/U  = kc / ((Ls+R)(Js+f) + kc*kem)
%   Omega/Cr = -(Ls+R) / ((Ls+R)(Js+f) + kc*kem)
L = 0.011;                      % @param L [H] {0.011, 0.000011} inductance (Tableau 2.1)
R = 0.8;                        % résistance (ohm)
J = 0.2;                        % moment d'inertie (kg.m^2)
f = 1e-2;                       % frottement visqueux (N.m.s/rad ; « N.m » dans le tableau)
kem = 1.91;                     % constante de f.c.e.m. (V.s/rad)
kc = 1.91;                      % constante de couple (N.m/A)
U = 200;                        % @param U [V] 0..240 tension d'alimentation (Tableau 2.1)
Cr = 0;                         % @param Cr [N.m] 0..50 couple résistant (non donné : 0)
Ge = tf(1, [L R]);              % partie électrique
Gmeca = tf(1, [J f]);           % partie mécanique
Gm = feedback(kc * Ge * Gmeca, kem)        % Omega/U
Gcr = -feedback(Gmeca, kc * kem * Ge);     % Omega/Cr
den_moteur = conv([L R], [J f]) + [0 0 kc*kem];   % calcul à la main du dénominateur
poles_moteur = pole(Gm)
gain_statique_moteur = dcgain(Gm)          % kc/(R f + kc kem) en rad/s par volt
omega_final = U*dcgain(Gm) + Cr*dcgain(Gcr)

%% IV.2 Transformée en Z du moteur
% T non donnée (errata E-AE24) : pôles -36.4 +/- 18.4j, tau = 1/36.4 s,
% d'où T = tau/10 = 2.5 ms. Chaque pôle p devient exp(p*T).
T_m = 0.0025;                   % @param T_m [s] 0.0005..0.05 période d'échantillonnage du moteur
Gmz = c2d(Gm, T_m, 'zoh')
poles_moteur_z = pole(Gmz)
poles_moteur_exp = exp(poles_moteur * T_m)    % mêmes valeurs
gain_statique_moteur_z = dcgain(Gmz)          % identique au gain continu

%% IV.3 Réponse avec un bloqueur d'ordre zéro (Simulink)
% Le signal d'entrée n'est pas précisé (errata E-AE25) : on prend un échelon
% de U = 200 V. Un échelon est constant entre deux instants d'échantillonnage,
% donc le bloqueur ne le modifie pas : la réponse discrète coïncide avec la
% réponse continue à chaque instant kT.
t_m = linspace(0, 0.3, 3001);
w_continu = (U * step(Gm, t_m)).';            % réponse continue
km = 0:round(0.3/T_m);
w_zoh = (U * step(Gmz, km*T_m)).';            % réponse discrète (bloqueur)
w_continu_kT = (U * step(Gm, km*T_m)).';
ecart_moteur_zoh = max(abs(w_zoh - w_continu_kT))   % 0 aux arrondis près
figure('Name', 'IV.3 - Moteur avec bloqueur');
plot(t_m, w_continu, 'LineWidth', 1.5); hold on;
stairs(km*T_m, w_zoh, 'LineWidth', 1.2); hold off; grid on;
xlabel('t (s)'); ylabel('\Omega (rad/s)');
legend('continu', 'échantillonné-bloqué', 'Location', 'southeast');
title(sprintf('Vitesse du moteur, U = %g V, T = %g s', U, T_m));

%% IV.4 Réponse sans bloqueur d'ordre zéro
% Sans bloqueur, on discrétise par invariance impulsionnelle (comme en III.6).
% Le modèle obtenu n'est plus exact pour un échelon : écart visible au gain
% statique et pendant le régime transitoire.
Gmz_imp_T = c2d(Gm, T_m, 'impulse');          % convention x T, quelle que soit la version :
if ~c2d_multiplie_par_T
    Gmz_imp_T = T_m * Gmz_imp_T;
end
w_imp = (U * step(Gmz_imp_T, km*T_m)).';
ecart_moteur_imp = max(abs(w_imp - w_continu_kT))
gain_statique_moteur_imp = dcgain(Gmz_imp_T)
figure('Name', 'IV.4 - Moteur sans bloqueur');
plot(t_m, w_continu, 'LineWidth', 1.5); hold on;
stairs(km*T_m, w_zoh, 'LineWidth', 1.2);
stairs(km*T_m, w_imp, '--', 'LineWidth', 1.2); hold off; grid on;
xlabel('t (s)'); ylabel('\Omega (rad/s)');
legend('continu', 'avec bloqueur', 'sans bloqueur', 'Location', 'southeast');
title('Vitesse du moteur avec et sans bloqueur d''ordre zéro');
