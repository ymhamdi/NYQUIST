function varargout = nyq_sl(cmd, varargin)
% NYQ_SL  Stand-in for the Simulink API under GNU Octave, for tests only.
% It records the blocks and lines that build_models.m creates, checks them
% (library paths, parameter names and values, port numbers, every input
% driven exactly once, no algebraic loop) and simulates the diagram with a
% fixed step: exact zero-order-hold discretization of each linear block,
% run at MaxStep and MaxStep/2, combined by Richardson extrapolation.
% Never put this folder on the MATLAB path: the real Simulink is used there.

  persistent M
  if isempty(M)
    M = struct();
  end
  switch cmd
    case 'new'
      name = varargin{1};
      if isfield(M, name)
        error('nyq_sl:exists', 'model %s is already loaded', name);
      end
      M.(name) = struct('params', struct(), 'blocks', {{}}, 'lines', zeros(0, 4));
    case 'loaded'
      varargout{1} = isfield(M, varargin{1});
    case 'close'
      if isfield(M, varargin{1})
        M = rmfield(M, varargin{1});
      end
    case 'set'
      name = model_of(M, varargin{1});
      kv = varargin(2:end);
      allowed = {'StopTime', 'Solver', 'MaxStep', 'RelTol', 'AbsTol'};
      for i = 1:2:numel(kv)
        if ~any(strcmp(kv{i}, allowed))
          error('nyq_sl:param', 'model parameter %s is not handled', kv{i});
        end
        if ~ischar(kv{i + 1})
          error('nyq_sl:value', 'set_param needs text values (%s)', kv{i});
        end
        M.(name).params.(kv{i}) = kv{i + 1};
      end
    case 'block'
      [lib, path] = varargin{1:2};
      slash = find(path == '/', 1);
      name = model_of(M, path(1:slash - 1));
      bname = path(slash + 1:end);
      spec = library(lib);
      prm = spec.defaults;
      kv = varargin(3:end);
      for i = 1:2:numel(kv)
        key = kv{i};
        if any(strcmp(key, {'Position', 'Orientation'}))
          continue
        end
        if ~isfield(spec.defaults, key)
          error('nyq_sl:param', '%s: block "%s" has no parameter %s', path, lib, key);
        end
        if ~ischar(kv{i + 1})
          error('nyq_sl:value', '%s: parameter %s must be text', path, key);
        end
        prm.(key) = kv{i + 1};
      end
      for b = 1:numel(M.(name).blocks)
        if strcmp(M.(name).blocks{b}.name, bname)
          error('nyq_sl:exists', 'block %s already exists', path);
        end
      end
      [nin, nout] = ports(spec.type, prm);
      M.(name).blocks{end + 1} = struct('name', bname, 'lib', lib, 'type', spec.type, 'prm', prm, 'nin', nin, 'nout', nout);
    case 'line'
      name = model_of(M, varargin{1});
      opts = varargin(4:end);
      for i = 1:2:numel(opts)
        if ~strcmpi(opts{i}, 'autorouting')
          error('nyq_sl:param', 'add_line option %s is not handled', opts{i});
        end
      end
      [s, sp] = port_ref(M.(name).blocks, varargin{2}, 'out');
      [d, dp] = port_ref(M.(name).blocks, varargin{3}, 'in');
      L = M.(name).lines;
      if any(L(:, 3) == d & L(:, 4) == dp)
        error('nyq_sl:driven', 'input %s is already driven', varargin{3});
      end
      M.(name).lines(end + 1, :) = [s sp d dp];
    case 'validate'
      validate(M.(model_of(M, varargin{1})), varargin{1});
      varargout{1} = true;
    case 'sim'
      name = model_of(M, varargin{1});
      mdl = M.(name);
      validate(mdl, name);
      varargout{1} = simulate(mdl);
    case 'blocks'
      varargout{1} = M.(model_of(M, varargin{1})).blocks;
    otherwise
      error('nyq_sl:cmd', 'unknown command %s', cmd);
  end
end

function name = model_of(M, name)
  if ~isfield(M, name)
    error('nyq_sl:model', 'model %s is not loaded', name);
  end
