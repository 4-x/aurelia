import { __decorate, __metadata, __param } from "tslib";
import { addBinding, BindingMode, ensureExpression, IExpressionParser, instructionRenderer, InterpolationBinding, IObserverLocator, MultiInterpolationBinding, PropertyBinding, applyBindingBehavior } from '@aurelia/runtime';
import { AttributeBinding } from './binding/attribute';
import { Listener } from './binding/listener';
import { IEventManager } from './observation/event-manager';
let TextBindingRenderer = 
/** @internal */
class TextBindingRenderer {
    constructor(parser, observerLocator) {
        this.parser = parser;
        this.observerLocator = observerLocator;
    }
    render(flags, dom, context, renderable, target, instruction) {
        const next = target.nextSibling;
        if (dom.isMarker(target)) {
            dom.remove(target);
        }
        let binding;
        const expr = ensureExpression(this.parser, instruction.from, 2048 /* Interpolation */);
        if (expr.isMulti) {
            binding = applyBindingBehavior(new MultiInterpolationBinding(this.observerLocator, expr, next, 'textContent', BindingMode.toView, context), expr, context);
        }
        else {
            binding = applyBindingBehavior(new InterpolationBinding(expr.firstExpression, expr, next, 'textContent', BindingMode.toView, this.observerLocator, context, true), expr, context);
        }
        addBinding(renderable, binding);
    }
};
TextBindingRenderer = __decorate([
    instructionRenderer("ha" /* textBinding */)
    /** @internal */
    ,
    __param(0, IExpressionParser),
    __param(1, IObserverLocator),
    __metadata("design:paramtypes", [Object, Object])
], TextBindingRenderer);
export { TextBindingRenderer };
let ListenerBindingRenderer = 
/** @internal */
class ListenerBindingRenderer {
    constructor(parser, eventManager) {
        this.parser = parser;
        this.eventManager = eventManager;
    }
    render(flags, dom, context, renderable, target, instruction) {
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        const expr = ensureExpression(this.parser, instruction.from, 80 /* IsEventCommand */ | (instruction.strategy + 6 /* DelegationStrategyDelta */));
        const binding = applyBindingBehavior(new Listener(dom, instruction.to, instruction.strategy, expr, target, instruction.preventDefault, this.eventManager, context), expr, context);
        addBinding(renderable, binding);
    }
};
ListenerBindingRenderer = __decorate([
    instructionRenderer("hb" /* listenerBinding */)
    /** @internal */
    ,
    __param(0, IExpressionParser),
    __param(1, IEventManager),
    __metadata("design:paramtypes", [Object, Object])
], ListenerBindingRenderer);
export { ListenerBindingRenderer };
let SetAttributeRenderer = 
/** @internal */
class SetAttributeRenderer {
    render(flags, dom, context, renderable, target, instruction) {
        target.setAttribute(instruction.to, instruction.value);
    }
};
SetAttributeRenderer = __decorate([
    instructionRenderer("he" /* setAttribute */)
    /** @internal */
], SetAttributeRenderer);
export { SetAttributeRenderer };
let SetClassAttributeRenderer = class SetClassAttributeRenderer {
    render(flags, dom, context, renderable, target, instruction) {
        addClasses(target.classList, instruction.value);
    }
};
SetClassAttributeRenderer = __decorate([
    instructionRenderer("hf" /* setClassAttribute */)
], SetClassAttributeRenderer);
export { SetClassAttributeRenderer };
let SetStyleAttributeRenderer = class SetStyleAttributeRenderer {
    render(flags, dom, context, renderable, target, instruction) {
        target.style.cssText += instruction.value;
    }
};
SetStyleAttributeRenderer = __decorate([
    instructionRenderer("hg" /* setStyleAttribute */)
], SetStyleAttributeRenderer);
export { SetStyleAttributeRenderer };
let StylePropertyBindingRenderer = 
/** @internal */
class StylePropertyBindingRenderer {
    constructor(parser, observerLocator) {
        this.parser = parser;
        this.observerLocator = observerLocator;
    }
    render(flags, dom, context, renderable, target, instruction) {
        const expr = ensureExpression(this.parser, instruction.from, 48 /* IsPropertyCommand */ | BindingMode.toView);
        const binding = applyBindingBehavior(new PropertyBinding(expr, target.style, instruction.to, BindingMode.toView, this.observerLocator, context), expr, context);
        addBinding(renderable, binding);
    }
};
StylePropertyBindingRenderer = __decorate([
    instructionRenderer("hd" /* stylePropertyBinding */)
    /** @internal */
    ,
    __param(0, IExpressionParser),
    __param(1, IObserverLocator),
    __metadata("design:paramtypes", [Object, Object])
], StylePropertyBindingRenderer);
export { StylePropertyBindingRenderer };
let AttributeBindingRenderer = 
/** @internal */
class AttributeBindingRenderer {
    constructor(parser, observerLocator) {
        this.parser = parser;
        this.observerLocator = observerLocator;
    }
    render(flags, dom, context, renderable, target, instruction) {
        const expr = ensureExpression(this.parser, instruction.from, 48 /* IsPropertyCommand */ | BindingMode.toView);
        const binding = applyBindingBehavior(new AttributeBinding(expr, target, instruction.attr /* targetAttribute */, instruction.to /* targetKey */, BindingMode.toView, this.observerLocator, context), expr, context);
        addBinding(renderable, binding);
    }
};
AttributeBindingRenderer = __decorate([
    instructionRenderer("hc" /* attributeBinding */)
    /** @internal */
    ,
    __param(0, IExpressionParser),
    __param(1, IObserverLocator),
    __metadata("design:paramtypes", [Object, Object])
], AttributeBindingRenderer);
export { AttributeBindingRenderer };
// http://jsben.ch/7n5Kt
function addClasses(classList, className) {
    const len = className.length;
    let start = 0;
    for (let i = 0; i < len; ++i) {
        if (className.charCodeAt(i) === 0x20) {
            if (i !== start) {
                classList.add(className.slice(start, i));
            }
            start = i + 1;
        }
        else if (i + 1 === len) {
            classList.add(className.slice(start));
        }
    }
}
//# sourceMappingURL=html-renderer.js.map