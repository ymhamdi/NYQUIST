%% TP4 : Asservissement des systèmes continus
% Automatique linéaire échantillonnée - IIA 3, INSAT
% Youssef El Mhamdi, IIA 3/1 - projet Nyquist
%
% Les modèles Simulink se construisent avec matlab/simulink/build_models.m.
% « Réponse désirée » n'est pas précisée (errata E-AE10) : on fixe le cahier
% des charges D <= 5 %, erreur statique nulle, temps de réponse le plus court
% possible. Les lignes "@param" sont réglables (curseurs du site).
% stepinfo : définitions de MATLAB R2021a et suivants (errata E-AE11).
clear; close all; clc;

%% III.1 Réservoir sans et avec régulateur PID (Simulink)
% « Sans PID » peut se lire de deux façons (errata E-AE9) :
%  - boucle ouverte : on impose le débit Qe = 2, H(inf) = 2 x 12.5 = 25 m,
%    plus que les 20 m du réservoir : il déborde ;
%  - boucle fermée à retour unitaire (C = 1) : H(inf) = 2 x 12.5/13.5 = 1.85 m.
% Réglage proposé, par compensation du pôle : ki/kp = 1/50, d'où
%   C(s)G(s) = 12.5 kp/(50 s)   et   F(s) = 1/(1 + (4/kp) s)
% boucle fermée du premier ordre : pas de dépassement, erreur nulle, tau = 4/kp.
G = tf(12.5, [50 1]);
consigne = 2;                   % @param consigne [m] 0.5..20 hauteur visée
H_max = 20;                     % hauteur du réservoir (m)
H_bo_final = consigne*dcgain(G)                 % 25 m
if H_bo_final > H_max
    t_debordement = -50*log(1 - H_max/H_bo_final)   % instant où H atteint 20 m
else
    t_debordement = Inf         % consigne < 1.6 m : H(inf) < 20 m, pas de débordement
end
F0 = feedback(G, 1)                             % sans PID : C = 1
kp = 1;                         % @param kp 0..10 gain proportionnel
ki = 0.02;                      % @param ki 0..1 gain intégral (ki/kp = 1/50 : compensation du pôle)
kd = 0;                         % @param kd 0..30 gain dérivé
C = pid(kp, ki, kd)
F = feedback(C*G, 1)
% Le bloc PID Controller de Simulink filtre la dérivée : kd*s devient
% kd*N*s/(s + N), N = 100 par défaut (errata E-AE14). Identique si kd = 0.
N_filtre = 100;                 % @param N_filtre 1..1000 coefficient de filtre du bloc PID Controller
F_simulink = feedback(pid(kp, ki, kd, 1/N_filtre)*G, 1);

t = linspace(0, 150, 1501);
H_bo = consigne*step(G, t).';
H_sans = consigne*step(F0, t).';
H_avec = consigne*step(F, t).';
H_avec_simulink = consigne*step(F_simulink, t).';
figure('Name', 'III.1 - Réservoir sans et avec PID');
plot(t, H_bo, t, H_sans, t, H_avec, 'LineWidth', 1.5); hold on;
plot([t(1) t(end)], [H_max H_max], 'k--'); hold off; grid on; ylim([0 26]);
xlabel('t (s)'); ylabel('H (m)');
legend('boucle ouverte (Qe = 2)', 'sans PID (C = 1)', sprintf('PID kp=%g ki=%g kd=%g', kp, ki, kd), ...
       'hauteur du réservoir', 'Location', 'east');
title('Hauteur d''eau, consigne 2 m');

%% III.2 Faire varier kp, ki et kd pour obtenir la réponse désirée
% On fait varier un gain à la fois autour du réglage proposé.
kp_liste = [0.5 1 2 4];         % @param kp_liste (ki = kd = 0)
ki_liste = [0.01 0.02 0.05 0.1];% @param ki_liste (kp = 1, kd = 0)
kd_liste = [0 1 5 20];          % @param kd_liste (kp = 1, ki = 0.02)
t2 = linspace(0, 100, 1001);
rep_kp = zeros(numel(kp_liste), numel(t2));
rep_ki = zeros(numel(ki_liste), numel(t2));
rep_kd = zeros(numel(kd_liste), numel(t2));
info_kp = zeros(numel(kp_liste), 3);   % [dépassement %, temps de réponse 2 %, erreur statique]
info_ki = zeros(numel(ki_liste), 3);
info_kd = zeros(numel(kd_liste), 3);
for i = 1:4
    Fi = feedback(pid(kp_liste(i), 0, 0)*G, 1);
    rep_kp(i, :) = consigne*step(Fi, t2).';
    Si = stepinfo(consigne*Fi);
    info_kp(i, :) = [Si.Overshoot, Si.SettlingTime, consigne - consigne*dcgain(Fi)];
    Fi = feedback(pid(1, ki_liste(i), 0)*G, 1);
    rep_ki(i, :) = consigne*step(Fi, t2).';
    Si = stepinfo(consigne*Fi);
    info_ki(i, :) = [Si.Overshoot, Si.SettlingTime, consigne - consigne*dcgain(Fi)];
    Fi = feedback(pid(1, 0.02, kd_liste(i))*G, 1);
    rep_kd(i, :) = consigne*step(Fi, t2).';
    Si = stepinfo(consigne*Fi);
    info_kd(i, :) = [Si.Overshoot, Si.SettlingTime, consigne - consigne*dcgain(Fi)];
