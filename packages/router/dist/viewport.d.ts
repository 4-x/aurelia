import { ICustomElementType, IRenderContext, LifecycleFlags } from '@aurelia/runtime';
import { INavigationInstruction } from './history-browser';
import { Router } from './router';
import { Scope } from './scope';
import { IViewportOptions } from './viewport';
import { ViewportContent } from './viewport-content';
import { ViewportInstruction } from './viewport-instruction';
export interface IViewportOptions {
    scope?: boolean;
    usedBy?: string | string[];
    default?: string;
    noLink?: boolean;
    noHistory?: boolean;
    stateful?: boolean;
    forceDescription?: boolean;
}
export declare class Viewport {
    name: string;
    element: Element;
    context: IRenderContext;
    owningScope: Scope;
    scope: Scope;
    options?: IViewportOptions;
    content: ViewportContent;
    nextContent: ViewportContent;
    enabled: boolean;
    private readonly router;
    private clear;
    private elementResolve?;
    private previousViewportState?;
    private cache;
    constructor(router: Router, name: string, element: Element, context: IRenderContext, owningScope: Scope, scope: Scope, options?: IViewportOptions);
    setNextContent(content: Partial<ICustomElementType> | string, instruction: INavigationInstruction): boolean;
    setElement(element: Element, context: IRenderContext, options: IViewportOptions): void;
    remove(element: Element, context: IRenderContext): boolean;
    canLeave(): Promise<boolean>;
    canEnter(): Promise<boolean | ViewportInstruction[]>;
    enter(): Promise<boolean>;
    loadContent(): Promise<boolean>;
    finalizeContentChange(): void;
    abortContentChange(): Promise<void>;
    description(full?: boolean): string;
    scopedDescription(full?: boolean): string;
    wantComponent(component: ICustomElementType | string): boolean;
    acceptComponent(component: ICustomElementType | string): boolean;
    binding(flags: LifecycleFlags): void;
    attaching(flags: LifecycleFlags): void;
    detaching(flags: LifecycleFlags): void;
    unbinding(flags: LifecycleFlags): void;
    private clearState;
    private waitForElement;
}
//# sourceMappingURL=viewport.d.ts.map