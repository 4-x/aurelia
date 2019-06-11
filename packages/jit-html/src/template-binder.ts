import {
  AttrInfo,
  AttrSyntax,
  BindableInfo,
  BindingSymbol,
  CustomAttributeSymbol,
  CustomElementSymbol,
  IAttributeParser,
  IElementSymbol,
  IParentNodeSymbol,
  IResourceAttributeSymbol,
  ISymbolWithMarker,
  LetElementSymbol,
  PlainAttributeSymbol,
  PlainElementSymbol,
  ReplacePartSymbol,
  ResourceModel,
  SymbolFlags,
  TemplateControllerSymbol,
  TextSymbol
} from '@aurelia/jit';
import { PLATFORM, Profiler, Tracer } from '@aurelia/kernel';
import {
  BindingMode,
  BindingType,
  IDOM,
  IExpressionParser
} from '@aurelia/runtime';
import { NodeType } from '@aurelia/runtime-html';

const slice = Array.prototype.slice;

const { enter, leave } = Profiler.createTimer('TemplateBinder');

const invalidSurrogateAttribute = {
  'id': true,
  'part': true,
  'replace-part': true
};

const attributesToIgnore = {
  'as-element': true,
  'part': true,
  'replace-part': true
};

/**
 * TemplateBinder. Todo: describe goal of this class
 */
export class TemplateBinder {
  public dom: IDOM;
  public resources: ResourceModel;
  public attrParser: IAttributeParser;
  public exprParser: IExpressionParser;

  private surrogate: PlainElementSymbol | null;

  // This is any "original" (as in, not a template created for a template controller) element.
  // It collects all attribute symbols except for template controllers and replace-parts.
  private manifest: IElementSymbol | null;

  // This is the nearest wrapping custom element.
  // It only collects replace-parts (and inherently everything that the manifest collects, if they are the same instance)
  private manifestRoot: CustomElementSymbol | null;

  // This is the nearest wrapping custom element relative to the current manifestRoot (the manifestRoot "one level up").
  // It exclusively collects replace-parts that are placed on the current manifestRoot.
  private parentManifestRoot: CustomElementSymbol | null;

  private partName: string | null;

  constructor(dom: IDOM, resources: ResourceModel, attrParser: IAttributeParser, exprParser: IExpressionParser) {
    this.dom = dom;
    this.resources = resources;
    this.attrParser = attrParser;
    this.exprParser = exprParser;
    this.surrogate = null;
    this.manifest = null;
    this.manifestRoot = null;
    this.parentManifestRoot = null;
    this.partName = null;
  }

  public bind(node: HTMLTemplateElement): PlainElementSymbol {
    if (Tracer.enabled) { Tracer.enter('TemplateBinder', 'bind', slice.call(arguments)); }
    if (Profiler.enabled) { enter(); }

    const surrogateSave = this.surrogate;
    const parentManifestRootSave = this.parentManifestRoot;
    const manifestRootSave = this.manifestRoot;
    const manifestSave = this.manifest;

    const manifest = this.surrogate = this.manifest = new PlainElementSymbol(node);

    const attributes = node.attributes;
    let i = 0;
    while (i < attributes.length) {
      const attr = attributes[i];
      const attrSyntax = this.attrParser.parse(attr.name, attr.value);

      if (invalidSurrogateAttribute[attrSyntax.target] === true) {
        if (Profiler.enabled) { leave(); }
        throw new Error(`Invalid surrogate attribute: ${attrSyntax.target}`);
        // TODO: use reporter
      }
      const attrInfo = this.resources.getAttributeInfo(attrSyntax);
      if (attrInfo === null) {
        this.bindPlainAttribute(attrSyntax, attr);
      } else if (attrInfo.isTemplateController) {
        if (Profiler.enabled) { leave(); }
        throw new Error('Cannot have template controller on surrogate element.');
        // TODO: use reporter
      } else {
        this.bindCustomAttribute(attrSyntax, attrInfo);
      }
      ++i;
    }

    this.bindChildNodes(node);

    this.surrogate = surrogateSave;
    this.parentManifestRoot = parentManifestRootSave;
    this.manifestRoot = manifestRootSave;
    this.manifest = manifestSave;

    if (Profiler.enabled) { leave(); }
    if (Tracer.enabled) { Tracer.leave(); }
    return manifest;
  }

