function bilan = build_models(verifier)
%BUILD_MODELS Construit les modèles Simulink des TP d'automatique (TP1 à TP4).
%   build_models          construit, enregistre, simule et vérifie chaque modèle
%   build_models(false)   construit et enregistre seulement
%   bilan = build_models  renvoie aussi le tableau des écarts
%
% Youssef El Mhamdi, IIA 3/1 - projet Nyquist
%
% Les questions « Simulink » du fascicule demandent de dessiner des schémas à
% la souris. Cette fonction les construit par programme (new_system,
% add_block, add_line, set_param), avec les valeurs par défaut des scripts
% tp1..tp4, et les enregistre dans build/simulink/. Ensuite elle simule chaque
% modèle et compare sa sortie au calcul fait avec tf, step et lsim : un écart
% signale un bloc mal câblé. Nécessite MATLAB avec Simulink et la Control
% System Toolbox. Pour ouvrir un modèle : open_system('build/simulink/<nom>.slx').

if nargin < 1
    verifier = true;
end
dossier = fullfile(fileparts(mfilename('fullpath')), '..', '..', 'build', 'simulink');
if ~exist(dossier, 'dir')
    mkdir(dossier);
end

constructeurs = {@tp1_figure_1_6, @tp2_bloqueur_sinus, @tp2_systeme_g, @tp2_moteur, ...
                 @tp3_figure_3_1, @tp3_figure_3_2, @tp4_figure_4_1, @tp4_figure_4_2, @tp4_figure_4_3};
bilan = struct('modele', {}, 'signal', {}, 'ecart', {}, 'tolerance', {}, 'conforme', {});
for i = 1:numel(constructeurs)
    [nom, controles] = constructeurs{i}();
    save_system(nom, fullfile(dossier, [nom '.slx']));
    fprintf('Modèle construit : %s\n', nom);
    if ~verifier
        continue
    end
    sortie = sim(nom, 'ReturnWorkspaceOutputs', 'on');
    for c = 1:numel(controles)
        s = sortie.get(controles(c).variable);
        t = s.time(:);
        y = s.signals.values(:);
        y_ref = controles(c).reference(t);
        utile = t >= controles(c).t_min;
        ecart = max(abs(y(utile) - y_ref(utile))) / max(abs(y_ref(utile)));
        bilan(end + 1) = struct('modele', nom, 'signal', controles(c).libelle, 'ecart', ecart, ...
                                'tolerance', controles(c).tolerance, 'conforme', ecart <= controles(c).tolerance); %#ok<AGROW>
    end
end

if verifier
    fprintf('\n%-20s %-42s %12s\n', 'modèle', 'signal comparé au calcul tf/step/lsim', 'écart relatif');
    for b = bilan
        etat = 'OK';
        if ~b.conforme
            etat = 'ÉCART';
        end
        fprintf('%-20s %-42s %12.2e  %s\n', b.modele, b.signal, b.ecart, etat);
    end
    if all([bilan.conforme])
        fprintf('\nTous les modèles se comportent comme le calcul.\n');
    else
        warning('build_models:ecart', 'Au moins un modèle s''écarte du calcul : vérifier son câblage.');
    end
end
end

%% ----------------------------------------------------------------- TP1
function [nom, controles] = tp1_figure_1_6()
% Figure 1.6 : Step -> Sum (+ -) -> Transfer Fcn 9/(s+9) -> Mux (avec le Step)
% -> Scope, retour unitaire. Le Scope montre donc la boucle fermée 9/(s+18)
% (errata E-AE15) : valeur finale 0.5 pour un échelon unité.
nom = 'tp1_figure_1_6';
t_step = 1;                     % bloc Step : saut à t = 1 s (valeur par défaut)
Uf = 1;                         % valeur finale du Step
G = tf(9, [1 9]);
modele(nom, 3, 1e-3);
bloc(nom, 'simulink/Sources/Step', 'Step', 0, 0, 'Time', t_step, 'Before', 0, 'After', Uf);
bloc(nom, 'simulink/Math Operations/Sum', 'Sum', 1, 0, 'Inputs', '|+-', 'IconShape', 'round');
bloc(nom, 'simulink/Continuous/Transfer Fcn', 'Transfer Fcn', 2, 0, 'Numerator', 9, 'Denominator', [1 9]);
bloc(nom, 'simulink/Signal Routing/Mux', 'Mux', 3, 0, 'Inputs', 2);
bloc(nom, 'simulink/Sinks/Scope', 'Scope', 4, 0);
journal(nom, 'y', 3, 1, 1e-3);
lien(nom, 'Step/1', 'Sum/1');
lien(nom, 'Sum/1', 'Transfer Fcn/1');
lien(nom, 'Step/1', 'Mux/1');
lien(nom, 'Transfer Fcn/1', 'Mux/2');
lien(nom, 'Mux/1', 'Scope/1');
lien(nom, 'Transfer Fcn/1', 'Sum/2');           % retour unitaire
lien(nom, 'Transfer Fcn/1', 'y/1');
controles = controle('y', 'sortie de la boucle (Scope)', ...
                     @(t) echelon_retarde(feedback(G, 1), t, t_step, Uf));
