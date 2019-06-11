import { Immutable } from '@aurelia/kernel';
import { LifecycleFlags } from '../flags';
import { IPropertySubscriber } from '../observation';
declare type Signal = string;
export interface ISignaler {
    signals: Immutable<Record<string, Set<IPropertySubscriber>>>;
    dispatchSignal(name: Signal, flags?: LifecycleFlags): void;
    addSignalListener(name: Signal, listener: IPropertySubscriber): void;
    removeSignalListener(name: Signal, listener: IPropertySubscriber): void;
}
export declare const ISignaler: import("@aurelia/kernel").InterfaceSymbol<ISignaler>;
export {};
//# sourceMappingURL=signaler.d.ts.map