  private bindManifest(parentManifest: IElementSymbol, node: HTMLTemplateElement | HTMLElement): void {
    if (Tracer.enabled) { Tracer.enter('TemplateBinder', 'bindManifest', slice.call(arguments)); }

    switch (node.nodeName) {
      case 'LET':
        // let cannot have children and has some different processing rules, so return early
        this.bindLetElement(parentManifest, node);
        if (Tracer.enabled) { Tracer.leave(); }
        return;
      case 'SLOT':
        // slot requires no compilation
        this.surrogate.hasSlots = true;
        if (Tracer.enabled) { Tracer.leave(); }
        return;
    }

    // nodes are processed bottom-up so we need to store the manifests before traversing down and
    // restore them again afterwards
    const parentManifestRootSave = this.parentManifestRoot;
    const manifestRootSave = this.manifestRoot;
    const manifestSave = this.manifest;

    // get the part name to override the name of the compiled definition
    this.partName = node.getAttribute('part');

    let manifestRoot: CustomElementSymbol;
    let name = node.getAttribute('as-element');
    if (name === null) {
      name = node.nodeName.toLowerCase();
    }
    const elementInfo = this.resources.getElementInfo(name);
    if (elementInfo === null) {
      // there is no registered custom element with this name
      this.manifest = new PlainElementSymbol(node);
    } else {
      // it's a custom element so we set the manifestRoot as well (for storing replace-parts)
      this.parentManifestRoot = this.manifestRoot;
      manifestRoot = this.manifestRoot = this.manifest = new CustomElementSymbol(this.dom, node, elementInfo);
    }

    // lifting operations done by template controllers and replace-parts effectively unlink the nodes, so start at the bottom
    this.bindChildNodes(node);

    // the parentManifest will receive either the direct child nodes, or the template controllers / replace-parts
    // wrapping them
    this.bindAttributes(node, parentManifest);

    if (manifestRoot !== undefined && manifestRoot.isContainerless) {
      node.parentNode.replaceChild(manifestRoot.marker as Node, node);
    } else if (this.manifest.isTarget) {
      node.classList.add('au');
    }

    // restore the stored manifests so the attributes are processed on the correct lavel
    this.parentManifestRoot = parentManifestRootSave;
    this.manifestRoot = manifestRootSave;
    this.manifest = manifestSave;

    if (Tracer.enabled) { Tracer.leave(); }
  }

  private bindLetElement(parentManifest: IElementSymbol, node: HTMLElement): void {
    const symbol = new LetElementSymbol(this.dom, node);
    parentManifest.childNodes.push(symbol);

    const attributes = node.attributes;
    let i = 0;
    while (i < attributes.length) {
      const attr = attributes[i];
      if (attr.name === 'to-view-model') {
        node.removeAttribute('to-view-model');
        symbol.toViewModel = true;
        continue;
      }
      const attrSyntax = this.attrParser.parse(attr.name, attr.value);
      const command = this.resources.getBindingCommand(attrSyntax);
      const bindingType = command === null ? BindingType.Interpolation : command.bindingType;
      const expr = this.exprParser.parse(attrSyntax.rawValue, bindingType);
      const to = PLATFORM.camelCase(attrSyntax.target);
      const info = new BindableInfo(to, BindingMode.toView);
      symbol.bindings.push(new BindingSymbol(command, info, expr, attrSyntax.rawValue, to));

      ++i;
    }
    node.parentNode.replaceChild(symbol.marker as Node, node);
  }

