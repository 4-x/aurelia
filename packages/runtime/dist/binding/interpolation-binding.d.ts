import { IServiceLocator } from '@aurelia/kernel';
import { IExpression, IInterpolationExpression } from '../ast';
import { BindingMode, LifecycleFlags, State } from '../flags';
import { IBinding } from '../lifecycle';
import { IBindingTargetAccessor, IObservable, IScope } from '../observation';
import { IObserverLocator } from '../observation/observer-locator';
import { IConnectableBinding, IPartialConnectableBinding } from './connectable';
export declare class MultiInterpolationBinding implements IBinding {
    $nextBinding: IBinding;
    $prevBinding: IBinding;
    $state: State;
    $scope: IScope;
    interpolation: IInterpolationExpression;
    observerLocator: IObserverLocator;
    locator: IServiceLocator;
    mode: BindingMode;
    parts: InterpolationBinding[];
    target: IObservable;
    targetProperty: string;
    constructor(observerLocator: IObserverLocator, interpolation: IInterpolationExpression, target: IObservable, targetProperty: string, mode: BindingMode, locator: IServiceLocator);
    $bind(flags: LifecycleFlags, scope: IScope): void;
    $unbind(flags: LifecycleFlags): void;
}
export interface InterpolationBinding extends IConnectableBinding {
}
export declare class InterpolationBinding implements IPartialConnectableBinding {
    id: string;
    $scope: IScope;
    $state: State;
    interpolation: IInterpolationExpression;
    isFirst: boolean;
    locator: IServiceLocator;
    mode: BindingMode;
    observerLocator: IObserverLocator;
    sourceExpression: IExpression;
    target: IObservable;
    targetProperty: string;
    targetObserver: IBindingTargetAccessor;
    constructor(sourceExpression: IExpression, interpolation: IInterpolationExpression, target: IObservable, targetProperty: string, mode: BindingMode, observerLocator: IObserverLocator, locator: IServiceLocator, isFirst: boolean);
    updateTarget(value: unknown, flags: LifecycleFlags): void;
    handleChange(_newValue: unknown, _previousValue: unknown, flags: LifecycleFlags): void;
    $bind(flags: LifecycleFlags, scope: IScope): void;
    $unbind(flags: LifecycleFlags): void;
}
//# sourceMappingURL=interpolation-binding.d.ts.map