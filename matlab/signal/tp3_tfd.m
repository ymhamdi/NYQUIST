%% TP3 : Transformée de Fourier Discrète
% Traitement du signal - IIA 3, INSAT
% Youssef El Mhamdi, IIA 3/1 - projet Nyquist
%
% ATTENTION : énoncé NON VÉRIFIÉ sur le fascicule original (transcription).
% Numérotation : questions 1 à 12 de la partie 2.2 (cellules Q1 ... Q12).
% Les lignes "@param" sont réglables (curseurs du site).
clear; close all; clc;

%% Q1 Générer x1[n] = 3cos(2*pi*100*n*Te) sur tmax = 0.1 s
% Deux lectures possibles de « sur une durée tmax » (errata E-TS5) :
%  - n = 0 ... N-1 avec N = tmax*Fe = 100 points : 100 Hz tombe sur une raie ;
%  - t = 0:Te:tmax, soit N + 1 = 101 points : 100 Hz tombe entre deux raies.
Fe = 1000; Te = 1/Fe;
tmax = 0.1;                     % @param tmax [s] temps d'acquisition
inclure_tmax = 0;               % @param inclure_tmax 1 : t = 0:Te:tmax (N+1 points)
N = round(tmax*Fe) + inclure_tmax
n = 0:N-1;
x1 = 3*cos(2*pi*100*n*Te);
figure('Name', 'Q1 - x1[n]');
stem(n*Te, x1, 'filled', 'MarkerSize', 3); grid on;
xlabel('t = nT_e (s)'); ylabel('x_1[n]'); title('x_1[n] = 3 cos(2\pi 100 n T_e)');

%% Q2 Parties réelle et imaginaire de X1(f) (fft, fftshift, stem)
% Après fftshift, la case k correspond à f = (k - floor(N/2)) Fe/N : l'axe va
% de -Fe/2 à Fe/2 avec un pas delta_f = Fe/N (valable pour N pair ou impair).
% Avec N = 100, x1 contient un nombre entier de périodes (10) : il est pair
% au sens circulaire, x1[N-n] = x1[n], donc X1 est réel. La partie imaginaire
% tracée vaut environ 1e-13 : c'est un zéro numérique (arrondis de la fft).
% Avec N = 101 (inclure_tmax = 1), ce n'est plus vrai.
X1 = fftshift(fft(x1));
f = ((0:N-1) - floor(N/2))*Fe/N;
delta_f = Fe/N
figure('Name', 'Q2 - X1(f)');
subplot(2, 1, 1); stem(f, real(X1), 'MarkerSize', 3); grid on; ylabel('Re X_1(f)');
subplot(2, 1, 2); stem(f, imag(X1), 'MarkerSize', 3); grid on; ylabel('Im X_1(f)'); xlabel('f (Hz)');

%% Q3 Spectre d'amplitude
figure('Name', 'Q3 - |X1(f)|');
stem(f, abs(X1), 'MarkerSize', 3); grid on;
xlabel('f (Hz)'); ylabel('|X_1(f)|'); title('Spectre d''amplitude de x_1');

%% Q4 Amplitude des raies : bonnes amplitudes et bonnes fréquences
% 3cos(2*pi*100t) = 1.5 e^{+j2pi100t} + 1.5 e^{-j2pi100t} : deux raies de 1.5.
% La fft additionne N échantillons sans diviser : la raie vaut N x 1.5 = 150.
% -> bonnes amplitudes : diviser par N (spectre bilatéral, 1.5 à +/-100 Hz),
%    puis multiplier par 2 pour l'amplitude du cosinus (3).
% -> bonnes fréquences : axe f = (k - floor(N/2)) Fe/N, et non l'indice k.
[amplitude_raie, i_raie] = max(abs(X1));
amplitude_raie                  % N*A/2 (= 150 si N = 100)
f_raie = abs(f(i_raie))         % 100 Hz
amplitude_bilaterale = amplitude_raie/N
amplitude_cosinus = 2*amplitude_raie/N   % 3 si 100 Hz tombe sur une raie
figure('Name', 'Q4 - |X1(f)|/N');
stem(f, abs(X1)/N, 'MarkerSize', 3); grid on;
xlabel('f (Hz)'); ylabel('|X_1(f)|/N'); title('Spectre d''amplitude normalisé');

