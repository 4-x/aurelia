import { IAttributeParser, ResourceModel } from '@aurelia/jit';
import { mergeDistinct, PLATFORM, Profiler, Registration, } from '@aurelia/kernel';
import { HydrateAttributeInstruction, HydrateElementInstruction, HydrateTemplateController, IExpressionParser, InterpolationInstruction, ITemplateCompiler, LetBindingInstruction, LetElementInstruction, RefBindingInstruction, SetPropertyInstruction } from '@aurelia/runtime';
import { SetAttributeInstruction, TextBindingInstruction } from '@aurelia/runtime-html';
import { TemplateBinder } from './template-binder';
import { ITemplateElementFactory } from './template-element-factory';
const buildNotRequired = Object.freeze({
    required: false,
    compiler: 'default'
});
const { enter, leave } = Profiler.createTimer('TemplateCompiler');
/**
 * Default (runtime-agnostic) implementation for `ITemplateCompiler`.
 *
 * @internal
 */
export class TemplateCompiler {
    constructor(factory, attrParser, exprParser) {
        this.factory = factory;
        this.attrParser = attrParser;
        this.exprParser = exprParser;
        this.instructionRows = null;
        this.parts = null;
        this.scopeParts = null;
    }
    get name() {
        return 'default';
    }
    static register(container) {
        return Registration.singleton(ITemplateCompiler, this).register(container);
    }
    compile(dom, definition, descriptions) {
        const binder = new TemplateBinder(dom, new ResourceModel(descriptions), this.attrParser, this.exprParser);
        const template = definition.template = this.factory.createTemplate(definition.template);
        const surrogate = binder.bind(template);
        if (definition.instructions === undefined || definition.instructions === PLATFORM.emptyArray) {
            definition.instructions = [];
        }
        if (surrogate.hasSlots === true) {
            definition.hasSlots = true;
        }
        if (definition.scopeParts === void 0 || definition.scopeParts === PLATFORM.emptyArray) {
            definition.scopeParts = [];
        }
        this.instructionRows = definition.instructions;
        this.parts = {};
        this.scopeParts = definition.scopeParts;
        const attributes = surrogate.attributes;
        const len = attributes.length;
        if (len > 0) {
            let surrogates;
            if (definition.surrogates === undefined || definition.surrogates === PLATFORM.emptyArray) {
                definition.surrogates = Array(len);
            }
            surrogates = definition.surrogates;
            for (let i = 0; i < len; ++i) {
                surrogates[i] = this.compileAttribute(attributes[i]);
            }
        }
        this.compileChildNodes(surrogate);
        this.instructionRows = null;
        this.parts = null;
        this.scopeParts = null;
        definition.build = buildNotRequired;
        return definition;
    }
    compileChildNodes(parent) {
        if (parent.flags & 8192 /* hasChildNodes */) {
            const { childNodes } = parent;
            let childNode;
            const ii = childNodes.length;
            for (let i = 0; i < ii; ++i) {
                childNode = childNodes[i];
                if (childNode.flags & 128 /* isText */) {
                    this.instructionRows.push([new TextBindingInstruction(childNode.interpolation)]);
                }
                else if (childNode.flags & 32 /* isLetElement */) {
                    const bindings = childNode.bindings;
                    const instructions = [];
                    let binding;
                    const jj = bindings.length;
                    for (let j = 0; j < jj; ++j) {
                        binding = bindings[j];
                        instructions[j] = new LetBindingInstruction(binding.expression, binding.target);
                    }
                    this.instructionRows.push([new LetElementInstruction(instructions, childNode.toViewModel)]);
                }
                else {
                    this.compileParentNode(childNode);
                }
            }
        }
    }
    compileCustomElement(symbol) {
        // offset 1 to leave a spot for the hydrate instruction so we don't need to create 2 arrays with a spread etc
        const instructionRow = this.compileAttributes(symbol, 1);
        instructionRow[0] = new HydrateElementInstruction(symbol.res, this.compileBindings(symbol), this.compileParts(symbol));
        this.instructionRows.push(instructionRow);
        this.compileChildNodes(symbol);
    }
    compilePlainElement(symbol) {
        const attributes = this.compileAttributes(symbol, 0);
        if (attributes.length > 0) {
            this.instructionRows.push(attributes);
        }
        this.compileChildNodes(symbol);
    }
    compileParentNode(symbol) {
        switch (symbol.flags & 511 /* type */) {
            case 16 /* isCustomElement */:
                this.compileCustomElement(symbol);
                break;
            case 64 /* isPlainElement */:
                this.compilePlainElement(symbol);
                break;
            case 1 /* isTemplateController */:
                this.compileTemplateController(symbol);
        }
    }
    compileTemplateController(symbol) {
        const bindings = this.compileBindings(symbol);
        const instructionRowsSave = this.instructionRows;
        const scopePartsSave = this.scopeParts;
        const controllerInstructions = this.instructionRows = [];
        const scopeParts = this.scopeParts = [];
        this.compileParentNode(symbol.template);
        this.instructionRows = instructionRowsSave;
        this.scopeParts = mergeDistinct(scopePartsSave, scopeParts, false);
        const def = {
            scopeParts,
            name: symbol.partName == null ? symbol.res : symbol.partName,
            template: symbol.physicalNode,
            instructions: controllerInstructions,
            build: buildNotRequired
        };
        let parts = void 0;
        if ((symbol.flags & 16384 /* hasParts */) > 0) {
            parts = {};
            for (const part of symbol.parts) {
                parts[part.name] = this.parts[part.name];
            }
        }
        this.instructionRows.push([new HydrateTemplateController(def, symbol.res, bindings, symbol.res === 'else', parts)]);
    }
    compileBindings(symbol) {
        let bindingInstructions;
        if (symbol.flags & 4096 /* hasBindings */) {
            // either a custom element with bindings, a custom attribute / template controller with dynamic options,
            // or a single value custom attribute binding
            const { bindings } = symbol;
            const len = bindings.length;
            bindingInstructions = Array(len);
            let i = 0;
            for (; i < len; ++i) {
                bindingInstructions[i] = this.compileBinding(bindings[i]);
            }
        }
        else {
            bindingInstructions = PLATFORM.emptyArray;
        }
        return bindingInstructions;
    }
    compileBinding(symbol) {
        if (symbol.command == null) {
            // either an interpolation or a normal string value assigned to an element or attribute binding
            if (symbol.expression == null) {
                // the template binder already filtered out non-bindables, so we know we need a setProperty here
                return new SetPropertyInstruction(symbol.rawValue, symbol.bindable.propName);
            }
            else {
                // either an element binding interpolation or a dynamic options attribute binding interpolation
                return new InterpolationInstruction(symbol.expression, symbol.bindable.propName);
            }
        }
        else {
            // either an element binding command, dynamic options attribute binding command,
            // or custom attribute / template controller (single value) binding command
            return symbol.command.compile(symbol);
        }
    }
    compileAttributes(symbol, offset) {
        let attributeInstructions;
        if (symbol.flags & 2048 /* hasAttributes */) {
            // any attributes on a custom element (which are not bindables) or a plain element
            const { attributes } = symbol;
            const len = attributes.length;
            attributeInstructions = Array(offset + len);
            for (let i = 0; i < len; ++i) {
                attributeInstructions[i + offset] = this.compileAttribute(attributes[i]);
            }
        }
        else if (offset > 0) {
            attributeInstructions = Array(offset);
        }
        else {
            attributeInstructions = PLATFORM.emptyArray;
        }
        return attributeInstructions;
    }
    compileCustomAttribute(symbol) {
        // a normal custom attribute (not template controller)
        const bindings = this.compileBindings(symbol);
        return new HydrateAttributeInstruction(symbol.res, bindings);
    }
    compilePlainAttribute(symbol) {
        if (symbol.command == null) {
            if (symbol.expression == null) {
                // a plain attribute on a surrogate
                return new SetAttributeInstruction(symbol.syntax.rawValue, symbol.syntax.target);
            }
            else {
                // a plain attribute with an interpolation
                return new InterpolationInstruction(symbol.expression, symbol.syntax.target);
            }
        }
        else {
            // a plain attribute with a binding command
            return symbol.command.compile(symbol);
        }
    }
    compileAttribute(symbol) {
        if (symbol.syntax.target === 'ref') {
            return new RefBindingInstruction(symbol.syntax.rawValue);
        }
        // any attribute on a custom element (which is not a bindable) or a plain element
        if (symbol.flags & 4 /* isCustomAttribute */) {
            return this.compileCustomAttribute(symbol);
        }
        else {
            return this.compilePlainAttribute(symbol);
        }
    }
    compileParts(symbol) {
        let parts;
        if (symbol.flags & 16384 /* hasParts */) {
            parts = {};
            const replaceParts = symbol.parts;
            const ii = replaceParts.length;
            let instructionRowsSave;
            let partScopesSave;
            let scopeParts;
            let partInstructions;
            let replacePart;
            for (let i = 0; i < ii; ++i) {
                replacePart = replaceParts[i];
                instructionRowsSave = this.instructionRows;
                partScopesSave = this.scopeParts;
                if (partScopesSave.indexOf(replacePart.name) === -1) {
                    partScopesSave.push(replacePart.name);
                }
                scopeParts = this.scopeParts = [];
                partInstructions = this.instructionRows = [];
                this.compileParentNode(replacePart.template);
                this.parts[replacePart.name] = parts[replacePart.name] = {
                    scopeParts,
                    name: replacePart.name,
                    template: replacePart.physicalNode,
                    instructions: partInstructions,
                    build: buildNotRequired,
                };
                this.instructionRows = instructionRowsSave;
                this.scopeParts = partScopesSave;
            }
        }
        else {
            parts = PLATFORM.emptyObject;
        }
        return parts;
    }
}
TemplateCompiler.inject = [ITemplateElementFactory, IAttributeParser, IExpressionParser];
//# sourceMappingURL=template-compiler.js.map