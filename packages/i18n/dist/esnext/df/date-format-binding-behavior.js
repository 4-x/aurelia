import * as tslib_1 from "tslib";
import { bindingBehavior } from '@aurelia/runtime';
import { createIntlFormatValueConverterExpression } from '../utils';
let DateFormatBindingBehavior = class DateFormatBindingBehavior {
    bind(flags, scope, binding) {
        createIntlFormatValueConverterExpression("df" /* dateFormatValueConverterName */, binding);
    }
};
DateFormatBindingBehavior = tslib_1.__decorate([
    bindingBehavior("df" /* dateFormatValueConverterName */)
], DateFormatBindingBehavior);
export { DateFormatBindingBehavior };
//# sourceMappingURL=date-format-binding-behavior.js.map