import { Class } from '@aurelia/kernel';
import { IConnectable } from '../ast';
import { IBinding } from '../lifecycle';
import { IProxySubscribable, ISubscribable, ISubscriber } from '../observation';
import { IObserverLocator } from '../observation/observer-locator';
export interface IPartialConnectableBinding extends IBinding, ISubscriber {
    observerLocator: IObserverLocator;
}
export interface IConnectableBinding extends IPartialConnectableBinding, IConnectable {
    id: number;
    observerSlots: number;
    version: number;
    addObserver(observer: ISubscribable | IProxySubscribable): void;
    unobserve(all?: boolean): void;
}
declare type DecoratableConnectable<TProto, TClass> = Class<TProto & Partial<IConnectableBinding> & IPartialConnectableBinding, TClass>;
declare type DecoratedConnectable<TProto, TClass> = Class<TProto & IConnectableBinding, TClass>;
declare function connectableDecorator<TProto, TClass>(target: DecoratableConnectable<TProto, TClass>): DecoratedConnectable<TProto, TClass>;
declare function connectable(): typeof connectableDecorator;
declare namespace connectable {
    var assignIdTo: (instance: IConnectableBinding) => void;
}
export default connectable;
declare function connectable<TProto, TClass>(target: DecoratableConnectable<TProto, TClass>): DecoratedConnectable<TProto, TClass>;
declare namespace connectable {
    var assignIdTo: (instance: IConnectableBinding) => void;
}
export default connectable;
//# sourceMappingURL=connectable.d.ts.map