  private bindAttributes(node: HTMLTemplateElement | HTMLElement, parentManifest: IElementSymbol): void {
    if (Tracer.enabled) { Tracer.enter('TemplateBinder', 'bindAttributes', slice.call(arguments)); }

    const { parentManifestRoot, manifestRoot, manifest } = this;
    // This is the top-level symbol for the current depth.
    // If there are no template controllers or replace-parts, it is always the manifest itself.
    // If there are template controllers, then this will be the outer-most TemplateControllerSymbol.
    let manifestProxy: IParentNodeSymbol = manifest;

    const replacePart = this.declareReplacePart(node);

    let previousController: TemplateControllerSymbol;
    let currentController: TemplateControllerSymbol;

    const attributes = node.attributes;
    let i = 0;
    while (i < attributes.length) {
      const attr = attributes[i];
      ++i;
      if (attributesToIgnore[attr.name] === true) {
        continue;
      }
      const attrSyntax = this.attrParser.parse(attr.name, attr.value);
      const attrInfo = this.resources.getAttributeInfo(attrSyntax);

      if (attrInfo === null) {
        // it's not a custom attribute but might be a regular bound attribute or interpolation (it might also be nothing)
        this.bindPlainAttribute(attrSyntax, attr);
      } else if (attrInfo.isTemplateController) {
        // the manifest is wrapped by the inner-most template controller (if there are multiple on the same element)
        // so keep setting manifest.templateController to the latest template controller we find
        currentController = manifest.templateController = this.declareTemplateController(attrSyntax, attrInfo);

        // the proxy and the manifest are only identical when we're at the first template controller (since the controller
        // is assigned to the proxy), so this evaluates to true at most once per node
        if (manifestProxy === manifest) {
          currentController.template = manifest;
          manifestProxy = currentController;
        } else {
          currentController.templateController = previousController;
          currentController.template = previousController.template;
          previousController.template = currentController;
        }
        previousController = currentController;
      } else {
        // a regular custom attribute
        this.bindCustomAttribute(attrSyntax, attrInfo);
      }
    }

    processTemplateControllers(this.dom, manifestProxy, manifest);

    if (replacePart === null) {
      // the proxy is either the manifest itself or the outer-most controller; add it directly to the parent
      parentManifest.childNodes.push(manifestProxy);
    } else {
      // there is a replace-part attribute on this node, so add it to the parts collection of the manifestRoot
      // instead of to the childNodes
      replacePart.parent = parentManifest;
      replacePart.template = manifestProxy;

      // if the current manifest is also the manifestRoot, it means the replace-part sits on a custom
      // element, so add the part to the parent wrapping custom element instead
      const partOwner = manifest === manifestRoot ? parentManifestRoot : manifestRoot;
      partOwner.parts.push(replacePart);

      processReplacePart(this.dom, replacePart, manifestProxy);
    }

    if (Tracer.enabled) { Tracer.leave(); }
  }

  private bindChildNodes(node: HTMLTemplateElement | HTMLElement): void {
    if (Tracer.enabled) { Tracer.enter('TemplateBinder', 'bindChildNodes', slice.call(arguments)); }

    let childNode: ChildNode;
    if (node.nodeName === 'TEMPLATE') {
      childNode = (node as HTMLTemplateElement).content.firstChild;
    } else {
      childNode = node.firstChild;
    }

    let nextChild: ChildNode;
    while (childNode !== null) {
      switch (childNode.nodeType) {
        case NodeType.Element:
          nextChild = childNode.nextSibling as ChildNode;
          this.bindManifest(this.manifest, childNode as HTMLElement);
          childNode = nextChild;
          break;
        case NodeType.Text:
          childNode = this.bindText(childNode as Text).nextSibling as ChildNode;
          break;
        case NodeType.CDATASection:
        case NodeType.ProcessingInstruction:
        case NodeType.Comment:
        case NodeType.DocumentType:
          childNode = childNode.nextSibling as ChildNode;
          break;
        case NodeType.Document:
        case NodeType.DocumentFragment:
          childNode = childNode.firstChild;
      }
    }

    if (Tracer.enabled) { Tracer.leave(); }
  }

  private bindText(node: Text): ChildNode {
    if (Tracer.enabled) { Tracer.enter('TemplateBinder', 'bindText', slice.call(arguments)); }
    const interpolation = this.exprParser.parse(node.wholeText, BindingType.Interpolation);
    if (interpolation !== null) {
      const symbol = new TextSymbol(this.dom, node, interpolation);
      this.manifest.childNodes.push(symbol);
      processInterpolationText(symbol);
    }
    while (node.nextSibling !== null && node.nextSibling.nodeType === NodeType.Text) {
      node = node.nextSibling as Text;
    }
    if (Tracer.enabled) { Tracer.leave(); }
    return node;
  }

