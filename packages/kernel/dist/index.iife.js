this.au = this.au || {};
this.au.kernel = (function (exports) {
  'use strict';

  // tslint:disable-next-line:no-redundant-jump
  function $noop() { return; }
  const $global = (function () {
      // https://github.com/Microsoft/tslint-microsoft-contrib/issues/415
      // tslint:disable:no-typeof-undefined
      if (typeof global !== 'undefined') {
          return global;
      }
      if (typeof self !== 'undefined') {
          return self;
      }
      if (typeof window !== 'undefined') {
          return window;
      }
      // tslint:enable:no-typeof-undefined
      try {
          // Not all environments allow eval and Function. Use only as a last resort:
          // tslint:disable-next-line:no-function-constructor-with-string-args function-constructor
          return new Function('return this')();
      }
      catch (_a) {
          // If all fails, give up and create an object.
          // tslint:disable-next-line:no-object-literal-type-assertion
          return {};
      }
  })();
  // performance.now polyfill for non-browser envs based on https://github.com/myrne/performance-now
  const $now = (function () {
      let getNanoSeconds;
      let hrtime;
      let moduleLoadTime;
      let nodeLoadTime;
      let upTime;
      if (($global.performance !== undefined && $global.performance !== null) && $global.performance.now) {
          const $performance = $global.performance;
          return function () {
              return $performance.now();
          };
      }
      else if (($global.process !== undefined && $global.process !== null) && $global.process.hrtime) {
          const now = function () {
              return (getNanoSeconds() - nodeLoadTime) / 1e6;
          };
          hrtime = $global.process.hrtime;
          getNanoSeconds = function () {
              let hr;
              hr = hrtime();
              return hr[0] * 1e9 + hr[1];
          };
          moduleLoadTime = getNanoSeconds();
          upTime = $global.process.uptime() * 1e9;
          nodeLoadTime = moduleLoadTime - upTime;
          return now;
      }
  })();
  // performance.mark / measure polyfill based on https://github.com/blackswanny/performance-polyfill
  // note: this is NOT intended to be a polyfill for browsers that don't support it; it's just for NodeJS
  // TODO: probably want to move environment-specific logic to the appropriate runtime (e.g. the NodeJS polyfill
  // to runtime-html-jsdom)
  const { $mark, $measure, $getEntriesByName, $getEntriesByType, $clearMarks, $clearMeasures } = (function () {
      if ($global.performance !== undefined &&
          $global.performance !== null &&
          $global.performance.mark &&
          $global.performance.measure &&
          $global.performance.getEntriesByName &&
          $global.performance.getEntriesByType &&
          $global.performance.clearMarks &&
          $global.performance.clearMeasures) {
          const $performance = $global.performance;
          return {
              $mark: function (name) {
                  $performance.mark(name);
              },
              $measure: function (name, start, end) {
                  $performance.measure(name, start, end);
              },
              $getEntriesByName: function (name) {
                  return $performance.getEntriesByName(name);
              },
              $getEntriesByType: function (type) {
                  return $performance.getEntriesByType(type);
              },
              $clearMarks: function (name) {
                  $performance.clearMarks(name);
              },
              $clearMeasures: function (name) {
                  $performance.clearMeasures(name);
              }
          };
      }
      else if ($global.process !== undefined && $global.process !== null && $global.process.hrtime) {
          const entries = [];
          const marksIndex = {};
          const filterEntries = function (key, value) {
              let i = 0;
              const n = entries.length;
              const result = [];
              for (; i < n; i++) {
                  if (entries[i][key] === value) {
                      result.push(entries[i]);
                  }
              }
              return result;
          };
          const clearEntries = function (type, name) {
              let i = entries.length;
              let entry;
              while (i--) {
                  entry = entries[i];
                  if (entry.entryType === type && (name === void 0 || entry.name === name)) {
                      entries.splice(i, 1);
                  }
              }
          };
          return {
              $mark: function (name) {
                  const mark = {
                      name,
                      entryType: 'mark',
                      startTime: $now(),
                      duration: 0
                  };
                  entries.push(mark);
                  marksIndex[name] = mark;
              },
              $measure: function (name, startMark, endMark) {
                  let startTime;
                  let endTime;
                  if (endMark !== undefined && marksIndex[endMark] === undefined) {
                      throw new SyntaxError(`Failed to execute 'measure' on 'Performance': The mark '${endMark}' does not exist.`);
                  }
                  if (startMark !== undefined && marksIndex[startMark] === undefined) {
                      throw new SyntaxError(`Failed to execute 'measure' on 'Performance': The mark '${startMark}' does not exist.`);
                  }
                  if (marksIndex[startMark]) {
                      startTime = marksIndex[startMark].startTime;
                  }
                  else {
                      startTime = 0;
                  }
                  if (marksIndex[endMark]) {
                      endTime = marksIndex[endMark].startTime;
                  }
                  else {
                      endTime = $now();
                  }
                  entries.push({
                      name,
                      entryType: 'measure',
                      startTime,
                      duration: endTime - startTime
                  });
              },
              $getEntriesByName: function (name) {
                  return filterEntries('name', name);
              },
              $getEntriesByType: function (type) {
                  return filterEntries('entryType', type);
              },
              $clearMarks: function (name) {
                  clearEntries('mark', name);
              },
              $clearMeasures: function (name) {
                  clearEntries('measure', name);
              }
          };
      }
  })();
  // RAF polyfill for non-browser envs from https://github.com/chrisdickinson/raf/blob/master/index.js
  const { $raf, $caf } = (function () {
      const vendors = ['moz', 'webkit'];
      const suffix = 'AnimationFrame';
      let raf = $global[`request${suffix}`];
      let caf = $global[`cancel${suffix}`] || $global[`cancelRequest${suffix}`];
      for (let i = 0; !raf && i < vendors.length; ++i) {
          raf = $global[`${vendors[i]}Request${suffix}`];
          caf = $global[`${vendors[i]}Cancel${suffix}`] || $global[`${vendors[i]}CancelRequest${suffix}`];
      }
      // Some versions of FF have rAF but not cAF
      if (!raf || !caf) {
          let last = 0;
          let id = 0;
          const queue = [];
          const frameDuration = 1000 / 60;
          raf = function (callback) {
              let _now;
              let next;
              if (queue.length === 0) {
                  _now = $now();
                  next = Math.max(0, frameDuration - (_now - last));
                  last = next + _now;
                  setTimeout(function () {
                      const cp = queue.slice(0);
                      // Clear queue here to prevent callbacks from appending listeners to the current frame's queue
                      queue.length = 0;
                      for (let i = 0; i < cp.length; ++i) {
                          if (!cp[i].cancelled) {
                              try {
                                  cp[i].callback(last);
                              }
                              catch (e) {
                                  setTimeout(function () { throw e; }, 0);
                              }
                          }
                      }
                  }, Math.round(next));
              }
              queue.push({
                  handle: ++id,
                  callback: callback,
                  cancelled: false
              });
              return id;
          };
          caf = function (handle) {
              for (let i = 0; i < queue.length; ++i) {
                  if (queue[i].handle === handle) {
                      queue[i].cancelled = true;
                  }
              }
          };
      }
      const $$raf = function (callback) {
          return raf.call($global, callback);
      };
      $$raf.cancel = function () {
          caf.apply($global, arguments);
      };
      $global.requestAnimationFrame = raf;
      $global.cancelAnimationFrame = caf;
      return { $raf: $$raf, $caf: caf };
  })();
  class Notifier {
      constructor(fn, context = null) {
          this.fn = fn;
          this.context = context;
          this.next = null;
          this.prev = null;
          this.disconnected = false;
      }
      equals(fn, context) {
          return this.fn === fn && this.context === (context === undefined ? null : context);
      }
      notify(frameDelta) {
          if (this.fn !== null) {
              if (this.context !== null) {
                  this.fn.call(this.context, frameDelta);
              }
              else {
                  this.fn(frameDelta);
              }
          }
          const next = this.next;
          if (this.disconnected) {
              this.next = null;
          }
          return next;
      }
      connect(prev) {
          this.prev = prev;
          if (prev.next !== null) {
              prev.next.prev = this;
          }
          this.next = prev.next;
          prev.next = this;
      }
      disconnect(hard = false) {
          this.disconnected = true;
          this.fn = null;
          this.context = null;
          if (this.prev !== null) {
              this.prev.next = this.next;
          }
          if (this.next !== null) {
              this.next.prev = this.prev;
          }
          const next = this.next;
          this.next = hard ? null : next;
          this.prev = null;
          return next;
      }
  }
  class Ticker {
      constructor() {
          this.head = new Notifier(null, null);
          this.requestId = -1;
          this.frameDelta = 1;
          this.lastTime = -1;
          this.started = false;
          this.promise = null;
          this.resolve = $noop;
          this.tick = (deltaTime) => {
              this.requestId = -1;
              if (this.started) {
                  this.update(deltaTime);
                  if (this.started && this.requestId === -1 && this.head.next !== null) {
                      this.requestId = $raf(this.tick);
                  }
              }
              this.resolve(deltaTime);
              this.resolve = $noop;
              this.promise = null;
          };
      }
      add(fn, context) {
          const notifier = new Notifier(fn, context);
          let cur = this.head.next;
          let prev = this.head;
          if (cur === null) {
              notifier.connect(prev);
          }
          else {
              while (cur !== null) {
                  prev = cur;
                  cur = cur.next;
              }
              if (notifier.prev === null) {
                  notifier.connect(prev);
              }
          }
          if (this.started) {
              this.tryRequest();
          }
          else {
              this.start();
          }
          return this;
      }
      remove(fn, context) {
          let notifier = this.head.next;
          while (notifier !== null) {
              if (notifier.equals(fn, context)) {
                  notifier = notifier.disconnect();
              }
              else {
                  notifier = notifier.next;
              }
          }
          if (this.head.next === null) {
              this.tryCancel();
          }
          return this;
      }
      start() {
          if (!this.started) {
              this.started = true;
              this.tryRequest();
          }
      }
      stop() {
          if (this.started) {
              this.started = false;
              this.tryCancel();
          }
      }
      update(currentTime = $now()) {
          let elapsedMS;
          if (currentTime > this.lastTime) {
              elapsedMS = currentTime - this.lastTime;
              // ElapsedMS * 60 / 1000 is to get the frame delta as calculated based on the elapsed time.
              // Adding half a rounding margin to that and performing a double bitwise negate rounds it to the rounding margin which is the nearest
              // 1/1000th of a frame (this algorithm is about twice as fast as Math.round - every CPU cycle counts :)).
              // The rounding is to account for floating point imprecisions in performance.now caused by the browser, and accounts for frame counting mismatch
              // caused by frame delta's like 0.999238239.
              this.frameDelta = (~~(elapsedMS * 60 + 0.5)) / 1000;
              const head = this.head;
              let notifier = head.next;
              while (notifier !== null) {
                  notifier = notifier.notify(this.frameDelta);
              }
              if (head.next === null) {
                  this.tryCancel();
              }
          }
          else {
              this.frameDelta = 0;
          }
          this.lastTime = currentTime;
      }
      waitForNextTick() {
          if (this.promise === null) {
              // tslint:disable-next-line:promise-must-complete
              this.promise = new Promise(resolve => {
                  this.resolve = resolve;
              });
          }
          return this.promise;
      }
      tryRequest() {
          if (this.requestId === -1 && this.head.next !== null) {
              this.lastTime = $now();
              this.requestId = $raf(this.tick);
          }
      }
      tryCancel() {
          if (this.requestId !== -1) {
              $caf(this.requestId);
              this.requestId = -1;
          }
      }
  }
  const camelCaseLookup = {};
  const kebabCaseLookup = {};
  const PLATFORM = {
      global: $global,
      ticker: new Ticker(),
      emptyArray: Object.freeze([]),
      emptyObject: Object.freeze({}),
      noop: $noop,
      now: $now,
      mark: $mark,
      measure: $measure,
      getEntriesByName: $getEntriesByName,
      getEntriesByType: $getEntriesByType,
      clearMarks: $clearMarks,
      clearMeasures: $clearMeasures,
      camelCase(input) {
          // benchmark: http://jsben.ch/qIz4Z
          let value = camelCaseLookup[input];
          if (value !== undefined)
              return value;
          value = '';
          let first = true;
          let sep = false;
          let char;
          for (let i = 0, ii = input.length; i < ii; ++i) {
              char = input.charAt(i);
              if (char === '-' || char === '.' || char === '_') {
                  sep = true; // skip separators
              }
              else {
                  value = value + (first ? char.toLowerCase() : (sep ? char.toUpperCase() : char));
                  sep = false;
              }
              first = false;
          }
          return camelCaseLookup[input] = value;
      },
      kebabCase(input) {
          // benchmark: http://jsben.ch/v7K9T
          let value = kebabCaseLookup[input];
          if (value !== undefined)
              return value;
          value = '';
          let first = true;
          let char, lower;
          for (let i = 0, ii = input.length; i < ii; ++i) {
              char = input.charAt(i);
              lower = char.toLowerCase();
              value = value + (first ? lower : (char !== lower ? `-${lower}` : lower));
              first = false;
          }
          return kebabCaseLookup[input] = value;
      },
      toArray(input) {
          // benchmark: http://jsben.ch/xjsyF
          const len = input.length;
          const arr = Array(len);
          for (let i = 0; i < len; ++i) {
              arr[i] = input[i];
          }
          return arr;
      },
      requestAnimationFrame(callback) {
          return $raf(callback);
      },
      clearInterval(handle) {
          $global.clearInterval(handle);
      },
      clearTimeout(handle) {
          $global.clearTimeout(handle);
      },
      // tslint:disable-next-line:no-any
      setInterval(handler, timeout, ...args) {
          return $global.setInterval(handler, timeout, ...args);
      },
      // tslint:disable-next-line:no-any
      setTimeout(handler, timeout, ...args) {
          return $global.setTimeout(handler, timeout, ...args);
      }
  };

  const Reporter = {
      write(code, ...params) { return; },
      error(code, ...params) { return new Error(`Code ${code}`); }
  };
  const Tracer = {
      /**
       * A convenience property for the user to conditionally call the tracer.
       * This saves unnecessary `noop` and `slice` calls in non-AOT scenarios even if debugging is disabled.
       * In AOT these calls will simply be removed entirely.
       *
       * This property **only** turns on tracing if `@aurelia/debug` is included and configured as well.
       */
      enabled: false,
      liveLoggingEnabled: false,
      liveWriter: null,
      /**
       * Call this at the start of a method/function.
       * Each call to `enter` **must** have an accompanying call to `leave` for the tracer to work properly.
       * @param objName Any human-friendly name to identify the traced object with.
       * @param methodName Any human-friendly name to identify the traced method with.
       * @param args Pass in `Array.prototype.slice.call(arguments)` to also trace the parameters, or `null` if this is not needed (to save memory/cpu)
       */
      enter(objName, methodName, args) { return; },
      /**
       * Call this at the end of a method/function. Pops one trace item off the stack.
       */
      leave() { return; },
      /**
       * Writes only the trace info leading up to the current method call.
       * @param writer An object to write the output to.
       */
      writeStack(writer) { return; },
      /**
       * Writes all trace info captured since the previous flushAll operation.
       * @param writer An object to write the output to. Can be null to simply reset the tracer state.
       */
      flushAll(writer) { return; },
      enableLiveLogging,
      /**
       * Stops writing out each trace info item as they are traced.
       */
      disableLiveLogging() { return; }
  };
  // tslint:disable-next-line:no-redundant-jump
  function enableLiveLogging(optionsOrWriter) { return; }

  // Shims to augment the Reflect object with methods used from the Reflect Metadata API proposal:
  // https://www.typescriptlang.org/docs/handbook/decorators.html#metadata
  // https://rbuckton.github.io/reflect-metadata/
  // As the official spec proposal uses "any", we use it here as well and suppress related typedef linting warnings.
  // tslint:disable:no-any ban-types
  if (!('getOwnMetadata' in Reflect)) {
      Reflect.getOwnMetadata = function (metadataKey, target) {
          return target[metadataKey];
      };
      Reflect.metadata = function (metadataKey, metadataValue) {
          return function (target) {
              target[metadataKey] = metadataValue;
          };
      };
  }
  function createContainer(...params) {
      if (arguments.length === 0) {
          return new Container();
      }
      else {
          return new Container().register(...params);
      }
  }
  const DI = {
      createContainer,
      getDesignParamTypes(target) {
          return Reflect.getOwnMetadata('design:paramtypes', target) || PLATFORM.emptyArray;
      },
      getDependencies(Type) {
          let dependencies;
          if (Type.inject === undefined) {
              dependencies = DI.getDesignParamTypes(Type);
          }
          else {
              dependencies = [];
              let ctor = Type;
              while (typeof ctor === 'function') {
                  if (ctor.hasOwnProperty('inject')) {
                      dependencies.push(...ctor.inject);
                  }
                  ctor = Object.getPrototypeOf(ctor);
              }
          }
          return dependencies;
      },
      createInterface(friendlyName) {
          const Interface = function (target, property, index) {
              if (target === undefined) {
                  throw Reporter.error(16, Interface.friendlyName, Interface); // TODO: add error (trying to resolve an InterfaceSymbol that has no registrations)
              }
              (target.inject || (target.inject = []))[index] = Interface;
              return target;
          };
          Interface.friendlyName = friendlyName || 'Interface';
          Interface.noDefault = function () {
              return Interface;
          };
          Interface.withDefault = function (configure) {
              Interface.withDefault = function () {
                  throw Reporter.error(17, Interface);
              };
              Interface.register = function (container, key) {
                  const trueKey = key || Interface;
                  return configure({
                      instance(value) {
                          return container.registerResolver(trueKey, new Resolver(trueKey, 0 /* instance */, value));
                      },
                      singleton(value) {
                          return container.registerResolver(trueKey, new Resolver(trueKey, 1 /* singleton */, value));
                      },
                      transient(value) {
                          return container.registerResolver(trueKey, new Resolver(trueKey, 2 /* transient */, value));
                      },
                      callback(value) {
                          return container.registerResolver(trueKey, new Resolver(trueKey, 3 /* callback */, value));
                      },
                      aliasTo(destinationKey) {
                          return container.registerResolver(trueKey, new Resolver(trueKey, 5 /* alias */, destinationKey));
                      },
                  });
              };
              return Interface;
          };
          return Interface;
      },
      inject(...dependencies) {
          return function (target, key, descriptor) {
              if (typeof descriptor === 'number') { // It's a parameter decorator.
                  if (!target.hasOwnProperty('inject')) {
                      const types = DI.getDesignParamTypes(target);
                      target.inject = types.slice();
                  }
                  if (dependencies.length === 1) {
                      target.inject[descriptor] = dependencies[0];
                  }
              }
              else if (key) { // It's a property decorator. Not supported by the container without plugins.
                  const actualTarget = target.constructor;
                  (actualTarget.inject || (actualTarget.inject = {}))[key] = dependencies[0];
              }
              else if (descriptor) { // It's a function decorator (not a Class constructor)
                  const fn = descriptor.value;
                  fn.inject = dependencies;
              }
              else { // It's a class decorator.
                  if (dependencies.length === 0) {
                      const types = DI.getDesignParamTypes(target);
                      target.inject = types.slice();
                  }
                  else {
                      target.inject = dependencies;
                  }
              }
          };
      },
      // tslint:disable:jsdoc-format
      /**
       * Registers the `target` class as a transient dependency; each time the dependency is resolved
       * a new instance will be created.
       *
       * @param target The class / constructor function to register as transient.
       * @returns The same class, with a static `register` method that takes a container and returns the appropriate resolver.
       *
       * Example usage:
    ```ts
    // On an existing class
    class Foo { }
    DI.transient(Foo);
    
    // Inline declaration
    const Foo = DI.transient(class { });
    // Foo is now strongly typed with register
    Foo.register(container);
    ```
       */
      // tslint:enable:jsdoc-format
      transient(target) {
          target.register = function register(container) {
              const registration = Registration.transient(target, target);
              return registration.register(container, target);
          };
          return target;
      },
      // tslint:disable:jsdoc-format
      /**
       * Registers the `target` class as a singleton dependency; the class will only be created once. Each
       * consecutive time the dependency is resolved, the same instance will be returned.
       *
       * @param target The class / constructor function to register as a singleton.
       * @returns The same class, with a static `register` method that takes a container and returns the appropriate resolver.
       * Example usage:
    ```ts
    // On an existing class
    class Foo { }
    DI.singleton(Foo);
    
    // Inline declaration
    const Foo = DI.singleton(class { });
    // Foo is now strongly typed with register
    Foo.register(container);
    ```
       */
      // tslint:enable:jsdoc-format
      singleton(target) {
          target.register = function register(container) {
              const registration = Registration.singleton(target, target);
              return registration.register(container, target);
          };
          return target;
      }
  };
  const IContainer = DI.createInterface('IContainer').noDefault();
  const IServiceLocator = IContainer;
  function createResolver(getter) {
      return function (key) {
          const resolver = function (target, property, descriptor) {
              DI.inject(resolver)(target, property, descriptor);
          };
          resolver.resolve = function (handler, requestor) {
              return getter(key, handler, requestor);
          };
          return resolver;
      };
  }
  const inject = DI.inject;
  function transientDecorator(target) {
      return DI.transient(target);
  }
  function transient(target) {
      return target === undefined ? transientDecorator : transientDecorator(target);
  }
  function singletonDecorator(target) {
      return DI.singleton(target);
  }
  function singleton(target) {
      return target === undefined ? singletonDecorator : singletonDecorator(target);
  }
  const all = createResolver((key, handler, requestor) => requestor.getAll(key));
  const lazy = createResolver((key, handler, requestor) => {
      let instance = null; // cache locally so that lazy always returns the same instance once resolved
      return () => {
          if (instance === null) {
              instance = requestor.get(key);
          }
          return instance;
      };
  });
  const optional = createResolver((key, handler, requestor) => {
      if (requestor.has(key, true)) {
          return requestor.get(key);
      }
      else {
          return null;
      }
  });
  /** @internal */
  var ResolverStrategy;
  (function (ResolverStrategy) {
      ResolverStrategy[ResolverStrategy["instance"] = 0] = "instance";
      ResolverStrategy[ResolverStrategy["singleton"] = 1] = "singleton";
      ResolverStrategy[ResolverStrategy["transient"] = 2] = "transient";
      ResolverStrategy[ResolverStrategy["callback"] = 3] = "callback";
      ResolverStrategy[ResolverStrategy["array"] = 4] = "array";
      ResolverStrategy[ResolverStrategy["alias"] = 5] = "alias";
  })(ResolverStrategy || (ResolverStrategy = {}));
  /** @internal */
  class Resolver {
      constructor(key, strategy, state) {
          this.key = key;
          this.strategy = strategy;
          this.state = state;
      }
      register(container, key) {
          return container.registerResolver(key || this.key, this);
      }
      resolve(handler, requestor) {
          switch (this.strategy) {
              case 0 /* instance */:
                  return this.state;
              case 1 /* singleton */: {
                  this.strategy = 0 /* instance */;
                  const factory = handler.getFactory(this.state);
                  return this.state = factory.construct(handler);
              }
              case 2 /* transient */: {
                  // Always create transients from the requesting container
                  const factory = handler.getFactory(this.state);
                  return factory.construct(requestor);
              }
              case 3 /* callback */:
                  return this.state(handler, requestor, this);
              case 4 /* array */:
                  return this.state[0].resolve(handler, requestor);
              case 5 /* alias */:
                  return handler.get(this.state);
              default:
                  throw Reporter.error(6, this.strategy);
          }
      }
      getFactory(container) {
          switch (this.strategy) {
              case 1 /* singleton */:
              case 2 /* transient */:
                  return container.getFactory(this.state);
              default:
                  return null;
          }
      }
  }
  /** @internal */
  class Factory {
      constructor(Type, invoker, dependencies) {
          this.Type = Type;
          this.invoker = invoker;
          this.dependencies = dependencies;
          this.transformers = null;
      }
      static create(Type) {
          const dependencies = DI.getDependencies(Type);
          const invoker = classInvokers[dependencies.length] || fallbackInvoker;
          return new Factory(Type, invoker, dependencies);
      }
      construct(container, dynamicDependencies) {
          const transformers = this.transformers;
          let instance = dynamicDependencies !== undefined
              ? this.invoker.invokeWithDynamicDependencies(container, this.Type, this.dependencies, dynamicDependencies)
              : this.invoker.invoke(container, this.Type, this.dependencies);
          if (transformers === null) {
              return instance;
          }
          for (let i = 0, ii = transformers.length; i < ii; ++i) {
              instance = transformers[i](instance);
          }
          return instance;
      }
      registerTransformer(transformer) {
          if (this.transformers === null) {
              this.transformers = [];
          }
          this.transformers.push(transformer);
          return true;
      }
  }
  const containerResolver = {
      resolve(handler, requestor) {
          return requestor;
      }
  };
  function isRegistry(obj) {
      return typeof obj.register === 'function';
  }
  function isClass(obj) {
      return obj.prototype !== undefined;
  }
  /** @internal */
  class Container {
      constructor(configuration = {}) {
          this.parent = null;
          this.registerDepth = 0;
          this.resolvers = new Map();
          this.configuration = configuration;
          this.factories = configuration.factories || (configuration.factories = new Map());
          this.resourceLookup = configuration.resourceLookup || (configuration.resourceLookup = Object.create(null));
          this.resolvers.set(IContainer, containerResolver);
      }
      register(...params) {
          if (++this.registerDepth === 100) {
              throw new Error('Unable to autoregister dependency');
              // TODO: change to reporter.error and add various possible causes in description.
              // Most likely cause is trying to register a plain object that does not have a
              // register method and is not a class constructor
          }
          let current;
          let keys;
          let value;
          let j;
          let jj;
          for (let i = 0, ii = params.length; i < ii; ++i) {
              current = params[i];
              if (isRegistry(current)) {
                  current.register(this);
              }
              else if (isClass(current)) {
                  Registration.singleton(current, current).register(this);
              }
              else {
                  keys = Object.keys(current);
                  j = 0;
                  jj = keys.length;
                  for (; j < jj; ++j) {
                      value = current[keys[j]];
                      // note: we could remove this if-branch and call this.register directly
                      // - the extra check is just a perf tweak to create fewer unnecessary arrays by the spread operator
                      if (isRegistry(value)) {
                          value.register(this);
                      }
                      else {
                          this.register(value);
                      }
                  }
              }
          }
          --this.registerDepth;
          return this;
      }
      registerResolver(key, resolver) {
          validateKey(key);
          const resolvers = this.resolvers;
          const result = resolvers.get(key);
          if (result === undefined) {
              resolvers.set(key, resolver);
              if (typeof key === 'string') {
                  this.resourceLookup[key] = resolver;
              }
          }
          else if (result instanceof Resolver && result.strategy === 4 /* array */) {
              result.state.push(resolver);
          }
          else {
              resolvers.set(key, new Resolver(key, 4 /* array */, [result, resolver]));
          }
          return resolver;
      }
      registerTransformer(key, transformer) {
          const resolver = this.getResolver(key);
          if (resolver === null) {
              return false;
          }
          if (resolver.getFactory) {
              const handler = resolver.getFactory(this);
              if (handler === null) {
                  return false;
              }
              return handler.registerTransformer(transformer);
          }
          return false;
      }
      getResolver(key, autoRegister = true) {
          validateKey(key);
          if (key.resolve) {
              return key;
          }
          let current = this;
          let resolver;
          while (current !== null) {
              resolver = current.resolvers.get(key);
              if (resolver === undefined) {
                  if (current.parent === null) {
                      return autoRegister ? this.jitRegister(key, current) : null;
                  }
                  current = current.parent;
              }
              else {
                  return resolver;
              }
          }
          return null;
      }
      has(key, searchAncestors = false) {
          return this.resolvers.has(key)
              ? true
              : searchAncestors && this.parent !== null
                  ? this.parent.has(key, true)
                  : false;
      }
      get(key) {
          validateKey(key);
          if (key.resolve) {
              return key.resolve(this, this);
          }
          let current = this;
          let resolver;
          while (current !== null) {
              resolver = current.resolvers.get(key);
              if (resolver === undefined) {
                  if (current.parent === null) {
                      resolver = this.jitRegister(key, current);
                      return resolver.resolve(current, this);
                  }
                  current = current.parent;
              }
              else {
                  return resolver.resolve(current, this);
              }
          }
      }
      getAll(key) {
          validateKey(key);
          let current = this;
          let resolver;
          while (current !== null) {
              resolver = current.resolvers.get(key);
              if (resolver === undefined) {
                  if (this.parent === null) {
                      return PLATFORM.emptyArray;
                  }
                  current = current.parent;
              }
              else {
                  return buildAllResponse(resolver, current, this);
              }
          }
          return PLATFORM.emptyArray;
      }
      getFactory(Type) {
          let factory = this.factories.get(Type);
          if (factory === undefined) {
              factory = Factory.create(Type);
              this.factories.set(Type, factory);
          }
          return factory;
      }
      createChild() {
          const config = this.configuration;
          const childConfig = { factories: config.factories, resourceLookup: Object.assign({}, config.resourceLookup) };
          const child = new Container(childConfig);
          child.parent = this;
          return child;
      }
      jitRegister(keyAsValue, handler) {
          if (keyAsValue.register) {
              const registrationResolver = keyAsValue.register(handler, keyAsValue);
              if (!(registrationResolver && registrationResolver.resolve)) {
                  throw Reporter.error(40); // did not return a valid resolver from the static register method
              }
              return registrationResolver;
          }
          const resolver = new Resolver(keyAsValue, 1 /* singleton */, keyAsValue);
          handler.resolvers.set(keyAsValue, resolver);
          return resolver;
      }
  }
  const Registration = {
      instance(key, value) {
          return new Resolver(key, 0 /* instance */, value);
      },
      singleton(key, value) {
          return new Resolver(key, 1 /* singleton */, value);
      },
      transient(key, value) {
          return new Resolver(key, 2 /* transient */, value);
      },
      callback(key, callback) {
          return new Resolver(key, 3 /* callback */, callback);
      },
      alias(originalKey, aliasKey) {
          return new Resolver(aliasKey, 5 /* alias */, originalKey);
      },
      interpret(interpreterKey, ...rest) {
          return {
              register(container) {
                  const resolver = container.getResolver(interpreterKey);
                  if (resolver !== null) {
                      let registry = null;
                      if (resolver.getFactory) {
                          const factory = resolver.getFactory(container);
                          if (factory !== null) {
                              registry = factory.construct(container, rest);
                          }
                      }
                      else {
                          registry = resolver.resolve(container, container);
                      }
                      if (registry !== null) {
                          registry.register(container);
                      }
                  }
              }
          };
      }
  };
  /** @internal */
  function validateKey(key) {
      // note: design:paramTypes which will default to Object if the param types cannot be statically analyzed by tsc
      // this check is intended to properly report on that problem - under no circumstance should Object be a valid key anyway
      if (key === null || key === undefined || key === Object) {
          throw Reporter.error(5);
      }
  }
  function buildAllResponse(resolver, handler, requestor) {
      if (resolver instanceof Resolver && resolver.strategy === 4 /* array */) {
          const state = resolver.state;
          let i = state.length;
          const results = new Array(i);
          while (i--) {
              results[i] = state[i].resolve(handler, requestor);
          }
          return results;
      }
      return [resolver.resolve(handler, requestor)];
  }
  /** @internal */
  const classInvokers = [
      {
          invoke(container, Type) {
              return new Type();
          },
          invokeWithDynamicDependencies
      },
      {
          invoke(container, Type, deps) {
              return new Type(container.get(deps[0]));
          },
          invokeWithDynamicDependencies
      },
      {
          invoke(container, Type, deps) {
              return new Type(container.get(deps[0]), container.get(deps[1]));
          },
          invokeWithDynamicDependencies
      },
      {
          invoke(container, Type, deps) {
              return new Type(container.get(deps[0]), container.get(deps[1]), container.get(deps[2]));
          },
          invokeWithDynamicDependencies
      },
      {
          invoke(container, Type, deps) {
              return new Type(container.get(deps[0]), container.get(deps[1]), container.get(deps[2]), container.get(deps[3]));
          },
          invokeWithDynamicDependencies
      },
      {
          invoke(container, Type, deps) {
              return new Type(container.get(deps[0]), container.get(deps[1]), container.get(deps[2]), container.get(deps[3]), container.get(deps[4]));
          },
          invokeWithDynamicDependencies
      }
  ];
  /** @internal */
  const fallbackInvoker = {
      invoke: invokeWithDynamicDependencies,
      invokeWithDynamicDependencies
  };
  /** @internal */
  function invokeWithDynamicDependencies(container, Type, staticDependencies, dynamicDependencies) {
      let i = staticDependencies.length;
      let args = new Array(i);
      let lookup;
      while (i--) {
          lookup = staticDependencies[i];
          if (lookup === null || lookup === undefined) {
              throw Reporter.error(7, `Index ${i}.`);
          }
          else {
              args[i] = container.get(lookup);
          }
      }
      if (dynamicDependencies !== undefined) {
          args = args.concat(dynamicDependencies);
      }
      return Reflect.construct(Type, args);
  }

  function trimDots(ary) {
      const len = ary.length;
      let i = 0;
      let part;
      for (; i < len; ++i) {
          part = ary[i];
          if (part === '.') {
              ary.splice(i, 1);
              i -= 1;
          }
          else if (part === '..') {
              // If at the start, or previous value is still ..,
              // keep them so that when converted to a path it may
              // still work when converted to a path, even though
              // as an ID it is less than ideal. In larger point
              // releases, may be better to just kick out an error.
              if (i === 0 || (i === 1 && ary[2] === '..') || ary[i - 1] === '..') {
                  continue;
              }
              if (i > 0) {
                  ary.splice(i - 1, 2);
                  i -= 2;
              }
          }
      }
  }
  /**
   * Calculates a path relative to a file.
   *
   * @param name The relative path.
   * @param file The file path.
   * @return The calculated path.
   */
  function relativeToFile(name, file) {
      const fileParts = file && file.split('/');
      const nameParts = name.trim().split('/');
      if (nameParts[0].charAt(0) === '.' && fileParts) {
          //Convert file to array, and lop off the last part,
          //so that . matches that 'directory' and not name of the file's
          //module. For instance, file of 'one/two/three', maps to
          //'one/two/three.js', but we want the directory, 'one/two' for
          //this normalization.
          const normalizedBaseParts = fileParts.slice(0, fileParts.length - 1);
          nameParts.unshift(...normalizedBaseParts);
      }
      trimDots(nameParts);
      return nameParts.join('/');
  }
  /**
   * Joins two paths.
   *
   * @param path1 The first path.
   * @param path2 The second path.
   * @return The joined path.
   */
  function join(path1, path2) {
      if (!path1) {
          return path2;
      }
      if (!path2) {
          return path1;
      }
      const schemeMatch = path1.match(/^([^/]*?:)\//);
      const scheme = (schemeMatch && schemeMatch.length > 0) ? schemeMatch[1] : '';
      path1 = path1.slice(scheme.length);
      let urlPrefix;
      if (path1.indexOf('///') === 0 && scheme === 'file:') {
          urlPrefix = '///';
      }
      else if (path1.indexOf('//') === 0) {
          urlPrefix = '//';
      }
      else if (path1.indexOf('/') === 0) {
          urlPrefix = '/';
      }
      else {
          urlPrefix = '';
      }
      const trailingSlash = path2.slice(-1) === '/' ? '/' : '';
      const url1 = path1.split('/');
      const url2 = path2.split('/');
      const url3 = [];
      for (let i = 0, ii = url1.length; i < ii; ++i) {
          if (url1[i] === '..') {
              url3.pop();
          }
          else if (url1[i] !== '.' && url1[i] !== '') {
              url3.push(url1[i]);
          }
      }
      for (let i = 0, ii = url2.length; i < ii; ++i) {
          if (url2[i] === '..') {
              url3.pop();
          }
          else if (url2[i] !== '.' && url2[i] !== '') {
              url3.push(url2[i]);
          }
      }
      return scheme + urlPrefix + url3.join('/') + trailingSlash;
  }
  const encode = encodeURIComponent;
  const encodeKey = (k) => encode(k).replace('%24', '$');
  /**
   * Recursively builds part of query string for parameter.
   *
   * @param key Parameter name for query string.
   * @param value Parameter value to deserialize.
   * @param traditional Boolean Use the old URI template standard (RFC6570)
   * @return Array with serialized parameter(s)
   */
  function buildParam(key, value, traditional) {
      let result = [];
      if (value === null || value === undefined) {
          return result;
      }
      if (Array.isArray(value)) {
          for (let i = 0, l = value.length; i < l; i++) {
              if (traditional) {
                  result.push(`${encodeKey(key)}=${encode(value[i])}`);
              }
              else {
                  const arrayKey = `${key}[${(typeof value[i] === 'object' && value[i] !== null ? i : '')}]`;
                  result = result.concat(buildParam(arrayKey, value[i]));
              }
          }
      }
      else if (typeof value === 'object' && !traditional) {
          for (const propertyName in value) {
              result = result.concat(buildParam(`${key}[${propertyName}]`, value[propertyName]));
          }
      }
      else {
          result.push(`${encodeKey(key)}=${encode(value)}`);
      }
      return result;
  }
  /**
   * Generate a query string from an object.
   *
   * @param params Object containing the keys and values to be used.
   * @param traditional Boolean Use the old URI template standard (RFC6570)
   * @returns The generated query string, excluding leading '?'.
   */
  function buildQueryString(params, traditional) {
      let pairs = [];
      const keys = Object.keys(params || {}).sort();
      for (let i = 0, len = keys.length; i < len; i++) {
          const key = keys[i];
          pairs = pairs.concat(buildParam(key, params[key], traditional));
      }
      if (pairs.length === 0) {
          return '';
      }
      return pairs.join('&');
  }
  /**
   * Process parameter that was recognized as scalar param (primitive value or shallow array).
   *
   * @param existedParam Object with previously parsed values for specified key.
   * @param value Parameter value to append.
   * @returns Initial primitive value or transformed existedParam if parameter was recognized as an array.
   */
  function processScalarParam(existedParam, value) {
      if (Array.isArray(existedParam)) {
          // value is already an array, so push on the next value.
          existedParam.push(value);
          return existedParam;
      }
      if (existedParam !== undefined) {
          // value isn't an array, but since a second value has been specified,
          // convert value into an array.
          return [existedParam, value];
      }
      // value is a scalar.
      return value;
  }
  /**
   * Sequentially process parameter that was recognized as complex value (object or array).
   * For each keys part, if the current level is undefined create an
   *   object or array based on the type of the next keys part.
   *
   * @param queryParams root-level result object.
   * @param keys Collection of keys related to this parameter.
   * @param value Parameter value to append.
   */
  function parseComplexParam(queryParams, keys, value) {
      let currentParams = queryParams;
      const keysLastIndex = keys.length - 1;
      for (let j = 0; j <= keysLastIndex; j++) {
          const key = keys[j] === '' ? currentParams.length : keys[j];
          if (j < keysLastIndex) {
              // The value has to be an array or a false value
              // It can happen that the value is no array if the key was repeated with traditional style like `list=1&list[]=2`
              const prevValue = !currentParams[key] || typeof currentParams[key] === 'object' ? currentParams[key] : [currentParams[key]];
              currentParams = currentParams[key] = prevValue || (isNaN(keys[j + 1]) ? {} : []);
          }
          else {
              currentParams = currentParams[key] = value;
          }
      }
  }
  /**
   * Parse a query string into a queryParams object.
   *
   * @param queryString The query string to parse.
   * @returns Object with keys and values mapped from the query string.
   */
  function parseQueryString(queryString) {
      const queryParams = {};
      if (!queryString || typeof queryString !== 'string') {
          return queryParams;
      }
      let query = queryString;
      if (query.charAt(0) === '?') {
          query = query.slice(1);
      }
      const pairs = query.replace(/\+/g, ' ').split('&');
      for (let i = 0; i < pairs.length; i++) {
          const pair = pairs[i].split('=');
          const key = decodeURIComponent(pair[0]);
          if (!key) {
              continue;
          }
          //split object key into its parts
          let keys = key.split('][');
          let keysLastIndex = keys.length - 1;
          // If the first keys part contains [ and the last ends with ], then []
          // are correctly balanced, split key to parts
          //Else it's basic key
          if (/\[/.test(keys[0]) && /\]$/.test(keys[keysLastIndex])) {
              keys[keysLastIndex] = keys[keysLastIndex].replace(/\]$/, '');
              keys = keys.shift().split('[').concat(keys);
              keysLastIndex = keys.length - 1;
          }
          else {
              keysLastIndex = 0;
          }
          if (pair.length >= 2) {
              const value = pair[1] ? decodeURIComponent(pair[1]) : '';
              if (keysLastIndex) {
                  parseComplexParam(queryParams, keys, value);
              }
              else {
                  queryParams[key] = processScalarParam(queryParams[key], value);
              }
          }
          else {
              queryParams[key] = true;
          }
      }
      return queryParams;
  }

  const Profiler = (function () {
      const now = PLATFORM.now;
      const timers = [];
      let profileMap;
      const profiler = {
          createTimer,
          enable,
          disable,
          report,
          enabled: false
      };
      return profiler;
      function createTimer(name) {
          timers.push(name);
          let depth = 0;
          let mark = 0;
          return {
              enter,
              leave
          };
          function enter() {
              if (++depth === 1) {
                  mark = now();
                  ++profileMap[name].topLevelCount;
              }
              ++profileMap[name].totalCount;
          }
          function leave() {
              if (--depth === 0) {
                  profileMap[name].duration += (now() - mark);
              }
          }
      }
      function enable() {
          profileMap = {};
          for (const timer of timers) {
              profileMap[timer] = {
                  name: timer,
                  duration: 0,
                  topLevelCount: 0,
                  totalCount: 0
              };
          }
          profiler.enabled = true;
      }
      function disable() {
          profiler.enabled = false;
      }
      function report(cb) {
          Object.keys(profileMap).map(key => profileMap[key]).sort((a, b) => b.duration - a.duration).forEach(p => {
              cb(p.name, p.duration, p.topLevelCount, p.totalCount);
          });
      }
  })();

  class RuntimeCompilationResources {
      constructor(context) {
          this.context = context;
      }
      find(kind, name) {
          const key = kind.keyFrom(name);
          const resourceLookup = this.context.resourceLookup;
          let resolver = resourceLookup[key];
          if (resolver === undefined) {
              resolver = resourceLookup[key] = this.context.getResolver(key, false);
          }
          if (resolver !== null && resolver.getFactory) {
              const factory = resolver.getFactory(this.context);
              if (factory !== null) {
                  const description = factory.Type.description;
                  return description === undefined ? null : description;
              }
          }
          return null;
      }
      create(kind, name) {
          const key = kind.keyFrom(name);
          const resourceLookup = this.context.resourceLookup;
          let resolver = resourceLookup[key];
          if (resolver === undefined) {
              resolver = resourceLookup[key] = this.context.getResolver(key, false);
          }
          if (resolver !== null) {
              const instance = resolver.resolve(this.context, this.context);
              return instance === undefined ? null : instance;
          }
          return null;
      }
  }

  /**
   * Represents a handler for an EventAggregator event.
   */
  class Handler {
      constructor(messageType, callback) {
          this.messageType = messageType;
          this.callback = callback;
      }
      handle(message) {
          if (message instanceof this.messageType) {
              this.callback.call(null, message);
          }
      }
  }
  function invokeCallback(callback, data, event) {
      try {
          callback(data, event);
      }
      catch (e) {
          Reporter.error(0, e); // TODO: create error code
      }
  }
  function invokeHandler(handler, data) {
      try {
          handler.handle(data);
      }
      catch (e) {
          Reporter.error(0, e); // TODO: create error code
      }
  }
  /**
   * Enables loosely coupled publish/subscribe messaging.
   */
  class EventAggregator {
      /**
       * Creates an instance of the EventAggregator class.
       */
      constructor() {
          this.eventLookup = {};
          this.messageHandlers = [];
      }
      publish(channelOrInstance, data) {
          let subscribers;
          let i;
          if (!channelOrInstance) {
              throw Reporter.error(0); // TODO: create error code for 'Event was invalid.'
          }
          if (typeof channelOrInstance === 'string') {
              const channel = channelOrInstance;
              subscribers = this.eventLookup[channel];
              if (subscribers) {
                  subscribers = subscribers.slice();
                  i = subscribers.length;
                  while (i--) {
                      invokeCallback(subscribers[i], data, channel);
                  }
              }
          }
          else {
              const instance = channelOrInstance;
              subscribers = this.messageHandlers.slice();
              i = subscribers.length;
              while (i--) {
                  invokeHandler(subscribers[i], instance);
              }
          }
      }
      subscribe(channelOrType, callback) {
          let handler;
          let subscribers;
          if (!channelOrType) {
              throw Reporter.error(0); // TODO: create error code for 'Event channel/type was invalid.'
          }
          if (typeof channelOrType === 'string') {
              const channel = channelOrType;
              handler = callback;
              subscribers = this.eventLookup[channel] || (this.eventLookup[channel] = []);
          }
          else {
              const type = channelOrType;
              handler = new Handler(type, callback);
              subscribers = this.messageHandlers;
          }
          subscribers.push(handler);
          return {
              dispose() {
                  const idx = subscribers.indexOf(handler);
                  if (idx !== -1) {
                      subscribers.splice(idx, 1);
                  }
              }
          };
      }
      subscribeOnce(channelOrType, callback) {
          const sub = this.subscribe(channelOrType, (data, event) => {
              sub.dispose();
              return callback(data, event);
          });
          return sub;
      }
  }

  exports.DI = DI;
  exports.EventAggregator = EventAggregator;
  exports.IContainer = IContainer;
  exports.IServiceLocator = IServiceLocator;
  exports.PLATFORM = PLATFORM;
  exports.Profiler = Profiler;
  exports.Registration = Registration;
  exports.Reporter = Reporter;
  exports.RuntimeCompilationResources = RuntimeCompilationResources;
  exports.Tracer = Tracer;
  exports.all = all;
  exports.buildQueryString = buildQueryString;
  exports.inject = inject;
  exports.join = join;
  exports.lazy = lazy;
  exports.optional = optional;
  exports.parseQueryString = parseQueryString;
  exports.relativeToFile = relativeToFile;
  exports.singleton = singleton;
  exports.transient = transient;

  return exports;

}({}));
//# sourceMappingURL=index.iife.js.map
