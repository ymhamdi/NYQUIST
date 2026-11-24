%% TP3 : Stabilité et précision d'un système échantillonné asservi
% Automatique linéaire échantillonnée - IIA 3, INSAT
% Youssef El Mhamdi, IIA 3/1 - projet Nyquist
%
% La numérotation suit le fascicule : la partie II commence à la question 3
% (il n'y a pas de questions 1 et 2, errata E-AE3).
% T et K ne sont pas donnés (errata E-AE1, E-AE2) : T = tau/10 et K = 1 par
% défaut. Les lignes "@param" sont réglables (curseurs du site).
% Les modèles Simulink se construisent avec matlab/simulink/build_models.m.
clear; close all; clc;

%% II.3 Transformée en z G(z) en boucle fermée (calcul à la main)
% Figure 3.1 : C(s) = K est un gain pur, les deux échantillonneurs sont donc
% équivalents à un seul (errata E-AE4). En boucle ouverte :
%   G0(z) = Z{ B0(s) G1(s) } = (1 - z^-1) Z{ 1/(s(s+1)) }
%   1/(s(s+1)) = 1/s - 1/(s+1)  ->  z/(z-1) - z/(z-a),  a = exp(-T)
%   G0(z) = (1 - a)/(z - a)
% En boucle fermée avec le gain K et le retour unitaire :
%   G(z) = K G0(z) / (1 + K G0(z)) = K(1 - a) / (z - a + K(1 - a))
T = 0.1;                        % @param T [s] période d'échantillonnage (non donnée : tau/10, tau = 1 s)
K = 1;                          % @param K gain du contrôleur proportionnel (non donné)
a = exp(-T)
G0_main = tf(1 - a, [1 -a], T);
G_bf_main = tf(K*(1 - a), [1, -a + K*(1 - a)], T)

%% II.4 Vérification avec tf, c2d et feedback
G1 = tf(1, [1 1]);
G0 = c2d(G1, T, 'zoh')          % bloqueur d'ordre zéro + G1(s)
G_bf = feedback(K*G0, 1)        % boucle fermée
ecart_bo = abs(dcgain(G0) - dcgain(G0_main)) + abs(pole(G0) - pole(G0_main))
ecart_bf = abs(dcgain(G_bf) - dcgain(G_bf_main)) + abs(pole(G_bf) - pole(G_bf_main))

%% II.5 Ordre, pôles, zéros et stabilité (rlocus)
% Système du premier ordre, sans zéro, un seul pôle : p = a - K(1 - a).
% Stable si et seulement si |p| < 1 (pôle à l'intérieur du cercle unité).
ordre = order(G_bf)             % 1
poles_bf = pole(G_bf)
zeros_bf = zero(G_bf)           % aucun zéro
pole_main = a - K*(1 - a)
stable = abs(poles_bf) < 1
figure('Name', 'II.5 - Lieu des racines');
rlocus(G0); grid on; hold on;
th = linspace(0, 2*pi, 200); plot(cos(th), sin(th), 'k:'); hold off;
axis([-1.5 1.5 -1.5 1.5]); axis square;   % cercle unité visible en entier
title(sprintf('Lieu des racines de K G0(z), T = %g s', T));
% Quand K augmente, le pôle part de z = a (K = 0) et se déplace vers la
% gauche sur l'axe réel ; il sort du cercle unité en z = -1.

%% II.6 Réponse du système (Simulink)
% Simulink montre la sortie CONTINUE s(t) du procédé, entre les instants
% d'échantillonnage, et la commande u maintenue par le bloqueur.
% On la reconstruit ici : la boucle discrète calcule u(k) = K(e(k) - s(k)),
% puis la commande maintenue attaque G1(s) en continu. Pour que le calcul
% soit exact (et identique dans MATLAB et Octave), G1 est discrétisé avec un
% pas 20 fois plus fin que T : la commande y est bien constante par morceaux.
e = 1;                          % @param e consigne (échelon e(t))
duree = 5;                      % durée simulée (s)
N = round(duree/T);
kk = 0:N;
s_k = e * step(G_bf, kk*T).';   % sortie aux instants kT (modèle discret)
u_k = K * (e - s_k);            % commande calculée puis maintenue par B0
t_fin = (0:20*N) * (T/20);
u_maintenue = u_k(min(floor(t_fin/T + 1e-9) + 1, N + 1));
G1_fin = c2d(G1, T/20, 'zoh');  % procédé continu, calculé tous les T/20
s_continue = lsim(G1_fin, u_maintenue, t_fin).';
ecart_instants = max(abs(s_continue(1:20:end) - s_k))   % 0 : les deux modèles coïncident en kT
s_final = e * dcgain(G_bf)      % K/(1+K)*e
figure('Name', 'II.6 - Réponse de la boucle de la figure 3.1');
plot(t_fin, s_continue, 'LineWidth', 1.5); hold on;
stairs(kk*T, u_k, 'LineWidth', 1);
stem(kk*T, s_k, 'filled', 'MarkerSize', 3); hold off; grid on;
xlabel('t (s)'); legend('s(t) continue', 'commande u maintenue', 's(kT)', 'Location', 'east');
title(sprintf('Réponse indicielle, K = %g, T = %g s', K, T));

%% II.7 Stabilité selon K et valeur limite de K
% |p| < 1  <=>  -1 < a - K(1 - a) < 1  <=>  -1 < K < (1 + a)/(1 - a)
% Valeur limite : Kmax = (1 + a)/(1 - a). Elle diminue quand T augmente :
% échantillonner lentement déstabilise la boucle.
Kmax = (1 + a)/(1 - a)
pole_a_Kmax = pole(feedback(Kmax*G0, 1))   % -1 : sur le cercle unité
K_essais = [1, 0.5*Kmax, 0.9*Kmax, 1.1*Kmax];   % @param K_essais gains comparés
poles_essais = a - K_essais*(1 - a)
stables_essais = abs(poles_essais) < 1
figure('Name', 'II.7 - Effet de K');
for i = 1:numel(K_essais)
    subplot(2, 2, i);
    yk = step(feedback(K_essais(i)*G0, 1), (0:40)*T);
    stairs((0:40)*T, yk, 'LineWidth', 1.2); grid on;
    title(sprintf('K = %.3g, pôle = %.3f', K_essais(i), poles_essais(i)));
    xlabel('t (s)');
end
T_grille = linspace(0.01, 3, 300);
Kmax_T = (1 + exp(-T_grille)) ./ (1 - exp(-T_grille));
figure('Name', 'II.7 - Kmax(T)');
semilogy(T_grille, Kmax_T, 'LineWidth', 1.5); grid on;
xlabel('T (s)'); ylabel('K_{max}');
title('Gain limite de stabilité en fonction de la période d''échantillonnage');

%% III.1 Réservoir : G(z) en boucle fermée (calcul à la main)
% G1(s) = H(s)/Qe(s) = 12.5/(50s + 1) : gain 12.5, constante de temps 50 s.
% Même démarche qu'en II.3 avec b = exp(-T/50) :
%   G0(z) = 12.5(1 - b)/(z - b)
%   G(z)  = 12.5 K (1 - b) / (z - b + 12.5 K (1 - b))
% La consigne est une hauteur (2 m), notée Qe(S) sur la figure 3.2 (errata E-AE5).
T_r = 5;                        % @param T_r [s] période d'échantillonnage (non donnée : tau/10, tau = 50 s)
K_r = 1;                        % @param K_r gain du contrôleur (non donné)
b = exp(-T_r/50)
G0r_main = tf(12.5*(1 - b), [1 -b], T_r);
G_bf_r_main = tf(12.5*K_r*(1 - b), [1, -b + 12.5*K_r*(1 - b)], T_r)

%% III.2 Vérification avec tf, c2d et feedback
G1r = tf(12.5, [50 1]);
G0r = c2d(G1r, T_r, 'zoh')
G_bf_r = feedback(K_r*G0r, 1)
ecart_r = abs(dcgain(G_bf_r) - dcgain(G_bf_r_main)) + abs(pole(G_bf_r) - pole(G_bf_r_main))

%% III.3 Réponse pour différentes périodes d'échantillonnage (Simulink)
% Kmax(T) = (1 + b)/(12.5(1 - b)) baisse quand T augmente : avec K = 1, la
% boucle devient instable dès que Kmax(T) < 1, c'est-à-dire T > T_limite.
consigne = 2;                   % @param consigne [m] hauteur visée (2 m dans l'énoncé)
T_liste = [1 5 10 25];          % @param T_liste [s] périodes comparées
Kmax_liste = (1 + exp(-T_liste/50)) ./ (12.5*(1 - exp(-T_liste/50)))
stable_liste = K_r < Kmax_liste
if 12.5*K_r > 1
    T_limite = -50*log((12.5*K_r - 1)/(12.5*K_r + 1))   % Kmax(T_limite) = K_r
else
    T_limite = Inf              % Kmax(T) > 1/12.5 pour tout T : toujours stable
end
duree_r = 300;
figure('Name', 'III.3 - Hauteur pour différentes périodes');
hold on;
for i = 1:numel(T_liste)
    Ti = T_liste(i);
    Fi = feedback(K_r*c2d(G1r, Ti, 'zoh'), 1);
    ki = 0:floor(duree_r/Ti);
    if ~stable_liste(i)
        ki = 0:min(numel(ki) - 1, 4);   % instable : les premiers échantillons suffisent à voir la divergence
    end
    stairs(ki*Ti, consigne*step(Fi, ki*Ti), 'LineWidth', 1.2);
end
hold off; grid on; ylim([-10 15]);
xlabel('t (s)'); ylabel('H (m)');
legend(arrayfun(@(v) sprintf('T = %g s', v), T_liste, 'UniformOutput', false), 'Location', 'northeast');
title(sprintf('Hauteur d''eau, consigne %g m, K = %g', consigne, K_r));

%% III.4 Valeur de K pour remplir 2 m
% Avec un correcteur proportionnel, H(inf) = consigne * 12.5K/(1 + 12.5K) :
% la hauteur n'atteint JAMAIS exactement 2 m (il faudrait K infini).
% L'énoncé ne donne pas de tolérance (errata E-AE6) : on cherche le plus
% petit K donnant une erreur relative <= eps :
%   1/(1 + 12.5K) <= eps  <=>  K >= (1 - eps)/(12.5 eps)
% Ce K doit aussi rester sous Kmax(T) pour que la boucle soit stable.
eps_tol = 0.02;                 % @param eps_tol tolérance sur la hauteur (non donnée : 2 %)
K_min = (1 - eps_tol)/(12.5*eps_tol)
Kmax_r = (1 + b)/(12.5*(1 - b))
realisable = K_min < Kmax_r
T_max_tolerance = -50*log((12.5*K_min - 1)/(12.5*K_min + 1))   % T maximal pour atteindre la tolérance
erreur_min_atteignable = 1/(1 + 12.5*Kmax_r)    % meilleure erreur relative à cette période
H_final_Kmin = consigne*12.5*K_min/(1 + 12.5*K_min)

%% III.5 Pôles, zéros et stabilité (rlocus)
poles_r = pole(G_bf_r)
zeros_r = zero(G_bf_r)
pole_r_main = b - 12.5*K_r*(1 - b)
stable_r = abs(poles_r) < 1
figure('Name', 'III.5 - Lieu des racines du réservoir');
rlocus(G0r); grid on; hold on;
th = linspace(0, 2*pi, 200); plot(cos(th), sin(th), 'k:'); hold off;
axis([-1.5 1.5 -1.5 1.5]); axis square;
title(sprintf('Lieu des racines du réservoir, T = %g s', T_r));

%% III.6 Erreur statique
% Gain statique de G0(z) : G0(1) = 12.5 (le bloqueur conserve le gain).
% Erreur statique pour un échelon de hauteur consigne :
%   e(inf) = consigne / (1 + 12.5 K)
erreur_statique = consigne - consigne*dcgain(G_bf_r)
erreur_statique_main = consigne/(1 + 12.5*K_r)
H_final = consigne*dcgain(G_bf_r)
% Remarque : le réservoir mesure 20 m ; le modèle linéaire ne tient pas
% compte du débordement.
