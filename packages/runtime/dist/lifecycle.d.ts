import { IContainer, IDisposable, Immutable, InjectArray, IResolver, IServiceLocator } from '@aurelia/kernel';
import { ITargetedInstruction, TemplateDefinition, TemplatePartDefinitions } from './definitions';
import { INode, INodeSequence, IRenderLocation } from './dom';
import { Hooks, LifecycleFlags, State } from './flags';
import { IChangeTracker, IPatchable, IScope } from './observation';
export interface IState {
    $state?: State;
    $lifecycle?: ILifecycle;
}
export interface IBinding {
    readonly $nextBinding: IBinding | null;
    readonly $prevBinding: IBinding | null;
    readonly locator: IServiceLocator;
    readonly $scope: IScope | null;
    readonly $state: State;
    $bind(flags: LifecycleFlags, scope: IScope): void;
    $unbind(flags: LifecycleFlags): void;
}
/**
 * An object containing the necessary information to render something for display.
 */
export interface IRenderable<T extends INode = INode> extends IState {
    /**
     * The Bindings that belong to this instance.
     */
    $bindingHead?: IBinding;
    $bindingTail?: IBinding;
    /**
     * The Views, CustomElements, CustomAttributes and other components that are children of this instance.
     */
    $componentHead?: IComponent;
    $componentTail?: IComponent;
    /**
     * The (dependency) context of this instance.
     *
     * Contains any dependencies required by this instance or its children.
     */
    readonly $context: IRenderContext<T>;
    /**
     * The nodes that represent the visible aspect of this instance.
     *
     * Typically this will be a sequence of `DOM` nodes contained in a `DocumentFragment`
     */
    readonly $nodes: INodeSequence<T>;
    /**
     * The binding scope that the `$bindables` of this instance will be bound to.
     *
     * This includes the `BindingContext` which can be either a user-defined view model instance, or a synthetic view model instantiated by a `templateController`
     */
    readonly $scope: IScope;
}
export declare const IRenderable: import("@aurelia/kernel").InterfaceSymbol<IRenderable<INode>>;
export interface IRenderContext<T extends INode = INode> extends IServiceLocator {
    createChild(): IRenderContext<T>;
    render(flags: LifecycleFlags, renderable: IRenderable<T>, targets: ArrayLike<object>, templateDefinition: TemplateDefinition, host?: T, parts?: TemplatePartDefinitions): void;
    beginComponentOperation(renderable: IRenderable<T>, target: object, instruction: Immutable<ITargetedInstruction>, factory?: IViewFactory<T>, parts?: TemplatePartDefinitions, location?: IRenderLocation<T>, locationIsContainer?: boolean): IDisposable;
}
export interface IView<T extends INode = INode> extends IRenderable<T>, IMountableComponent {
    readonly cache: IViewCache<T>;
    readonly isFree: boolean;
    readonly location: IRenderLocation<T>;
    /**
     * Reserves this `IView` for mounting at a particular `IRenderLocation`.
     * Also marks this `IView` such that it cannot be returned to the cache until
     * it is released again.
     *
     * @param location The RenderLocation before which the view will be appended to the DOM.
     */
    hold(location: IRenderLocation<T>): void;
    /**
     * Marks this `IView` such that it can be returned to the cache when it is unmounted.
     *
     * If this `IView` is not currently attached, it will be unmounted immediately.
     *
     * @param flags The `LifecycleFlags` to pass to the unmount operation (only effective
     * if the view is already in detached state).
     *
     * @returns Whether this `IView` can/will be returned to cache
     */
    release(flags: LifecycleFlags): boolean;
    lockScope(scope: IScope): void;
}
export interface IViewCache<T extends INode = INode> {
    readonly isCaching: boolean;
    setCacheSize(size: number | '*', doNotOverrideIfAlreadySet: boolean): void;
    canReturnToCache(view: IView<T>): boolean;
    tryReturnToCache(view: IView<T>): boolean;
}
export interface IViewFactory<T extends INode = INode> extends IViewCache<T> {
    readonly name: string;
    create(flags?: LifecycleFlags): IView<T>;
}
export declare const IViewFactory: import("@aurelia/kernel").InterfaceSymbol<IViewFactory<INode>>;
/**
 * Defines optional lifecycle hooks that will be called only when they are implemented.
 */