  private declareTemplateController(attrSyntax: AttrSyntax, attrInfo: AttrInfo): TemplateControllerSymbol {
    if (Tracer.enabled) { Tracer.enter('TemplateBinder', 'declareTemplateController', slice.call(arguments)); }

    let symbol: TemplateControllerSymbol;
    // dynamicOptions logic here is similar to (and explained in) bindCustomAttribute
    const command = this.resources.getBindingCommand(attrSyntax);
    if (command === null && attrInfo.hasDynamicOptions) {
      symbol = new TemplateControllerSymbol(this.dom, attrSyntax, attrInfo, this.partName);
      this.partName = null;
      this.bindMultiAttribute(symbol, attrInfo, attrSyntax.rawValue);
    } else {
      symbol = new TemplateControllerSymbol(this.dom, attrSyntax, attrInfo, this.partName);
      const bindingType = command === null ? BindingType.Interpolation : command.bindingType;
      const expr = this.exprParser.parse(attrSyntax.rawValue, bindingType);
      symbol.bindings.push(new BindingSymbol(command, attrInfo.bindable, expr, attrSyntax.rawValue, attrSyntax.target));
      this.partName = null;
    }

    if (Tracer.enabled) { Tracer.leave(); }
    return symbol;
  }

  private bindCustomAttribute(attrSyntax: AttrSyntax, attrInfo: AttrInfo): void {
    if (Tracer.enabled) { Tracer.enter('TemplateBinder', 'bindCustomAttribute', slice.call(arguments)); }

    const command = this.resources.getBindingCommand(attrSyntax);
    let symbol: CustomAttributeSymbol;
    if (command === null && attrInfo.hasDynamicOptions) {
      // a dynamicOptions (semicolon separated binding) is only valid without a binding command;
      // the binding commands must be declared in the dynamicOptions expression itself
      symbol = new CustomAttributeSymbol(attrSyntax, attrInfo);
      this.bindMultiAttribute(symbol, attrInfo, attrSyntax.rawValue);
    } else {
      // we've either got a command (with or without dynamicOptions, the latter maps to the first bindable),
      // or a null command but without dynamicOptions (which may be an interpolation or a normal string)
      symbol = new CustomAttributeSymbol(attrSyntax, attrInfo);
      const bindingType = command === null ? BindingType.Interpolation : command.bindingType;
      const expr = this.exprParser.parse(attrSyntax.rawValue, bindingType);
      symbol.bindings.push(new BindingSymbol(command, attrInfo.bindable, expr, attrSyntax.rawValue, attrSyntax.target));
    }
    this.manifest.attributes.push(symbol);
    this.manifest.isTarget = true;

    if (Tracer.enabled) { Tracer.leave(); }
  }

  private bindMultiAttribute(symbol: IResourceAttributeSymbol, attrInfo: AttrInfo, value: string): void {
    if (Tracer.enabled) { Tracer.enter('TemplateBinder', 'bindMultiAttribute', slice.call(arguments)); }

    const attributes = parseMultiAttributeBinding(value);
    let attr: IAttrLike;
    for (let i = 0, ii = attributes.length; i < ii; ++i) {
      attr = attributes[i];
      const attrSyntax = this.attrParser.parse(attr.name, attr.value);
      const command = this.resources.getBindingCommand(attrSyntax);
      const bindingType = command === null ? BindingType.Interpolation : command.bindingType;
      const expr = this.exprParser.parse(attrSyntax.rawValue, bindingType);
      let bindable = attrInfo.bindables[attrSyntax.target];
      if (bindable === undefined) {
        // everything in a dynamicOptions expression must be used, so if it's not a bindable then we create one on the spot
        bindable = attrInfo.bindables[attrSyntax.target] = new BindableInfo(attrSyntax.target, BindingMode.toView);
      }

      symbol.bindings.push(new BindingSymbol(command, bindable, expr, attrSyntax.rawValue, attrSyntax.target));
    }

    if (Tracer.enabled) { Tracer.leave(); }
  }

