(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "@aurelia/runtime", "../router"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tslib_1 = require("tslib");
    const runtime_1 = require("@aurelia/runtime");
    const router_1 = require("../router");
    class ViewportCustomElement {
        constructor(router, element, renderingEngine) {
            this.name = 'default';
            this.scope = null;
            this.usedBy = null;
            this.default = null;
            this.noLink = null;
            this.noHistory = null;
            this.stateful = null;
            this.viewport = null;
            this.router = router;
            this.element = element;
            this.renderingEngine = renderingEngine;
        }
        render(flags, host, parts, parentContext) {
            const Type = this.constructor;
            const dom = parentContext.get(runtime_1.IDOM);
            const template = this.renderingEngine.getElementTemplate(dom, Type.description, parentContext, Type);
            template.renderContext = runtime_1.createRenderContext(dom, parentContext, Type.description.dependencies, Type);
            template.render(this, host, parts);
        }
        // public created(...rest): void {
        //   console.log('Created', rest);
        //   const booleanAttributes = {
        //     'scope': 'scope',
        //     'no-link': 'noLink',
        //     'no-history': 'noHistory',
        //   };
        //   const valueAttributes = {
        //     'used-by': 'usedBy',
        //     'default': 'default',
        //   };
        //   const name = this.element.hasAttribute('name') ? this.element.getAttribute('name') : 'default';
        //   const options: IViewportOptions = {};
        //   for (const attribute in booleanAttributes) {
        //     if (this.element.hasAttribute[attribute]) {
        //       options[booleanAttributes[attribute]] = true;
        //     }
        //   }
        //   for (const attribute in valueAttributes) {
        //     if (this.element.hasAttribute(attribute)) {
        //       const value = this.element.getAttribute(attribute);
        //       if (value && value.length) {
        //         options[valueAttributes[attribute]] = value;
        //       }
        //     }
        //   }
        //   this.viewport = this.router.addViewport(name, this.element, (this as any).$context.get(IContainer), options);
        // }
        bound() {
            this.connect();
        }
        unbound() {
            this.disconnect();
        }
        connect() {
            const options = { scope: this.element.hasAttribute('scope') };
            if (this.usedBy && this.usedBy.length) {
                options.usedBy = this.usedBy;
            }
            if (this.default && this.default.length) {
                options.default = this.default;
            }
            if (this.element.hasAttribute('no-link')) {
                options.noLink = true;
            }
            if (this.element.hasAttribute('no-history')) {
                options.noHistory = true;
            }
            if (this.element.hasAttribute('stateful')) {
                options.stateful = true;
            }
            this.viewport = this.router.addViewport(this.name, this.element, this.$controller.context, options);
        }
        disconnect() {
            this.router.removeViewport(this.viewport, this.element, this.$controller.context);
        }
        binding(flags) {
            if (this.viewport) {
                this.viewport.binding(flags);
            }
        }
        attaching(flags) {
            if (this.viewport) {
                this.viewport.attaching(flags);
            }
        }
        detaching(flags) {
            if (this.viewport) {
                this.viewport.detaching(flags);
            }
        }
        unbinding(flags) {
            if (this.viewport) {
                this.viewport.unbinding(flags);
            }
        }
    }
    ViewportCustomElement.inject = [router_1.IRouter, runtime_1.INode, runtime_1.IRenderingEngine];
    tslib_1.__decorate([
        runtime_1.bindable
    ], ViewportCustomElement.prototype, "name", void 0);
    tslib_1.__decorate([
        runtime_1.bindable
    ], ViewportCustomElement.prototype, "scope", void 0);
    tslib_1.__decorate([
        runtime_1.bindable
    ], ViewportCustomElement.prototype, "usedBy", void 0);
    tslib_1.__decorate([
        runtime_1.bindable
    ], ViewportCustomElement.prototype, "default", void 0);
    tslib_1.__decorate([
        runtime_1.bindable
    ], ViewportCustomElement.prototype, "noLink", void 0);
    tslib_1.__decorate([
        runtime_1.bindable
    ], ViewportCustomElement.prototype, "noHistory", void 0);
    tslib_1.__decorate([
        runtime_1.bindable
    ], ViewportCustomElement.prototype, "stateful", void 0);
    exports.ViewportCustomElement = ViewportCustomElement;
    // tslint:disable-next-line:no-invalid-template-strings
    runtime_1.CustomElement.define({ name: 'au-viewport', template: '<template><div class="viewport-header" style="display: none;"> Viewport: <b>${name}</b> ${scope ? "[new scope]" : ""} : <b>${viewport.content && viewport.content.componentName()}</b></div></template>' }, ViewportCustomElement);
});
//# sourceMappingURL=viewport.js.map