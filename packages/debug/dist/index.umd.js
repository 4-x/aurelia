(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@aurelia/kernel'), require('@aurelia/runtime')) :
  typeof define === 'function' && define.amd ? define(['exports', '@aurelia/kernel', '@aurelia/runtime'], factory) :
  (global = global || self, factory(global.debug = {}, global.kernel, global.runtime));
}(this, function (exports, kernel, AST) { 'use strict';

  const astTypeMap = [
      { type: AST.AccessKeyed, name: 'AccessKeyed' },
      { type: AST.AccessMember, name: 'AccessMember' },
      { type: AST.AccessScope, name: 'AccessScope' },
      { type: AST.AccessThis, name: 'AccessThis' },
      { type: AST.ArrayBindingPattern, name: 'ArrayBindingPattern' },
      { type: AST.ArrayLiteral, name: 'ArrayLiteral' },
      { type: AST.Assign, name: 'Assign' },
      { type: AST.Binary, name: 'Binary' },
      { type: AST.BindingBehavior, name: 'BindingBehavior' },
      { type: AST.BindingIdentifier, name: 'BindingIdentifier' },
      { type: AST.CallFunction, name: 'CallFunction' },
      { type: AST.CallMember, name: 'CallMember' },
      { type: AST.CallScope, name: 'CallScope' },
      { type: AST.Conditional, name: 'Conditional' },
      { type: AST.ForOfStatement, name: 'ForOfStatement' },
      { type: AST.HtmlLiteral, name: 'HtmlLiteral' },
      { type: AST.Interpolation, name: 'Interpolation' },
      { type: AST.ObjectBindingPattern, name: 'ObjectBindingPattern' },
      { type: AST.ObjectLiteral, name: 'ObjectLiteral' },
      { type: AST.PrimitiveLiteral, name: 'PrimitiveLiteral' },
      { type: AST.TaggedTemplate, name: 'TaggedTemplate' },
      { type: AST.Template, name: 'Template' },
      { type: AST.Unary, name: 'Unary' },
      { type: AST.ValueConverter, name: 'ValueConverter' }
  ];
  function enableImprovedExpressionDebugging() {
      astTypeMap.forEach(x => { adoptDebugMethods(x.type, x.name); });
  }
  /** @internal */
  function adoptDebugMethods($type, name) {
      $type.prototype.toString = function () { return Unparser.unparse(this); };
  }
  /** @internal */
  class Unparser {
      constructor() {
          this.text = '';
      }
      static unparse(expr) {
          const visitor = new Unparser();
          expr.accept(visitor);
          return visitor.text;
      }
      visitAccessMember(expr) {
          expr.object.accept(this);
          this.text += `.${expr.name}`;
      }
      visitAccessKeyed(expr) {
          expr.object.accept(this);
          this.text += '[';
          expr.key.accept(this);
          this.text += ']';
      }
      visitAccessThis(expr) {
          if (expr.ancestor === 0) {
              this.text += '$this';
              return;
          }
          this.text += '$parent';
          let i = expr.ancestor - 1;
          while (i--) {
              this.text += '.$parent';
          }
      }
      visitAccessScope(expr) {
          let i = expr.ancestor;
          while (i--) {
              this.text += '$parent.';
          }
          this.text += expr.name;
      }
      visitArrayLiteral(expr) {
          const elements = expr.elements;
          this.text += '[';
          for (let i = 0, length = elements.length; i < length; ++i) {
              if (i !== 0) {
                  this.text += ',';
              }
              elements[i].accept(this);
          }
          this.text += ']';
      }
      visitObjectLiteral(expr) {
          const keys = expr.keys;
          const values = expr.values;
          this.text += '{';
          for (let i = 0, length = keys.length; i < length; ++i) {
              if (i !== 0) {
                  this.text += ',';
              }
              this.text += `'${keys[i]}':`;
              values[i].accept(this);
          }
          this.text += '}';
      }
      visitPrimitiveLiteral(expr) {
          this.text += '(';
          if (typeof expr.value === 'string') {
              const escaped = expr.value.replace(/'/g, '\\\'');
              this.text += `'${escaped}'`;
          }
          else {
              this.text += `${expr.value}`;
          }
          this.text += ')';
      }
      visitCallFunction(expr) {
          this.text += '(';
          expr.func.accept(this);
          this.writeArgs(expr.args);
          this.text += ')';
      }
      visitCallMember(expr) {
          this.text += '(';
          expr.object.accept(this);
          this.text += `.${expr.name}`;
          this.writeArgs(expr.args);
          this.text += ')';
      }
      visitCallScope(expr) {
          this.text += '(';
          let i = expr.ancestor;
          while (i--) {
              this.text += '$parent.';
          }
          this.text += expr.name;
          this.writeArgs(expr.args);
          this.text += ')';
      }
      visitTemplate(expr) {
          const { cooked, expressions } = expr;
          const length = expressions.length;
          this.text += '`';
          this.text += cooked[0];
          for (let i = 0; i < length; i++) {
              expressions[i].accept(this);
              this.text += cooked[i + 1];
          }
          this.text += '`';
      }
      visitTaggedTemplate(expr) {
          const { cooked, expressions } = expr;
          const length = expressions.length;
          expr.func.accept(this);
          this.text += '`';
          this.text += cooked[0];
          for (let i = 0; i < length; i++) {
              expressions[i].accept(this);
              this.text += cooked[i + 1];
          }
          this.text += '`';
      }
      visitUnary(expr) {
          this.text += `(${expr.operation}`;
          if (expr.operation.charCodeAt(0) >= /*a*/ 97) {
              this.text += ' ';
          }
          expr.expression.accept(this);
          this.text += ')';
      }
      visitBinary(expr) {
          this.text += '(';
          expr.left.accept(this);
          if (expr.operation.charCodeAt(0) === /*i*/ 105) {
              this.text += ` ${expr.operation} `;
          }
          else {
              this.text += expr.operation;
          }
          expr.right.accept(this);
          this.text += ')';
      }
      visitConditional(expr) {
          this.text += '(';
          expr.condition.accept(this);
          this.text += '?';
          expr.yes.accept(this);
          this.text += ':';
          expr.no.accept(this);
          this.text += ')';
      }
      visitAssign(expr) {
          this.text += '(';
          expr.target.accept(this);
          this.text += '=';
          expr.value.accept(this);
          this.text += ')';
      }
      visitValueConverter(expr) {
          const args = expr.args;
          expr.expression.accept(this);
          this.text += `|${expr.name}`;
          for (let i = 0, length = args.length; i < length; ++i) {
              this.text += ':';
              args[i].accept(this);
          }
      }
      visitBindingBehavior(expr) {
          const args = expr.args;
          expr.expression.accept(this);
          this.text += `&${expr.name}`;
          for (let i = 0, length = args.length; i < length; ++i) {
              this.text += ':';
              args[i].accept(this);
          }
      }
      visitArrayBindingPattern(expr) {
          const elements = expr.elements;
          this.text += '[';
          for (let i = 0, length = elements.length; i < length; ++i) {
              if (i !== 0) {
                  this.text += ',';
              }
              elements[i].accept(this);
          }
          this.text += ']';
      }
      visitObjectBindingPattern(expr) {
          const keys = expr.keys;
          const values = expr.values;
          this.text += '{';
          for (let i = 0, length = keys.length; i < length; ++i) {
              if (i !== 0) {
                  this.text += ',';
              }
              this.text += `'${keys[i]}':`;
              values[i].accept(this);
          }
          this.text += '}';
      }
      visitBindingIdentifier(expr) {
          this.text += expr.name;
      }
      visitHtmlLiteral(expr) { throw new Error('visitHtmlLiteral'); }
      visitForOfStatement(expr) {
          expr.declaration.accept(this);
          this.text += ' of ';
          expr.iterable.accept(this);
      }
      visitInterpolation(expr) {
          const { parts, expressions } = expr;
          const length = expressions.length;
          // tslint:disable-next-line:no-invalid-template-strings
          this.text += '${';
          this.text += parts[0];
          for (let i = 0; i < length; i++) {
              expressions[i].accept(this);
              this.text += parts[i + 1];
          }
          this.text += '}';
      }
      writeArgs(args) {
          this.text += '(';
          for (let i = 0, length = args.length; i < length; ++i) {
              if (i !== 0) {
                  this.text += ',';
              }
              args[i].accept(this);
          }
          this.text += ')';
      }
  }

  var MessageType;
  (function (MessageType) {
      MessageType[MessageType["error"] = 0] = "error";
      MessageType[MessageType["warn"] = 1] = "warn";
      MessageType[MessageType["info"] = 2] = "info";
      MessageType[MessageType["debug"] = 3] = "debug";
  })(MessageType || (MessageType = {}));
  const Reporter = Object.assign({}, kernel.Reporter, { write(code, ...params) {
          const info = getMessageInfoForCode(code);
          // tslint:disable:no-console
          switch (info.type) {
              case 3 /* debug */:
                  console.debug(info.message, ...params);
                  break;
              case 2 /* info */:
                  console.info(info.message, ...params);
                  break;
              case 1 /* warn */:
                  console.warn(info.message, ...params);
                  break;
              case 0 /* error */:
                  throw this.error(code, ...params);
          }
          // tslint:enable:no-console
      },
      error(code, ...params) {
          const info = getMessageInfoForCode(code);
          const error = new Error(info.message);
          error.data = params;
          return error;
      } });
  function getMessageInfoForCode(code) {
      const info = codeLookup[code];
      return info !== undefined ? info : createInvalidCodeMessageInfo(code);
  }
  function createInvalidCodeMessageInfo(code) {
      return {
          type: 0 /* error */,
          message: `Attempted to report with unknown code ${code}.`
      };
  }
  const codeLookup = {
      0: {
          type: 1 /* warn */,
          message: 'Cannot add observers to object.'
      },
      1: {
          type: 1 /* warn */,
          message: 'Cannot observe property of object.'
      },
      2: {
          type: 2 /* info */,
          message: 'Starting application in debug mode.'
      },
      3: {
          type: 0 /* error */,
          message: 'Runtime expression compilation is only available when including JIT support.'
      },
      4: {
          type: 0 /* error */,
          message: 'Invalid animation direction.'
      },
      5: {
          type: 0 /* error */,
          message: 'key/value cannot be null or undefined. Are you trying to inject/register something that doesn\'t exist with DI?'
      },
      6: {
          type: 0 /* error */,
          message: 'Invalid resolver strategy specified.'
      },
      7: {
          type: 0 /* error */,
          message: 'Constructor Parameter with index cannot be null or undefined. Are you trying to inject/register something that doesn\'t exist with DI?'
      },
      8: {
          type: 0 /* error */,
          message: 'Self binding behavior only supports events.'
      },
      9: {
          type: 0 /* error */,
          message: 'The updateTrigger binding behavior requires at least one event name argument: eg <input value.bind="firstName & updateTrigger:\'blur\'">'
      },
      10: {
          type: 0 /* error */,
          message: 'The updateTrigger binding behavior can only be applied to two-way/ from-view bindings on input/select elements.'
      },
      11: {
          type: 0 /* error */,
          message: 'Only property bindings and string interpolation bindings can be signaled. Trigger, delegate and call bindings cannot be signaled.'
      },
      12: {
          type: 0 /* error */,
          message: 'Signal name is required.'
      },
      14: {
          type: 0 /* error */,
          message: 'Property cannot be assigned.'
      },
      15: {
          type: 0 /* error */,
          message: 'Unexpected call context.'
      },
      16: {
          type: 0 /* error */,
          message: 'Only one child observer per content view is supported for the life of the content view.'
      },
      17: {
          type: 0 /* error */,
          message: 'You can only define one default implementation for an interface.'
      },
      18: {
          type: 0 /* error */,
          message: 'You cannot observe a setter only property.'
      },
      19: {
          type: 0 /* error */,
          message: 'Value for expression is non-repeatable.'
      },
      20: {
          type: 0 /* error */,
          message: 'No template compiler found with the specified name. JIT support or a custom compiler is required.'
      },
      21: {
          type: 0 /* error */,
          message: 'You cannot combine the containerless custom element option with Shadow DOM.'
      },
      22: {
          type: 0 /* error */,
          message: 'A containerless custom element cannot be the root component of an application.'
      },
      30: {
          type: 0 /* error */,
          message: 'There are more targets than there are target instructions.'
      },
      31: {
          type: 0 /* error */,
          message: 'There are more target instructions than there are targets.'
      },
      100: {
          type: 0 /* error */,
          message: 'Invalid start of expression.'
      },
      101: {
          type: 0 /* error */,
          message: 'Unconsumed token.'
      },
      102: {
          type: 0 /* error */,
          message: 'Double dot and spread operators are not supported.'
      },
      103: {
          type: 0 /* error */,
          message: 'Invalid member expression.'
      },
      104: {
          type: 0 /* error */,
          message: 'Unexpected end of expression.'
      },
      105: {
          type: 0 /* error */,
          message: 'Expected identifier.'
      },
      106: {
          type: 0 /* error */,
          message: 'Invalid BindingIdentifier at left hand side of "of".'
      },
      107: {
          type: 0 /* error */,
          message: 'Invalid or unsupported property definition in object literal.'
      },
      108: {
          type: 0 /* error */,
          message: 'Unterminated quote in string literal.'
      },
      109: {
          type: 0 /* error */,
          message: 'Unterminated template string.'
      },
      110: {
          type: 0 /* error */,
          message: 'Missing expected token.'
      },
      111: {
          type: 0 /* error */,
          message: 'Unexpected character.'
      },
      150: {
          type: 0 /* error */,
          message: 'Left hand side of expression is not assignable.'
      },
      151: {
          type: 0 /* error */,
          message: 'Unexpected keyword "of"'
      },
      2000: {
          type: 0 /* error */,
          message: 'Router has not been activated.'
      },
      2001: {
          type: 0 /* error */,
          message: 'Router has already been activated.'
      },
      2002: {
          type: 0 /* error */,
          message: 'Failed to resolve all viewports.'
      },
      2003: {
          type: 0 /* error */,
          message: 'Queued browser history has already been activated.'
      },
      2004: {
          type: 0 /* error */,
          message: 'LinkHandler has already been activated.'
      },
      10000: {
          type: 3 /* debug */,
          message: '%s'
      }
  };

  const marker = {
      objName: 'marker',
      methodName: 'noop',
      params: kernel.PLATFORM.emptyArray,
      depth: -1,
      prev: null,
      next: null
  };
  class TraceInfo {
      constructor(objName, methodName, params) {
          this.objName = objName;
          this.methodName = methodName;
          this.depth = TraceInfo.stack.length;
          this.params = params;
          this.next = marker;
          this.prev = TraceInfo.tail;
          TraceInfo.tail.next = this;
          TraceInfo.tail = this;
          TraceInfo.stack.push(this);
      }
      static reset() {
          let current = TraceInfo.head;
          let next = null;
          while (current !== null) {
              next = current.next;
              current.next = null;
              current.prev = null;
              current.params = null;
              current = next;
          }
          TraceInfo.head = marker;
          TraceInfo.tail = marker;
          TraceInfo.stack = [];
      }
      static enter(objName, methodName, params) {
          return new TraceInfo(objName, methodName, params);
      }
      static leave() {
          return TraceInfo.stack.pop();
      }
  }
  TraceInfo.head = marker;
  TraceInfo.tail = marker;
  TraceInfo.stack = [];
  const Tracer = Object.assign({}, kernel.Tracer, { 
      /**
       * A convenience property for the user to conditionally call the tracer.
       * This saves unnecessary `noop` and `slice` calls in non-AOT scenarios even if debugging is disabled.
       * In AOT these calls will simply be removed entirely.
       *
       * This property **only** turns on tracing if `@aurelia/debug` is included and configured as well.
       */
      enabled: false, liveLoggingEnabled: false, liveWriter: null, 
      /**
       * Call this at the start of a method/function.
       * Each call to `enter` **must** have an accompanying call to `leave` for the tracer to work properly.
       * @param objName Any human-friendly name to identify the traced object with.
       * @param methodName Any human-friendly name to identify the traced method with.
       * @param args Pass in `Array.prototype.slice.call(arguments)` to also trace the parameters, or `null` if this is not needed (to save memory/cpu)
       */
      enter(objName, methodName, args) {
          if (this.enabled) {
              const info = TraceInfo.enter(objName, methodName, args);
              if (this.liveLoggingEnabled) {
                  this.liveWriter.write(info);
              }
          }
      },
      /**
       * Call this at the end of a method/function. Pops one trace item off the stack.
       */
      leave() {
          if (this.enabled) {
              TraceInfo.leave();
          }
      },
      /**
       * Writes only the trace info leading up to the current method call.
       * @param writer An object to write the output to.
       */
      writeStack(writer) {
          let i = 0;
          const stack = TraceInfo.stack;
          const len = stack.length;
          while (i < len) {
              writer.write(stack[i]);
              ++i;
          }
      },
      /**
       * Writes all trace info captured since the previous flushAll operation.
       * @param writer An object to write the output to. Can be null to simply reset the tracer state.
       */
      flushAll(writer) {
          if (writer !== null) {
              let current = TraceInfo.head.next; // skip the marker
              while (current !== null && current !== marker) {
                  writer.write(current);
                  current = current.next;
              }
          }
          TraceInfo.reset();
      },
      enableLiveLogging,
      /**
       * Stops writing out each trace info item as they are traced.
       */
      disableLiveLogging() {
          this.liveLoggingEnabled = false;
          this.liveWriter = null;
      } });
  const defaultOptions = Object.freeze({
      rendering: true,
      binding: true,
      observation: true,
      attaching: true,
      mounting: true,
      di: true,
      lifecycle: true,
      jit: true
  });
  function enableLiveLogging(optionsOrWriter) {
      this.liveLoggingEnabled = true;
      if (optionsOrWriter && 'write' in optionsOrWriter) {
          this.liveWriter = optionsOrWriter;
      }
      else {
          const options = optionsOrWriter !== undefined ? optionsOrWriter : defaultOptions;
          this.liveWriter = createLiveTraceWriter(options);
      }
  }
  const toString = Object.prototype.toString;
  function flagsText(info, i = 0) {
      if (info.params !== null && info.params.length > i) {
          return stringifyLifecycleFlags(info.params[i]);
      }
      return 'none';
  }
  function _ctorName(obj) {
      let name;
      if (obj === undefined) {
          name = 'undefined';
      }
      else if (obj === null) {
          name = 'null';
      }
      else if (obj.constructor !== undefined) {
          if (obj.constructor.description) {
              name = `Resource{'${obj.constructor.description.name}'}`;
          }
          else {
              name = obj.constructor.name;
          }
      }
      else if (typeof obj === 'string') {
          name = `'${obj}'`;
      }
      else {
          name = toString.call(obj);
      }
      return name;
  }
  function ctorName(info, i = 0) {
      if (info.params !== null && info.params.length > i) {
          return _ctorName(info.params[i]);
      }
      return 'undefined';
  }
  function scopeText(info, i = 0) {
      let $ctorName;
      if (info.params !== null && info.params.length > i) {
          const $scope = info.params[i];
          if ($scope !== undefined && $scope.bindingContext !== undefined) {
              $ctorName = _ctorName($scope.bindingContext);
          }
          else {
              $ctorName = 'undefined';
          }
          return `Scope{${$ctorName}}`;
      }
      return 'undefined';
  }
  function keyText(info, i = 0) {
      if (info.params !== null && info.params.length > i) {
          const $key = info.params[i];
          if (typeof $key === 'string') {
              return `'${$key}'`;
          }
          if ($key !== undefined && Reflect.has($key, 'friendlyName')) {
              return $key['friendlyName'];
          }
          return _ctorName($key);
      }
      return 'undefined';
  }
  function primitive(info, i = 0) {
      if (info.params !== null && info.params.length > i) {
          const $key = info.params[i];
          if (typeof $key === 'string') {
              return `'${$key}'`;
          }
          return $key.toString();
      }
      return 'undefined';
  }
  const RenderingArgsProcessor = {
      $hydrate(info) {
          return flagsText(info);
      },
      render(info) {
          return `${flagsText(info)},IDOM,IRenderContext,${ctorName(info, 3)}`;
      },
      addBinding(info) {
          return `${ctorName(info)},${ctorName(info, 1)}`;
      },
      addComponent(info) {
          return `${ctorName(info)},${ctorName(info, 1)}`;
      }
  };
  const BindingArgsProcessor = {
      $bind(info) {
          return flagsText(info);
      },
      $unbind(info) {
          return flagsText(info);
      },
      connect(info) {
          return flagsText(info);
      },
      // currently only observers trace constructor calls but keep an eye on this if others are added, then we'd need additional filtering
      constructor(info) {
          switch (info.objName) {
              case 'ArrayObserver':
              case 'MapObserver':
              case 'SetObserver':
                  return flagsText(info);
              case 'SetterObserver':
              case 'SelfObserver':
                  return `${flagsText(info)},${ctorName(info, 1)},${primitive(info, 2)}`;
              case 'ProxyObserver':
                  return ctorName(info);
              case 'ProxySubscriberCollection':
              case 'DirtyCheckProperty':
                  return `${ctorName(info, 1)},${primitive(info, 2)}`;
              case 'PrimitiveObserver':
              case 'PropertyAccessor':
                  return `${ctorName(info)},${primitive(info, 1)}`;
              default:
                  return '';
          }
      },
      lockedBind(info) {
          return flagsText(info);
      },
      lockedUnbind(info) {
          return flagsText(info);
      },
      InternalObserversLookup(info) {
          return `${flagsText(info)},${ctorName(info, 1)},${primitive(info, 2)}`;
      },
      BindingContext(info) {
          switch (info.methodName) {
              case 'get':
                  return `${scopeText(info)},${primitive(info, 1)},${primitive(info, 2)},${flagsText(info, 3)}`;
              case 'getObservers':
                  return flagsText(info);
              default:
                  return 'unknown';
          }
      },
      Scope(info) {
          switch (info.methodName) {
              case 'create':
                  return `${flagsText(info)},${ctorName(info, 1)},${ctorName(info, 2)}`;
              case 'fromOverride':
                  return `${flagsText(info)},${ctorName(info, 1)}`;
              case 'fromParent':
                  return `${flagsText(info)},${scopeText(info, 1)},${ctorName(info, 2)}`;
              default:
                  return 'unknown';
          }
      },
      OverrideContext(info) {
          switch (info.methodName) {
              case 'create':
                  return `${flagsText(info)},${ctorName(info, 1)},${ctorName(info, 2)}`;
              case 'getObservers':
                  return '';
              default:
                  return 'unknown';
          }
      }
  };
  const ObservationArgsProcessor = {
      $patch(info) {
          return flagsText(info);
      },
      callSource(info) {
          switch (info.objName) {
              case 'Listener':
                  return (info.params[0]).type;
              case 'Call':
                  const names = [];
                  if (info.params !== null) {
                      for (let i = 0, ii = info.params.length; i < ii; ++i) {
                          names.push(ctorName(info, i));
                      }
                  }
                  return names.join(',');
              default:
                  return 'unknown';
          }
      },
      setValue(info) {
          let valueText;
          const value = info.params[0];
          switch (typeof value) {
              case 'undefined':
                  valueText = 'undefined';
                  break;
              case 'object':
                  if (value === null) {
                      valueText = 'null';
                  }
                  else {
                      valueText = _ctorName(value);
                  }
                  break;
              case 'string':
                  valueText = `'${value}'`;
                  break;
              case 'number':
                  valueText = value.toString();
                  break;
              default:
                  valueText = _ctorName(value);
          }
          return `${valueText},${flagsText(info, 1)}`;
      },
      flush(info) {
          return flagsText(info);
      },
      handleChange(info) {
          return `${primitive(info)},${primitive(info, 1)},${flagsText(info, 2)}`;
      },
      lockScope(info) {
          return scopeText(info);
      }
  };
  const AttachingArgsProcessor = {
      $attach(info) {
          return flagsText(info);
      },
      $detach(info) {
          return flagsText(info);
      },
      $cache(info) {
          return flagsText(info);
      },
      hold(info) {
          return `Node{'${(info.params[0]).textContent}'}`;
      },
      release(info) {
          return flagsText(info);
      }
  };
  const MountingArgsProcessor = {
      $mount(info) {
          return flagsText(info);
      },
      $unmount(info) {
          return flagsText(info);
      },
      project(info) {
          return ctorName(info);
      },
      take(info) {
          return ctorName(info);
      }
  };
  const DIArgsProcessor = {
      construct(info) {
          return ctorName(info);
      },
      Container(info) {
          switch (info.methodName) {
              case 'get':
              case 'getAll':
                  return keyText(info);
              case 'register':
                  const names = [];
                  if (info.params !== null) {
                      for (let i = 0, ii = info.params.length; i < ii; ++i) {
                          names.push(keyText(info, i));
                      }
                  }
                  return names.join(',');
              case 'createChild':
                  return '';
              default:
                  return 'unknown';
          }
      }
  };
  const LifecycleArgsProcessor = {
      Lifecycle(info) {
          switch (info.methodName.slice(0, 3)) {
              case 'beg':
                  return '';
              case 'enq':
                  return ctorName(info);
              case 'end':
              case 'pro':
                  return flagsText(info);
              default:
                  return 'unknown';
          }
      },
      CompositionCoordinator(info) {
          switch (info.methodName) {
              case 'enqueue':
                  return 'IView';
              case 'swap':
                  return `IView,${flagsText(info, 1)}`;
              case 'processNext':
                  return '';
              default:
                  return 'unknown';
          }
      },
      AggregateLifecycleTask(info) {
          switch (info.methodName) {
              case 'addTask':
              case 'removeTask':
                  return ctorName(info);
              case 'complete':
                  return `${primitive(info, 2)}`;
              default:
                  return 'unknown';
          }
      }
  };
  const JitArgsProcessor = {
      TemplateBinder(info) {
          return ''; // TODO
      }
  };
  function createLiveTraceWriter(options) {
      const Processors = {};
      if (options.rendering) {
          Object.assign(Processors, RenderingArgsProcessor);
      }
      if (options.binding) {
          Object.assign(Processors, BindingArgsProcessor);
      }
      if (options.observation) {
          Object.assign(Processors, ObservationArgsProcessor);
      }
      if (options.attaching) {
          Object.assign(Processors, AttachingArgsProcessor);
      }
      if (options.mounting) {
          Object.assign(Processors, MountingArgsProcessor);
      }
      if (options.di) {
          Object.assign(Processors, DIArgsProcessor);
      }
      if (options.lifecycle) {
          Object.assign(Processors, LifecycleArgsProcessor);
      }
      if (options.jit) {
          Object.assign(Processors, JitArgsProcessor);
      }
      return {
          write(info) {
              let output;
              if (Processors[info.methodName] !== undefined) {
                  output = Processors[info.methodName](info);
              }
              else if (Processors[info.objName] !== undefined) {
                  output = Processors[info.objName](info);
              }
              else {
                  return;
              }
              kernel.Reporter.write(10000, `${'-'.repeat(info.depth)}${info.objName}.${info.methodName}(${output})`);
          }
      };
  }
  function stringifyLifecycleFlags(flags) {
      const flagNames = [];
      if (flags & 1048576 /* mustEvaluate */) {
          flagNames.push('mustEvaluate');
      }
      if (flags & 33554432 /* isCollectionMutation */) {
          flagNames.push('isCollectionMutation');
      }
      if (flags & 16 /* updateTargetInstance */) {
          flagNames.push('updateTargetInstance');
      }
      if (flags & 32 /* updateSourceExpression */) {
          flagNames.push('updateSourceExpression');
      }
      if (flags & 64 /* fromAsyncFlush */) {
          flagNames.push('fromAsyncFlush');
      }
      if (flags & 128 /* fromSyncFlush */) {
          flagNames.push('fromSyncFlush');
      }
      if (flags & 512 /* fromStartTask */) {
          flagNames.push('fromStartTask');
      }
      if (flags & 1024 /* fromStopTask */) {
          flagNames.push('fromStopTask');
      }
      if (flags & 2048 /* fromBind */) {
          flagNames.push('fromBind');
      }
      if (flags & 4096 /* fromUnbind */) {
          flagNames.push('fromUnbind');
      }
      if (flags & 8192 /* fromAttach */) {
          flagNames.push('fromAttach');
      }
      if (flags & 16384 /* fromDetach */) {
          flagNames.push('fromDetach');
      }
      if (flags & 32768 /* fromCache */) {
          flagNames.push('fromCache');
      }
      if (flags & 65536 /* fromDOMEvent */) {
          flagNames.push('fromDOMEvent');
      }
      if (flags & 131072 /* fromLifecycleTask */) {
          flagNames.push('fromLifecycleTask');
      }
      if (flags & 2097152 /* parentUnmountQueued */) {
          flagNames.push('parentUnmountQueued');
      }
      if (flags & 4194304 /* doNotUpdateDOM */) {
          flagNames.push('doNotUpdateDOM');
      }
      if (flags & 8388608 /* isTraversingParentScope */) {
          flagNames.push('isTraversingParentScope');
      }
      if (flags & 67108864 /* allowParentScopeTraversal */) {
          flagNames.push('allowParentScopeTraversal');
      }
      if (flags & 1 /* getterSetterStrategy */) {
          flagNames.push('getterSetterStrategy');
      }
      if (flags & 2 /* proxyStrategy */) {
          flagNames.push('proxyStrategy');
      }
      if (flags & 8 /* keyedStrategy */) {
          flagNames.push('keyedStrategy');
      }
      if (flags & 4 /* patchStrategy */) {
          flagNames.push('patchStrategy');
      }
      if (flagNames.length === 0) {
          return 'none';
      }
      return flagNames.join('|');
  }

  const DebugConfiguration = {
      register(container) {
          Reporter.write(2);
          Object.assign(kernel.Reporter, Reporter);
          enableImprovedExpressionDebugging();
      }
  };
  const TraceConfiguration = {
      register(container) {
          Object.assign(kernel.Tracer, Tracer);
      }
  };

  exports.DebugConfiguration = DebugConfiguration;
  exports.TraceConfiguration = TraceConfiguration;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
