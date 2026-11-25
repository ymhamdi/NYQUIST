function out = sim(name, varargin)
% Stand-in for Simulink (tests under Octave only): see nyq_sl.m.
  if ~(numel(varargin) == 2 && strcmp(varargin{1}, 'ReturnWorkspaceOutputs') && strcmp(varargin{2}, 'on'))
    error('nyq_sl:sim', 'call sim(model, ''ReturnWorkspaceOutputs'', ''on'')');
  end
  out = nyq_sl('sim', name);
end