end
figure('Name', 'III.2 - Effet de chaque gain');
subplot(1, 3, 1); plot(t2, rep_kp, 'LineWidth', 1.2); grid on; title('k_p (k_i = k_d = 0)');
legend(arrayfun(@(v) sprintf('kp = %g', v), kp_liste, 'UniformOutput', false), 'Location', 'southeast');
subplot(1, 3, 2); plot(t2, rep_ki, 'LineWidth', 1.2); grid on; title('k_i (k_p = 1)');
legend(arrayfun(@(v) sprintf('ki = %g', v), ki_liste, 'UniformOutput', false), 'Location', 'southeast');
subplot(1, 3, 3); plot(t2, rep_kd, 'LineWidth', 1.2); grid on; title('k_d (k_p = 1, k_i = 0.02)');
legend(arrayfun(@(v) sprintf('kd = %g', v), kd_liste, 'UniformOutput', false), 'Location', 'southeast');
info_kp, info_ki, info_kd

%% III.3 Effet de chaque gain sur la stabilité, la rapidité et la précision
% Lu sur les tableaux info_* (dépassement, temps de réponse, erreur statique) :
%  - kp augmente : plus rapide, erreur statique 2/(1 + 12.5 kp) plus petite
%    mais jamais nulle ; ce procédé du premier ordre reste sans dépassement.
%  - ki : annule l'erreur statique (intégrateur) ; trop grand, il crée un
%    dépassement et des oscillations : la stabilité se dégrade.
%  - kd : sur un premier ordre, la dérivée n'apporte presque rien ; elle
%    provoque un saut de la sortie à t = 0 et amplifie le bruit.
variation_kp = info_kp(end, :) - info_kp(1, :)   % [dD, dTr, de] du plus petit au plus grand gain
variation_ki = info_ki(end, :) - info_ki(1, :)
variation_kd = info_kd(end, :) - info_kd(1, :)

%% III.4 Erreur statique, temps de réponse et dépassement, avant et après PID
S_sans = stepinfo(consigne*F0)
S_avec = stepinfo(consigne*F)
erreur_sans = consigne - consigne*dcgain(F0)   % 2/13.5 = 0.148 m
erreur_avec = consigne - consigne*dcgain(F)    % 0 grâce à l'intégrateur
% stepinfo donne le temps de réponse à 2 % ; à 5 % (usage courant en France) :
S_sans_5 = stepinfo(consigne*F0, 'SettlingTimeThreshold', 0.05);
S_avec_5 = stepinfo(consigne*F, 'SettlingTimeThreshold', 0.05);
tr5_sans = S_sans_5.SettlingTime
tr5_avec = S_avec_5.SettlingTime
cahier_des_charges_respecte = S_avec.Overshoot <= 5 && abs(erreur_avec) < 1e-9

%% IV.5 Moteur à courant continu sans et avec régulateur PID (Simulink)
% Figure 4.3 : boucle interne par ke (f.c.e.m.), boucle externe de vitesse.
%   Omega/V = kc / ((Ls+R)(Js+f) + kc ke)
% Tableau 4.1 : L = 0.011 mH, alors que le Tableau 2.1 (même moteur) donne
% 0.011 H (errata E-AE7). On prend 0.011 H par défaut : L/R = 14 ms, réaliste.
% U = 10 est la consigne de vitesse (10 rad/s), pas une tension (errata E-AE13).
L = 0.011;                      % @param L [H] {0.011, 0.000011} inductance (0.011e-3 pour la valeur imprimée)
R = 0.8; J = 0.2; f = 1e-2;     % ohm, kg.m^2, N.m.s/rad
kem = 1.91; kc = 1.91;          % V.s/rad, N.m/A
U = 10;                         % @param U [rad/s] 1..50 consigne de vitesse
Cr = 0;                         % @param Cr [N.m] 0..20 couple résistant (non donné)
t_cr = 0.5;                     % @param t_cr [s] 0..1/0.0005 instant d'application du couple résistant
Gm = feedback(kc*tf(1, [L R])*tf(1, [J f]), kem)   % Omega/V
Gcr = -feedback(tf(1, [J f]), kc*kem*tf(1, [L R]));  % Omega/Cr (boucle ouverte)
poles_moteur = pole(Gm)
omega_bo_final = U*dcgain(Gm)                      % tension 10 V appliquée directement
Fm0 = feedback(Gm, 1)                              % sans PID : C = 1
kp_m = 2;                       % @param kp_m 0..10 gain proportionnel
ki_m = 60;                      % @param ki_m 0..200 gain intégral
kd_m = 0.02;                    % @param kd_m 0..0.2 gain dérivé
Cm = pid(kp_m, ki_m, kd_m)
Fm = feedback(Cm*Gm, 1)
Fm_cr = Gcr*feedback(tf(1, 1), Cm*Gm);             % effet de Cr en boucle fermée : Gcr/(1 + C Gm)
tm = linspace(0, 1, 2001);
w_bo = U*step(Gm, tm).';
w_sans = U*step(Fm0, tm).';
w_cr = zeros(size(tm)); apres = tm >= t_cr;
w_cr(apres) = Cr * step(Fm_cr, tm(apres) - t_cr);   % couple appliqué à t_cr (multiple de 0.5 ms)
w_avec = U*step(Fm, tm).' + w_cr;
figure('Name', 'IV.5 - Moteur sans et avec PID');
plot(tm, w_bo, tm, w_sans, tm, w_avec, 'LineWidth', 1.5); grid on;
xlabel('t (s)'); ylabel('\Omega (rad/s)');
legend('boucle ouverte (10 V)', 'sans PID (C = 1)', sprintf('PID kp=%g ki=%g kd=%g', kp_m, ki_m, kd_m), ...
       'Location', 'east');
