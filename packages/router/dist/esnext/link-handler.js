import { IDOM } from '@aurelia/runtime';
/**
 * Class responsible for handling interactions that should trigger navigation.
 */
export class LinkHandler {
    // private handler: EventListener;
    constructor(dom) {
        // tslint:disable-next-line:no-empty
        this.options = {
            useHref: true,
            callback: () => { }
        };
        this.isActive = false;
        this.handler = (e) => {
            const info = LinkHandler.getEventInfo(e, this.window, this.options);
            if (info.shouldHandleEvent) {
                e.preventDefault();
                this.options.callback(info);
            }
        };
        this.window = dom.window;
        this.document = dom.document;
    }
    /**
     * Gets the href and a "should handle" recommendation, given an Event.
     *
     * @param event - The Event to inspect for target anchor and href.
     */
    static getEventInfo(event, win, options) {
        const info = {
            shouldHandleEvent: false,
            instruction: null,
            anchor: null
        };
        const target = info.anchor = LinkHandler.closestAnchor(event.target);
        if (!target || !LinkHandler.targetIsThisWindow(target, win)) {
            return info;
        }
        if (target.hasAttribute('external')) {
            return info;
        }
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return info;
        }
        const auHref = target.$au !== void 0 && target.$au['au-href'] !== void 0 ? target.$au['au-href'].viewModel.value : null;
        const href = options.useHref && target.hasAttribute('href') ? target.getAttribute('href') : null;
        if ((auHref === null || auHref.length === 0) && (href === null || href.length === 0)) {
            return info;
        }
        info.anchor = target;
        info.instruction = auHref || href;
        const leftButtonClicked = event.button === 0;
        info.shouldHandleEvent = leftButtonClicked;
        return info;
    }
    /**
     * Finds the closest ancestor that's an anchor element.
     *
     * @param el - The element to search upward from.
     * @returns The link element that is the closest ancestor.
     */
    static closestAnchor(el) {
        while (el !== null && el !== void 0) {
            if (el.tagName === 'A') {
                return el;
            }
            el = el.parentNode;
        }
        return null;
    }
    /**
     * Gets a value indicating whether or not an anchor targets the current window.
     *
     * @param target - The anchor element whose target should be inspected.
     * @returns True if the target of the link element is this window; false otherwise.
     */
    static targetIsThisWindow(target, win) {
        const targetWindow = target.getAttribute('target');
        return !targetWindow ||
            targetWindow === win.name ||
            targetWindow === '_self';
    }
    /**
     * Activate the instance.
     *
     */
    activate(options) {
        if (this.isActive) {
            throw new Error('Link handler has already been activated');
        }
        this.isActive = true;
        this.options = { ...options };
        this.document.addEventListener('click', this.handler, true);
    }
    /**
     * Deactivate the instance. Event handlers and other resources should be cleaned up here.
     */
    deactivate() {
        if (!this.isActive) {
            throw new Error('Link handler has not been activated');
        }
        this.document.removeEventListener('click', this.handler, true);
        this.isActive = false;
    }
}
LinkHandler.inject = [IDOM];
//# sourceMappingURL=link-handler.js.map