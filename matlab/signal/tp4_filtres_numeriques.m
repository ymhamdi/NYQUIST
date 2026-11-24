%% TP4 : Analyse des filtres numériques
% Traitement du signal - IIA 3, INSAT
% Youssef El Mhamdi, IIA 3/1 - projet Nyquist
%
% ATTENTION : énoncé NON VÉRIFIÉ sur le fascicule original (transcription).
% Les pauses de 5 s demandées par l'énoncé sont conservées.
% Les lignes "@param" sont réglables (curseurs du site).
clear; close all; clc;

%% I.1 Période d'échantillonnage et coefficients de la TZ
% H1(z) = (z - 0.3)/(z^2 - 1.3z + 0.7)
% H2(z) = (z^2 - 0.3)/(z^3 - 1.3z^2 + 0.7z + 1.5)
% Coefficients en puissances DÉCROISSANTES de z, comme écrits dans l'énoncé.
Te = 0.01;
Num1 = [1 -0.3];      Den1 = [1 -1.3 0.7];
Num2 = [1 0 -0.3];    Den2 = [1 -1.3 0.7 1.5];

%% I.2 Fonction de transfert en z (sans point-virgule pour l'afficher)
% Le programme fourni utilise dfilt.df1, un ancien objet de la Signal
% Processing Toolbox ; tf(Num, Den, Te) donne la TZ avec sa période
% d'échantillonnage (errata E-TS7, « %H=ft(...) » se lit tf).
H1 = tf(Num1, Den1, Te)
pause(5)
H2 = tf(Num2, Den2, Te)
pause(5)

%% I.3 Zéros et pôles dans le plan complexe
% Un filtre causal est stable si tous ses pôles sont dans le cercle unité.
zeros1 = roots(Num1)
poles1 = roots(Den1)
zeros2 = roots(Num2)
poles2 = roots(Den2)
module_poles1 = abs(poles1)     % sqrt(0.7) = 0.837 : H1 stable
module_poles2 = abs(poles2)     % deux pôles de module 1.456 : H2 instable
stable1 = all(module_poles1 < 1)
stable2 = all(module_poles2 < 1)
figure('Name', 'I.3 - Pôles et zéros');
subplot(1, 2, 1); zplane(zeros1, poles1); title('H_1(z)');
subplot(1, 2, 2); zplane(zeros2, poles2); title('H_2(z)');
pause(5)

%% I.4 Transformée en z inverse (impz)
% impz(b, a) lit b et a en puissances CROISSANTES de z^-1. En divisant par
% la plus haute puissance de z :
%   H1(z) = (z^-1 - 0.3 z^-2)/(1 - 1.3 z^-1 + 0.7 z^-2)  ->  b1 = [0 1 -0.3]
% On complète donc Num à gauche par des zéros jusqu'à la longueur de Den.
% Division à la main : h1 = 0, 1, 1, 0.6, 0.08, ...
%   h(n) = 1.3 h(n-1) - 0.7 h(n-2) + (entrées)  pour n >= 3
b1 = [zeros(1, numel(Den1) - numel(Num1)) Num1]
b2 = [zeros(1, numel(Den2) - numel(Num2)) Num2]
n_imp = 30;                     % @param n_imp nombre d'échantillons calculés
h1 = impz(b1, Den1, n_imp).';
h2 = impz(b2, Den2, n_imp).';
n = 0:n_imp-1;
h1_division = filter(b1, Den1, [1 zeros(1, n_imp - 1)]);
ecart_impz_filter = max(abs(h1 - h1_division))   % 0
premiers_termes_h1 = h1(1:5)                     % 0 1 1 0.6 0.08
figure('Name', 'I.4 - Réponses impulsionnelles');
subplot(2, 1, 1); stem(n*Te, h1, 'filled', 'MarkerSize', 3); grid on; title('h_1[n] : tend vers 0 (stable)');
subplot(2, 1, 2); stem(n*Te, h2, 'filled', 'MarkerSize', 3); grid on; title('h_2[n] : diverge (instable)');
xlabel('t = nT_e (s)');
pause(5)

%% I.5 Réponse en fréquence (freqz) : amplitude et phase dans la même figure
% Le programme fourni écrit freqz(Num, Den, 1/Te) : le 3e argument est un
% NOMBRE DE POINTS (100), pas la fréquence d'échantillonnage (errata E-TS7).
% Forme correcte : freqz(b, a, nPoints, Fe), axe de 0 à Fe/2 en Hz.
% Pour H2 (instable), freqz calcule H(e^{j2pi f Te}) mais ce n'est pas une
% réponse en régime permanent : la sortie diverge.
n_freq = 512;                   % @param n_freq nombre de points de fréquence
Fe = 1/Te;
[Hf1, f1] = freqz(b1, Den1, n_freq, Fe);
[Hf2, f2] = freqz(b2, Den2, n_freq, Fe);
Hf1 = Hf1.'; f1 = f1.'; Hf2 = Hf2.'; f2 = f2.';
gain_continu_1 = abs(Hf1(1))    % H1(1) = 0.7/0.4 = 1.75
[gain_max_1, i_max] = max(abs(Hf1));
gain_max_1
f_resonance_1 = f1(i_max)
figure('Name', 'I.5 - Réponse en fréquence');
subplot(2, 1, 1); plot(f1, 20*log10(abs(Hf1)), f2, 20*log10(abs(Hf2)), 'LineWidth', 1.2); grid on;
ylabel('|H| (dB)'); legend('H_1', 'H_2 (instable)');
subplot(2, 1, 2); plot(f1, angle(Hf1), f2, angle(Hf2), 'LineWidth', 1.2); grid on;
ylabel('phase (rad)'); xlabel('f (Hz)');
pause(5)

%% Hors-fascicule invfreqz : retrouver Num et Den à partir de la réponse en fréquence
% L'objectif du TP cite invfreqz sans question associée : on vérifie qu'il
% retrouve les coefficients de H1 à partir de sa réponse en fréquence.
[b1_estime, a1_estime] = invfreqz(Hf1, 2*pi*f1/Fe, numel(b1) - 1, numel(Den1) - 1);
ecart_invfreqz = max(abs([b1_estime - b1, a1_estime - Den1]))

%% II.1 Filtre passe-bas RII du second ordre : réponse impulsionnelle (N = 32)
% Dénominateur imprimé 0.516z^2 - 1.2z + 1 : pôles de module 1.392, filtre
% INSTABLE, qu'on lise les coefficients en z ou en z^-1 (errata E-TS8).
% C'est le polynôme z^2 - 1.2z + 0.516 écrit à l'envers (confusion z / z^-1) ;
% inverser l'ordre des coefficients inverse les pôles : module 1/1.392 = 0.718.
% « ordre du filtre N = 32 » : 32 est le nombre d'échantillons de h[n] ; le
% filtre est d'ordre 2 (errata E-TS9).
b = [0.079 0.158 0.079];
a_imprime = [0.516 -1.2 1];
a_corrige = [1 -1.2 0.516];
utiliser_imprime = 0;           % @param utiliser_imprime 1 : dénominateur tel qu'imprimé (instable)
if utiliser_imprime
    a = a_imprime;
else
    a = a_corrige;
end
module_poles_imprime = abs(roots(a_imprime)).'
module_poles_corrige = abs(roots(a_corrige)).'
N = 32;
h = impz(b, a, N).';
figure('Name', 'II.1 - Réponse impulsionnelle du filtre RII');
stem(0:N-1, h, 'filled', 'MarkerSize', 3); grid on;
xlabel('n'); ylabel('h[n]'); title('Réponse impulsionnelle (32 échantillons)');

%% II.2 Réponse en fréquence sur L = 256 points (amplitude en dB et phase)
L = 256;
[H, w] = freqz(b, a, L);
H = H.'; w = w.';
gain_dB = 20*log10(abs(H));
gain_continu = abs(H(1))        % 0.316/0.316 = 1 (0 dB)
[gain_max, i_max] = max(abs(H));
gain_max                        % léger pic de résonance
w_resonance = w(i_max)/pi       % en multiples de pi rad/échantillon
i_coupure = find(abs(H) < gain_continu/sqrt(2), 1);
w_coupure = w(i_coupure)/pi     % première fréquence sous -3 dB (en multiples de pi)
figure('Name', 'II.2 - Réponse en fréquence du filtre RII');
subplot(2, 1, 1); plot(w/pi, gain_dB, 'LineWidth', 1.2); grid on;
ylabel('|H| (dB)'); title('Réponse en amplitude');
subplot(2, 1, 2); plot(w/pi, angle(H), 'LineWidth', 1.2); grid on;
ylabel('phase (rad)'); xlabel('\omega / \pi'); title('Réponse en phase');

%% II.3 Pôles et zéros dans le plan z
% Zéro double en z = -1 : le gain est nul à Fe/2, c'est bien un passe-bas.
zeros_rii = roots(b)
poles_rii = roots(a)
module_poles_rii = abs(poles_rii)
figure('Name', 'II.3 - Pôles et zéros du filtre RII');
zplane(zeros_rii, poles_rii); title('Pôles et zéros du filtre RII');