%% Q5 x2[n] = 5 + x1[n] : questions 1 à 4 pour x2
x2 = 5 + x1;
X2 = fftshift(fft(x2));
figure('Name', 'Q5 - x2[n] et X2(f)');
subplot(2, 2, 1); stem(n*Te, x2, 'filled', 'MarkerSize', 3); grid on; title('x_2[n]');
subplot(2, 2, 2); stem(f, real(X2), 'MarkerSize', 3); grid on; title('Re X_2(f)');
subplot(2, 2, 3); stem(f, imag(X2), 'MarkerSize', 3); grid on; title('Im X_2(f)');
subplot(2, 2, 4); stem(f, abs(X2)/N, 'MarkerSize', 3); grid on; title('|X_2(f)|/N'); xlabel('f (Hz)');

%% Q6 Effet de la composante continue
% La constante 5 ajoute une raie à f = 0 : X2(0) = N x 5, soit 5 après
% division par N. Les raies à +/-100 Hz ne changent pas (linéarité).
i0 = floor(N/2) + 1;            % case de f = 0
raie_continue = abs(X2(i0))/N   % 5
raie_100_x2 = abs(X2(i_raie))/N % inchangée

%% Q7 x3[n] = 5 + cos(2*pi*100*n*Te - pi/3)
x3 = 5 + cos(2*pi*100*n*Te - pi/3);
X3 = fftshift(fft(x3));
figure('Name', 'Q7 - X3(f)');
subplot(3, 1, 1); stem(f, real(X3)/N, 'MarkerSize', 3); grid on; ylabel('Re X_3/N');
subplot(3, 1, 2); stem(f, imag(X3)/N, 'MarkerSize', 3); grid on; ylabel('Im X_3/N');
subplot(3, 1, 3); stem(f, abs(X3)/N, 'MarkerSize', 3); grid on; ylabel('|X_3|/N'); xlabel('f (Hz)');

%% Q8 Effet du retard
% cos(2*pi*100*n*Te - pi/3) = cos(2*pi*100*(nTe - tau)) avec tau = 1/600 s :
% déphasage de -pi/3 à 100 Hz. La raie à +100 Hz est multipliée par
% e^{-j pi/3} (celle à -100 Hz par e^{+j pi/3}) : les parties réelle et
% imaginaire changent, le module reste le même.
% x3 a une amplitude 1 alors que x2 a une amplitude 3 (errata E-TS10) : pour
% isoler l'effet du retard, on compare aussi avec 5 + cos(2*pi*100*n*Te).
tau_retard = (pi/3)/(2*pi*100)  % 1/600 s
X_ref = fftshift(fft(5 + cos(2*pi*100*n*Te)));
i100 = find(abs(f - 100) < 1e-9);
if isempty(i100)                % 100 Hz hors grille (N = 101) : raie la plus proche
    [~, i100] = min(abs(f - 100));
end
raie_x3 = X3(i100)/N            % 0.5 e^{-j pi/3} = 0.25 - 0.433j (si 100 Hz est sur une raie)
raie_ref = X_ref(i100)/N        % 0.5
dephasage_mesure = angle(raie_x3/raie_ref)   % -pi/3
rapport_modules = abs(raie_x3)/abs(raie_ref) % 1 : le module ne change pas
rapport_x3_x2 = abs(raie_x3)/abs(X2(i100)/N) % 1/3 : effet de l'amplitude, pas du retard

%% Q9 Spectre de x4[n] = 5 + cos(2*pi*105*n*Te)
% Avec tmax = 0.1 s, delta_f = 10 Hz : 105 Hz n'est pas un multiple de
% delta_f, il tombe entre les raies 100 et 110 Hz. L'énergie se répartit sur
% les raies voisines (fuite spectrale) et le pic est plus bas que 0.5.
N9 = round(0.1*Fe);
n9 = 0:N9-1;
x4 = 5 + cos(2*pi*105*n9*Te);
X4 = fftshift(fft(x4))/N9;
f9 = ((0:N9-1) - floor(N9/2))*Fe/N9;
figure('Name', 'Q9 - |X4(f)|/N');
stem(f9, abs(X4), 'MarkerSize', 3); grid on; xlabel('f (Hz)'); title('|X_4(f)|/N, t_{max} = 0.1 s');
pic_x4 = max(abs(X4(f9 > 50)))  % < 0.5 : fuite spectrale