export interface ILifecycleHooks extends IState {
    $hooks?: Hooks;
    /**
     * Called at the end of `$hydrate`.
     *
     * @description
     * This is the second and last "hydrate" lifecycle hook (after `render`). It happens only once per instance (contrary to bind/attach
     * which can happen many times per instance), though it can happen many times per type (once for each instance)
     *
     * This hook is called right before the `$bind` lifecycle starts, making this the last opportunity
     * for any high-level post processing on initialized properties.
     */
    created?(flags: LifecycleFlags): void;
    /**
     * Called at the start of `$bind`, before this instance and its children (if any) are bound.
     *
     * @description
     * This is the first "create" lifecycle hook of the hooks that can occur multiple times per instance,
     * and the third lifecycle hook (after `render` and `created`) of the very first this.lifecycle.
     */
    binding?(flags: LifecycleFlags): void;
    /**
     * Called at the end of `$bind`, after this instance and its children (if any) are bound.
     *
     * @description
     * This is the second "create" lifecycle hook (after `binding`) of the hooks that can occur multiple times per instance,
     * and the fourth lifecycle hook (after `render`, `created` and `binding`) of the very first this.lifecycle.
     */
    bound?(flags: LifecycleFlags): void;
    /**
     * Called at the start of `$unbind`, before this instance and its children (if any) are unbound.
     *
     * @description
     * This is the fourth "cleanup" lifecycle hook (after `detaching`, `caching` and `detached`)
     *
     * Last opportunity to perform any source or target updates before the bindings are disconnected.
     *
     */
    unbinding?(flags: LifecycleFlags): void;
    /**
     * Called at the end of `$unbind`, after this instance and its children (if any) are unbound.
     *
     * @description
     * This is the fifth (and last) "cleanup" lifecycle hook (after `detaching`, `caching`, `detached`
     * and `unbinding`).
     *
     * The lifecycle either ends here, or starts at `$bind` again.
     */
    unbound?(flags: LifecycleFlags): void;
    /**
     * Called at the start of `$attach`, before this instance and its children (if any) are attached.
     *
     * @description
     * This is the third "create" lifecycle hook (after `binding` and `bound`) of the hooks that can occur multiple times per instance,
     * and the fifth lifecycle hook (after `render`, `created`, `binding` and `bound`) of the very first lifecycle
     *
     * This is the time to add any (sync or async) tasks (e.g. animations) to the lifecycle that need to happen before
     * the nodes are added to the DOM.
     */
    attaching?(flags: LifecycleFlags): void;
    /**
     * Called at the end of `$attach`, after this instance and its children (if any) are attached.
     *
     * @description
     * This is the fourth (and last) "create" lifecycle hook (after `binding`, `bound` and `attaching`) of the hooks that can occur
     * multiple times per instance, and the sixth lifecycle hook (after `render`, `created`, `binding`, `bound` and `attaching`)
     * of the very first lifecycle
     *
     * This instance and its children (if any) can be assumed
     * to be fully initialized, bound, rendered, added to the DOM and ready for use.
     */
    attached?(flags: LifecycleFlags): void;
    /**
     * Called at the start of `$detach`, before this instance and its children (if any) are detached.
     *
     * @description
     * This is the first "cleanup" lifecycle hook.
     *
     * This is the time to add any (sync or async) tasks (e.g. animations) to the lifecycle that need to happen before
     * the nodes are removed from the DOM.
     */
    detaching?(flags: LifecycleFlags): void;
    /**
     * Called at the end of `$detach`, after this instance and its children (if any) are detached.
     *
     * @description
     * This is the third "cleanup" lifecycle hook (after `detaching` and `caching`).
     *
     * The `$nodes` are now removed from the DOM and the `View` (if possible) is returned to cache.
     *
     * If no `$unbind` lifecycle is queued, this is the last opportunity to make state changes before the lifecycle ends.
     */
    detached?(flags: LifecycleFlags): void;
    /**
     * Called during `$unmount` (which happens during `$detach`), specifically after the
     * `$nodes` are removed from the DOM, but before the view is actually added to the cache.
     *
     * @description
     * This is the second "cleanup" lifecycle hook.
     *
     * This lifecycle is invoked if and only if the `ViewFactory` that created the `View` allows the view to be cached.
     *
     * Usually this hook is not invoked unless you explicitly set the cache size to to something greater than zero
     * on the resource description.
     */
    caching?(flags: LifecycleFlags): void;
}
export interface IComponent extends IPatchable {
    readonly $nextComponent: IComponent | null;
    readonly $prevComponent: IComponent | null;
    $nextUnbindAfterDetach: IComponent | null;
    $bind(flags: LifecycleFlags, scope?: IScope): void;
    $unbind(flags: LifecycleFlags): void;
    $attach(flags: LifecycleFlags): void;
    $detach(flags: LifecycleFlags): void;
    $cache(flags: LifecycleFlags): void;
}
export interface IMountableComponent extends IComponent {
    /**
     * Add the `$nodes` of this instance to the Host or RenderLocation that this instance is holding.
     */
    $mount(flags: LifecycleFlags): void;
    /**
     * Remove the `$nodes` of this instance from the Host or RenderLocation that this instance is holding, optionally returning them to a cache.
     * @returns
     * - `true` if the instance has been returned to the cache.
     * - `false` if the cache (typically ViewFactory) did not allow the instance to be cached.
     * - `undefined` (void) if the instance does not support caching. Functionally equivalent to `false`
     */
    $unmount(flags: LifecycleFlags): boolean | void;
}
export interface ILifecycle {
    processFlushQueue(flags: LifecycleFlags): void;
    /**
     * Queue a flush() callback to be executed either on the next promise tick or on the next
     * bind lifecycle (if during startTask) or on the next attach lifecycle.
     *
     * This method is idempotent; adding the same item more than once has the same effect as
     * adding it once.
     *
     * This queue is primarily used by DOM target observers and collection observers.
     */
    enqueueFlush(requestor: IChangeTracker): Promise<void>;
    processBindQueue(flags: LifecycleFlags): void;
    processUnbindQueue(flags: LifecycleFlags): void;
    /**
     * Open up / expand a bind batch for enqueueing `bound` callbacks.
     *
     * When the top-most caller calls `endBind`, the `bound` callbacks will be invoked.
     *
     * Each `beginBind` *must* be matched by an `endBind`.
     */
    beginBind(): void;
    /**
     * Add a `bound` callback to the queue, to be invoked when the current bind batch
     * is ended via `endBind` by the top-most caller.
     *
     * This method is idempotent; adding the same item more than once has the same effect as
     * adding it once.
     */
    enqueueBound(requestor: ILifecycleHooks): void;
    /**
     * Close / shrink a bind batch for invoking queued `bound` callbacks.
     * @param flags The flags that will be passed into the `bound` callbacks.
     *
     * Flags during bind are primarily for optimization purposes, and to control whether
     * changes are batched or propagated synchronously.
     * If unsure which flags to provide, it's OK to use `LifecycleFlags.none` (or simply `0`)
     * This default will work, but is generally less efficient.
     */
    endBind(flags: LifecycleFlags): ILifecycleTask;
    /**
     * Open up / expand an unbind batch for enqueueing `unbound` callbacks.
     *
     * When the top-most caller calls `endUnbind`, the `unbound` callbacks will be invoked.
     *
     * Each `beginUnbind` *must* be matched by an `endUnbind`.
     */
    beginUnbind(): void;
    /**
     * Add an `unbound` callback to the queue, to be invoked when the current unbind batch
     * is ended via `endUnbind` by the top-most caller.
     *
     * This method is idempotent; adding the same item more than once has the same effect as
     * adding it once.
     */
    enqueueUnbound(requestor: ILifecycleHooks): void;
    /**
     * Close / shrink an unbind batch for invoking queued `unbound` callbacks.
     * @param flags The flags that will be passed into the `unbound` callbacks.
     *
     * Flags during unbind are primarily for optimization purposes, and to control whether
     * changes are batched or propagated synchronously.
     * If unsure which flags to provide, it's OK to use `LifecycleFlags.none` (or simply `0`)
     * This default will work, but is generally less efficient.
     */
    endUnbind(flags: LifecycleFlags): ILifecycleTask;
    processAttachQueue(flags: LifecycleFlags): void;
    processDetachQueue(flags: LifecycleFlags): void;
    /**
     * Open up / expand an attach batch for enqueueing `$mount` and `attached` callbacks.
     *
     * When the top-most caller calls `endAttach`, the `$mount` and `attached` callbacks
     * will be invoked (in that order).
     *
     * Each `beginAttach` *must* be matched by an `endAttach`.
     */
    beginAttach(): void;
    /**
     * Add a `$mount` callback to the queue, to be invoked when the current attach batch
     * is ended via `endAttach` by the top-most caller.
     *
     * This method is idempotent; adding the same item more than once has the same effect as
     * adding it once.
     */
    enqueueMount(requestor: IMountableComponent): void;
    /**
     * Add an `attached` callback to the queue, to be invoked when the current attach batch
     * is ended via `endAttach` by the top-most caller.
     *
     * This method is idempotent; adding the same item more than once has the same effect as
     * adding it once.
     */
    enqueueAttached(requestor: ILifecycleHooks): void;
    /**
     * Close / shrink an attach batch for invoking queued `$mount` and `attached` callbacks.
     * @param flags The flags that will be passed into the `$mount` and `attached` callbacks.
     *
     * Flags during attach are primarily for optimization purposes.
     * If unsure which flags to provide, it's OK to use `LifecycleFlags.none` (or simply `0`)
     * This default will work, but is generally less efficient.
     */
    endAttach(flags: LifecycleFlags): ILifecycleTask;
    /**
     * Open up / expand a detach batch for enqueueing `$unmount` and `detached` callbacks.
     *
     * When the top-most caller calls `endAttach`, the `$unmount` and `detached` callbacks
     * will be invoked (in that order).
     *
     * Each `beginAttach` *must* be matched by an `endAttach`.
     */
    beginDetach(): void;
    /**
     * Add a `$unmount` callback to the queue, to be invoked when the current detach batch
     * is ended via `endAttach` by the top-most caller.
     *
     * This method is idempotent; adding the same item more than once has the same effect as
     * adding it once.
     */
    enqueueUnmount(requestor: IMountableComponent): void;
    /**
     * Add a `detached` callback to the queue, to be invoked when the current detach batch
     * is ended via `endAttach` by the top-most caller.
     *
     * This method is idempotent; adding the same item more than once has the same effect as
     * adding it once.
     */
    enqueueDetached(requestor: ILifecycleHooks): void;
    /**
     * Add an `$unbind` callback to the queue, to be invoked when the current detach batch
     * is ended via `endAttach` by the top-most caller. The callback is invoked after all the
     * `$unmount` and `detached` callbacks are processed.
     *
     * This method is idempotent; adding the same item more than once has the same effect as
     * adding it once.
     */
    enqueueUnbindAfterDetach(requestor: IComponent): void;
    /**
     * Close / shrink a detach batch for invoking queued `$unmount` and `detached` callbacks.
     * @param flags The flags that will be passed into the `$unmount` and `detached` callbacks.
     *
     * Flags during detach are primarily for optimization purposes, and to control whether a
     * component should be unmounted or not (the default is to only unmount root nodes).
     * If unsure which flags to provide, it's OK to use `LifecycleFlags.none` (or simply `0`).
     * This default will work, but is generally less efficient.
     */
    endDetach(flags: LifecycleFlags): ILifecycleTask;
    registerTask(task: ILifecycleTask): void;
    finishTask(task: ILifecycleTask): void;
}
export declare const ILifecycle: import("@aurelia/kernel").InterfaceSymbol<ILifecycle>;
export declare class CompositionCoordinator {
    static readonly inject: InjectArray;
    readonly $lifecycle: ILifecycle;
    onSwapComplete: () => void;
    private currentView;
    private isAttached;
    private isBound;
    private queue;
    private scope;
    private swapTask;
    constructor($lifecycle: ILifecycle);
    static register(container: IContainer): IResolver<CompositionCoordinator>;
    compose(value: IView | Promise<IView>, flags: LifecycleFlags): void;
    binding(flags: LifecycleFlags, scope: IScope): void;
    attaching(flags: LifecycleFlags): void;
    detaching(flags: LifecycleFlags): void;
    unbinding(flags: LifecycleFlags): void;
    caching(flags: LifecycleFlags): void;
    private enqueue;
    private swap;
    private processNext;
}
export declare const LifecycleTask: {
    done: {
        done: boolean;
        canCancel(): boolean;
        cancel(): void;
        wait(): Promise<unknown>;
    };
};
export interface ILifecycleTask<T = unknown> {
    readonly done: boolean;
    canCancel(): boolean;
    cancel(): void;
    wait(): Promise<T>;
}
export declare class AggregateLifecycleTask implements ILifecycleTask<void> {
    done: boolean;
    private readonly tasks;
    private resolve;
    private waiter;
    constructor();
    addTask(task: ILifecycleTask): void;
    removeTask(task: ILifecycleTask): void;
    canCancel(): boolean;
    cancel(): void;
    wait(): Promise<void>;
    private tryComplete;
    private complete;
}
/**
 * A general-purpose ILifecycleTask implementation that can be placed
 * before an attached, detached, bound or unbound hook during attaching,
 * detaching, binding or unbinding, respectively.
 *
 * The provided promise will be awaited before the corresponding lifecycle
 * hook (and any hooks following it) is invoked.
 *
 * The provided callback will be invoked after the promise is resolved
 * and before the next lifecycle hook.
 *
 * Example:
```ts
export class MyViewModel {
  private $lifecycle: ILifecycle; // set before created() hook
  private answer: number;

  public binding(flags: LifecycleFlags): void {
    // this.answer === undefined
    this.$lifecycle.registerTask(new PromiseTask(
      this.getAnswerAsync,
      answer => {
        this.answer = answer;
      }
    ));
  }

  public bound(flags: LifecycleFlags): void {
    // this.answer === 42
  }

  private getAnswerAsync(): Promise<number> {
    return Promise.resolve().then(() => 42);
  }
}
```
 */
export declare class PromiseTask<T = void> implements ILifecycleTask<T> {
    done: boolean;
    private isCancelled;
    private readonly promise;
    private readonly callback;
    constructor(promise: Promise<T>, callback: (result?: T) => void);
    canCancel(): boolean;
    cancel(): void;
    wait(): Promise<T>;
}
//# sourceMappingURL=lifecycle.d.ts.map