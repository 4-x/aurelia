(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "@aurelia/runtime"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tslib_1 = require("tslib");
    const runtime_1 = require("@aurelia/runtime");
    // TODO: handle file attribute properly again, etc
    let ValueAttributeObserver = class ValueAttributeObserver {
        constructor(lifecycle, flags, handler, obj, propertyKey) {
            this.lifecycle = lifecycle;
            this.handler = handler;
            this.obj = obj;
            this.propertyKey = propertyKey;
            this.currentValue = '';
            this.oldValue = '';
            this.hasChanges = false;
            this.priority = 12288 /* propagate */;
            this.persistentFlags = flags & 1610612751 /* targetObserverFlags */;
        }
        getValue() {
            return this.currentValue;
        }
        setValue(newValue, flags) {
            this.currentValue = newValue;
            this.hasChanges = newValue !== this.oldValue;
            if ((flags & 4096 /* fromBind */) > 0 || this.persistentFlags === 536870912 /* noTargetObserverQueue */) {
                this.flushRAF(flags);
            }
            else if (this.persistentFlags !== 1073741824 /* persistentTargetObserverQueue */) {
                this.lifecycle.enqueueRAF(this.flushRAF, this, this.priority, true);
            }
        }
        flushRAF(flags) {
            if (this.hasChanges) {
                this.hasChanges = false;
                const { currentValue, oldValue } = this;
                this.oldValue = currentValue;
                if (currentValue == void 0) {
                    this.obj[this.propertyKey] = '';
                }
                else {
                    this.obj[this.propertyKey] = currentValue;
                }
                if ((flags & 4096 /* fromBind */) === 0) {
                    this.callSubscribers(currentValue, oldValue, flags);
                }
            }
        }
        handleEvent() {
            const oldValue = this.oldValue = this.currentValue;
            const currentValue = this.currentValue = this.obj[this.propertyKey];
            if (oldValue !== currentValue) {
                this.oldValue = currentValue;
                this.callSubscribers(currentValue, oldValue, 131072 /* fromDOMEvent */ | 524288 /* allowPublishRoundtrip */);
            }
        }
        subscribe(subscriber) {
            if (!this.hasSubscribers()) {
                this.handler.subscribe(this.obj, this);
                this.currentValue = this.oldValue = this.obj[this.propertyKey];
            }
            this.addSubscriber(subscriber);
        }
        unsubscribe(subscriber) {
            this.removeSubscriber(subscriber);
            if (!this.hasSubscribers()) {
                this.handler.dispose();
            }
        }
        bind(flags) {
            if (this.persistentFlags === 1073741824 /* persistentTargetObserverQueue */) {
                this.lifecycle.enqueueRAF(this.flushRAF, this, this.priority);
            }
        }
        unbind(flags) {
            if (this.persistentFlags === 1073741824 /* persistentTargetObserverQueue */) {
                this.lifecycle.dequeueRAF(this.flushRAF, this);
            }
        }
    };
    ValueAttributeObserver = tslib_1.__decorate([
        runtime_1.subscriberCollection()
    ], ValueAttributeObserver);
    exports.ValueAttributeObserver = ValueAttributeObserver;
});
//# sourceMappingURL=value-attribute-observer.js.map