end

function spec = library(lib)
  % Simulink library paths with their default parameters (R2020a+ defaults).
  switch lib
    case 'simulink/Sources/Step'
      spec = struct('type', 'step', 'defaults', struct('Time', '1', 'Before', '0', 'After', '1', 'SampleTime', '0'));
    case 'simulink/Sources/Sine Wave'
      spec = struct('type', 'sine', 'defaults', struct('Amplitude', '1', 'Bias', '0', 'Frequency', '1', 'Phase', '0', 'SampleTime', '0'));
    case 'simulink/Sources/Constant'
      spec = struct('type', 'const', 'defaults', struct('Value', '1'));
    case 'simulink/Math Operations/Sum'
      spec = struct('type', 'sum', 'defaults', struct('Inputs', '|++', 'IconShape', 'round'));
    case 'simulink/Math Operations/Gain'
      spec = struct('type', 'gain', 'defaults', struct('Gain', '1'));
    case 'simulink/Continuous/Transfer Fcn'
      spec = struct('type', 'lin', 'defaults', struct('Numerator', '[1]', 'Denominator', '[1 1]'));
    case 'simulink/Continuous/Zero-Pole'
      spec = struct('type', 'lin', 'defaults', struct('Zeros', '[1]', 'Poles', '[0 -1]', 'Gain', '[1]'));
    case 'simulink/Continuous/Integrator'
      spec = struct('type', 'lin', 'defaults', struct('InitialCondition', '0'));
    case 'simulink/Continuous/Derivative'
      spec = struct('type', 'der', 'defaults', struct());
    case 'simulink/Continuous/PID Controller'
      spec = struct('type', 'lin', 'defaults', struct('P', '1', 'I', '1', 'D', '0', 'N', '100', 'Controller', 'PID', 'Form', 'Parallel'));
    case 'simulink/Discrete/Zero-Order Hold'
      spec = struct('type', 'zoh', 'defaults', struct('SampleTime', '-1'));
    case 'simulink/Signal Routing/Mux'
      spec = struct('type', 'mux', 'defaults', struct('Inputs', '2'));
    case 'simulink/Sinks/Scope'
      spec = struct('type', 'scope', 'defaults', struct('NumInputPorts', '1'));
    case 'simulink/Sinks/To Workspace'
      spec = struct('type', 'tows', 'defaults', struct('VariableName', 'simout', 'SaveFormat', 'Timeseries', 'SampleTime', '-1'));
    otherwise
      error('nyq_sl:library', 'unknown library block "%s"', lib);
  end
end

function s = signs(inputs)
  if all(isstrprop(inputs, 'digit'))
    s = repmat('+', 1, str2double(inputs));
  else
    s = inputs(inputs == '+' | inputs == '-');
  end
end

function [nin, nout] = ports(type, prm)
  switch type
    case {'step', 'sine', 'const'}
      nin = 0; nout = 1;
    case 'sum'
      nin = numel(signs(prm.Inputs)); nout = 1;
    case 'mux'
      nin = str2double(prm.Inputs); nout = 1;
    case 'scope'
      nin = str2double(prm.NumInputPorts); nout = 0;
    case 'tows'
      nin = 1; nout = 0;
    otherwise
      nin = 1; nout = 1;
  end
end

function [b, p] = port_ref(blocks, ref, dir)
  slash = find(ref == '/', 1, 'last');
  bname = ref(1:slash - 1);
  p = str2double(ref(slash + 1:end));
  b = find(cellfun(@(x) strcmp(x.name, bname), blocks));
  if isempty(b)
    error('nyq_sl:block', 'no block named "%s"', bname);
  end
  if strcmp(dir, 'out')
    n = blocks{b}.nout;
  else
    n = blocks{b}.nin;
  end
  if ~(p >= 1 && p <= n && p == round(p))
    error('nyq_sl:port', '%s: block "%s" has %d %sput port(s)', ref, bname, n, dir);
  end
end