end

%% ----------------------------------------------------------------- TP2
function [nom, controles] = tp2_bloqueur_sinus()
% II.1 : sinusoïde de pulsation 1 rad/s discrétisée par un bloqueur d'ordre
% zéro. T non donnée (errata E-AE17) : T = 0.5 s, comme T_sin dans le script.
nom = 'tp2_bloqueur_sinus';
T_sin = 0.5;
modele(nom, 4*pi, 1e-3);
bloc(nom, 'simulink/Sources/Sine Wave', 'Sine Wave', 0, 0, 'Amplitude', 1, 'Frequency', 1);
bloc(nom, 'simulink/Discrete/Zero-Order Hold', 'Zero-Order Hold', 1, 0, 'SampleTime', T_sin);
bloc(nom, 'simulink/Signal Routing/Mux', 'Mux', 2, 0, 'Inputs', 2);
bloc(nom, 'simulink/Sinks/Scope', 'Scope', 3, 0);
journal(nom, 'y', 2, 1, 1e-2);
lien(nom, 'Sine Wave/1', 'Zero-Order Hold/1');
lien(nom, 'Sine Wave/1', 'Mux/1');
lien(nom, 'Zero-Order Hold/1', 'Mux/2');
lien(nom, 'Mux/1', 'Scope/1');
lien(nom, 'Zero-Order Hold/1', 'y/1');
controles = controle('y', 'sortie du bloqueur', @(t) sin(floor(t/T_sin + 1e-9)*T_sin));
end

function [nom, controles] = tp2_systeme_g()
% III.3 et III.5 : G(s) = 9/(s+9) avec le bloc Zero-Pole (zéros [], pôle -9,
% gain 9) et avec le bloc Transfer Fcn. Les deux réponses à un échelon sont
% identiques. Le bloc Zero-Pole définit le système, il ne trace pas le
% diagramme des pôles (errata E-AE19).
nom = 'tp2_systeme_g';
G = tf(9, [1 9]);
modele(nom, 1, 1e-4);
bloc(nom, 'simulink/Sources/Step', 'Step', 0, 0, 'Time', 0, 'Before', 0, 'After', 1);
bloc(nom, 'simulink/Continuous/Zero-Pole', 'Zero-Pole', 1, 0, 'Zeros', '[]', 'Poles', -9, 'Gain', 9);
bloc(nom, 'simulink/Continuous/Transfer Fcn', 'Transfer Fcn', 1, 1, 'Numerator', 9, 'Denominator', [1 9]);
bloc(nom, 'simulink/Signal Routing/Mux', 'Mux', 2, 0, 'Inputs', 2);
bloc(nom, 'simulink/Sinks/Scope', 'Scope', 3, 0);
journal(nom, 'y_zp', 2, 2, 1e-3);
journal(nom, 'y_tf', 3, 2, 1e-3);
lien(nom, 'Step/1', 'Zero-Pole/1');
lien(nom, 'Step/1', 'Transfer Fcn/1');
lien(nom, 'Zero-Pole/1', 'Mux/1');
lien(nom, 'Transfer Fcn/1', 'Mux/2');
lien(nom, 'Mux/1', 'Scope/1');
lien(nom, 'Zero-Pole/1', 'y_zp/1');
lien(nom, 'Transfer Fcn/1', 'y_tf/1');
reference = @(t) echelon_retarde(G, t, 0, 1);
controles = [controle('y_zp', 'bloc Zero-Pole', reference), controle('y_tf', 'bloc Transfer Fcn', reference)];
end

