import { IForOfStatement, IInterpolationExpression, IsBindingBehavior } from './ast';
import { ICallBindingInstruction, IHydrateAttributeInstruction, IHydrateElementInstruction, IHydrateLetElementInstruction, IHydrateTemplateController, IInterpolationInstruction, IIteratorBindingInstruction, ILetBindingInstruction, IPropertyBindingInstruction, IRefBindingInstruction, ISetPropertyInstruction, ITargetedInstruction, ITemplateDefinition, TargetedInstructionType } from './definitions';
import { BindingMode } from './flags';
export declare class InterpolationInstruction implements IInterpolationInstruction {
    type: TargetedInstructionType.interpolation;
    from: string | IInterpolationExpression;
    to: string;
    constructor(from: string | IInterpolationExpression, to: string);
}
export declare class OneTimeBindingInstruction implements IPropertyBindingInstruction {
    type: TargetedInstructionType.propertyBinding;
    from: string | IsBindingBehavior;
    mode: BindingMode.oneTime;
    oneTime: true;
    to: string;
    constructor(from: string | IsBindingBehavior, to: string);
}
export declare class ToViewBindingInstruction implements IPropertyBindingInstruction {
    type: TargetedInstructionType.propertyBinding;
    from: string | IsBindingBehavior;
    mode: BindingMode.toView;
    oneTime: false;
    to: string;
    constructor(from: string | IsBindingBehavior, to: string);
}
export declare class FromViewBindingInstruction implements IPropertyBindingInstruction {
    type: TargetedInstructionType.propertyBinding;
    from: string | IsBindingBehavior;
    mode: BindingMode.fromView;
    oneTime: false;
    to: string;
    constructor(from: string | IsBindingBehavior, to: string);
}
export declare class TwoWayBindingInstruction implements IPropertyBindingInstruction {
    type: TargetedInstructionType.propertyBinding;
    from: string | IsBindingBehavior;
    mode: BindingMode.twoWay;
    oneTime: false;
    to: string;
    constructor(from: string | IsBindingBehavior, to: string);
}
export declare class IteratorBindingInstruction implements IIteratorBindingInstruction {
    type: TargetedInstructionType.iteratorBinding;
    from: string | IForOfStatement;
    to: string;
    constructor(from: string | IForOfStatement, to: string);
}
export declare class CallBindingInstruction implements ICallBindingInstruction {
    type: TargetedInstructionType.callBinding;
    from: string | IsBindingBehavior;
    to: string;
    constructor(from: string | IsBindingBehavior, to: string);
}
export declare class RefBindingInstruction implements IRefBindingInstruction {
    type: TargetedInstructionType.refBinding;
    from: string | IsBindingBehavior;
    constructor(from: string | IsBindingBehavior);
}
export declare class SetPropertyInstruction implements ISetPropertyInstruction {
    type: TargetedInstructionType.setProperty;
    to: string;
    value: unknown;
    constructor(value: unknown, to: string);
}
export declare class HydrateElementInstruction implements IHydrateElementInstruction {
    type: TargetedInstructionType.hydrateElement;
    instructions: ITargetedInstruction[];
    parts?: Record<string, ITemplateDefinition>;
    res: string;
    constructor(res: string, instructions: ITargetedInstruction[], parts?: Record<string, ITemplateDefinition>);
}
export declare class HydrateAttributeInstruction implements IHydrateAttributeInstruction {
    type: TargetedInstructionType.hydrateAttribute;
    instructions: ITargetedInstruction[];
    res: string;
    constructor(res: string, instructions: ITargetedInstruction[]);
}
export declare class HydrateTemplateController implements IHydrateTemplateController {
    type: TargetedInstructionType.hydrateTemplateController;
    def: ITemplateDefinition;
    instructions: ITargetedInstruction[];
    link?: boolean;
    res: string;
    constructor(def: ITemplateDefinition, res: string, instructions: ITargetedInstruction[], link?: boolean);
}
export declare class LetElementInstruction implements IHydrateLetElementInstruction {
    type: TargetedInstructionType.hydrateLetElement;
    instructions: ILetBindingInstruction[];
    toViewModel: boolean;
    constructor(instructions: ILetBindingInstruction[], toViewModel: boolean);
}
export declare class LetBindingInstruction implements ILetBindingInstruction {
    type: TargetedInstructionType.letBinding;
    from: string | IsBindingBehavior | IInterpolationExpression;
    to: string;
    constructor(from: string | IsBindingBehavior | IInterpolationExpression, to: string);
}
//# sourceMappingURL=instructions.d.ts.map