function validate(mdl, name)
  for f = {'StopTime', 'MaxStep'}
    if ~isfield(mdl.params, f{1})
      error('nyq_sl:param', '%s: %s is not set', name, f{1});
    end
  end
  L = mdl.lines;
  for b = 1:numel(mdl.blocks)
    blk = mdl.blocks{b};
    for p = 1:blk.nin
      if ~any(L(:, 3) == b & L(:, 4) == p)
        error('nyq_sl:open', '%s: input %d of "%s" is not connected', name, p, blk.name);
      end
    end
    for p = 1:blk.nout
      if ~any(L(:, 1) == b & L(:, 2) == p)
        error('nyq_sl:open', '%s: output %d of "%s" is not used', name, p, blk.name);
      end
    end
    if strcmp(blk.type, 'tows') && ~strcmp(blk.prm.SaveFormat, 'Structure With Time')
      error('nyq_sl:format', '%s: the stand-in returns "Structure With Time" only', blk.name);
    end
  end
end

function out = simulate(mdl)
  T = str2double(mdl.params.StopTime);
  h = str2double(mdl.params.MaxStep);
  coarse = run(mdl, h, T);
  fine = run(mdl, h/2, T);
  data = struct();
  for f = fieldnames(coarse).'
    c = coarse.(f{1});
    g = fine.(f{1});
    n = min(numel(c.t), numel(g.t));
    if max(abs(c.t(1:n) - g.t(1:n))) > 1e-9
      error('nyq_sl:grid', 'logging grids differ for %s', f{1});
    end
    data.(f{1}) = struct('time', c.t(1:n), 'signals', struct('values', 2*g.y(1:n) - c.y(1:n)));
  end
  out.get = @(v) data.(v);
end

function logs = run(mdl, dt, T)
  blocks = mdl.blocks;
  nb = numel(blocks);
  L = mdl.lines;
  % input sources of each block: src(b){port} = source block index
  src = cell(nb, 1);
  for b = 1:nb
    src{b} = zeros(1, blocks{b}.nin);
  end
  for i = 1:size(L, 1)
    src{L(i, 3)}(L(i, 4)) = L(i, 1);
  end
  % numeric form of every block
  B = cell(nb, 1);
  feed = true(nb, 1);
  for b = 1:nb
    blk = blocks{b};
    p = blk.prm;
    e = struct('type', blk.type);
    switch blk.type
      case 'step'
        e.time = str2num(p.Time); e.before = str2num(p.Before); e.after = str2num(p.After); %#ok<ST2NM>
      case 'sine'
        e.a = str2num(p.Amplitude); e.bias = str2num(p.Bias); e.w = str2num(p.Frequency); e.ph = str2num(p.Phase); %#ok<ST2NM>
      case 'const'
        e.v = str2num(p.Value); %#ok<ST2NM>
      case 'sum'
        e.s = 2*(signs(p.Inputs) == '+') - 1;
      case 'gain'
        e.k = str2num(p.Gain); %#ok<ST2NM>
      case 'lin'
        [A, Bm, C, D, x0] = linear(blk);
        n = size(A, 1);
        E = expm([A Bm; zeros(1, n + 1)]*dt);
        e.Ad = E(1:n, 1:n); e.Bd = E(1:n, n + 1); e.C = C; e.D = D; e.x = x0;
        feed(b) = any(D(:) ~= 0);
      case 'zoh'
        e.Ts = str2num(p.SampleTime); e.held = 0; %#ok<ST2NM>
        if ~(e.Ts > 0)
          error('nyq_sl:zoh', '%s: set an explicit sample time', blk.name);
        end
      case 'der'
        e.prev = [];
      case 'tows'
        e.Ts = str2num(p.SampleTime); e.var = p.VariableName; e.t = []; e.y = []; %#ok<ST2NM>
    end
    B{b} = e;
  end
  order = topo(nb, L, feed);
  ns = round(T/dt);
  hit = @(t, Ts) abs(t/Ts - round(t/Ts)) < 1e-6;
  y = cell(nb, 1);
  for k = 0:ns
    t = k*dt;
    for b = 1:nb
      if strcmp(B{b}.type, 'lin') && ~feed(b)
        y{b} = B{b}.C*B{b}.x;
      end
    end
    for b = order
      e = B{b};
      if strcmp(e.type, 'lin') && ~feed(b)
        continue
      end
      u = cell(1, numel(src{b}));
      for q = 1:numel(src{b})
        u{q} = y{src{b}(q)};
      end
      switch e.type
        case 'step'
          if t >= e.time - 1e-9*max(1, abs(e.time))
            y{b} = e.after;
          else
            y{b} = e.before;
          end
        case 'sine'
          y{b} = e.bias + e.a*sin(e.w*t + e.ph);
        case 'const'
          y{b} = e.v;
        case 'sum'
          acc = 0;
          for q = 1:numel(u)
            acc = acc + e.s(q)*u{q};
          end
          y{b} = acc;
        case 'gain'
          y{b} = e.k*u{1};
        case 'lin'
          y{b} = e.C*e.x + e.D*u{1};
        case 'zoh'
          if hit(t, e.Ts)
            B{b}.held = u{1};
          end
          y{b} = B{b}.held;
        case 'der'
          if isempty(e.prev)
            y{b} = 0*u{1};
          else
            y{b} = (u{1} - e.prev)/dt;
          end
        case 'mux'
          y{b} = vertcat(u{:});
        case 'tows'
          if e.Ts <= 0 || hit(t, e.Ts)
            B{b}.t(end + 1, 1) = t;
            B{b}.y(end + 1, 1) = u{1};
          end
      end
    end
    for b = 1:nb
      switch B{b}.type
        case 'lin'
          B{b}.x = B{b}.Ad*B{b}.x + B{b}.Bd*y{src{b}(1)};
        case 'der'
          B{b}.prev = y{src{b}(1)};
      end
    end
  end
  logs = struct();
  for b = 1:nb
    if strcmp(B{b}.type, 'tows')
      logs.(B{b}.var) = struct('t', B{b}.t, 'y', B{b}.y);
    end
  end