function [nom, controles] = tp2_moteur()
% IV.1, IV.3, IV.4 : moteur à courant continu (Tableau 2.1), alimenté par un
% échelon U = 200 V, avec et sans bloqueur d'ordre zéro (T_m = 2.5 ms).
% Un échelon est constant entre deux instants d'échantillonnage : le
% bloqueur ne le modifie pas et les deux vitesses coïncident (cf. script).
nom = 'tp2_moteur';
p = parametres_moteur();
U = 200;
Cr = 0;                         % couple résistant non donné (errata E-AE24)
T_m = 0.0025;
modele(nom, 0.3, 1e-4);
bloc(nom, 'simulink/Sources/Step', 'U', 0, 0, 'Time', 0, 'Before', 0, 'After', U);
bloc(nom, 'simulink/Discrete/Zero-Order Hold', 'Zero-Order Hold', 1, 0, 'SampleTime', T_m);
[e1, s1] = moteur(nom, 'B_', 0, 2, p, Cr, 0);   % avec bloqueur (IV.3)
[e2, s2] = moteur(nom, 'C_', 3, 2, p, Cr, 0);   % sans bloqueur (IV.4)
bloc(nom, 'simulink/Signal Routing/Mux', 'Mux', 8, 1, 'Inputs', 2);
bloc(nom, 'simulink/Sinks/Scope', 'Scope', 9, 1);
journal(nom, 'w_bloqueur', 8, 0, 1e-3);
journal(nom, 'w_continu', 8, 3, 1e-3);
lien(nom, 'U/1', 'Zero-Order Hold/1');
lien(nom, 'Zero-Order Hold/1', e1);
lien(nom, 'U/1', e2);
lien(nom, s1, 'Mux/1');
lien(nom, s2, 'Mux/2');
lien(nom, 'Mux/1', 'Scope/1');
lien(nom, s1, 'w_bloqueur/1');
lien(nom, s2, 'w_continu/1');
reference = @(t) echelon_retarde(p.Gm, t, 0, U);
controles = [controle('w_bloqueur', 'vitesse avec bloqueur', reference), ...
             controle('w_continu', 'vitesse sans bloqueur', reference)];
end

%% ----------------------------------------------------------------- TP3
function [nom, controles] = tp3_figure_3_1()
% Figure 3.1 : e(t) -> comparateur -> échantillonneur -> C = K ->
% échantillonneur -> bloqueur B0 -> G1(s) = 1/(s+1), retour unitaire.
% Dans Simulink, le bloc Zero-Order Hold échantillonne ET bloque. Avec un
% contrôleur proportionnel, les deux échantillonneurs sont équivalents à
% un seul (errata E-AE4) ; on garde les deux blocs pour suivre la figure.
nom = 'tp3_figure_3_1';
[nom, controles] = boucle_echantillonnee(nom, 1, [1 1], 1, 0.1, 1, 5);
end

function [nom, controles] = tp3_figure_3_2()
% Figure 3.2 : réservoir G1(s) = 12.5/(50s+1), même structure. Consigne
% 2 m (notée Qe(S) sur la figure, errata E-AE5), T = 5 s, K = 1.
nom = 'tp3_figure_3_2';
[nom, controles] = boucle_echantillonnee(nom, 12.5, [50 1], 1, 5, 2, 300);
end

