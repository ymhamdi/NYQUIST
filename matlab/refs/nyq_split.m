function [cells, fundir] = nyq_split(file)
% NYQ_SPLIT  Split a MATLAB script into its "%%" cells.
%   cells(k).id   first word after "%%" (the handout's question number)
%   cells(k).code the cell's code, with clear/clc removed (they would wipe
%                 the harness's own variables)
% Local functions at the end of the script (valid in MATLAB, not callable
% from an Octave script) are written to their own files in `fundir`.

  txt = strrep(fileread(file), sprintf('\r'), '');
  lines = strsplit(txt, sprintf('\n'));

  % local functions: everything from the first top-level "function" line
  fundir = tempname(); mkdir(fundir);
  ifun = find(~cellfun(@isempty, regexp(lines, '^function\s', 'once')), 1);
  if ~isempty(ifun)
    flines = lines(ifun:end);
    starts = find(~cellfun(@isempty, regexp(flines, '^function\s', 'once')));
    starts(end+1) = numel(flines) + 1;
    for k = 1:numel(starts) - 1
      body = flines(starts(k):starts(k+1) - 1);
      tok = regexp(body{1}, '^function\s+(?:\[?[\w,\s]*\]?\s*=\s*)?(\w+)', 'tokens', 'once');
      fid = fopen(fullfile(fundir, [tok{1} '.m']), 'w');
      fprintf(fid, '%s\n', body{:});
      fclose(fid);
    end
    lines = lines(1:ifun - 1);
  end

  cells = struct('id', {}, 'code', {});
  current = struct('id', 'entete', 'lines', {{}});
  for k = 1:numel(lines)
    m = regexp(lines{k}, '^\s*%%\s*(\S+)', 'tokens', 'once');
    if ~isempty(m)
      cells = flush(cells, current);
      current = struct('id', m{1}, 'lines', {{}});
    else
      current.lines{end+1} = lines{k};
    end
  end
  cells = flush(cells, current);
end

function cells = flush(cells, current)
  code = strjoin(current.lines, sprintf('\n'));
  code = regexprep(code, '(^|\n)\s*clear\s*;', '$1');
  code = regexprep(code, '(^|\n)\s*clc\s*;', '$1');
  if isempty(regexprep(code, '\s|%[^\n]*', '')), return; end   % comments only
  id = current.id;
  if any(strcmp({cells.id}, id)), id = sprintf('%s#%d', id, numel(cells) + 1); end
  cells(end+1) = struct('id', id, 'code', code);
end
