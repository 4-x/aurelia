import { Key, IRegistry } from '@aurelia/kernel';
import { PropertyBinding, IObserverLocator, IScope, LifecycleFlags } from '@aurelia/runtime';
import { CheckedObserver } from '../../observation/checked-observer';
import { IEventSubscriber } from '../../observation/event-manager';
import { SelectValueObserver } from '../../observation/select-value-observer';
import { ValueAttributeObserver } from '../../observation/value-attribute-observer';
export declare type UpdateTriggerableObserver = ((ValueAttributeObserver & Required<ValueAttributeObserver>) | (CheckedObserver & Required<CheckedObserver>) | (SelectValueObserver & Required<SelectValueObserver>)) & {
    originalHandler?: IEventSubscriber;
};
export declare type UpdateTriggerableBinding = PropertyBinding & {
    targetObserver: UpdateTriggerableObserver;
};
export declare class UpdateTriggerBindingBehavior {
    static readonly inject: readonly Key[];
    static register: IRegistry['register'];
    persistentFlags: LifecycleFlags;
    private readonly observerLocator;
    constructor(observerLocator: IObserverLocator);
    bind(flags: LifecycleFlags, scope: IScope, binding: UpdateTriggerableBinding, ...events: string[]): void;
    unbind(flags: LifecycleFlags, scope: IScope, binding: UpdateTriggerableBinding): void;
}
//# sourceMappingURL=update-trigger.d.ts.map