function [nom, controles] = boucle_echantillonnee(nom, num, den, K, T, consigne, duree)
modele(nom, duree, T/50);
bloc(nom, 'simulink/Sources/Step', 'Consigne', 0, 0, 'Time', 0, 'Before', 0, 'After', consigne);
bloc(nom, 'simulink/Math Operations/Sum', 'Comparateur', 1, 0, 'Inputs', '|+-', 'IconShape', 'round');
bloc(nom, 'simulink/Discrete/Zero-Order Hold', 'Echantillonneur', 2, 0, 'SampleTime', T);
bloc(nom, 'simulink/Math Operations/Gain', 'C = K', 3, 0, 'Gain', K);
bloc(nom, 'simulink/Discrete/Zero-Order Hold', 'Bloqueur B0', 4, 0, 'SampleTime', T);
bloc(nom, 'simulink/Continuous/Transfer Fcn', 'G1', 5, 0, 'Numerator', num, 'Denominator', den);
bloc(nom, 'simulink/Sinks/Scope', 'Scope', 6, 0);
journal(nom, 'y', 6, 1, T);
lien(nom, 'Consigne/1', 'Comparateur/1');
lien(nom, 'Comparateur/1', 'Echantillonneur/1');
lien(nom, 'Echantillonneur/1', 'C = K/1');
lien(nom, 'C = K/1', 'Bloqueur B0/1');
lien(nom, 'Bloqueur B0/1', 'G1/1');
lien(nom, 'G1/1', 'Scope/1');
lien(nom, 'G1/1', 'Comparateur/2');             % retour unitaire
lien(nom, 'G1/1', 'y/1');
% aux instants kT, la sortie est exactement celle de la boucle discrète
Fz = feedback(K*c2d(tf(num, den), T, 'zoh'), 1);
controles = controle('y', 'sortie aux instants kT', @(t) echantillons(Fz, t, T, consigne));
end

