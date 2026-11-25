function loaded = bdIsLoaded(name)
% Stand-in for Simulink (tests under Octave only): see nyq_sl.m.
  loaded = nyq_sl('loaded', name);
end
