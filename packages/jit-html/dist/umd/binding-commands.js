(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "@aurelia/jit", "@aurelia/runtime-html"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tslib_1 = require("tslib");
    const jit_1 = require("@aurelia/jit");
    const runtime_html_1 = require("@aurelia/runtime-html");
    /**
     * Trigger binding command. Compile attr with binding symbol with command `trigger` to `TriggerBindingInstruction`
     */
    let TriggerBindingCommand = class TriggerBindingCommand {
        /**
         * Trigger binding command. Compile attr with binding symbol with command `trigger` to `TriggerBindingInstruction`
         */
        constructor() {
            this.bindingType = 4182 /* TriggerCommand */;
        }
        compile(binding) {
            return new runtime_html_1.TriggerBindingInstruction(binding.expression, jit_1.getTarget(binding, false));
        }
    };
    TriggerBindingCommand = tslib_1.__decorate([
        jit_1.bindingCommand('trigger')
    ], TriggerBindingCommand);
    exports.TriggerBindingCommand = TriggerBindingCommand;
    /**
     * Delegate binding command. Compile attr with binding symbol with command `delegate` to `DelegateBindingInstruction`
     */
    let DelegateBindingCommand = class DelegateBindingCommand {
        /**
         * Delegate binding command. Compile attr with binding symbol with command `delegate` to `DelegateBindingInstruction`
         */
        constructor() {
            this.bindingType = 4184 /* DelegateCommand */;
        }
        compile(binding) {
            return new runtime_html_1.DelegateBindingInstruction(binding.expression, jit_1.getTarget(binding, false));
        }
    };
    DelegateBindingCommand = tslib_1.__decorate([
        jit_1.bindingCommand('delegate')
    ], DelegateBindingCommand);
    exports.DelegateBindingCommand = DelegateBindingCommand;
    /**
     * Capture binding command. Compile attr with binding symbol with command `capture` to `CaptureBindingInstruction`
     */
    let CaptureBindingCommand = class CaptureBindingCommand {
        /**
         * Capture binding command. Compile attr with binding symbol with command `capture` to `CaptureBindingInstruction`
         */
        constructor() {
            this.bindingType = 4183 /* CaptureCommand */;
        }
        compile(binding) {
            return new runtime_html_1.CaptureBindingInstruction(binding.expression, jit_1.getTarget(binding, false));
        }
    };
    CaptureBindingCommand = tslib_1.__decorate([
        jit_1.bindingCommand('capture')
    ], CaptureBindingCommand);
    exports.CaptureBindingCommand = CaptureBindingCommand;
    /**
     * Attr binding command. Compile attr with binding symbol with command `attr` to `AttributeBindingInstruction`
     */
    let AttrBindingCommand = class AttrBindingCommand {
        /**
         * Attr binding command. Compile attr with binding symbol with command `attr` to `AttributeBindingInstruction`
         */
        constructor() {
            this.bindingType = 32 /* IsProperty */;
        }
        compile(binding) {
            const target = jit_1.getTarget(binding, false);
            return new runtime_html_1.AttributeBindingInstruction(target, binding.expression, target);
        }
    };
    AttrBindingCommand = tslib_1.__decorate([
        jit_1.bindingCommand('attr')
    ], AttrBindingCommand);
    exports.AttrBindingCommand = AttrBindingCommand;
    /**
     * Style binding command. Compile attr with binding symbol with command `style` to `AttributeBindingInstruction`
     */
    let StyleBindingCommand = class StyleBindingCommand {
        /**
         * Style binding command. Compile attr with binding symbol with command `style` to `AttributeBindingInstruction`
         */
        constructor() {
            this.bindingType = 32 /* IsProperty */;
        }
        compile(binding) {
            return new runtime_html_1.AttributeBindingInstruction('style', binding.expression, jit_1.getTarget(binding, false));
        }
    };
    StyleBindingCommand = tslib_1.__decorate([
        jit_1.bindingCommand('style')
    ], StyleBindingCommand);
    exports.StyleBindingCommand = StyleBindingCommand;
    /**
     * Class binding command. Compile attr with binding symbol with command `class` to `AttributeBindingInstruction`
     */
    let ClassBindingCommand = class ClassBindingCommand {
        /**
         * Class binding command. Compile attr with binding symbol with command `class` to `AttributeBindingInstruction`
         */
        constructor() {
            this.bindingType = 32 /* IsProperty */;
        }
        compile(binding) {
            return new runtime_html_1.AttributeBindingInstruction('class', binding.expression, jit_1.getTarget(binding, false));
        }
    };
    ClassBindingCommand = tslib_1.__decorate([
        jit_1.bindingCommand('class')
    ], ClassBindingCommand);
    exports.ClassBindingCommand = ClassBindingCommand;
});
//# sourceMappingURL=binding-commands.js.map