end

function [A, Bm, C, D, x0] = linear(blk)
  p = blk.prm;
  x0 = [];
  switch blk.lib
    case 'simulink/Continuous/Transfer Fcn'
      sys = ss(tf(str2num(p.Numerator), str2num(p.Denominator))); %#ok<ST2NM>
    case 'simulink/Continuous/Zero-Pole'
      sys = ss(zpk(str2num(p.Zeros), str2num(p.Poles), str2num(p.Gain))); %#ok<ST2NM>
    case 'simulink/Continuous/Integrator'
      sys = ss(0, 1, 1, 0);
      x0 = str2num(p.InitialCondition); %#ok<ST2NM>
    case 'simulink/Continuous/PID Controller'
      if ~strcmp(p.Form, 'Parallel') || ~strcmp(p.Controller, 'PID')
        error('nyq_sl:pid', 'only the parallel PID form is simulated');
      end
      P = str2num(p.P); I = str2num(p.I); Dg = str2num(p.D); N = str2num(p.N); %#ok<ST2NM>
      % parallel form: P + I/s + D*N*s/(s + N), states kept even for zero gains
      sys = ss([0 0; 0 -N], [1; 1], [I -Dg*N^2], P + Dg*N);
  end
  [A, Bm, C, D] = ssdata(sys);
  if isempty(x0)
    x0 = zeros(size(A, 1), 1);
  end
end

function order = topo(nb, L, feed)
  % Execution order: an edge s -> d matters only when d has direct feedthrough.
  indeg = zeros(1, nb);
  adj = cell(nb, 1);
  for i = 1:size(L, 1)
    s = L(i, 1);
    d = L(i, 3);
    if feed(d)
      adj{s}(end + 1) = d;
      indeg(d) = indeg(d) + 1;
    end
  end
  order = [];
  ready = find(indeg == 0);
  while ~isempty(ready)
    b = ready(1);
    ready(1) = [];
    order(end + 1) = b; %#ok<AGROW>
    for d = adj{b}
      indeg(d) = indeg(d) - 1;
      if indeg(d) == 0
        ready(end + 1) = d; %#ok<AGROW>
      end
    end
  end
  if numel(order) < nb
    error('nyq_sl:loop', 'algebraic loop: every loop needs a block without direct feedthrough');
  end
end
