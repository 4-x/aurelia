(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./type-resolvers"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const type_resolvers_1 = require("./type-resolvers");
    class NavRoute {
        constructor(nav, route) {
            this.compareParameters = false;
            this.visible = true;
            this.active = '';
            this.nav = nav;
            Object.assign(this, {
                title: route.title,
                children: null,
                meta: route.meta,
                active: '',
            });
            if (route.route) {
                this.instructions = this.parseRoute(route.route);
                this.link = this.computeLink(this.instructions);
            }
            this.linkActive = route.consideredActive ? route.consideredActive : this.link;
            if (!(this.linkActive instanceof Function) || type_resolvers_1.ComponentAppellationResolver.isType(this.linkActive)) {
                this.linkActive = type_resolvers_1.NavigationInstructionResolver.toViewportInstructions(this.nav.router, this.linkActive);
            }
            this.execute = route.execute;
            this.compareParameters = !!route.compareParameters;
            this.linkVisible = route.condition === undefined ? true : route.condition;
            this.update();
        }
        get hasChildren() {
            return (this.children && this.children.length ? 'nav-has-children' : '');
        }
        update() {
            this.visible = this.computeVisible();
            if ((this.link && this.link.length) || this.execute) {
                this.active = this.computeActive();
            }
            else {
                this.active = (this.active === 'nav-active' ? 'nav-active' : (this.activeChild() ? 'nav-active-child' : ''));
            }
        }
        executeAction(event) {
            this.execute(this);
            event.stopPropagation();
        }
        toggleActive() {
            this.active = (this.active.startsWith('nav-active') ? '' : 'nav-active');
        }
        parseRoute(routes) {
            return type_resolvers_1.NavigationInstructionResolver.toViewportInstructions(this.nav.router, routes);
        }
        computeVisible() {
            if (this.linkVisible instanceof Function) {
                return this.linkVisible(this);
            }
            return this.linkVisible;
        }
        computeActive() {
            if (!Array.isArray(this.linkActive)) {
                return this.linkActive(this) ? 'nav-active' : '';
            }
            const components = this.linkActive;
            let activeComponents = this.nav.router.activeComponents.map((state) => this.nav.router.instructionResolver.parseViewportInstruction(state));
            activeComponents = this.nav.router.instructionResolver.flattenViewportInstructions(activeComponents);
            for (const component of components) {
                if (activeComponents.every((active) => !active.sameComponent(component, this.compareParameters && !!component.parametersString))) {
                    return '';
                }
            }
            return 'nav-active';
        }
        computeLink(instructions) {
            return this.nav.router.instructionResolver.stringifyViewportInstructions(instructions);
        }
        activeChild() {
            if (this.children) {
                for (const child of this.children) {
                    if (child.active.startsWith('nav-active') || child.activeChild()) {
                        return true;
                    }
                }
            }
            return false;
        }
    }
    exports.NavRoute = NavRoute;
});
//# sourceMappingURL=nav-route.js.map