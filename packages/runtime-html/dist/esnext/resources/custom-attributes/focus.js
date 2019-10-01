import { __decorate, __param } from "tslib";
import { bindable, BindingMode, customAttribute, IDOM, INode } from '@aurelia/runtime';
/**
 * Focus attribute for element focus binding
 */
let Focus = class Focus {
    constructor(element, dom) {
        this.element = element;
        this.dom = dom;
        this.element = element;
        this.dom = dom;
        this.needsApply = false;
    }
    binding() {
        this.valueChanged();
    }
    /**
     * Invoked everytime the bound value changes.
     * @param newValue The new value.
     */
    valueChanged() {
        // In theory, we could/should react immediately
        // but focus state of an element cannot be achieved
        // while it's disconnected from the document
        // thus, there neesd to be a check if it's currently connected or not
        // before applying the value to the element
        if (this.$controller.state & 32 /* isAttached */) {
            this.apply();
        }
        // If the element is not currently connect
        // toggle the flag to add pending work for later
        // in attached lifecycle
        else {
            this.needsApply = true;
        }
    }
    /**
     * Invoked when the attribute is attached to the DOM.
     */
    attached() {
        if (this.needsApply) {
            this.needsApply = false;
            this.apply();
        }
        const el = this.element;
        el.addEventListener('focus', this);
        el.addEventListener('blur', this);
    }
    /**
     * Invoked when the attribute is detached from the DOM.
     */
    detached() {
        const el = this.element;
        el.removeEventListener('focus', this);
        el.removeEventListener('blur', this);
    }
    /**
     * EventTarget interface handler for better memory usage
     */
    handleEvent(e) {
        // there are only two event listened to
        // if the even is focus, it menans the element is focused
        // only need to switch the value to true
        if (e.type === 'focus') {
            this.value = true;
        }
        // else, it's blur event
        // when a blur event happens, there are two situations
        // 1. the element itself lost the focus
        // 2. window lost the focus
        // To handle both (1) and (2), only need to check if
        // current active element is still the same element of this focus custom attribute
        // If it's not, it's a blur event happened on Window because the browser tab lost focus
        else if (this.dom.document.activeElement !== this.element) {
            this.value = false;
        }
    }
    /**
     * Focus/blur based on current value
     */
    apply() {
        const el = this.element;
        if (this.value) {
            el.focus();
        }
        else {
            el.blur();
        }
    }
};
__decorate([
    bindable({ mode: BindingMode.twoWay })
], Focus.prototype, "value", void 0);
Focus = __decorate([
    customAttribute('focus'),
    __param(0, INode),
    __param(1, IDOM)
], Focus);
export { Focus };
//# sourceMappingURL=focus.js.map