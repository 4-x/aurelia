(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@aurelia/kernel", "./viewport-content", "./viewport-instruction"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const kernel_1 = require("@aurelia/kernel");
    const viewport_content_1 = require("./viewport-content");
    const viewport_instruction_1 = require("./viewport-instruction");
    class Viewport {
        constructor(router, name, element, context, owningScope, scope, options) {
            this.router = router;
            this.name = name;
            this.element = element;
            this.context = context;
            this.owningScope = owningScope;
            this.scope = scope;
            this.options = options;
            this.clear = false;
            this.content = new viewport_content_1.ViewportContent();
            this.nextContent = null;
            this.elementResolve = null;
            this.previousViewportState = null;
            this.cache = [];
            this.enabled = true;
        }
        setNextContent(content, instruction) {
            let parameters;
            this.clear = false;
            if (typeof content === 'string') {
                if (content === this.router.instructionResolver.clearViewportInstruction) {
                    this.clear = true;
                    content = null;
                }
                else {
                    const viewportInstruction = this.router.instructionResolver.parseViewportInstruction(content);
                    content = viewportInstruction.componentName;
                    parameters = viewportInstruction.parametersString;
                }
            }
            // Can have a (resolved) type or a string (to be resolved later)
            this.nextContent = new viewport_content_1.ViewportContent(content, parameters, instruction, this.context);
            if (this.options.stateful) {
                // TODO: Add a parameter here to decide required equality
                const cached = this.cache.find((item) => this.nextContent.isCacheEqual(item));
                if (cached) {
                    this.nextContent = cached;
                    this.nextContent.fromCache = true;
                }
                else {
                    this.cache.push(this.nextContent);
                }
            }
            // ReentryBehavior 'refresh' takes precedence
            if (!this.content.equalComponent(this.nextContent) ||
                instruction.navigation.refresh ||
                this.content.reentryBehavior() === "refresh" /* refresh */) {
                return true;
            }
            // Explicitly don't allow navigation back to the same component again
            if (this.content.reentryBehavior() === "disallow" /* disallow */) {
                return;
            }
            // ReentryBehavior is now 'enter' or 'default'
            if (!this.content.equalParameters(this.nextContent) ||
                this.content.reentryBehavior() === "enter" /* enter */) {
                this.content.reentry = true;
                this.nextContent.content = this.content.content;
                this.nextContent.component = this.content.component;
                this.nextContent.contentStatus = this.content.contentStatus;
                this.nextContent.reentry = this.content.reentry;
                return true;
            }
            return false;
        }
        setElement(element, context, options) {
            // First added viewport with element is always scope viewport (except for root scope)
            if (this.scope && this.scope.parent && !this.scope.viewport) {
                this.scope.viewport = this;
            }
            if (this.scope && !this.scope.element) {
                this.scope.element = element;
            }
            if (this.element !== element) {
                // TODO: Restore this state on navigation cancel
                this.previousViewportState = { ...this };
                this.clearState();
                this.element = element;
                if (options && options.usedBy) {
                    this.options.usedBy = options.usedBy;
                }
                if (options && options.default) {
                    this.options.default = options.default;
                }
                if (options && options.noLink) {
                    this.options.noLink = options.noLink;
                }
                if (options && options.noHistory) {
                    this.options.noHistory = options.noHistory;
                }
                if (options && options.stateful) {
                    this.options.stateful = options.stateful;
                }
                if (this.elementResolve) {
                    this.elementResolve();
                }
            }
            if (context) {
                context['viewportName'] = this.name;
            }
            if (this.context !== context) {
                this.context = context;
            }
            if (!this.content.component && (!this.nextContent || !this.nextContent.component) && this.options.default) {
                this.router.addProcessingViewport(this.options.default, this);
            }
        }
        remove(element, context) {
            if (this.element === element && this.context === context) {
                if (this.content.component) {
                    this.content.freeContent(this.element, (this.nextContent ? this.nextContent.instruction : null), this.options.stateful).catch(error => { throw error; });
                }
                return true;
            }
            return false;
        }
        async canLeave() {
            return this.content.canLeave(this.nextContent.instruction);
        }
        async canEnter() {
            if (this.clear) {
                return true;
            }
            if (!this.nextContent.content) {
                return false;
            }
            await this.waitForElement();
            this.nextContent.createComponent(this.context);
            return this.nextContent.canEnter(this, this.content.instruction);
        }
        async enter() {
            kernel_1.Reporter.write(10000, 'Viewport enter', this.name);
            if (this.clear) {
                return true;
            }
            if (!this.nextContent || !this.nextContent.component) {
                return false;
            }
            await this.nextContent.enter(this.content.instruction);
            await this.nextContent.loadComponent(this.context, this.element);
            this.nextContent.initializeComponent();
            return true;
        }
        async loadContent() {
            kernel_1.Reporter.write(10000, 'Viewport loadContent', this.name);
            // No need to wait for next component activation
            if (this.content.component && !this.nextContent.component) {
                await this.content.leave(this.nextContent.instruction);
                this.content.removeComponent(this.element, this.options.stateful);
                this.content.terminateComponent(this.options.stateful);
                this.content.unloadComponent();
                this.content.destroyComponent();
            }
            if (this.nextContent.component) {
                this.nextContent.addComponent(this.element);
                // Only when next component activation is done
                if (this.content.component) {
                    await this.content.leave(this.nextContent.instruction);
                    if (!this.content.reentry) {
                        this.content.removeComponent(this.element, this.options.stateful);
                        this.content.terminateComponent(this.options.stateful);
                        this.content.unloadComponent();
                        this.content.destroyComponent();
                    }
                }
                this.content = this.nextContent;
                this.content.reentry = false;
            }
            if (this.clear) {
                this.content = new viewport_content_1.ViewportContent(null, null, this.nextContent.instruction);
            }
            this.nextContent = null;
            return true;
        }
        finalizeContentChange() {
            this.previousViewportState = null;
        }
        async abortContentChange() {
            await this.nextContent.freeContent(this.element, (this.nextContent ? this.nextContent.instruction : null), this.options.stateful);
            if (this.previousViewportState) {
                Object.assign(this, this.previousViewportState);
            }
        }
        description(full = false) {
            if (this.content.content) {
                const component = this.content.componentName();
                if (full || this.scope || this.options.forceDescription) {
                    return this.router.instructionResolver.stringifyViewportInstruction(new viewport_instruction_1.ViewportInstruction(component, this, this.content.parameters, this.scope !== null));
                }
                const found = this.owningScope.findViewports([new viewport_instruction_1.ViewportInstruction(component)]);
                if (!found || !found.viewportInstructions || !found.viewportInstructions.length) {
                    return this.router.instructionResolver.stringifyViewportInstruction(new viewport_instruction_1.ViewportInstruction(component, this, this.content.parameters));
                }
                return this.router.instructionResolver.stringifyViewportInstruction(new viewport_instruction_1.ViewportInstruction(component, null, this.content.parameters));
            }
        }
        scopedDescription(full = false) {
            const descriptions = [this.owningScope.scopeContext(full), this.description(full)];
            return this.router.instructionResolver.stringifyScopedViewportInstruction(descriptions.filter((value) => value && value.length));
        }
        // TODO: Deal with non-string components
        wantComponent(component) {
            let usedBy = this.options.usedBy || [];
            if (typeof usedBy === 'string') {
                usedBy = usedBy.split(',');
            }
            return usedBy.indexOf(component) >= 0;
        }
        // TODO: Deal with non-string components
        acceptComponent(component) {
            if (component === '-' || component === null) {
                return true;
            }
            let usedBy = this.options.usedBy;
            if (!usedBy || !usedBy.length) {
                return true;
            }
            if (typeof usedBy === 'string') {
                usedBy = usedBy.split(',');
            }
            if (usedBy.indexOf(component) >= 0) {
                return true;
            }
            if (usedBy.filter((value) => value.indexOf('*') >= 0).length) {
                return true;
            }
            return false;
        }
        binding(flags) {
            if (this.content.component) {
                this.content.initializeComponent();
            }
        }
        attaching(flags) {
            kernel_1.Reporter.write(10000, 'ATTACHING viewport', this.name, this.content, this.nextContent);
            this.enabled = true;
            if (this.content.component) {
                this.content.addComponent(this.element);
            }
        }
        detaching(flags) {
            kernel_1.Reporter.write(10000, 'DETACHING viewport', this.name);
            if (this.content.component) {
                this.content.removeComponent(this.element, this.options.stateful);
            }
            this.enabled = false;
        }
        unbinding(flags) {
            if (this.content.component) {
                this.content.terminateComponent(this.options.stateful);
            }
        }
        clearState() {
            this.options = {};
            this.content = new viewport_content_1.ViewportContent();
            this.cache = [];
        }
        async waitForElement() {
            if (this.element) {
                return Promise.resolve();
            }
            // tslint:disable-next-line:promise-must-complete
            return new Promise((resolve) => {
                this.elementResolve = resolve;
            });
        }
    }
    exports.Viewport = Viewport;
});
//# sourceMappingURL=viewport.js.map