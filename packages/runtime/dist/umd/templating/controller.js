(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@aurelia/kernel", "../definitions", "../dom", "../lifecycle", "../lifecycle-task", "../observation/binding-context", "../observation/proxy-observer", "../observation/self-observer", "../rendering-engine", "../resources/custom-element"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const kernel_1 = require("@aurelia/kernel");
    const definitions_1 = require("../definitions");
    const dom_1 = require("../dom");
    const lifecycle_1 = require("../lifecycle");
    const lifecycle_task_1 = require("../lifecycle-task");
    const binding_context_1 = require("../observation/binding-context");
    const proxy_observer_1 = require("../observation/proxy-observer");
    const self_observer_1 = require("../observation/self-observer");
    const rendering_engine_1 = require("../rendering-engine");
    const custom_element_1 = require("../resources/custom-element");
    function hasDescription(type) {
        return type.description != void 0;
    }
    class Controller {
        // todo: refactor
        // tslint:disable-next-line:cognitive-complexity
        constructor(flags, viewCache, lifecycle, viewModel, parentContext, host, options) {
            this.id = kernel_1.nextId('au$component');
            this.nextBound = void 0;
            this.nextUnbound = void 0;
            this.prevBound = void 0;
            this.prevUnbound = void 0;
            this.nextAttached = void 0;
            this.nextDetached = void 0;
            this.prevAttached = void 0;
            this.prevDetached = void 0;
            this.nextMount = void 0;
            this.nextUnmount = void 0;
            this.prevMount = void 0;
            this.prevUnmount = void 0;
            this.flags = flags;
            this.viewCache = viewCache;
            this.bindings = void 0;
            this.controllers = void 0;
            this.state = 0 /* none */;
            if (viewModel == void 0) {
                if (viewCache == void 0) {
                    // TODO: create error code
                    throw new Error(`No IViewCache was provided when rendering a synthetic view.`);
                }
                if (lifecycle == void 0) {
                    // TODO: create error code
                    throw new Error(`No ILifecycle was provided when rendering a synthetic view.`);
                }
                this.lifecycle = lifecycle;
                this.hooks = definitions_1.HooksDefinition.none;
                this.viewModel = void 0;
                this.bindingContext = void 0; // stays undefined
                this.host = void 0; // stays undefined
                this.vmKind = 2 /* synthetic */;
                this.scopeParts = void 0; // will be populated during ITemplate.render() immediately after the constructor is done
                this.scope = void 0; // will be populated during bindSynthetic()
                this.projector = void 0; // stays undefined
                this.nodes = void 0; // will be populated during ITemplate.render() immediately after the constructor is done
                this.context = void 0; // will be populated during ITemplate.render() immediately after the constructor is done
                this.location = void 0; // should be set with `hold(location)` by the consumer
            }
            else {
                if (parentContext == void 0) {
                    // TODO: create error code
                    throw new Error(`No parentContext was provided when rendering a custom element or attribute.`);
                }
                this.lifecycle = parentContext.get(lifecycle_1.ILifecycle);
                viewModel.$controller = this;
                const Type = viewModel.constructor;
                if (!hasDescription(Type)) {
                    // TODO: create error code
                    throw new Error(`The provided viewModel does not have a (valid) description.`);
                }
                const { description } = Type;
                flags |= description.strategy;
                createObservers(this, description, flags, viewModel);
                this.hooks = description.hooks;
                this.viewModel = viewModel;
                this.bindingContext = getBindingContext(flags, viewModel);
                this.host = host;
                switch (Type.kind.name) {
                    case 'custom-element':
                        if (host == void 0) {
                            // TODO: create error code
                            throw new Error(`No host element was provided when rendering a custom element.`);
                        }
                        this.vmKind = 0 /* customElement */;
                        const renderingEngine = parentContext.get(rendering_engine_1.IRenderingEngine);
                        let template = void 0;
                        if (this.hooks.hasRender) {
                            const result = this.bindingContext.render(flags, host, options.parts == void 0
                                ? kernel_1.PLATFORM.emptyObject
                                : options.parts, parentContext);
                            if (result != void 0 && 'getElementTemplate' in result) {
                                template = result.getElementTemplate(renderingEngine, Type, parentContext);
                            }
                        }
                        else {
                            const dom = parentContext.get(dom_1.IDOM);
                            template = renderingEngine.getElementTemplate(dom, description, parentContext, Type);
                        }
                        if (template !== void 0) {
                            let parts;
                            if (template.definition == null ||
                                template.definition.instructions.length === 0 ||
                                template.definition.instructions[0].length === 0 ||
                                (template.definition.instructions[0][0].parts == void 0)) {
                                if (options.parts == void 0) {
                                    parts = kernel_1.PLATFORM.emptyObject;
                                }
                                else {
                                    parts = options.parts;
                                }
                            }
                            else {
                                const instruction = template.definition.instructions[0][0];
                                if (options.parts == void 0) {
                                    parts = instruction.parts;
                                }
                                else {
                                    parts = { ...options.parts, ...instruction.parts };
                                }
                            }
                            template.render(this, host, parts);
                        }
                        this.scope = binding_context_1.Scope.create(flags, this.bindingContext, null);
                        this.projector = parentContext.get(custom_element_1.IProjectorLocator).getElementProjector(parentContext.get(dom_1.IDOM), this, host, description);
                        this.location = void 0;
                        break;
                    case 'custom-attribute':
                        this.vmKind = 1 /* customAttribute */;
                        this.scope = void 0;
                        this.projector = void 0;
                        this.nodes = void 0;
                        this.context = void 0;
                        this.location = void 0;
                        break;
                    default:
                        throw new Error(`Invalid resource kind: '${Type.kind.name}'`);
                }
                if (this.hooks.hasCreated) {
                    this.bindingContext.created(flags);
                }
            }
        }
        static forCustomElement(viewModel, parentContext, host, flags = 0 /* none */, options = kernel_1.PLATFORM.emptyObject) {
            let controller = Controller.lookup.get(viewModel);
            if (controller === void 0) {
                controller = new Controller(flags, void 0, void 0, viewModel, parentContext, host, options);
                this.lookup.set(viewModel, controller);
            }
            return controller;
        }
        static forCustomAttribute(viewModel, parentContext, flags = 0 /* none */) {
            let controller = Controller.lookup.get(viewModel);
            if (controller === void 0) {
                controller = new Controller(flags, void 0, void 0, viewModel, parentContext, void 0, kernel_1.PLATFORM.emptyObject);
                this.lookup.set(viewModel, controller);
            }
            return controller;
        }
        static forSyntheticView(viewCache, lifecycle, flags = 0 /* none */) {
            return new Controller(flags, viewCache, lifecycle, void 0, void 0, void 0, kernel_1.PLATFORM.emptyObject);
        }
        lockScope(scope) {
            this.scope = scope;
            this.state |= 16384 /* hasLockedScope */;
        }
        hold(location) {
            this.state = (this.state | 32768 /* canBeCached */) ^ 32768 /* canBeCached */;
            this.location = location;
        }
        release(flags) {
            this.state |= 32768 /* canBeCached */;
            if ((this.state & 32 /* isAttached */) > 0) {
                // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
                return this.viewCache.canReturnToCache(this);
            }
            return this.unmountSynthetic(flags);
        }
        bind(flags, scope, part) {
            this.part = part;
            // TODO: benchmark which of these techniques is fastest:
            // - the current one (enum with switch)
            // - set the name of the method in the constructor, e.g. this.bindMethod = 'bindCustomElement'
            //    and then doing this[this.bindMethod](flags, scope) instead of switch (eliminates branching
            //    but computed property access might be harmful to browser optimizations)
            // - make bind() a property and set it to one of the 3 methods in the constructor,
            //    e.g. this.bind = this.bindCustomElement (eliminates branching + reduces call stack depth by 1,
            //    but might make the call site megamorphic)
            flags |= 4096 /* fromBind */;
            switch (this.vmKind) {
                case 0 /* customElement */:
                    return this.bindCustomElement(flags, scope);
                case 1 /* customAttribute */:
                    return this.bindCustomAttribute(flags, scope);
                case 2 /* synthetic */:
                    return this.bindSynthetic(flags, scope);
            }
        }
        unbind(flags) {
            flags |= 8192 /* fromUnbind */;
            switch (this.vmKind) {
                case 0 /* customElement */:
                    return this.unbindCustomElement(flags);
                case 1 /* customAttribute */:
                    return this.unbindCustomAttribute(flags);
                case 2 /* synthetic */:
                    return this.unbindSynthetic(flags);
            }
        }
        bound(flags) {
            // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
            this.bindingContext.bound(flags);
        }
        unbound(flags) {
            // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
            this.bindingContext.unbound(flags);
        }
        attach(flags) {
            if ((this.state & 40 /* isAttachedOrAttaching */) > 0 && (flags & 67108864 /* reorderNodes */) === 0) {
                return;
            }
            flags |= 16384 /* fromAttach */;
            switch (this.vmKind) {
                case 0 /* customElement */:
                    this.attachCustomElement(flags);
                    break;
                case 1 /* customAttribute */:
                    this.attachCustomAttribute(flags);
                    break;
                case 2 /* synthetic */:
                    this.attachSynthetic(flags);
            }
        }
        detach(flags) {
            if ((this.state & 40 /* isAttachedOrAttaching */) === 0) {
                return;
            }
            flags |= 32768 /* fromDetach */;
            switch (this.vmKind) {
                case 0 /* customElement */:
                    this.detachCustomElement(flags);
                    break;
                case 1 /* customAttribute */:
                    this.detachCustomAttribute(flags);
                    break;
                case 2 /* synthetic */:
                    this.detachSynthetic(flags);
            }
        }
        attached(flags) {
            // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
            this.bindingContext.attached(flags);
        }
        detached(flags) {
            // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
            this.bindingContext.detached(flags);
        }
        mount(flags) {
            switch (this.vmKind) {
                case 0 /* customElement */:
                    this.mountCustomElement(flags);
                    break;
                case 2 /* synthetic */:
                    this.mountSynthetic(flags);
            }
        }
        unmount(flags) {
            switch (this.vmKind) {
                case 0 /* customElement */:
                    this.unmountCustomElement(flags);
                    break;
                case 2 /* synthetic */:
                    this.unmountSynthetic(flags);
            }
        }
        cache(flags) {
            switch (this.vmKind) {
                case 0 /* customElement */:
                    this.cacheCustomElement(flags);
                    break;
                case 1 /* customAttribute */:
                    this.cacheCustomAttribute(flags);
                    break;
                case 2 /* synthetic */:
                    this.cacheSynthetic(flags);
            }
        }
        getTargetAccessor(propertyName) {
            const { bindings } = this;
            if (bindings !== void 0) {
                const binding = bindings.find(b => b.targetProperty === propertyName);
                if (binding !== void 0) {
                    return binding.targetObserver;
                }
            }
            return void 0;
        }
        // #region bind/unbind
        bindCustomElement(flags, scope) {
            const $scope = this.scope;
            $scope.parentScope = scope === void 0 ? null : scope;
            $scope.scopeParts = this.scopeParts;
            if ((this.state & 4 /* isBound */) > 0) {
                return lifecycle_task_1.LifecycleTask.done;
            }
            flags |= 4096 /* fromBind */;
            this.state |= 1 /* isBinding */;
            this.lifecycle.bound.begin();
            this.bindBindings(flags, $scope);
            if (this.hooks.hasBinding) {
                const ret = this.bindingContext.binding(flags);
                if (lifecycle_task_1.hasAsyncWork(ret)) {
                    return new lifecycle_task_1.ContinuationTask(ret, this.bindControllers, this, flags, $scope);
                }
            }
            return this.bindControllers(flags, $scope);
        }
        bindCustomAttribute(flags, scope) {
            if ((this.state & 4 /* isBound */) > 0) {
                if (this.scope === scope) {
                    return lifecycle_task_1.LifecycleTask.done;
                }
                flags |= 4096 /* fromBind */;
                const task = this.unbind(flags);
                if (!task.done) {
                    return new lifecycle_task_1.ContinuationTask(task, this.bind, this, flags, scope);
                }
            }
            else {
                flags |= 4096 /* fromBind */;
            }
            this.state |= 1 /* isBinding */;
            this.scope = scope;
            this.lifecycle.bound.begin();
            if (this.hooks.hasBinding) {
                const ret = this.bindingContext.binding(flags);
                if (lifecycle_task_1.hasAsyncWork(ret)) {
                    return new lifecycle_task_1.ContinuationTask(ret, this.endBind, this, flags);
                }
            }
            this.endBind(flags);
            return lifecycle_task_1.LifecycleTask.done;
        }
        bindSynthetic(flags, scope) {
            if (scope == void 0) {
                throw new Error(`Scope is null or undefined`); // TODO: create error code
            }
            scope.scopeParts = kernel_1.mergeDistinct(scope.scopeParts, this.scopeParts, false);
            if ((this.state & 4 /* isBound */) > 0) {
                if (this.scope === scope || (this.state & 16384 /* hasLockedScope */) > 0) {
                    return lifecycle_task_1.LifecycleTask.done;
                }
                flags |= 4096 /* fromBind */;
                const task = this.unbind(flags);
                if (!task.done) {
                    return new lifecycle_task_1.ContinuationTask(task, this.bind, this, flags, scope);
                }
            }
            else {
                flags |= 4096 /* fromBind */;
            }
            if ((this.state & 16384 /* hasLockedScope */) === 0) {
                this.scope = scope;
            }
            this.state |= 1 /* isBinding */;
            this.lifecycle.bound.begin();
            this.bindBindings(flags, scope);
            return this.bindControllers(flags, scope);
        }
        bindBindings(flags, scope) {
            const { bindings } = this;
            if (bindings !== void 0) {
                const { length } = bindings;
                for (let i = 0; i < length; ++i) {
                    bindings[i].$bind(flags, scope, this.part);
                }
            }
        }
        bindControllers(flags, scope) {
            let tasks = void 0;
            let task;
            const { controllers } = this;
            if (controllers !== void 0) {
                const { length } = controllers;
                for (let i = 0; i < length; ++i) {
                    controllers[i].parent = this;
                    task = controllers[i].bind(flags, scope, this.part);
                    if (!task.done) {
                        if (tasks === void 0) {
                            tasks = [];
                        }
                        tasks.push(task);
                    }
                }
            }
            if (tasks === void 0) {
                this.endBind(flags);
                return lifecycle_task_1.LifecycleTask.done;
            }
            return new lifecycle_task_1.AggregateContinuationTask(tasks, this.endBind, this, flags);
        }
        endBind(flags) {
            if (this.hooks.hasBound) {
                this.lifecycle.bound.add(this);
            }
            this.state = this.state ^ 1 /* isBinding */ | 4 /* isBound */;
            this.lifecycle.bound.end(flags);
        }
        unbindCustomElement(flags) {
            if ((this.state & 4 /* isBound */) === 0) {
                return lifecycle_task_1.LifecycleTask.done;
            }
            this.scope.parentScope = null;
            this.state |= 2 /* isUnbinding */;
            flags |= 8192 /* fromUnbind */;
            this.lifecycle.unbound.begin();
            if (this.hooks.hasUnbinding) {
                const ret = this.bindingContext.unbinding(flags);
                if (lifecycle_task_1.hasAsyncWork(ret)) {
                    return new lifecycle_task_1.ContinuationTask(ret, this.unbindControllers, this, flags);
                }
            }
            return this.unbindControllers(flags);
        }
        unbindCustomAttribute(flags) {
            if ((this.state & 4 /* isBound */) === 0) {
                return lifecycle_task_1.LifecycleTask.done;
            }
            this.state |= 2 /* isUnbinding */;
            flags |= 8192 /* fromUnbind */;
            this.lifecycle.unbound.begin();
            if (this.hooks.hasUnbinding) {
                const ret = this.bindingContext.unbinding(flags);
                if (lifecycle_task_1.hasAsyncWork(ret)) {
                    return new lifecycle_task_1.ContinuationTask(ret, this.endUnbind, this, flags);
                }
            }
            this.endUnbind(flags);
            return lifecycle_task_1.LifecycleTask.done;
        }
        unbindSynthetic(flags) {
            if ((this.state & 4 /* isBound */) === 0) {
                return lifecycle_task_1.LifecycleTask.done;
            }
            this.state |= 2 /* isUnbinding */;
            flags |= 8192 /* fromUnbind */;
            this.lifecycle.unbound.begin();
            return this.unbindControllers(flags);
        }
        unbindBindings(flags) {
            const { bindings } = this;
            if (bindings !== void 0) {
                for (let i = bindings.length - 1; i >= 0; --i) {
                    bindings[i].$unbind(flags);
                }
            }
            this.endUnbind(flags);
        }
        unbindControllers(flags) {
            let tasks = void 0;
            let task;
            const { controllers } = this;
            if (controllers !== void 0) {
                for (let i = controllers.length - 1; i >= 0; --i) {
                    task = controllers[i].unbind(flags);
                    controllers[i].parent = void 0;
                    if (!task.done) {
                        if (tasks === void 0) {
                            tasks = [];
                        }
                        tasks.push(task);
                    }
                }
            }
            if (tasks === void 0) {
                this.unbindBindings(flags);
                return lifecycle_task_1.LifecycleTask.done;
            }
            return new lifecycle_task_1.AggregateContinuationTask(tasks, this.unbindBindings, this, flags);
        }
        endUnbind(flags) {
            switch (this.vmKind) {
                case 1 /* customAttribute */:
                    this.scope = void 0;
                    break;
                case 2 /* synthetic */:
                    if ((this.state & 16384 /* hasLockedScope */) === 0) {
                        this.scope = void 0;
                    }
            }
            if (this.hooks.hasUnbound) {
                this.lifecycle.unbound.add(this);
            }
            this.state = (this.state | 6 /* isBoundOrUnbinding */) ^ 6 /* isBoundOrUnbinding */;
            this.lifecycle.unbound.end(flags);
        }
        // #endregion
        // #region attach/detach
        attachCustomElement(flags) {
            flags |= 16384 /* fromAttach */;
            this.state |= 8 /* isAttaching */;
            this.lifecycle.mount.add(this);
            this.lifecycle.attached.begin();
            if (this.hooks.hasAttaching) {
                this.bindingContext.attaching(flags);
            }
            this.attachControllers(flags);
            if (this.hooks.hasAttached) {
                this.lifecycle.attached.add(this);
            }
            this.state = this.state ^ 8 /* isAttaching */ | 32 /* isAttached */;
            this.lifecycle.attached.end(flags);
        }
        attachCustomAttribute(flags) {
            flags |= 16384 /* fromAttach */;
            this.state |= 8 /* isAttaching */;
            this.lifecycle.attached.begin();
            if (this.hooks.hasAttaching) {
                this.bindingContext.attaching(flags);
            }
            if (this.hooks.hasAttached) {
                this.lifecycle.attached.add(this);
            }
            this.state = this.state ^ 8 /* isAttaching */ | 32 /* isAttached */;
            this.lifecycle.attached.end(flags);
        }
        attachSynthetic(flags) {
            if (((this.state & 32 /* isAttached */) > 0 && flags & 67108864 /* reorderNodes */) > 0) {
                this.lifecycle.mount.add(this);
            }
            else {
                flags |= 16384 /* fromAttach */;
                this.state |= 8 /* isAttaching */;
                this.lifecycle.mount.add(this);
                this.lifecycle.attached.begin();
                this.attachControllers(flags);
                this.state = this.state ^ 8 /* isAttaching */ | 32 /* isAttached */;
                this.lifecycle.attached.end(flags);
            }
        }
        detachCustomElement(flags) {
            flags |= 32768 /* fromDetach */;
            this.state |= 16 /* isDetaching */;
            this.lifecycle.detached.begin();
            this.lifecycle.unmount.add(this);
            if (this.hooks.hasDetaching) {
                this.bindingContext.detaching(flags);
            }
            this.detachControllers(flags);
            if (this.hooks.hasDetached) {
                this.lifecycle.detached.add(this);
            }
            this.state = (this.state | 48 /* isAttachedOrDetaching */) ^ 48 /* isAttachedOrDetaching */;
            this.lifecycle.detached.end(flags);
        }
        detachCustomAttribute(flags) {
            flags |= 32768 /* fromDetach */;
            this.state |= 16 /* isDetaching */;
            this.lifecycle.detached.begin();
            if (this.hooks.hasDetaching) {
                this.bindingContext.detaching(flags);
            }
            if (this.hooks.hasDetached) {
                this.lifecycle.detached.add(this);
            }
            this.state = (this.state | 48 /* isAttachedOrDetaching */) ^ 48 /* isAttachedOrDetaching */;
            this.lifecycle.detached.end(flags);
        }
        detachSynthetic(flags) {
            flags |= 32768 /* fromDetach */;
            this.state |= 16 /* isDetaching */;
            this.lifecycle.detached.begin();
            this.lifecycle.unmount.add(this);
            this.detachControllers(flags);
            this.state = (this.state | 48 /* isAttachedOrDetaching */) ^ 48 /* isAttachedOrDetaching */;
            this.lifecycle.detached.end(flags);
        }
        attachControllers(flags) {
            const { controllers } = this;
            if (controllers !== void 0) {
                const { length } = controllers;
                for (let i = 0; i < length; ++i) {
                    controllers[i].attach(flags);
                }
            }
        }
        detachControllers(flags) {
            const { controllers } = this;
            if (controllers !== void 0) {
                for (let i = controllers.length - 1; i >= 0; --i) {
                    controllers[i].detach(flags);
                }
            }
        }
        // #endregion
        // #region mount/unmount/cache
        mountCustomElement(flags) {
            if ((this.state & 64 /* isMounted */) > 0) {
                return;
            }
            this.state |= 64 /* isMounted */;
            // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
            this.projector.project(this.nodes);
        }
        mountSynthetic(flags) {
            this.state |= 64 /* isMounted */;
            // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
            this.nodes.insertBefore(this.location);
        }
        unmountCustomElement(flags) {
            if ((this.state & 64 /* isMounted */) === 0) {
                return;
            }
            this.state = (this.state | 64 /* isMounted */) ^ 64 /* isMounted */;
            // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
            this.projector.take(this.nodes);
        }
        unmountSynthetic(flags) {
            if ((this.state & 64 /* isMounted */) === 0) {
                return false;
            }
            this.state = (this.state | 64 /* isMounted */) ^ 64 /* isMounted */;
            // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
            this.nodes.remove();
            this.nodes.unlink();
            if ((this.state & 32768 /* canBeCached */) > 0) {
                this.state = (this.state | 32768 /* canBeCached */) ^ 32768 /* canBeCached */;
                // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
                if (this.viewCache.tryReturnToCache(this)) {
                    this.state |= 128 /* isCached */;
                    return true;
                }
            }
            return false;
        }
        cacheCustomElement(flags) {
            flags |= 65536 /* fromCache */;
            if (this.hooks.hasCaching) {
                // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
                this.bindingContext.caching(flags);
            }
        }
        cacheCustomAttribute(flags) {
            flags |= 65536 /* fromCache */;
            if (this.hooks.hasCaching) {
                // tslint:disable-next-line: no-non-null-assertion // non-null is implied by the hook
                this.bindingContext.caching(flags);
            }
            const { controllers } = this;
            if (controllers !== void 0) {
                const { length } = controllers;
                for (let i = length - 1; i >= 0; --i) {
                    controllers[i].cache(flags);
                }
            }
        }
        cacheSynthetic(flags) {
            const { controllers } = this;
            if (controllers !== void 0) {
                const { length } = controllers;
                for (let i = length - 1; i >= 0; --i) {
                    controllers[i].cache(flags);
                }
            }
        }
    }
    Controller.lookup = new WeakMap();
    exports.Controller = Controller;
    function createObservers(controller, description, flags, instance) {
        const hasLookup = instance.$observers != void 0;
        const observers = hasLookup ? instance.$observers : {};
        const bindables = description.bindables;
        const observableNames = Object.getOwnPropertyNames(bindables);
        const useProxy = (flags & 2 /* proxyStrategy */) > 0;
        const lifecycle = controller.lifecycle;
        const hasChildrenObservers = 'childrenObservers' in description;
        const length = observableNames.length;
        let name;
        for (let i = 0; i < length; ++i) {
            name = observableNames[i];
            if (observers[name] == void 0) {
                observers[name] = new self_observer_1.SelfObserver(lifecycle, flags, useProxy ? proxy_observer_1.ProxyObserver.getOrCreate(instance).proxy : instance, name, bindables[name].callback);
            }
        }
        if (hasChildrenObservers) {
            const childrenObservers = description.childrenObservers;
            if (childrenObservers) {
                const childObserverNames = Object.getOwnPropertyNames(childrenObservers);
                const { length } = childObserverNames;
                let name;
                for (let i = 0; i < length; ++i) {
                    name = childObserverNames[i];
                    if (observers[name] == void 0) {
                        const childrenDescription = childrenObservers[name];
                        observers[name] = new rendering_engine_1.ChildrenObserver(controller, instance, flags, name, childrenDescription.callback, childrenDescription.query, childrenDescription.filter, childrenDescription.map, childrenDescription.options);
                    }
                }
            }
        }
        if (!useProxy || hasChildrenObservers) {
            Reflect.defineProperty(instance, '$observers', {
                enumerable: false,
                value: observers
            });
        }
    }
    function getBindingContext(flags, instance) {
        if (instance.noProxy === true || (flags & 2 /* proxyStrategy */) === 0) {
            return instance;
        }
        return proxy_observer_1.ProxyObserver.getOrCreate(instance).proxy;
    }
});
//# sourceMappingURL=controller.js.map