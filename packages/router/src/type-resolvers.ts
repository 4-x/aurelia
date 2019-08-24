import { Constructable } from '@aurelia/kernel';
import { CustomElement, ICustomElementType } from '@aurelia/runtime';
import { ComponentAppellation, IRouteableComponent, IRouteableComponentType, IViewportInstruction, NavigationInstruction, ViewportHandle } from './interfaces';
import { IRouter } from './router';
import { Viewport } from './viewport';
import { ViewportInstruction } from './viewport-instruction';

export const ComponentAppellationResolver = {
  isName: function <T>(component: T & ComponentAppellation): component is T & ComponentAppellation {
    return typeof component === 'string';
  },
  isType: function <T>(component: T & ComponentAppellation): component is T & ComponentAppellation & IRouteableComponentType {
    return CustomElement.isType(component);
  },
  isInstance: function <T>(component: T & ComponentAppellation): component is T & ComponentAppellation & IRouteableComponent {
    return !ComponentAppellationResolver.isName(component) && !ComponentAppellationResolver.isType(component);
  },

  getName: function <T>(component: T & ComponentAppellation): string {
    if (ComponentAppellationResolver.isName(component)) {
      return component as string;
    } else if (ComponentAppellationResolver.isType(component)) {
      return (component as ICustomElementType).description.name;
    } else {
      return ((component as IRouteableComponent).constructor as ICustomElementType).description.name;
    }
  },
  getType: function <T extends Constructable>(component: T & ComponentAppellation): IRouteableComponentType {
    if (ComponentAppellationResolver.isName(component)) {
      return null;
    } else if (ComponentAppellationResolver.isType(component)) {
      return component;
    } else {
      return ((component as IRouteableComponent).constructor as IRouteableComponentType);
    }
  },
  getInstance: function <T extends Constructable>(component: T & ComponentAppellation): IRouteableComponent {
    if (ComponentAppellationResolver.isName(component) || ComponentAppellationResolver.isType(component)) {
      return null;
    } else {
      return component;
    }
  },
};

export const ViewportHandleResolver = {
  isName: function <T>(viewport: T & ViewportHandle): viewport is T & ViewportHandle {
    return typeof viewport === 'string';
  },
  isInstance: function <T>(viewport: T & ViewportHandle): viewport is T & ViewportHandle {
    return viewport instanceof Viewport;
  },
  getName: function <T>(viewport: T & ViewportHandle): string {
    if (ViewportHandleResolver.isName(viewport)) {
      return viewport as string;
    } else {
      return viewport ? (viewport as Viewport).name : null;
    }
  },
  getInstance: function <T>(viewport: T & ViewportHandle): Viewport {
    if (ViewportHandleResolver.isName(viewport)) {
      return null;
    } else {
      return viewport;
    }
  },
};

export const NavigationInstructionResolver = {
  toViewportInstructions: function (router: IRouter, navigationInstructions: NavigationInstruction | NavigationInstruction[]): ViewportInstruction[] {
    if (!Array.isArray(navigationInstructions)) {
      return NavigationInstructionResolver.toViewportInstructions(router, [navigationInstructions]);
    }
    const instructions: ViewportInstruction[] = [];
    for (const instruction of navigationInstructions) {
      if (typeof instruction === 'string') {
        instructions.push(router.instructionResolver.parseViewportInstruction(instruction));
      } else if (instruction as ViewportInstruction instanceof ViewportInstruction) {
        instructions.push(instruction as ViewportInstruction);
      } else if (instruction['component']) {
        const viewportComponent = instruction as IViewportInstruction;
        instructions.push(new ViewportInstruction(viewportComponent.component, viewportComponent.viewport, viewportComponent.parameters));
      } else {
        instructions.push(new ViewportInstruction(instruction as IRouteableComponentType));
      }
    }
    return instructions;
  },
};
