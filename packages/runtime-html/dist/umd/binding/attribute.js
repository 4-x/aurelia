(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "@aurelia/kernel", "@aurelia/runtime", "../observation/element-attribute-observer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tslib_1 = require("tslib");
    const kernel_1 = require("@aurelia/kernel");
    const runtime_1 = require("@aurelia/runtime");
    const element_attribute_observer_1 = require("../observation/element-attribute-observer");
    const slice = Array.prototype.slice;
    // BindingMode is not a const enum (and therefore not inlined), so assigning them to a variable to save a member accessor is a minor perf tweak
    const { oneTime, toView, fromView } = runtime_1.BindingMode;
    // pre-combining flags for bitwise checks is a minor perf tweak
    const toViewOrOneTime = toView | oneTime;
    /**
     * Attribute binding. Handle attribute binding betwen view/view model. Understand Html special attributes
     */
    let AttributeBinding = class AttributeBinding {
        constructor(sourceExpression, target, 
        // some attributes may have inner structure
        // such as class -> collection of class names
        // such as style -> collection of style rules
        //
        // for normal attributes, targetAttribute and targetProperty are the same and can be ignore
        targetAttribute, targetKey, mode, observerLocator, locator) {
            runtime_1.connectable.assignIdTo(this);
            this.$state = 0 /* none */;
            this.$lifecycle = locator.get(runtime_1.ILifecycle);
            this.$scope = null;
            this.locator = locator;
            this.mode = mode;
            this.observerLocator = observerLocator;
            this.sourceExpression = sourceExpression;
            this.target = target;
            this.targetAttribute = targetAttribute;
            this.targetProperty = targetKey;
            this.persistentFlags = 0 /* none */;
        }
        updateTarget(value, flags) {
            flags |= this.persistentFlags;
            this.targetObserver.setValue(value, flags | 16 /* updateTargetInstance */);
        }
        updateSource(value, flags) {
            flags |= this.persistentFlags;
            this.sourceExpression.assign(flags | 32 /* updateSourceExpression */, this.$scope, this.locator, value);
        }
        handleChange(newValue, _previousValue, flags) {
            if (kernel_1.Tracer.enabled) {
                kernel_1.Tracer.enter('Binding', 'handleChange', slice.call(arguments));
            }
            if (!(this.$state & 4 /* isBound */)) {
                if (kernel_1.Tracer.enabled) {
                    kernel_1.Tracer.leave();
                }
                return;
            }
            flags |= this.persistentFlags;
            if (this.mode === runtime_1.BindingMode.fromView) {
                flags &= ~16 /* updateTargetInstance */;
                flags |= 32 /* updateSourceExpression */;
            }
            if (flags & 16 /* updateTargetInstance */) {
                const previousValue = this.targetObserver.getValue();
                // if the only observable is an AccessScope then we can assume the passed-in newValue is the correct and latest value
                if (this.sourceExpression.$kind !== 10082 /* AccessScope */ || this.observerSlots > 1) {
                    newValue = this.sourceExpression.evaluate(flags, this.$scope, this.locator, this.part);
                }
                if (newValue !== previousValue) {
                    this.updateTarget(newValue, flags);
                }
                if ((this.mode & oneTime) === 0) {
                    this.version++;
                    this.sourceExpression.connect(flags, this.$scope, this, this.part);
                    this.unobserve(false);
                }
                if (kernel_1.Tracer.enabled) {
                    kernel_1.Tracer.leave();
                }
                return;
            }
            if (flags & 32 /* updateSourceExpression */) {
                if (newValue !== this.sourceExpression.evaluate(flags, this.$scope, this.locator, this.part)) {
                    this.updateSource(newValue, flags);
                }
                if (kernel_1.Tracer.enabled) {
                    kernel_1.Tracer.leave();
                }
                return;
            }
            throw kernel_1.Reporter.error(15, flags);
        }
        $bind(flags, scope, part) {
            if (kernel_1.Tracer.enabled) {
                kernel_1.Tracer.enter('Binding', '$bind', slice.call(arguments));
            }
            if (this.$state & 4 /* isBound */) {
                if (this.$scope === scope) {
                    if (kernel_1.Tracer.enabled) {
                        kernel_1.Tracer.leave();
                    }
                    return;
                }
                this.$unbind(flags | 4096 /* fromBind */);
            }
            // add isBinding flag
            this.$state |= 1 /* isBinding */;
            // Store flags which we can only receive during $bind and need to pass on
            // to the AST during evaluate/connect/assign
            this.persistentFlags = flags & 536870927 /* persistentBindingFlags */;
            this.$scope = scope;
            this.part = part;
            let sourceExpression = this.sourceExpression;
            if (runtime_1.hasBind(sourceExpression)) {
                sourceExpression.bind(flags, scope, this);
            }
            let targetObserver = this.targetObserver;
            if (!targetObserver) {
                targetObserver = this.targetObserver = new element_attribute_observer_1.AttributeObserver(this.$lifecycle, this.observerLocator, this.target, this.targetProperty, this.targetAttribute);
            }
            if (targetObserver.bind) {
                targetObserver.bind(flags);
            }
            // during bind, binding behavior might have changed sourceExpression
            sourceExpression = this.sourceExpression;
            if (this.mode & toViewOrOneTime) {
                this.updateTarget(sourceExpression.evaluate(flags, scope, this.locator, part), flags);
            }
            if (this.mode & toView) {
                sourceExpression.connect(flags, scope, this, part);
            }
            if (this.mode & fromView) {
                targetObserver[this.id] |= 32 /* updateSourceExpression */;
                targetObserver.subscribe(this);
            }
            // add isBound flag and remove isBinding flag
            this.$state |= 4 /* isBound */;
            this.$state &= ~1 /* isBinding */;
            if (kernel_1.Tracer.enabled) {
                kernel_1.Tracer.leave();
            }
        }
        $unbind(flags) {
            if (kernel_1.Tracer.enabled) {
                kernel_1.Tracer.enter('Binding', '$unbind', slice.call(arguments));
            }
            if (!(this.$state & 4 /* isBound */)) {
                if (kernel_1.Tracer.enabled) {
                    kernel_1.Tracer.leave();
                }
                return;
            }
            // add isUnbinding flag
            this.$state |= 2 /* isUnbinding */;
            // clear persistent flags
            this.persistentFlags = 0 /* none */;
            if (runtime_1.hasUnbind(this.sourceExpression)) {
                this.sourceExpression.unbind(flags, this.$scope, this);
            }
            this.$scope = null;
            if (this.targetObserver.unbind) {
                this.targetObserver.unbind(flags);
            }
            if (this.targetObserver.unsubscribe) {
                this.targetObserver.unsubscribe(this);
                this.targetObserver[this.id] &= ~32 /* updateSourceExpression */;
            }
            this.unobserve(true);
            // remove isBound and isUnbinding flags
            this.$state &= ~(4 /* isBound */ | 2 /* isUnbinding */);
            if (kernel_1.Tracer.enabled) {
                kernel_1.Tracer.leave();
            }
        }
        connect(flags) {
            if (kernel_1.Tracer.enabled) {
                kernel_1.Tracer.enter('Binding', 'connect', slice.call(arguments));
            }
            if (this.$state & 4 /* isBound */) {
                flags |= this.persistentFlags;
                this.sourceExpression.connect(flags | 2097152 /* mustEvaluate */, this.$scope, this, this.part); // why do we have a connect method here in the first place? will this be called after bind?
            }
            if (kernel_1.Tracer.enabled) {
                kernel_1.Tracer.leave();
            }
        }
    };
    AttributeBinding = tslib_1.__decorate([
        runtime_1.connectable()
    ], AttributeBinding);
    exports.AttributeBinding = AttributeBinding;
});
//# sourceMappingURL=attribute.js.map