title('Vitesse du moteur, consigne 10 rad/s');

%% IV.6 Faire varier kp, ki et kd pour obtenir la réponse désirée
kpm_liste = [0.5 1 2 4];        % @param kpm_liste (ki = kd = 0)
kim_liste = [10 30 60 100];     % @param kim_liste (kp = 2, kd = 0)
kdm_liste = [0 0.01 0.02 0.05]; % @param kdm_liste (kp = 2, ki = 60)
t3 = linspace(0, 0.5, 1001);
rep_kpm = zeros(4, numel(t3)); rep_kim = zeros(4, numel(t3)); rep_kdm = zeros(4, numel(t3));
info_kpm = zeros(4, 3); info_kim = zeros(4, 3); info_kdm = zeros(4, 3);
for i = 1:4
    Fi = feedback(pid(kpm_liste(i), 0, 0)*Gm, 1);
    rep_kpm(i, :) = U*step(Fi, t3).';
    Si = stepinfo(U*Fi);
    info_kpm(i, :) = [Si.Overshoot, Si.SettlingTime, U - U*dcgain(Fi)];
    Fi = feedback(pid(2, kim_liste(i), 0)*Gm, 1);
    rep_kim(i, :) = U*step(Fi, t3).';
    Si = stepinfo(U*Fi);
    info_kim(i, :) = [Si.Overshoot, Si.SettlingTime, U - U*dcgain(Fi)];
    Fi = feedback(pid(2, 60, kdm_liste(i))*Gm, 1);
    rep_kdm(i, :) = U*step(Fi, t3).';
    Si = stepinfo(U*Fi);
    info_kdm(i, :) = [Si.Overshoot, Si.SettlingTime, U - U*dcgain(Fi)];
end
figure('Name', 'IV.6 - Effet de chaque gain (MCC)');
subplot(1, 3, 1); plot(t3, rep_kpm, 'LineWidth', 1.2); grid on; title('k_p (k_i = k_d = 0)');
subplot(1, 3, 2); plot(t3, rep_kim, 'LineWidth', 1.2); grid on; title('k_i (k_p = 2)');
subplot(1, 3, 3); plot(t3, rep_kdm, 'LineWidth', 1.2); grid on; title('k_d (k_p = 2, k_i = 60)');
info_kpm, info_kim, info_kdm

%% IV.7 Effet de chaque gain sur la stabilité, la rapidité et la précision
% Le moteur est du second ordre (pôles complexes) : ici kp crée un
% dépassement, ki annule l'erreur mais augmente le dépassement, kd amortit.
variation_kpm = info_kpm(end, :) - info_kpm(1, :)
variation_kim = info_kim(end, :) - info_kim(1, :)
variation_kdm = info_kdm(end, :) - info_kdm(1, :)

%% IV.8 Erreur statique, temps de réponse et dépassement, avant et après PID
Sm_sans = stepinfo(U*Fm0)
Sm_avec = stepinfo(U*Fm)
erreur_m_sans = U - U*dcgain(Fm0)
erreur_m_avec = U - U*dcgain(Fm)
Sm_sans_5 = stepinfo(U*Fm0, 'SettlingTimeThreshold', 0.05);
Sm_avec_5 = stepinfo(U*Fm, 'SettlingTimeThreshold', 0.05);
tr5_m_sans = Sm_sans_5.SettlingTime
tr5_m_avec = Sm_avec_5.SettlingTime
cahier_des_charges_m_respecte = Sm_avec.Overshoot <= 5 && abs(erreur_m_avec) < 1e-9
