%% TP1 : Initialisation à Matlab Simulink
% Automatique linéaire échantillonnée - IIA 3, INSAT
% Youssef El Mhamdi, IIA 3/1 - projet Nyquist
%
% Le TP se fait dans Simulink. Ce script calcule avec la Control System
% Toolbox exactement ce que doit afficher le Scope, pour vérifier le modèle.
% Le modèle Simulink de la figure 1.6 se construit sans clic avec
% matlab/simulink/build_models.m.
% Les lignes marquées "@param" sont les valeurs réglables (curseurs du site).
clear; close all; clc;

%% III.1 Schéma bloc de G(p) = 9/(s+9) : Step, Sum, Transfer Fcn, Mux, Scope
% Attention (errata E-AE15) : l'énoncé parle du système G, mais la figure 1.6
% ramène la sortie sur le comparateur (Sum + -). Le Scope montre donc la
% boucle fermée F = G/(1+G) = 9/(s+18), et non G seule :
%   gain statique : F(0) = 9/18 = 0.5   (G(0) = 1 en boucle ouverte)
%   constante de temps : 1/18 s          (1/9 s en boucle ouverte)
G = tf(9, [1 9])                % Transfer Fcn : numérateur [9], dénominateur [1 9]
F = feedback(G, 1)              % boucle de la figure 1.6
F_main = tf(9, [1 18]);         % calcul à la main : G/(1+G) = 9/(s+9+9)
gain_statique = dcgain(F)       % 0.5
tau = -1/pole(F)                % 1/18 s
gain_statique_bo = dcgain(G)    % 1
tau_bo = -1/pole(G)             % 1/9 s

t_step = 1;                     % @param t_step [s] 0..5/0.005 instant du saut (bloc Step : 1 s par défaut ; multiple de 5 ms)
Uf = 1;                         % @param Uf 0.1..10 valeur finale du bloc Step (1 par défaut)
t = linspace(0, 10, 2001);      % durée de simulation par défaut de Simulink : 10 s
u = Uf * (t >= t_step);         % sortie du bloc Step
apres = t >= t_step;            % la réponse est la réponse indicielle décalée de t_step
y = zeros(size(t));  y(apres) = Uf * step(F, t(apres) - t_step);       % voie 2 du Mux
y_bo = zeros(size(t)); y_bo(apres) = Uf * step(G, t(apres) - t_step);  % G seule, sans retour

figure('Name', 'III.1 - Scope de la figure 1.6');
plot(t, u, t, y, 'LineWidth', 1.5); hold on;
plot(t, y_bo, '--', 'LineWidth', 1); hold off; grid on;
xlabel('t (s)'); ylabel('amplitude');
legend('Step', 'Transfer Fcn (boucle fermée)', 'G seule (sans retour)', 'Location', 'east');
title('Scope : échelon et réponse du système de la figure 1.6');

y_final = y(end)                % 0.5*Uf : le Scope se stabilise à 0.5
t5 = t_step + 3*tau             % temps de réponse à 5 % (3 tau)

%% III.2 Faire varier la valeur finale du bloc Step
% Le système est linéaire : la sortie est proportionnelle à l'entrée.
% Multiplier Uf multiplie la valeur finale (0.5*Uf), sans changer la forme
% de la réponse ni la constante de temps (1/18 s).
Uf_liste = [0.5 1 2 5];         % @param Uf_liste valeurs finales essayées
y_finaux = zeros(size(Uf_liste));
figure('Name', 'III.2 - Effet de la valeur finale du Step');
hold on;
for i = 1:numel(Uf_liste)
    yi = zeros(size(t));
    yi(apres) = Uf_liste(i) * step(F, t(apres) - t_step);
    y_finaux(i) = yi(end);
    plot(t, yi, 'LineWidth', 1.5);
end
hold off; grid on;
xlabel('t (s)'); ylabel('sortie');
legend(arrayfun(@(v) sprintf('Uf = %g', v), Uf_liste, 'UniformOutput', false), 'Location', 'east');
title('Réponse pour plusieurs valeurs finales du bloc Step');
rapport_sortie_entree = y_finaux ./ Uf_liste   % toujours 0.5 = gain statique de F
