function h = add_line(model, from, to, varargin)
% Stand-in for Simulink (tests under Octave only): see nyq_sl.m.
  nyq_sl('line', model, from, to, varargin{:});
  h = 1;
end
