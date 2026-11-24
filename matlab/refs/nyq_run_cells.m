function NYQ__out = nyq_run_cells(NYQ__file, NYQ__figdir)
% NYQ_RUN_CELLS  Execute a TP script cell by cell in one workspace and return
% {cell id, {name, value; ...}} for the variables each cell creates or changes.
% Every local variable of this function starts with NYQ__ so that it can be
% told apart from the script's own variables.

  [NYQ__cells, NYQ__fundir] = nyq_split(NYQ__file);
  addpath(NYQ__fundir);
  NYQ__out = cell(0, 2);
  NYQ__prev = struct();
  close all;
  for NYQ__i = 1:numel(NYQ__cells)
    try
      eval(NYQ__cells(NYQ__i).code);
    catch NYQ__err
      rmpath(NYQ__fundir);
      error('nyq_run_cells:cell', '%s, cell "%s": %s', NYQ__file, NYQ__cells(NYQ__i).id, NYQ__err.message);
    end
    NYQ__names = who;
    NYQ__vars = cell(0, 2);
    for NYQ__j = 1:numel(NYQ__names)
      NYQ__n = NYQ__names{NYQ__j};
      if strncmp(NYQ__n, 'NYQ__', 5) || strcmp(NYQ__n, 'ans'), continue; end
      NYQ__v = eval(NYQ__n);
      if ~isfield(NYQ__prev, NYQ__n) || ~isequal(NYQ__prev.(NYQ__n), NYQ__v)
        NYQ__vars(end+1, :) = {NYQ__n, NYQ__v};
        NYQ__prev.(NYQ__n) = NYQ__v;
      end
    end
    NYQ__out(end+1, :) = {NYQ__cells(NYQ__i).id, NYQ__vars};
  end
  rmpath(NYQ__fundir);

  % figures, for a visual check of the CI run (not committed)
  if ~exist(NYQ__figdir, 'dir'), mkdir(NYQ__figdir); end
  NYQ__figs = sort(get(0, 'children'));
  for NYQ__i = 1:numel(NYQ__figs)
    print(NYQ__figs(NYQ__i), fullfile(NYQ__figdir, sprintf('fig%02d.svg', NYQ__i)), '-dsvg');
  end
  close all;
end
