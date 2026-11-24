% OCTAVE_SETUP  À lancer une fois dans GNU Octave avant les scripts des TP.
% (Inutile dans MATLAB : les scripts n'utilisent que des fonctions MATLAB.)
% Charge les paquets control et signal et ajoute les fonctions de
% compatibilité (stepinfo, order) qui manquent à Octave.
pkg load control
pkg load signal
addpath(fullfile(fileparts(mfilename('fullpath')), 'compat'));
disp('Octave prêt : paquets control et signal chargés, compat/ ajouté au chemin.');
