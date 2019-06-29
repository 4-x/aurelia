(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "@aurelia/kernel", "../flags", "../lifecycle", "./ast", "./connectable"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tslib_1 = require("tslib");
    const kernel_1 = require("@aurelia/kernel");
    const flags_1 = require("../flags");
    const lifecycle_1 = require("../lifecycle");
    const ast_1 = require("./ast");
    const connectable_1 = require("./connectable");
    const slice = Array.prototype.slice;
    // BindingMode is not a const enum (and therefore not inlined), so assigning them to a variable to save a member accessor is a minor perf tweak
    const { oneTime, toView, fromView } = flags_1.BindingMode;
    // pre-combining flags for bitwise checks is a minor perf tweak
    const toViewOrOneTime = toView | oneTime;
    let PropertyBinding = class PropertyBinding {
        constructor(sourceExpression, target, targetProperty, mode, observerLocator, locator) {
            connectable_1.connectable.assignIdTo(this);
            this.$state = 0 /* none */;
            this.$lifecycle = locator.get(lifecycle_1.ILifecycle);
            this.$scope = void 0;
            this.locator = locator;
            this.mode = mode;
            this.observerLocator = observerLocator;
            this.sourceExpression = sourceExpression;
            this.target = target;
            this.targetProperty = targetProperty;
            this.targetObserver = void 0;
            this.persistentFlags = 0 /* none */;
        }
        updateTarget(value, flags) {
            flags |= this.persistentFlags;
            this.targetObserver.setValue(value, flags);
        }
        updateSource(value, flags) {
            flags |= this.persistentFlags;
            this.sourceExpression.assign(flags, this.$scope, this.locator, value, this.part);
        }
        handleChange(newValue, _previousValue, flags) {
            if (kernel_1.Tracer.enabled) {
                kernel_1.Tracer.enter('Binding', 'handleChange', slice.call(arguments));
            }
            if ((this.$state & 4 /* isBound */) === 0) {
                if (kernel_1.Tracer.enabled) {
                    kernel_1.Tracer.leave();
                }
                return;
            }
            flags |= this.persistentFlags;
            if ((flags & 16 /* updateTargetInstance */) > 0) {
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
            if ((flags & 32 /* updateSourceExpression */) > 0) {
                if (newValue !== this.sourceExpression.evaluate(flags, this.$scope, this.locator, this.part)) {
                    this.updateSource(newValue, flags);
                }
                if (kernel_1.Tracer.enabled) {
                    kernel_1.Tracer.leave();
                }
                return;
            }
            if (kernel_1.Tracer.enabled) {
                kernel_1.Tracer.leave();
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
            if (ast_1.hasBind(sourceExpression)) {
                sourceExpression.bind(flags, scope, this);
            }
            let targetObserver = this.targetObserver;
            if (!targetObserver) {
                if (this.mode & fromView) {
                    targetObserver = this.targetObserver = this.observerLocator.getObserver(flags, this.target, this.targetProperty);
                }
                else {
                    targetObserver = this.targetObserver = this.observerLocator.getAccessor(flags, this.target, this.targetProperty);
                }
            }
            if (this.mode !== flags_1.BindingMode.oneTime && targetObserver.bind) {
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
                targetObserver.subscribe(this);
                targetObserver[this.id] |= 32 /* updateSourceExpression */;
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
            if (ast_1.hasUnbind(this.sourceExpression)) {
                this.sourceExpression.unbind(flags, this.$scope, this);
            }
            this.$scope = void 0;
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
    };
    PropertyBinding = tslib_1.__decorate([
        connectable_1.connectable()
    ], PropertyBinding);
    exports.PropertyBinding = PropertyBinding;
});
//# sourceMappingURL=property-binding.js.map