function add_block(lib, path, varargin)
% Stand-in for Simulink (tests under Octave only): see nyq_sl.m.
  nyq_sl('block', lib, path, varargin{:});
end