  private bindPlainAttribute(attrSyntax: AttrSyntax, attr: Attr): void {
    if (Tracer.enabled) { Tracer.enter('TemplateBinder', 'bindPlainAttribute', slice.call(arguments)); }

    if (attrSyntax.rawValue.length === 0) {
      if (Tracer.enabled) { Tracer.leave(); }
      return;
    }

    const command = this.resources.getBindingCommand(attrSyntax);
    const bindingType = command === null ? BindingType.Interpolation : command.bindingType;
    const manifest = this.manifest;
    const expr = this.exprParser.parse(attrSyntax.rawValue, bindingType);

    if (manifest.flags & SymbolFlags.isCustomElement) {
      const bindable = (manifest as CustomElementSymbol).bindables[attrSyntax.target];
      if (bindable !== undefined) {
        // if the attribute name matches a bindable property name, add it regardless of whether it's a command, interpolation, or just a plain string;
        // the template compiler will translate it to the correct instruction
        (manifest as CustomElementSymbol).bindings.push(new BindingSymbol(command, bindable, expr, attrSyntax.rawValue, attrSyntax.target));
        manifest.isTarget = true;
      } else if (expr !== null || attrSyntax.target === 'ref') {
        // if it does not map to a bindable, only add it if we were able to parse an expression (either a command or interpolation)
        manifest.attributes.push(new PlainAttributeSymbol(attrSyntax, command, expr));
        manifest.isTarget = true;
      }
    } else if (expr !== null || attrSyntax.target === 'ref') {
      // either a binding command, an interpolation, or a ref
      manifest.attributes.push(new PlainAttributeSymbol(attrSyntax, command, expr));
      manifest.isTarget = true;
    } else if (manifest === this.surrogate) {
      // any attributes, even if they are plain (no command/interpolation etc), should be added if they
      // are on the surrogate element
      manifest.attributes.push(new PlainAttributeSymbol(attrSyntax, command, expr));
    }

    if (command === null && expr !== null) {
      // if it's an interpolation, clear the attribute value
      attr.value = '';
    }

    if (Tracer.enabled) { Tracer.leave(); }
  }

  private declareReplacePart(node: HTMLTemplateElement | HTMLElement): ReplacePartSymbol {
    if (Tracer.enabled) { Tracer.enter('TemplateBinder', 'declareReplacePart', slice.call(arguments)); }

    const name = node.getAttribute('replace-part');
    if (name === null) {
      if (Tracer.enabled) { Tracer.leave(); }
      return null;
    }
    node.removeAttribute('replace-part');

    const symbol = new ReplacePartSymbol(name);

    if (Tracer.enabled) { Tracer.leave(); }
    return symbol;
  }
}

function processInterpolationText(symbol: TextSymbol): void {
  const node = symbol.physicalNode as Text;
  const parentNode = node.parentNode;
  while (node.nextSibling !== null && node.nextSibling.nodeType === NodeType.Text) {
    parentNode.removeChild(node.nextSibling);
  }
  node.textContent = '';
  parentNode.insertBefore(symbol.marker as Node, node);
}

/**
 * A (temporary) standalone function that purely does the DOM processing (lifting) related to template controllers.
 * It's a first refactoring step towards separating DOM parsing/binding from mutations.
 */
