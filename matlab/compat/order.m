function n = order(sys)
% ORDER  Octave shim of MATLAB's order: number of states of a state-space
% model, degree of the denominator of a SISO transfer function.
  if isa(sys, 'ss')
    n = size(get(sys, 'a'), 1);
    return
  end
  [~, den] = tfdata(sys, 'v');
  k = find(den ~= 0, 1);
  n = numel(den) - k;
end