%% ----------------------------------------------------------------- TP4
function [nom, controles] = tp4_figure_4_1()
% Figure 4.1 : PID construit avec trois branches (Gain 1, Integrator puis
% Gain 2, Derivative puis Gain 1), et le bloc PID Controller. Entrée de test :
% sinusoïde de 1 rad/s (la dérivée d'un échelon serait une impulsion).
% Le bloc PID Controller filtre la dérivée : kd*s devient kd*N*s/(s+N)
% (errata E-AE14), d'où sa référence pid(kp, ki, kd, 1/N).
nom = 'tp4_figure_4_1';
kp = 1; ki = 2; kd = 1; N = 100;
modele(nom, 2*pi, 5e-4);              % une période de la sinusoïde
bloc(nom, 'simulink/Sources/Sine Wave', 'Ecart', 0, 1, 'Amplitude', 1, 'Frequency', 1);
bloc(nom, 'simulink/Math Operations/Gain', 'Gain', 2, 0, 'Gain', kp);
bloc(nom, 'simulink/Continuous/Integrator', 'Integrator', 1, 1);
bloc(nom, 'simulink/Math Operations/Gain', 'Gain1', 2, 1, 'Gain', ki);
bloc(nom, 'simulink/Continuous/Derivative', 'Derivative', 1, 2);
bloc(nom, 'simulink/Math Operations/Gain', 'Gain2', 2, 2, 'Gain', kd);
bloc(nom, 'simulink/Math Operations/Sum', 'Somme', 3, 1, 'Inputs', '+++');
bloc(nom, 'simulink/Continuous/PID Controller', 'PID Controller', 2, 3, 'P', kp, 'I', ki, 'D', kd, 'N', N);
bloc(nom, 'simulink/Signal Routing/Mux', 'Mux', 4, 2, 'Inputs', 2);
bloc(nom, 'simulink/Sinks/Scope', 'Scope', 5, 2);
journal(nom, 'u_branches', 4, 0, 1e-3);
journal(nom, 'u_pid', 4, 3, 1e-3);
lien(nom, 'Ecart/1', 'Gain/1');
lien(nom, 'Ecart/1', 'Integrator/1');
lien(nom, 'Ecart/1', 'Derivative/1');
lien(nom, 'Ecart/1', 'PID Controller/1');
lien(nom, 'Integrator/1', 'Gain1/1');
lien(nom, 'Derivative/1', 'Gain2/1');
lien(nom, 'Gain/1', 'Somme/1');
lien(nom, 'Gain1/1', 'Somme/2');
lien(nom, 'Gain2/1', 'Somme/3');
lien(nom, 'Somme/1', 'Mux/1');
lien(nom, 'PID Controller/1', 'Mux/2');
lien(nom, 'Mux/1', 'Scope/1');
lien(nom, 'Somme/1', 'u_branches/1');
lien(nom, 'PID Controller/1', 'u_pid/1');
% kp sin(t) + ki (1 - cos(t)) + kd cos(t) ; la dérivée numérique démarre à 0
controles = [controle('u_branches', 'trois branches (kp, ki/s, kd s)', ...
                      @(t) kp*sin(t) + ki*(1 - cos(t)) + kd*cos(t), 0.1, 1e-2), ...
             controle('u_pid', 'bloc PID Controller (N = 100)', ...
                      @(t) reponse_lsim(pid(kp, ki, kd, 1/N), @sin, t))];
end

function [nom, controles] = tp4_figure_4_2()
% Figure 4.2 et question 1 : réservoir 12.5/(50s+1), consigne 2 m, en
% boucle ouverte, sans PID (C = 1, errata E-AE9) et avec PID (kp = 1,
% ki = 0.02, kd = 0, valeurs par défaut du script).
nom = 'tp4_figure_4_2';
G = tf(12.5, [50 1]);
consigne = 2; kp = 1; ki = 0.02; kd = 0; N = 100;
modele(nom, 150, 1e-2);
bloc(nom, 'simulink/Sources/Step', 'Consigne', 0, 1, 'Time', 0, 'Before', 0, 'After', consigne);
bloc(nom, 'simulink/Continuous/Transfer Fcn', 'G boucle ouverte', 2, 0, 'Numerator', 12.5, 'Denominator', [50 1]);
bloc(nom, 'simulink/Math Operations/Sum', 'Comparateur sans PID', 1, 1, 'Inputs', '|+-', 'IconShape', 'round');
bloc(nom, 'simulink/Continuous/Transfer Fcn', 'G sans PID', 2, 1, 'Numerator', 12.5, 'Denominator', [50 1]);
bloc(nom, 'simulink/Math Operations/Sum', 'Comparateur', 1, 2, 'Inputs', '|+-', 'IconShape', 'round');
bloc(nom, 'simulink/Continuous/PID Controller', 'PID', 2, 2, 'P', kp, 'I', ki, 'D', kd, 'N', N);
bloc(nom, 'simulink/Continuous/Transfer Fcn', 'G avec PID', 3, 2, 'Numerator', 12.5, 'Denominator', [50 1]);
bloc(nom, 'simulink/Signal Routing/Mux', 'Mux', 4, 1, 'Inputs', 3);
bloc(nom, 'simulink/Sinks/Scope', 'Scope', 5, 1);
journal(nom, 'H_bo', 3, 0, 0.1);
journal(nom, 'H_sans', 3, 1, 0.1);
journal(nom, 'H_avec', 4, 3, 0.1);
lien(nom, 'Consigne/1', 'G boucle ouverte/1');
lien(nom, 'Consigne/1', 'Comparateur sans PID/1');
lien(nom, 'Comparateur sans PID/1', 'G sans PID/1');
lien(nom, 'G sans PID/1', 'Comparateur sans PID/2');
lien(nom, 'Consigne/1', 'Comparateur/1');
lien(nom, 'Comparateur/1', 'PID/1');
lien(nom, 'PID/1', 'G avec PID/1');
lien(nom, 'G avec PID/1', 'Comparateur/2');
lien(nom, 'G boucle ouverte/1', 'Mux/1');
lien(nom, 'G sans PID/1', 'Mux/2');
lien(nom, 'G avec PID/1', 'Mux/3');
lien(nom, 'Mux/1', 'Scope/1');
lien(nom, 'G boucle ouverte/1', 'H_bo/1');
lien(nom, 'G sans PID/1', 'H_sans/1');
lien(nom, 'G avec PID/1', 'H_avec/1');
controles = [controle('H_bo', 'hauteur en boucle ouverte', @(t) echelon_retarde(G, t, 0, consigne)), ...
             controle('H_sans', 'hauteur sans PID (C = 1)', @(t) echelon_retarde(feedback(G, 1), t, 0, consigne)), ...
             controle('H_avec', 'hauteur avec PID', @(t) echelon_retarde(feedback(pid(kp, ki, kd, 1/N)*G, 1), t, 0, consigne))];
end

function [nom, controles] = tp4_figure_4_3()
% Figure 4.3 et question 5 : moteur à courant continu (Tableau 4.1, avec
% L = 0.011 H, errata E-AE7), consigne de vitesse 10 rad/s (errata E-AE13),
% sans PID (C = 1) et avec PID (kp = 2, ki = 60, kd = 0.02, N = 100).
% Couple résistant cr = 0 par défaut (errata E-AE12), appliqué à t = 0.5 s.
nom = 'tp4_figure_4_3';
p = parametres_moteur();
U = 10; Cr = 0; t_cr = 0.5;
kp = 2; ki = 60; kd = 0.02; N = 100;
modele(nom, 1, 1e-4);
bloc(nom, 'simulink/Sources/Step', 'Consigne', 0, 1, 'Time', 0, 'Before', 0, 'After', U);
bloc(nom, 'simulink/Math Operations/Sum', 'S1 sans PID', 1, 0, 'Inputs', '|+-', 'IconShape', 'round');
[e1, s1] = moteur(nom, 'A_', 2, 0, p, Cr, t_cr);
bloc(nom, 'simulink/Math Operations/Sum', 'S1', 1, 3, 'Inputs', '|+-', 'IconShape', 'round');
bloc(nom, 'simulink/Continuous/PID Controller', 'PID', 2, 3, 'P', kp, 'I', ki, 'D', kd, 'N', N);
[e2, s2] = moteur(nom, 'P_', 3, 3, p, Cr, t_cr);
bloc(nom, 'simulink/Signal Routing/Mux', 'Mux', 9, 2, 'Inputs', 2);
bloc(nom, 'simulink/Sinks/Scope', 'Scope', 10, 2);
journal(nom, 'w_sans', 9, 0, 1e-3);
journal(nom, 'w_avec', 9, 4, 1e-3);
lien(nom, 'Consigne/1', 'S1 sans PID/1');
lien(nom, 'S1 sans PID/1', e1);
lien(nom, s1, 'S1 sans PID/2');
lien(nom, 'Consigne/1', 'S1/1');
lien(nom, 'S1/1', 'PID/1');
lien(nom, 'PID/1', e2);
lien(nom, s2, 'S1/2');
lien(nom, s1, 'Mux/1');
lien(nom, s2, 'Mux/2');
lien(nom, 'Mux/1', 'Scope/1');
lien(nom, s1, 'w_sans/1');
lien(nom, s2, 'w_avec/1');
C = pid(kp, ki, kd, 1/N);
% effet du couple résistant en boucle fermée : Gcr/(1 + C*Gm)
controles = [controle('w_sans', 'vitesse sans PID (C = 1)', ...
                      @(t) echelon_retarde(feedback(p.Gm, 1), t, 0, U) + echelon_retarde(p.Gcr*feedback(tf(1, 1), p.Gm), t, t_cr, Cr)), ...
             controle('w_avec', 'vitesse avec PID', ...
                      @(t) echelon_retarde(feedback(C*p.Gm, 1), t, 0, U) + echelon_retarde(p.Gcr*feedback(tf(1, 1), C*p.Gm), t, t_cr, Cr))];
end

%% ------------------------------------------------------ blocs partagés
function p = parametres_moteur()
% Tableaux 2.1 et 4.1 (L = 0.011 H, errata E-AE7 ; 0.011e-3 pour la valeur imprimée)
p.L = 0.011; p.R = 0.8; p.J = 0.2; p.f = 1e-2; p.kem = 1.91; p.kc = 1.91;
p.Gm = feedback(p.kc*tf(1, [p.L p.R])*tf(1, [p.J p.f]), p.kem);       % Omega/U
p.Gcr = -feedback(tf(1, [p.J p.f]), p.kc*p.kem*tf(1, [p.L p.R]));      % Omega/Cr
end

function [entree, sortie] = moteur(nom, pre, col, ligne, p, Cr, t_cr)
% Moteur de la figure 4.3 : U - ke*Omega -> 1/(Ls+R) -> kc -> - cr ->
% 1/(Js+f) -> Omega, avec la boucle interne de force contre-électromotrice.
somme = 'simulink/Math Operations/Sum';
bloc(nom, somme, [pre 'S2'], col, ligne, 'Inputs', '|+-', 'IconShape', 'round');
bloc(nom, 'simulink/Continuous/Transfer Fcn', [pre 'Electrique'], col + 1, ligne, 'Numerator', 1, 'Denominator', [p.L p.R]);
bloc(nom, 'simulink/Math Operations/Gain', [pre 'kc'], col + 2, ligne, 'Gain', p.kc);
bloc(nom, somme, [pre 'S3'], col + 3, ligne, 'Inputs', '|+-', 'IconShape', 'round');
bloc(nom, 'simulink/Sources/Step', [pre 'cr'], col + 3, ligne + 1, 'Time', t_cr, 'Before', 0, 'After', Cr);
bloc(nom, 'simulink/Continuous/Transfer Fcn', [pre 'Mecanique'], col + 4, ligne, 'Numerator', 1, 'Denominator', [p.J p.f]);
bloc(nom, 'simulink/Math Operations/Gain', [pre 'ke'], col + 2, ligne + 1, 'Gain', p.kem, 'Orientation', 'left');
lien(nom, [pre 'S2/1'], [pre 'Electrique/1']);
lien(nom, [pre 'Electrique/1'], [pre 'kc/1']);
lien(nom, [pre 'kc/1'], [pre 'S3/1']);
lien(nom, [pre 'cr/1'], [pre 'S3/2']);
lien(nom, [pre 'S3/1'], [pre 'Mecanique/1']);
lien(nom, [pre 'Mecanique/1'], [pre 'ke/1']);
lien(nom, [pre 'ke/1'], [pre 'S2/2']);
entree = [pre 'S2/1'];
sortie = [pre 'Mecanique/1'];
end

%% ------------------------------------------------------------- outils
function modele(nom, duree, pas_max)
% Nouveau modèle vide (on ferme sans enregistrer une version déjà ouverte).
if bdIsLoaded(nom)
    close_system(nom, 0);
end
new_system(nom);
set_param(nom, 'StopTime', num2str(duree, 15), 'Solver', 'ode45', 'MaxStep', num2str(pas_max, 15), ...
          'RelTol', '1e-8', 'AbsTol', '1e-10');
end

function bloc(nom, chemin, nom_bloc, col, ligne, varargin)
% Ajoute un bloc de la bibliothèque, placé sur une grille ; les valeurs
% numériques des paramètres sont converties en texte (set_param attend du texte).
reglages = varargin;
for k = 2:2:numel(reglages)
    if isnumeric(reglages{k})
        reglages{k} = mat2str(reglages{k}, 15);
    end
end
taille = [100 44];
if strcmp(chemin, 'simulink/Math Operations/Sum')
    taille = [32 32];
end
x = 40 + 150*col;
y = 40 + 110*ligne;
add_block(chemin, [nom '/' nom_bloc], 'Position', [x, y, x + taille(1), y + taille(2)], reglages{:});
end

function journal(nom, variable, col, ligne, periode)
% Bloc To Workspace : enregistre un signal (temps + valeurs) tous les « periode ».
bloc(nom, 'simulink/Sinks/To Workspace', variable, col, ligne, 'VariableName', variable, ...
     'SaveFormat', 'Structure With Time', 'SampleTime', periode);
end

function lien(nom, depuis, vers)
try
    add_line(nom, depuis, vers, 'autorouting', 'on');
catch
    add_line(nom, depuis, vers);       % versions sans routage automatique
end
end

function c = controle(variable, libelle, reference, t_min, tolerance)
if nargin < 4
    t_min = 0;
end
if nargin < 5
    tolerance = 1e-3;
end
c = struct('variable', variable, 'libelle', libelle, 'reference', reference, 't_min', t_min, 'tolerance', tolerance);
end

function y = echelon_retarde(sys, t, t0, amplitude)
% amplitude * réponse indicielle de sys à un échelon appliqué à t0, aux instants t.
y = zeros(size(t));
if amplitude == 0 || max(t) <= t0
    return
end
tr = linspace(0, max(t) - t0, 20001).';
yr = amplitude*step(sys, tr);
apres = t >= t0;
y(apres) = interp1(tr + t0, yr(:), t(apres));
end

function y = echantillons(Fz, t, T, amplitude)
% Réponse indicielle d'un système discret aux instants t = kT.
k = round(t/T);
yk = amplitude*step(Fz, (0:max(k)).'*T);
y = yk(k + 1);
end

function y = reponse_lsim(sys, entree, t)
% Réponse de sys à l'entrée entree(t), calculée sur une grille fine puis lue aux instants t.
tr = linspace(0, max(t), 100001).';
yr = lsim(sys, entree(tr), tr);
y = interp1(tr, yr(:), t);
end
