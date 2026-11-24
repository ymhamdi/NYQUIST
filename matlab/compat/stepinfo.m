function S = stepinfo(varargin)
% STEPINFO  Octave shim of MATLAB's stepinfo (definitions of MATLAB R2021a+).
%
% Only added to the path under GNU Octave (which has no stepinfo); MATLAB
% always uses its own. Supported calls:
%   S = stepinfo(sys)                      SISO model, step of amplitude 1
%   S = stepinfo(y, t)                     response data (yfinal = y(end), yinit = 0)
%   S = stepinfo(y, t, yfinal)
%   S = stepinfo(y, t, yfinal, yinit)
%   ... , 'SettlingTimeThreshold', st, 'RiseTimeLimits', [lo hi]
%
% Definitions (R2021a+ documentation):
%   SettlingTime  first T such that |y - yfinal| <= st*|yfinal - yinit| for t >= T
%   TransientTime first T such that |y - yfinal| <= st*max|y - yfinal|  for t >= T
%                 (this was SettlingTime up to R2020b)
%   RiseTime      time from lo to hi of (yfinal - yinit)
%   Overshoot     100*(max(y) - yfinal)/(yfinal - yinit), >= 0
%   Undershoot    100*max(0, -min(y - yinit)/(yfinal - yinit))
%   Peak, PeakTime: max |y| and when it occurs
%   SettlingMin/Max: min/max of y once the response has risen
% Continuous data are interpolated linearly between samples; for a
% discrete-time model the times are sample instants (no interpolation).

  st = 0.02; rl = [0.1 0.9];
  args = varargin;
  k = 1;
  while k <= numel(args)
    if ischar(args{k})
      switch lower(args{k})
        case 'settlingtimethreshold', st = args{k+1};
        case 'risetimelimits',        rl = args{k+1};
        otherwise, error('stepinfo: unknown option %s', args{k});
      end
      args(k:k+1) = [];
    else
      k = k + 1;
    end
  end

  discrete = false;
  if isa(args{1}, 'lti')
    sys = args{1};
    Ts = get(sys, 'tsam');
    discrete = Ts > 0;
    yinit = 0;
    if ~isstable(sys)
      S = nan_info();
      return
    end
    yfinal = dcgain(sys);
    [t, y] = simulate_step(sys, Ts);
  else
    y = args{1}(:); t = args{2}(:);
    if numel(args) >= 3, yfinal = args{3}; else, yfinal = y(end); end
    if numel(args) >= 4, yinit = args{4}; else, yinit = 0; end
  end

  span = yfinal - yinit;
  S = nan_info();
  [pk, ipk] = max(abs(y));
  S.Peak = pk; S.PeakTime = t(ipk);
  if span == 0 || ~isfinite(span)
    return
  end
  yn = (y - yinit) / span;              % normalized: 0 -> 1

  % rise time
  t_lo = cross_time(t, yn, rl(1), discrete);
  t_hi = cross_time(t, yn, rl(2), discrete);
  S.RiseTime = t_hi - t_lo;

  % settling time (R2021a+) and transient time (peak-error based)
  err = abs(y - yfinal);
  S.SettlingTime  = band_time(t, err, st * abs(span), discrete);
  S.TransientTime = band_time(t, err, st * max(err), discrete);

  S.Overshoot  = max(0, 100 * max(yn - 1));
  S.Undershoot = max(0, 100 * max(-yn));
  if isfinite(t_hi)
    after = t >= t_hi;
    S.SettlingMin = min(y(after));
    S.SettlingMax = max(y(after));
  end
end

function S = nan_info()
  S = struct('RiseTime', NaN, 'TransientTime', NaN, 'SettlingTime', NaN, ...
             'SettlingMin', NaN, 'SettlingMax', NaN, 'Overshoot', NaN, ...
             'Undershoot', NaN, 'Peak', NaN, 'PeakTime', NaN);
end

function tc = cross_time(t, yn, level, discrete)
  % first time the normalized response reaches `level`
  i = find(yn >= level, 1);
  if isempty(i), tc = NaN; return; end
  if i == 1 || discrete, tc = t(i); return; end
  tc = t(i-1) + (level - yn(i-1)) / (yn(i) - yn(i-1)) * (t(i) - t(i-1));
end

function ts = band_time(t, err, band, discrete)
  % first time after which err stays <= band
  k = find(err > band, 1, 'last');
  if isempty(k), ts = t(1); return; end
  if k == numel(t), ts = NaN; return; end          % not settled in the window
  if discrete, ts = t(k+1); return; end
  ts = t(k) + (err(k) - band) / (err(k) - err(k+1)) * (t(k+1) - t(k));
end

function [t, y] = simulate_step(sys, Ts)
  % long enough to settle: 15 time constants of the slowest pole
  p = pole(sys);
  if Ts > 0
    r = abs(p); r = r(r > 0);
    if isempty(r), nmax = 50; else, nmax = ceil(15 / max(-log(max(r)), 1e-6)); end
    nmax = min(max(nmax, 50), 1e5);
    t = (0:nmax)' * Ts;
  else
    re = abs(real(p)); re = re(re > 0);
    if isempty(re), tf_ = 10; else, tf_ = 15 / min(re); end
    fast = max([abs(p); 1]);
    n = min(max(ceil(tf_ * fast * 20), 20001), 400001);   % resolve the fastest pole
    t = linspace(0, tf_, n)';
  end
  [y, t] = step(sys, t);
  y = y(:); t = t(:);
end
