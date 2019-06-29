import { IRegistry } from '@aurelia/kernel';
import { PropertyBinding } from '../../binding/property-binding';
import { BindingMode, LifecycleFlags } from '../../flags';
import { IScope } from '../../observation';
import { BindingBehavior } from '../binding-behavior';

const { oneTime, toView, fromView, twoWay } = BindingMode;

export type WithMode = { mode: BindingMode; originalMode?: BindingMode };

export abstract class BindingModeBehavior {
  private readonly mode: BindingMode;

  constructor(mode: BindingMode) {
    this.mode = mode;
  }

  public bind(flags: LifecycleFlags, scope: IScope, binding: PropertyBinding & WithMode): void {
    binding.originalMode = binding.mode;
    binding.mode = this.mode;
  }

  public unbind(flags: LifecycleFlags, scope: IScope, binding: PropertyBinding & WithMode): void {
    binding.mode = binding.originalMode!;
    binding.originalMode = null!;
  }
}

export class OneTimeBindingBehavior extends BindingModeBehavior {
  public static register: IRegistry['register'];

  constructor() {
    super(oneTime);
  }
}
BindingBehavior.define('oneTime', OneTimeBindingBehavior);

export class ToViewBindingBehavior extends BindingModeBehavior {
  public static register: IRegistry['register'];

  constructor() {
    super(toView);
  }
}
BindingBehavior.define('toView', ToViewBindingBehavior);

export class FromViewBindingBehavior extends BindingModeBehavior {
  public static register: IRegistry['register'];

  constructor() {
    super(fromView);
  }
}
BindingBehavior.define('fromView', FromViewBindingBehavior);

export class TwoWayBindingBehavior extends BindingModeBehavior {
  public static register: IRegistry['register'];

  constructor() {
    super(twoWay);
  }
}
BindingBehavior.define('twoWay', TwoWayBindingBehavior);
