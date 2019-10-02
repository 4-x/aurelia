import { DI, IContainer, Registration } from '@aurelia/kernel';
import { IDOM, IDOMInitializer } from '@aurelia/runtime';
import { RuntimeHtmlConfiguration, HTMLDOM } from '@aurelia/runtime-html';
import { JSDOM } from 'jsdom';
class JSDOMInitializer {
    constructor(container) {
        this.container = container;
        this.jsdom = new JSDOM();
    }
    static register(container) {
        return Registration.singleton(IDOMInitializer, this).register(container);
    }
    initialize(config) {
        if (this.container.has(IDOM, false)) {
            return this.container.get(IDOM);
        }
        let dom;
        if (config !== undefined) {
            if (config.dom !== undefined) {
                dom = config.dom;
            }
            else if (config.host.ownerDocument) {
                dom = new HTMLDOM(this.jsdom.window, config.host.ownerDocument, this.jsdom.window.Node, this.jsdom.window.Element, this.jsdom.window.HTMLElement, this.jsdom.window.CustomEvent, this.jsdom.window.CSSStyleSheet, this.jsdom.window.ShadowRoot);
            }
            else {
                if (config.host !== undefined) {
                    this.jsdom.window.document.body.appendChild(config.host);
                }
                dom = new HTMLDOM(this.jsdom.window, this.jsdom.window.document, this.jsdom.window.Node, this.jsdom.window.Element, this.jsdom.window.HTMLElement, this.jsdom.window.CustomEvent, this.jsdom.window.CSSStyleSheet, this.jsdom.window.ShadowRoot);
            }
        }
        else {
            dom = new HTMLDOM(this.jsdom.window, this.jsdom.window.document, this.jsdom.window.Node, this.jsdom.window.Element, this.jsdom.window.HTMLElement, this.jsdom.window.CustomEvent, this.jsdom.window.CSSStyleSheet, this.jsdom.window.ShadowRoot);
        }
        Registration.instance(IDOM, dom).register(this.container);
        return dom;
    }
}
JSDOMInitializer.inject = [IContainer];
export const IDOMInitializerRegistration = JSDOMInitializer;
/**
 * Default HTML-specific, jsdom-specific implementations for the following interfaces:
 * - `IDOMInitializer`
 */
export const DefaultComponents = [
    IDOMInitializerRegistration
];
/**
 * A DI configuration object containing html-specific, jsdom-specific registrations:
 * - `RuntimeHtmlConfiguration` from `@aurelia/runtime-html`
 * - `DefaultComponents`
 */
export const RuntimeHtmlJsdomConfiguration = {
    /**
     * Apply this configuration to the provided container.
     */
    register(container) {
        return RuntimeHtmlConfiguration
            .register(container)
            .register(...DefaultComponents);
    },
    /**
     * Create a new container with this configuration applied to it.
     */
    createContainer() {
        return this.register(DI.createContainer());
    }
};
//# sourceMappingURL=index.js.map