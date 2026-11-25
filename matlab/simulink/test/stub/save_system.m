function save_system(name, file)
% Stand-in for Simulink (tests under Octave only): validates the model, writes nothing.
  nyq_sl('validate', name);
end
