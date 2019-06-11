import { IContainer, IRegistry } from '@aurelia/kernel';
import { IActivator } from './activator';
import { IDOM, INode } from './dom';
import { BindingStrategy } from './flags';
import { IController, IHydratedViewModel, ILifecycle } from './lifecycle';
import { ILifecycleTask } from './lifecycle-task';
export interface ISinglePageApp<THost extends INode = INode> {
    enableTimeSlicing?: boolean;
    adaptiveTimeSlicing?: boolean;
    strategy?: BindingStrategy;
    dom?: IDOM;
    host: THost;
    component: unknown;
}
export declare class CompositionRoot<T extends INode = INode> {
    readonly config: ISinglePageApp<T>;
    readonly container: IContainer;
    readonly controller: IController;
    readonly host: T & {
        $au?: Aurelia<T>;
    };
    readonly dom: IDOM<T>;
    readonly viewModel: IHydratedViewModel<T>;
    readonly strategy: BindingStrategy;
    readonly lifecycle: ILifecycle;
    readonly activator: IActivator;
    task: ILifecycleTask;
    hasPendingStartFrame: boolean;
    hasPendingStopFrame: boolean;
    constructor(config: ISinglePageApp<T>, container: IContainer);
    activate(antecedent?: ILifecycleTask): ILifecycleTask;
    deactivate(antecedent?: ILifecycleTask): ILifecycleTask;
}
export declare class Aurelia<TNode extends INode = INode> {
    readonly container: IContainer;
    readonly isRunning: boolean;
    readonly isStarting: boolean;
    readonly isStopping: boolean;
    readonly root: CompositionRoot<TNode>;
    private task;
    private _isRunning;
    private _isStarting;
    private _isStopping;
    private _root?;
    private next?;
    constructor(container?: IContainer);
    register(...params: (IRegistry | Record<string, Partial<IRegistry>>)[]): this;
    app(config: ISinglePageApp<TNode>): this;
    start(root?: CompositionRoot<TNode> | undefined): ILifecycleTask;
    stop(root?: CompositionRoot<TNode> | undefined): ILifecycleTask;
    wait(): Promise<void>;
    private onBeforeStart;
    private onAfterStart;
    private onBeforeStop;
    private onAfterStop;
    private dispatchEvent;
}
export declare const IDOMInitializer: import("@aurelia/kernel").InterfaceSymbol<IDOMInitializer>;
export interface IDOMInitializer {
    initialize(config?: ISinglePageApp): IDOM;
}
//# sourceMappingURL=aurelia.d.ts.map