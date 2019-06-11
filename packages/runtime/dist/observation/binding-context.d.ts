import { IIndexable, StrictPrimitive } from '@aurelia/kernel';
import { LifecycleFlags } from '../flags';
import { IBinding } from '../lifecycle';
import { IBindingContext, IOverrideContext, IScope, ObservedCollection, ObserversLookup } from '../observation';
export declare type BindingContextValue = ObservedCollection | StrictPrimitive | IIndexable;
export declare class BindingContext implements IBindingContext {
    [key: string]: BindingContextValue;
    readonly $synthetic: true;
    $observers: ObserversLookup<IOverrideContext>;
    private constructor();
    /**
     * Create a new synthetic `BindingContext` for use in a `Scope`.
     * @param obj Optional. An existing object or `BindingContext` to (shallow) clone (own) properties from.
     */
    static create(flags: LifecycleFlags, obj?: IIndexable): BindingContext;
    /**
     * Create a new synthetic `BindingContext` for use in a `Scope`.
     * @param key The name of the only property to initialize this `BindingContext` with.
     * @param value The value of the only property to initialize this `BindingContext` with.
     */
    static create(flags: LifecycleFlags, key: string, value: BindingContextValue): BindingContext;
    /**
     * Create a new synthetic `BindingContext` for use in a `Scope`.
     *
     * This overload signature is simply the combined signatures of the other two, and can be used
     * to keep strong typing in situations where the arguments are dynamic.
     */
    static create(flags: LifecycleFlags, keyOrObj?: string | IIndexable, value?: BindingContextValue): BindingContext;
    static get(scope: IScope, name: string, ancestor: number, flags: LifecycleFlags): IBindingContext | IOverrideContext | IBinding;
    getObservers(flags: LifecycleFlags): ObserversLookup<IOverrideContext>;
}
export declare class Scope implements IScope {
    bindingContext: IBindingContext | IBinding;
    overrideContext: IOverrideContext;
    private constructor();
    /**
     * Create a new `Scope` backed by the provided `BindingContext` and a new standalone `OverrideContext`.
     *
     * Use this overload when the scope is for the root component, in a unit test,
     * or when you simply want to prevent binding expressions from traversing up the scope.
     * @param bc The `BindingContext` to back the `Scope` with.
     */
    static create(flags: LifecycleFlags, bc: IBindingContext | IBinding): Scope;
    /**
     * Create a new `Scope` backed by the provided `BindingContext` and `OverrideContext`.
     *
     * @param bc The `BindingContext` to back the `Scope` with.
     * @param oc The `OverrideContext` to back the `Scope` with.
     * If a binding expression attempts to access a property that does not exist on the `BindingContext`
     * during binding, it will traverse up via the `parentOverrideContext` of the `OverrideContext` until
     * it finds the property.
     */
    static create(flags: LifecycleFlags, bc: IBindingContext | IBinding, oc: IOverrideContext): Scope;
    /**
     * Create a new `Scope` backed by the provided `BindingContext` and `OverrideContext`.
     *
     * Use this overload when the scope is for the root component, in a unit test,
     * or when you simply want to prevent binding expressions from traversing up the scope.
     *
     * @param bc The `BindingContext` to back the `Scope` with.
     * @param oc null. This overload is functionally equivalent to not passing this argument at all.
     */
    static create(flags: LifecycleFlags, bc: IBindingContext | IBinding, oc: null): Scope;
    static fromOverride(flags: LifecycleFlags, oc: IOverrideContext): Scope;
    static fromParent(flags: LifecycleFlags, ps: IScope | null, bc: IBindingContext | IBinding): Scope;
}
export declare class OverrideContext implements IOverrideContext {
    [key: string]: ObservedCollection | StrictPrimitive | IIndexable;
    readonly $synthetic: true;
    bindingContext: IBindingContext | IBinding;
    parentOverrideContext: IOverrideContext | null;
    private constructor();
    static create(flags: LifecycleFlags, bc: IBindingContext | IBinding, poc: IOverrideContext | null): OverrideContext;
    getObservers(): ObserversLookup<IOverrideContext>;
}
//# sourceMappingURL=binding-context.d.ts.map