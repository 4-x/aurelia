import * as tslib_1 from "tslib";
import { nextId } from '@aurelia/kernel';
import { IRenderLocation } from '../../dom';
import { IViewFactory } from '../../lifecycle';
import { templateController } from '../custom-attribute';
class FlagsTemplateController {
    constructor(factory, location, flags) {
        this.factory = factory;
        this.flags = flags;
        this.id = nextId('au$component');
        this.view = this.factory.create();
        this.view.hold(location);
    }
    binding(flags) {
        this.view.parent = this.$controller;
        return this.view.bind(flags | this.flags, this.$controller.scope);
    }
    attaching(flags) {
        this.view.attach(flags);
    }
    detaching(flags) {
        this.view.detach(flags);
    }
    unbinding(flags) {
        const task = this.view.unbind(flags);
        this.view.parent = void 0;
        return task;
    }
}
let InfrequentMutations = class InfrequentMutations extends FlagsTemplateController {
    constructor(factory, location) {
        super(factory, location, 536870912 /* noTargetObserverQueue */);
    }
};
InfrequentMutations = tslib_1.__decorate([
    templateController('infrequent-mutations'),
    tslib_1.__param(0, IViewFactory),
    tslib_1.__param(1, IRenderLocation)
], InfrequentMutations);
export { InfrequentMutations };
let FrequentMutations = class FrequentMutations extends FlagsTemplateController {
    constructor(factory, location) {
        super(factory, location, 1073741824 /* persistentTargetObserverQueue */);
    }
};
FrequentMutations = tslib_1.__decorate([
    templateController('frequent-mutations'),
    tslib_1.__param(0, IViewFactory),
    tslib_1.__param(1, IRenderLocation)
], FrequentMutations);
export { FrequentMutations };
let ObserveShallow = class ObserveShallow extends FlagsTemplateController {
    constructor(factory, location) {
        super(factory, location, 268435456 /* observeLeafPropertiesOnly */);
    }
};
ObserveShallow = tslib_1.__decorate([
    templateController('observe-shallow'),
    tslib_1.__param(0, IViewFactory),
    tslib_1.__param(1, IRenderLocation)
], ObserveShallow);
export { ObserveShallow };
//# sourceMappingURL=flags.js.map