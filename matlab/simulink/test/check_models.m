function check_models()
% CHECK_MODELS  CI test under GNU Octave: runs build_models.m against the
% Simulink stand-in (test/stub) and fails if a model is mis-wired or if its
% simulated output differs from the tf/step/lsim calculation.
% In MATLAB, run build_models itself: it uses the real Simulink.

  here = fileparts(mfilename('fullpath'));
  pkg load control
  addpath(fullfile(here, 'stub'));
  addpath(fileparts(here));
  bilan = build_models(true);
  rmpath(fullfile(here, 'stub'));
  if isempty(bilan) || ~all([bilan.conforme])
    error('check_models:ecart', 'at least one Simulink model differs from its calculation');
  end
  printf('check_models: %d signals in %d models match their calculation\n', numel(bilan), numel(unique({bilan.modele})));
end
