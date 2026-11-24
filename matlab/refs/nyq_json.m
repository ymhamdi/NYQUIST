function s = nyq_json(v)
% NYQ_JSON  Deterministic JSON encoding for the reference files.
%   numbers   12 significant digits; |x| < 1e-12 written as 0 (round-off
%             noise would otherwise differ between machines);
%             NaN / Inf written as the strings "NaN", "Infinity", "-Infinity"
%   complex   {"re": ..., "im": ...}
%   tf / ss   {"class": "tf", "num", "den", "Ts"} / {"class": "ss", "A", "B", "C", "D", "Ts"}
%   struct    object (struct array -> list of objects)
%   cell      {name, value; ...} pairs (n x 2) -> object, otherwise list
%   others    (handles, function handles…) -> null
% Arrays larger than 20000 elements are replaced by {"skipped": n}.

  if ischar(v)
    s = ['"' esc(v) '"'];
  elseif isa(v, 'lti')
    s = lti_json(v);
  elseif isstruct(v)
    if numel(v) == 1
      f = fieldnames(v);
      parts = cellfun(@(k) sprintf('"%s": %s', k, nyq_json(v.(k))), f, 'UniformOutput', false);
      s = ['{' strjoin(parts.', ', ') '}'];
    else
      parts = arrayfun(@(e) nyq_json(e), v(:).', 'UniformOutput', false);
      s = ['[' strjoin(parts, ', ') ']'];
    end
  elseif iscell(v)
    if size(v, 2) == 2 && all(cellfun(@ischar, v(:, 1)))
      parts = cell(1, size(v, 1));
      for k = 1:size(v, 1)
        parts{k} = sprintf('%s: %s', nyq_json(v{k, 1}), nyq_json(v{k, 2}));
      end
      s = ['{' strjoin(parts, sprintf(',\n')) '}'];
    else
      parts = cellfun(@nyq_json, v(:).', 'UniformOutput', false);
      s = ['[' strjoin(parts, ', ') ']'];
    end
  elseif islogical(v) || isnumeric(v)
    if numel(v) > 20000
      s = sprintf('{"skipped": %d}', numel(v));
    elseif ~isreal(v)
      s = sprintf('{"re": %s, "im": %s}', arr(real(double(v))), arr(imag(double(v))));
    elseif islogical(v)
      s = arr(double(v), true);
    else
      s = arr(double(v));
    end
  else
    s = 'null';
  end
end

function s = arr(x, logic)
  if nargin < 2, logic = false; end
  if isscalar(x), s = num(x, logic); return; end
  if isempty(x), s = '[]'; return; end
  if isvector(x)
    parts = arrayfun(@(e) num(e, logic), x(:).', 'UniformOutput', false);
    s = ['[' strjoin(parts, ', ') ']'];
    return
  end
  rows = cell(1, size(x, 1));
  for r = 1:size(x, 1)
    rows{r} = arr(x(r, :), logic);
    if isscalar(x(r, :)), rows{r} = ['[' rows{r} ']']; end
  end
  s = ['[' strjoin(rows, ', ') ']'];
end

function s = num(x, logic)
  if logic, if x, s = 'true'; else, s = 'false'; end, return; end
  if isnan(x), s = '"NaN"';
  elseif isinf(x), if x > 0, s = '"Infinity"'; else, s = '"-Infinity"'; end
  elseif abs(x) < 1e-12, s = '0';
  else, s = sprintf('%.12g', x);
  end
end

function s = lti_json(sys)
  Ts = get(sys, 'tsam');
  if isa(sys, 'ss')
    [A, B, C, D] = ssdata(sys);
    s = sprintf('{"class": "ss", "A": %s, "B": %s, "C": %s, "D": %s, "Ts": %s}', ...
                arr(A), arr(B), arr(C), arr(D), num(Ts, false));
  else
    [n, d] = tfdata(sys, 'v');
    s = sprintf('{"class": "tf", "num": %s, "den": %s, "Ts": %s}', ...
                arr(n(:).'), arr(d(:).'), num(Ts, false));
  end
end

function t = esc(t)
  t = strrep(t, '\', '\\');
  t = strrep(t, '"', '\"');
  t = strrep(t, sprintf('\n'), '\n');
  t = strrep(t, sprintf('\t'), '\t');
end