function processTemplateControllers(dom: IDOM, manifestProxy: IParentNodeSymbol, manifest: IElementSymbol): void {
  const manifestNode = manifest.physicalNode as HTMLElement;
  let current = manifestProxy as TemplateControllerSymbol;
  let currentTemplate: HTMLTemplateElement;
  while ((current as IParentNodeSymbol) !== manifest) {
    if (current.template === manifest) {
      // the DOM linkage is still in its original state here so we can safely assume the parentNode is non-null
      manifestNode.parentNode.replaceChild(current.marker as Node, manifestNode);

      // if the manifest is a template element (e.g. <template repeat.for="...">) then we can skip one lift operation
      // and simply use the template directly, saving a bit of work
      if (manifestNode.nodeName === 'TEMPLATE') {
        current.physicalNode = manifestNode as HTMLTemplateElement;
        // the template could safely stay without affecting anything visible, but let's keep the DOM tidy
        manifestNode.remove();
      } else {
        // the manifest is not a template element so we need to wrap it in one
        currentTemplate = current.physicalNode = dom.createTemplate() as HTMLTemplateElement;
        currentTemplate.content.appendChild(manifestNode);
      }
    } else {
      currentTemplate = current.physicalNode = dom.createTemplate() as HTMLTemplateElement;
      currentTemplate.content.appendChild(current.marker as Node);
    }
    manifestNode.removeAttribute(current.syntax.rawName);
    current = current.template as TemplateControllerSymbol;
  }
}

function processReplacePart(dom: IDOM, replacePart: ReplacePartSymbol, manifestProxy: IParentNodeSymbol | ISymbolWithMarker): void {
    let proxyNode: HTMLElement;
    let currentTemplate: HTMLTemplateElement;
    if (manifestProxy.flags & SymbolFlags.hasMarker) {
      proxyNode = (manifestProxy as ISymbolWithMarker).marker as HTMLElement;
    } else {
      proxyNode = manifestProxy.physicalNode as HTMLElement;
    }
    if (proxyNode.nodeName === 'TEMPLATE') {
      // if it's a template element, no need to do anything special, just assign it to the replacePart
      replacePart.physicalNode = proxyNode as HTMLTemplateElement;
    } else {
      // otherwise wrap the replace-part in a template
      currentTemplate = replacePart.physicalNode = dom.createTemplate() as HTMLTemplateElement;
      currentTemplate.content.appendChild(proxyNode);
    }
}

interface IAttrLike {
  name: string;
  value: string;
}

/**
 * ParserState. Todo: describe goal of this class
 */
class ParserState {
  public input: string;
  public index: number;
  public length: number;

  constructor(input: string) {
    this.input = input;
    this.index = 0;
    this.length = input.length;
  }
}

const fromCharCode = String.fromCharCode;

// TODO: move to expression parser
function parseMultiAttributeBinding(input: string): IAttrLike[] {
  const attributes: IAttrLike[] = [];

  const state = new ParserState(input);
  const length = state.length;
  let name: string;
  let value: string;

  while (state.index < length) {
    name = scanAttributeName(state);
    if (name.length === 0) {
      return attributes;
    }
    value = scanAttributeValue(state);
    attributes.push({ name, value });
  }

  return attributes;
}

function scanAttributeName(state: ParserState): string {
  const start = state.index;
  const { length, input } = state;
  while (state.index < length && input.charCodeAt(++state.index) !== Char.Colon);

  return input.slice(start, state.index).trim();
}

const enum Char {
  DoubleQuote    = 0x22,
  SingleQuote    = 0x27,
  Slash          = 0x2F,
  Semicolon      = 0x3B,
  Colon          = 0x3A
}

function scanAttributeValue(state: ParserState): string {
  ++state.index;
  const { length, input } = state;
  let token = '';
  let inString = false;
  let quote = null;
  let ch = 0;
  while (state.index < length) {
    ch = input.charCodeAt(state.index);
    switch (ch) {
      case Char.Semicolon:
        ++state.index;
        return token.trim();
      case Char.Slash:
        ch = input.charCodeAt(++state.index);
        if (ch === Char.DoubleQuote) {
          if (inString === false) {
            inString = true;
            quote = Char.DoubleQuote;
          } else if (quote === Char.DoubleQuote) {
            inString = false;
            quote = null;
          }
        }
        token += `\\${fromCharCode(ch)}`;
        break;
      case Char.SingleQuote:
        if (inString === false) {
          inString = true;
          quote = Char.SingleQuote;
        } else if (quote === Char.SingleQuote) {
          inString = false;
          quote = null;
        }
        token += '\'';
        break;
      default:
        token += fromCharCode(ch);
    }
    ++state.index;
  }

  return token.trim();
}
