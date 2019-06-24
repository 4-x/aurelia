import { Reporter } from '@aurelia/kernel';
import { BindingBehaviorResource } from '@aurelia/runtime';
import { findOriginalEventTarget } from '../../observation/event-manager';
/** @internal */
export function handleSelfEvent(event) {
    const target = findOriginalEventTarget(event);
    if (this.target !== target) {
        return;
    }
    return this.selfEventCallSource(event);
}
export class SelfBindingBehavior {
    bind(flags, scope, binding) {
        if (!binding.callSource || !binding.targetEvent) {
            throw Reporter.error(8);
        }
        binding.selfEventCallSource = binding.callSource;
        binding.callSource = handleSelfEvent;
    }
    unbind(flags, scope, binding) {
        binding.callSource = binding.selfEventCallSource;
        binding.selfEventCallSource = null;
    }
}
BindingBehaviorResource.define('self', SelfBindingBehavior);
//# sourceMappingURL=self.js.map