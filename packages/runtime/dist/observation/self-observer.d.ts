import { IIndexable } from '@aurelia/kernel';
import { LifecycleFlags } from '../flags';
import { IPropertyObserver } from '../observation';
export interface SelfObserver extends IPropertyObserver<IIndexable, string> {
}
export declare class SelfObserver implements SelfObserver {
    readonly persistentFlags: LifecycleFlags;
    obj: object;
    propertyKey: string;
    currentValue: unknown;
    private readonly callback;
    constructor(flags: LifecycleFlags, instance: object, propertyName: string, cbName: string);
    handleChange(newValue: unknown, oldValue: unknown, flags: LifecycleFlags): void;
    getValue(): unknown;
    getValueDirect(): unknown;
    setValue(newValue: unknown, flags: LifecycleFlags): void;
    $patch(flags: LifecycleFlags): void;
}
//# sourceMappingURL=self-observer.d.ts.map