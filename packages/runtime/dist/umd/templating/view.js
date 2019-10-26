(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@aurelia/kernel", "../observation/binding-context", "../resources/custom-element", "./controller"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const kernel_1 = require("@aurelia/kernel");
    const binding_context_1 = require("../observation/binding-context");
    const custom_element_1 = require("../resources/custom-element");
    const controller_1 = require("./controller");
    class ViewFactory {
        constructor(name, template, lifecycle) {
            this.name = name;
            this.template = template;
            this.lifecycle = lifecycle;
            this.isCaching = false;
            this.parts = kernel_1.PLATFORM.emptyObject;
            this.cache = null;
            this.cacheSize = -1;
        }
        get parentContextId() {
            return this.template.renderContext.parentId;
        }
        setCacheSize(size, doNotOverrideIfAlreadySet) {
            if (size) {
                if (size === '*') {
                    size = ViewFactory.maxCacheSize;
                }
                else if (typeof size === 'string') {
                    size = parseInt(size, 10);
                }
                if (this.cacheSize === -1 || !doNotOverrideIfAlreadySet) {
                    this.cacheSize = size;
                }
            }
            if (this.cacheSize > 0) {
                this.cache = [];
            }
            else {
                this.cache = null;
            }
            this.isCaching = this.cacheSize > 0;
        }
        canReturnToCache(controller) {
            return this.cache != null && this.cache.length < this.cacheSize;
        }
        tryReturnToCache(controller) {
            if (this.canReturnToCache(controller)) {
                controller.cache(0 /* none */);
                this.cache.push(controller);
                return true;
            }
            return false;
        }
        create(flags) {
            const cache = this.cache;
            let controller;
            if (cache != null && cache.length > 0) {
                controller = cache.pop();
                controller.state = (controller.state | 128 /* isCached */) ^ 128 /* isCached */;
                return controller;
            }
            controller = controller_1.Controller.forSyntheticView(this, this.lifecycle, flags);
            this.template.render(controller, null, this.parts, flags);
            if (!controller.nodes) {
                throw kernel_1.Reporter.error(90);
            }
            return controller;
        }
        addParts(parts) {
            if (Object.keys(parts).length > 0) {
                this.parts = { ...this.parts, ...parts };
            }
        }
    }
    exports.ViewFactory = ViewFactory;
    ViewFactory.maxCacheSize = 0xFFFF;
    const seenViews = new WeakSet();
    function notYetSeen($view) {
        return !seenViews.has($view);
    }
    function toCustomElementDefinition($view) {
        seenViews.add($view);
        return custom_element_1.CustomElementDefinition.create($view);
    }
    exports.Views = {
        name: kernel_1.Protocol.resource.keyFor('views'),
        has(value) {
            return typeof value === 'function' && (kernel_1.Metadata.hasOwn(exports.Views.name, value) || '$views' in value);
        },
        get(value) {
            if (typeof value === 'function' && '$views' in value) {
                // TODO: a `get` operation with side effects is not a good thing. Should refactor this to a proper resource kind.
                const $views = value.$views;
                const definitions = $views.filter(notYetSeen).map(toCustomElementDefinition);
                for (const def of definitions) {
                    exports.Views.add(value, def);
                }
            }
            let views = kernel_1.Metadata.getOwn(exports.Views.name, value);
            if (views === void 0) {
                kernel_1.Metadata.define(exports.Views.name, views = [], value);
            }
            return views;
        },
        add(Type, partialDefinition) {
            const definition = custom_element_1.CustomElementDefinition.create(partialDefinition);
            let views = kernel_1.Metadata.getOwn(exports.Views.name, Type);
            if (views === void 0) {
                kernel_1.Metadata.define(exports.Views.name, views = [definition], Type);
            }
            else {
                views.push(definition);
            }
            return views;
        },
    };
    function view(v) {
        return function (target) {
            exports.Views.add(target, v);
        };
    }
    exports.view = view;
    exports.IViewLocator = kernel_1.DI.createInterface('IViewLocator')
        .noDefault();
    const lifecycleCallbacks = [
        'binding',
        'bound',
        'attaching',
        'attached',
        'detaching',
        'caching',
        'detached',
        'unbinding',
        'unbound'
    ];
    class ViewLocator {
        constructor() {
            this.modelInstanceToBoundComponent = new WeakMap();
            this.modelTypeToUnboundComponent = new Map();
        }
        static register(container) {
            return kernel_1.Registration.singleton(exports.IViewLocator, this).register(container);
        }
        getViewComponentForObject(object, viewNameOrSelector) {
            if (object) {
                const availableViews = exports.Views.has(object.constructor) ? exports.Views.get(object.constructor) : [];
                const resolvedViewName = typeof viewNameOrSelector === 'function'
                    ? viewNameOrSelector(object, availableViews)
                    : this.getViewName(availableViews, viewNameOrSelector);
                return this.getOrCreateBoundComponent(object, availableViews, resolvedViewName);
            }
            return null;
        }
        getOrCreateBoundComponent(object, availableViews, resolvedViewName) {
            let lookup = this.modelInstanceToBoundComponent.get(object);
            let BoundComponent;
            if (lookup === void 0) {
                lookup = {};
                this.modelInstanceToBoundComponent.set(object, lookup);
            }
            else {
                BoundComponent = lookup[resolvedViewName];
            }
            if (BoundComponent === void 0) {
                const UnboundComponent = this.getOrCreateUnboundComponent(object, availableViews, resolvedViewName);
                BoundComponent = custom_element_1.CustomElement.define(custom_element_1.CustomElement.getDefinition(UnboundComponent), class extends UnboundComponent {
                    constructor() {
                        super(object);
                    }
                });
                lookup[resolvedViewName] = BoundComponent;
            }
            return BoundComponent;
        }
        getOrCreateUnboundComponent(object, availableViews, resolvedViewName) {
            let lookup = this.modelTypeToUnboundComponent.get(object.constructor);
            let UnboundComponent;
            if (lookup === void 0) {
                lookup = {};
                this.modelTypeToUnboundComponent.set(object.constructor, lookup);
            }
            else {
                UnboundComponent = lookup[resolvedViewName];
            }
            if (UnboundComponent === void 0) {
                UnboundComponent = custom_element_1.CustomElement.define(this.getView(availableViews, resolvedViewName), class {
                    constructor(viewModel) {
                        this.viewModel = viewModel;
                    }
                    created(flags) {
                        this.$controller.scope = binding_context_1.Scope.fromParent(flags, this.$controller.scope, this.viewModel);
                        if (this.viewModel.created) {
                            this.viewModel.created(flags);
                        }
                    }
                });
                const proto = UnboundComponent.prototype;
                lifecycleCallbacks.forEach(x => {
                    if (x in object) {
                        const fn = function (flags) { return this.viewModel[x](flags); };
                        Reflect.defineProperty(fn, 'name', { configurable: true, value: x });
                        proto[x] = fn;
                    }
                });
                lookup[resolvedViewName] = UnboundComponent;
            }
            return UnboundComponent;
        }
        getViewName(views, requestedName) {
            if (requestedName) {
                return requestedName;
            }
            if (views.length === 1) {
                return views[0].name;
            }
            return 'default-view';
        }
        getView(views, name) {
            const v = views.find(x => x.name === name);
            if (v === void 0) {
                // TODO: Use Reporter
                throw new Error(`Could not find view: ${name}`);
            }
            return v;
        }
    }
    exports.ViewLocator = ViewLocator;
});
//# sourceMappingURL=view.js.map