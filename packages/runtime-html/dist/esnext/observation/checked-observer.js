import { __decorate, __metadata } from "tslib";
import { IObserverLocator, subscriberCollection, IScheduler, } from '@aurelia/runtime';
function defaultMatcher(a, b) {
    return a === b;
}
let CheckedObserver = class CheckedObserver {
    constructor(scheduler, flags, observerLocator, handler, obj) {
        this.scheduler = scheduler;
        this.observerLocator = observerLocator;
        this.handler = handler;
        this.obj = obj;
        this.currentValue = void 0;
        this.oldValue = void 0;
        this.hasChanges = false;
        this.task = null;
        this.arrayObserver = void 0;
        this.valueObserver = void 0;
        this.persistentFlags = flags & 805306383 /* targetObserverFlags */;
    }
    getValue() {
        return this.currentValue;
    }
    setValue(newValue, flags) {
        this.currentValue = newValue;
        this.hasChanges = newValue !== this.oldValue;
        if ((flags & 4096 /* fromBind */) > 0 || this.persistentFlags === 268435456 /* noTargetObserverQueue */) {
            this.flushChanges(flags);
        }
        else if (this.persistentFlags !== 536870912 /* persistentTargetObserverQueue */ && this.task === null) {
            this.task = this.scheduler.queueRenderTask(() => {
                this.flushChanges(flags);
                this.task = null;
            });
        }
    }
    flushChanges(flags) {
        if (this.hasChanges) {
            this.hasChanges = false;
            const currentValue = this.currentValue;
            this.oldValue = currentValue;
            if (this.valueObserver === void 0) {
                if (this.obj.$observers !== void 0) {
                    if (this.obj.$observers.model !== void 0) {
                        this.valueObserver = this.obj.$observers.model;
                    }
                    else if (this.obj.$observers.value !== void 0) {
                        this.valueObserver = this.obj.$observers.value;
                    }
                }
                if (this.valueObserver !== void 0) {
                    this.valueObserver.subscribe(this);
                }
            }
            if (this.arrayObserver !== void 0) {
                this.arrayObserver.unsubscribeFromCollection(this);
                this.arrayObserver = void 0;
            }
            if (this.obj.type === 'checkbox' && Array.isArray(currentValue)) {
                this.arrayObserver = this.observerLocator.getArrayObserver(flags, currentValue);
                this.arrayObserver.subscribeToCollection(this);
            }
            this.synchronizeElement();
        }
    }
    handleCollectionChange(indexMap, flags) {
        const { currentValue, oldValue } = this;
        if ((flags & 4096 /* fromBind */) > 0 || this.persistentFlags === 268435456 /* noTargetObserverQueue */) {
            this.oldValue = currentValue;
            this.synchronizeElement();
        }
        else {
            this.hasChanges = true;
        }
        if (this.persistentFlags !== 536870912 /* persistentTargetObserverQueue */ && this.task === null) {
            this.task = this.scheduler.queueRenderTask(() => {
                this.flushChanges(flags);
                this.task = null;
            });
        }
        this.callSubscribers(currentValue, oldValue, flags);
    }
    handleChange(newValue, previousValue, flags) {
        if ((flags & 4096 /* fromBind */) > 0 || this.persistentFlags === 268435456 /* noTargetObserverQueue */) {
            this.synchronizeElement();
        }
        else {
            this.hasChanges = true;
        }
        if (this.persistentFlags !== 536870912 /* persistentTargetObserverQueue */ && this.task === null) {
            this.task = this.scheduler.queueRenderTask(() => this.flushChanges(flags));
        }
        this.callSubscribers(newValue, previousValue, flags);
    }
    synchronizeElement() {
        const currentValue = this.currentValue;
        const obj = this.obj;
        const elementValue = Object.prototype.hasOwnProperty.call(obj, 'model') ? obj.model : obj.value;
        const isRadio = obj.type === 'radio';
        const matcher = obj.matcher !== void 0 ? obj.matcher : defaultMatcher;
        if (isRadio) {
            obj.checked = !!matcher(currentValue, elementValue);
        }
        else if (currentValue === true) {
            obj.checked = true;
        }
        else if (Array.isArray(currentValue)) {
            obj.checked = currentValue.findIndex(item => !!matcher(item, elementValue)) !== -1;
        }
        else {
            obj.checked = false;
        }
    }
    handleEvent() {
        this.oldValue = this.currentValue;
        let { currentValue } = this;
        const { obj } = this;
        const elementValue = Object.prototype.hasOwnProperty.call(obj, 'model') ? obj.model : obj.value;
        let index;
        const matcher = obj.matcher !== void 0 ? obj.matcher : defaultMatcher;
        if (obj.type === 'checkbox') {
            if (Array.isArray(currentValue)) {
                index = currentValue.findIndex(item => !!matcher(item, elementValue));
                if (obj.checked && index === -1) {
                    currentValue.push(elementValue);
                }
                else if (!obj.checked && index !== -1) {
                    currentValue.splice(index, 1);
                }
                // when existing currentValue is array, do not invoke callback as only the array obj has changed
                return;
            }
            currentValue = obj.checked;
        }
        else if (obj.checked) {
            currentValue = elementValue;
        }
        else {
            return;
        }
        this.currentValue = currentValue;
        this.callSubscribers(this.currentValue, this.oldValue, 131072 /* fromDOMEvent */ | 524288 /* allowPublishRoundtrip */);
    }
    bind(flags) {
        if (this.persistentFlags === 536870912 /* persistentTargetObserverQueue */) {
            if (this.task !== null) {
                this.task.cancel();
            }
            this.task = this.scheduler.queueRenderTask(() => this.flushChanges(flags), { persistent: true });
        }
        this.currentValue = this.obj.checked;
    }
    unbind(flags) {
        if (this.arrayObserver !== void 0) {
            this.arrayObserver.unsubscribeFromCollection(this);
            this.arrayObserver = void 0;
        }
        if (this.valueObserver !== void 0) {
            this.valueObserver.unsubscribe(this);
        }
        if (this.task !== null) {
            this.task.cancel();
            this.task = null;
        }
    }
    subscribe(subscriber) {
        if (!this.hasSubscribers()) {
            this.handler.subscribe(this.obj, this);
        }
        this.addSubscriber(subscriber);
    }
    unsubscribe(subscriber) {
        this.removeSubscriber(subscriber);
        if (!this.hasSubscribers()) {
            this.handler.dispose();
        }
    }
};
CheckedObserver = __decorate([
    subscriberCollection(),
    __metadata("design:paramtypes", [Object, Number, Object, Object, Object])
], CheckedObserver);
export { CheckedObserver };
//# sourceMappingURL=checked-observer.js.map