%% Q10 tmax = 0.05 s et 0.2 s
% delta_f = 1/tmax : 20 Hz (0.05 s), 10 Hz (0.1 s), 5 Hz (0.2 s).
% 105 Hz est un multiple de 5 Hz : seule tmax = 0.2 s donne une raie nette
% d'amplitude 0.5. Plus on observe longtemps, plus la résolution est fine.
% La hauteur du pic dépend de la position de 105 Hz par rapport aux raies :
%  - 0.05 s : 105 Hz est à 1/4 de case de la raie 100 Hz -> pic un peu bas ;
%  - 0.1 s  : 105 Hz est au milieu de deux raies -> pic le plus bas ;
%  - 0.2 s  : 105 Hz est sur une raie -> pic exact de 0.5.
% Une durée plus longue n'améliore donc pas toujours la hauteur du pic, mais
% elle améliore toujours la résolution (delta_f plus petit).
tmax_liste = [0.05 0.1 0.2];    % @param tmax_liste [s]
delta_f_liste = 1./tmax_liste
sur_une_raie = abs(105./delta_f_liste - round(105./delta_f_liste)) < 1e-9
pics = zeros(size(tmax_liste));
figure('Name', 'Q10 - Résolution');
for i = 1:numel(tmax_liste)
    Ni = round(tmax_liste(i)*Fe);
    ni = 0:Ni-1;
    Xi = fftshift(fft(5 + cos(2*pi*105*ni*Te)))/Ni;
    fi = ((0:Ni-1) - floor(Ni/2))*Fe/Ni;
    pics(i) = max(abs(Xi(fi > 50)));
    subplot(3, 1, i); stem(fi, abs(Xi), 'MarkerSize', 3); grid on;
    title(sprintf('t_{max} = %g s, \\Delta f = %g Hz', tmax_liste(i), delta_f_liste(i)));
end
xlabel('f (Hz)');
pics

%% Q11 Fonction : indice p tel que 2^p est la première valeur qui dépasse N
% « dépasse » : strictement supérieur (errata E-TS6). Pour N = 50, p = 6 (64).
tmax11 = 0.05;
N11 = round(tmax11*Fe)
p = exposant_puissance2(N11)
L = 2^p

%% Q12 Ajout de zéros : x5[n] = x4[n] pour n < N, 0 jusqu'à 2^p
% Les zéros ajoutés ne changent pas la résolution (1/tmax = 20 Hz) : ils
% calculent plus de points sur la même courbe (la TFTD de x4). Le spectre
% est interpolé et le pic calculé se rapproche du pic de la TFTD.
% Attention : avec seulement 50 points, le pic de la TFTD n'est pas à
% 105 Hz. Le lobe de la composante continue (5, dix fois plus grande) et la
% raie image à -105 Hz débordent sur le lobe à 105 Hz et le décalent
% (f_pic_tftd ci-dessous). Ajouter des zéros ne corrige pas ce biais : seule
% une durée d'observation plus longue (ou une fenêtre) le réduit.
% L = 2^p permet aussi l'algorithme FFT radix-2, plus rapide.
n11 = 0:N11-1;
x4_11 = 5 + cos(2*pi*105*n11*Te);
x5 = [x4_11 zeros(1, L - N11)];
X5 = fftshift(fft(x5))/N11;     % divisé par N (et non L) : mêmes amplitudes que x4
f5 = ((0:L-1) - floor(L/2))*Fe/L;
X4_11 = fftshift(fft(x4_11))/N11;
f11 = ((0:N11-1) - floor(N11/2))*Fe/N11;
Ld = 4096;                      % TFTD approchée sur une grille très fine
Xd = fftshift(fft(x4_11, Ld))/N11;
fd = ((0:Ld-1) - floor(Ld/2))*Fe/Ld;
[~, i4] = max(abs(X4_11) .* (f11 > 50));  f_pic_N = f11(i4)
[~, i5] = max(abs(X5) .* (f5 > 50));      f_pic_L = f5(i5)
[~, id] = max(abs(Xd) .* (fd > 50));      f_pic_tftd = fd(id)
figure('Name', 'Q12 - Ajout de zéros');
plot(fd, abs(Xd), 'Color', [0.7 0.7 0.7]); hold on;
stem(f11, abs(X4_11), 'MarkerSize', 4);
stem(f5, abs(X5), 'filled', 'MarkerSize', 3); hold off; grid on;
xlim([0 200]); xlabel('f (Hz)');
legend('TFTD de x_4', sprintf('x_4, N = %d', N11), sprintf('x_5, %d points', L));
title('Spectre d''amplitude de x_5 (zéros ajoutés)');

%% Fonction de la question 11 (doit rester à la fin du script)
function p = exposant_puissance2(N)
% Plus petit entier p tel que 2^p > N (strictement).
    p = 0;
    while 2^p <= N
        p = p + 1;
    end
end
