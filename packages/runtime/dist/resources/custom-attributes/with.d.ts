import { InjectArray, IRegistry } from '@aurelia/kernel';
import { AttributeDefinition, IAttributeDefinition } from '../../definitions';
import { INode, IRenderLocation } from '../../dom';
import { LifecycleFlags } from '../../flags';
import { IBinding, IViewFactory } from '../../lifecycle';
import { IBindingContext } from '../../observation';
import { ICustomAttribute, ICustomAttributeResource } from '../custom-attribute';
export interface With<T extends INode = INode> extends ICustomAttribute<T> {
}
export declare class With<T extends INode = INode> implements With<T> {
    static readonly inject: InjectArray;
    static readonly register: IRegistry['register'];
    static readonly bindables: IAttributeDefinition['bindables'];
    static readonly kind: ICustomAttributeResource;
    static readonly description: AttributeDefinition;
    value: IBinding | IBindingContext;
    private readonly currentView;
    private readonly factory;
    constructor(factory: IViewFactory<T>, location: IRenderLocation<T>);
    valueChanged(this: With): void;
    binding(flags: LifecycleFlags): void;
    attaching(flags: LifecycleFlags): void;
    detaching(flags: LifecycleFlags): void;
    unbinding(flags: LifecycleFlags): void;
    private bindChild;
}
//# sourceMappingURL=with.d.ts.map