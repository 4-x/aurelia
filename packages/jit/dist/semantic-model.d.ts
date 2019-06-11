import { AnyBindingExpression, IDOM, IInterpolationExpression, INode } from '@aurelia/runtime';
import { AttrSyntax } from './ast';
import { IBindingCommand } from './binding-command';
import { AttrInfo, BindableInfo, ElementInfo } from './resource-model';
export declare const enum SymbolFlags {
    type = 511,
    isTemplateController = 1,
    isReplacePart = 2,
    isCustomAttribute = 4,
    isPlainAttribute = 8,
    isCustomElement = 16,
    isLetElement = 32,
    isPlainElement = 64,
    isText = 128,
    isBinding = 256,
    hasMarker = 512,
    hasTemplate = 1024,
    hasAttributes = 2048,
    hasBindings = 4096,
    hasChildNodes = 8192,
    hasParts = 16384
}
export interface ISymbol {
    flags: SymbolFlags;
}
export interface IAttributeSymbol extends ISymbol {
    syntax: AttrSyntax;
}
export interface ISymbolWithBindings extends ISymbol {
    bindings: BindingSymbol[];
}
export interface IResourceAttributeSymbol extends ISymbolWithBindings {
    res: string;
    bindings: BindingSymbol[];
}
export interface INodeSymbol extends ISymbol {
    physicalNode: INode;
}
export interface IParentNodeSymbol extends INodeSymbol {
    physicalNode: INode;
    templateController: TemplateControllerSymbol;
}
export interface ISymbolWithTemplate extends INodeSymbol {
    physicalNode: INode;
    template: IParentNodeSymbol;
}
export interface IElementSymbol extends IParentNodeSymbol {
    attributes: IAttributeSymbol[];
    childNodes: INodeSymbol[];
    isTarget: boolean;
}
export interface ISymbolWithMarker extends INodeSymbol {
    marker: INode;
}
/**
 * A html attribute that is associated with a registered resource, specifically a template controller.
 */
export declare class TemplateControllerSymbol implements IResourceAttributeSymbol, IParentNodeSymbol, ISymbolWithTemplate, ISymbolWithMarker {
    flags: SymbolFlags;
    res: string;
    partName: string | null;
    physicalNode: INode | null;
    syntax: AttrSyntax;
    template: IParentNodeSymbol | null;
    templateController: TemplateControllerSymbol | null;
    marker: INode;
    private _bindings;
    readonly bindings: BindingSymbol[];
    constructor(dom: IDOM, syntax: AttrSyntax, info: AttrInfo, partName: string | null);
}
/**
 * Wrapper for an element (with all of its attributes, regardless of the order in which they are declared)
 * that has a replace-part attribute on it.
 *
 * This element will be lifted from the DOM just like a template controller.
 */
export declare class ReplacePartSymbol implements ISymbolWithTemplate {
    flags: SymbolFlags;
    name: string;
    physicalNode: INode | null;
    parent: IParentNodeSymbol | null;
    template: IParentNodeSymbol | null;
    constructor(name: string);
}
/**
 * A html attribute that is associated with a registered resource, but not a template controller.
 */
export declare class CustomAttributeSymbol implements IAttributeSymbol, IResourceAttributeSymbol {
    flags: SymbolFlags;
    res: string;
    syntax: AttrSyntax;
    private _bindings;
    readonly bindings: BindingSymbol[];
    constructor(syntax: AttrSyntax, info: AttrInfo);
}
/**
 * An attribute, with either a binding command or an interpolation, whose target is the html
 * attribute of the element.
 *
 * This will never target a bindable property of a custom attribute or element;
 */
export declare class PlainAttributeSymbol implements IAttributeSymbol {
    flags: SymbolFlags;
    syntax: AttrSyntax;
    command: IBindingCommand | null;
    expression: AnyBindingExpression | null;
    constructor(syntax: AttrSyntax, command: IBindingCommand | null, expression: AnyBindingExpression | null);
}
/**
 * Either an attribute on an custom element that maps to a declared bindable property of that element,
 * a single-value bound custom attribute, or one of several bindables that were extracted from the attribute
 * value of a dynamicOptions custom attribute.
 *
 * This will always target a bindable property of a custom attribute or element;
 */
export declare class BindingSymbol implements ISymbol {
    flags: SymbolFlags;
    command: IBindingCommand | null;
    bindable: BindableInfo;
    expression: AnyBindingExpression | null;
    rawValue: string;
    target: string;
    constructor(command: IBindingCommand | null, bindable: BindableInfo, expression: AnyBindingExpression | null, rawValue: string, target: string);
}
/**
 * A html element that is associated with a registered resource either via its (lowerCase) `nodeName`
 * or the value of its `as-element` attribute.
 */
export declare class CustomElementSymbol implements IElementSymbol, ISymbolWithBindings, ISymbolWithMarker {
    flags: SymbolFlags;
    res: string;
    physicalNode: INode;
    bindables: Record<string, BindableInfo>;
    isTarget: true;
    templateController: TemplateControllerSymbol | null;
    isContainerless: boolean;
    marker: INode | null;
    private _attributes;
    readonly attributes: IAttributeSymbol[];
    private _bindings;
    readonly bindings: BindingSymbol[];
    private _childNodes;
    readonly childNodes: INodeSymbol[];
    private _parts;
    readonly parts: ReplacePartSymbol[];
    constructor(dom: IDOM, node: INode, info: ElementInfo);
}
export declare class LetElementSymbol implements INodeSymbol, ISymbolWithBindings, ISymbolWithMarker {
    flags: SymbolFlags;
    physicalNode: INode;
    toViewModel: boolean;
    marker: INode;
    private _bindings;
    readonly bindings: BindingSymbol[];
    constructor(dom: IDOM, node: INode);
}
/**
 * A normal html element that may or may not have attribute behaviors and/or child node behaviors.
 *
 * It is possible for a PlainElementSymbol to not yield any instructions during compilation.
 */
export declare class PlainElementSymbol implements IElementSymbol {
    flags: SymbolFlags;
    physicalNode: INode;
    isTarget: boolean;
    templateController: TemplateControllerSymbol | null;
    hasSlots?: boolean;
    private _attributes;
    readonly attributes: IAttributeSymbol[];
    private _childNodes;
    readonly childNodes: INodeSymbol[];
    constructor(node: INode);
}
/**
 * A standalone text node that has an interpolation.
 */
export declare class TextSymbol implements INodeSymbol, ISymbolWithMarker {
    flags: SymbolFlags;
    physicalNode: INode;
    interpolation: IInterpolationExpression;
    marker: INode;
    constructor(dom: IDOM, node: INode, interpolation: IInterpolationExpression);
}
//# sourceMappingURL=semantic-model.d.ts.map