function export_refs(outdir)
% EXPORT_REFS  Run every TP script in GNU Octave, cell by cell, and write
% one JSON file of reference values per script.
%
%   octave-cli --eval "addpath('matlab/refs'); export_refs"            % -> reference/
%   octave-cli --eval "addpath('matlab/refs'); export_refs('/tmp/r')"  % -> /tmp/r (CI staleness check)
%
% For each "%%" cell, every variable that the cell creates or changes is
% recorded under the cell's id (the handout's question number, e.g. "II.3").
% The web engine's tests compare against these files: no reference value is
% ever typed by hand. Figures are saved as SVG in build/figures/ (not committed).

  root = fileparts(fileparts(fileparts(mfilename('fullpath'))));
  if nargin < 1, outdir = fullfile(root, 'reference'); end
  if ~exist(outdir, 'dir'), mkdir(outdir); end

  if ~exist('OCTAVE_VERSION', 'builtin')
    error('export_refs: meant for GNU Octave (the CI). In MATLAB, just run the TP scripts.');
  end
  pkg load control
  pkg load signal
  addpath(fullfile(root, 'matlab', 'compat'));           % Octave-only shims (stepinfo, order)
  addpath(fullfile(root, 'matlab', 'refs', 'shadow'));   % pause() without waiting
  warning('off', 'all');
  graphics_toolkit('gnuplot');
  set(0, 'defaultfigurevisible', 'off');

  scripts = {
    'automatique/tp1_simulink_premier_ordre.m'
    'automatique/tp2_discretisation.m'
    'automatique/tp3_stabilite_precision.m'
    'automatique/tp4_regulation_pid.m'
    'signal/tp3_tfd.m'
    'signal/tp4_filtres_numeriques.m'
  };

  ver_ctrl = pkg('describe', 'control'); ver_sig = pkg('describe', 'signal');
  generator = sprintf('GNU Octave %s, control %s, signal %s', OCTAVE_VERSION, ...
                      ver_ctrl{1}.version, ver_sig{1}.version);

  for i = 1:numel(scripts)
    rel = scripts{i};
    file = fullfile(root, 'matlab', rel);
    [~, base] = fileparts(rel);
    course = fileparts(rel);
    name = [course '_' base];
    figdir = fullfile(root, 'build', 'figures', name);
    fprintf('== %s\n', rel);
    cells = nyq_run_cells(file, figdir);

    parts = cell(1, size(cells, 1));
    for c = 1:size(cells, 1)
      parts{c} = sprintf('%s: %s', nyq_json(cells{c, 1}), nyq_json(cells{c, 2}));
    end
    txt = sprintf('{\n"source": %s,\n"generator": %s,\n"cells": {\n%s\n}\n}\n', ...
                  nyq_json(['matlab/' rel]), nyq_json(generator), strjoin(parts, sprintf(',\n')));
    fid = fopen(fullfile(outdir, [name '.json']), 'w');
    fprintf(fid, '%s', txt);
    fclose(fid);
    fprintf('   %d cells -> %s.json\n', size(cells, 1), name);
  end
end
