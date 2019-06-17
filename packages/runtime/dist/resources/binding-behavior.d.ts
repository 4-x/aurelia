import { Class, Constructable, IResourceDefinition, IResourceKind, IResourceType } from '@aurelia/kernel';
import { LifecycleFlags } from '../flags';
import { IBinding } from '../lifecycle';
import { IScope } from '../observation';
export interface IBindingBehavior {
    bind(flags: LifecycleFlags, scope: IScope, binding: IBinding): void;
    unbind(flags: LifecycleFlags, scope: IScope, binding: IBinding): void;
}
export interface IBindingBehaviorDefinition extends IResourceDefinition {
}
export interface IBindingBehaviorType<C extends Constructable = Constructable> extends IResourceType<IBindingBehaviorDefinition, InstanceType<C> & IBindingBehavior> {
}
export interface IBindingBehaviorResource extends IResourceKind<IBindingBehaviorDefinition, IBindingBehavior, Class<IBindingBehavior>> {
}
export declare function bindingBehavior(definition: IBindingBehaviorDefinition): BindingBehaviorDecorator;
export declare function bindingBehavior(name: string): BindingBehaviorDecorator;
export declare function bindingBehavior(nameOrDefinition: string | IBindingBehaviorDefinition): BindingBehaviorDecorator;
export declare const BindingBehaviorResource: IBindingBehaviorResource;
export declare type BindingBehaviorDecorator = <T extends Constructable>(target: T) => T & IBindingBehaviorType<T>;
//# sourceMappingURL=binding-behavior.d.ts.map