import { Unparser } from '@aurelia/debug';
import { IContainer, Registration } from '@aurelia/kernel';
import {
  Aurelia,
  CustomElement,
  IBinding,
  INode,
  IScheduler,
  bindable,
  customElement,
  customAttribute,
  valueConverter,
  bindingBehavior,
  BindingInterceptor,
  BindingBehaviorInstance,
  IScope,
  LifecycleFlags,
  BindingMediator,
  IObserverLocator,
  ILifecycle,
  ArrayObserver
} from '@aurelia/runtime';
import { assert, TestContext, HTMLTestContext } from '@aurelia/testing';
import {
  BindingWithBehavior,
  IValidationController,
  IValidationRules,
  ValidationConfiguration,
  ValidationController,
  ValidationTrigger,
  PropertyRule,
  RangeRule,
  RequiredRule,
  ValidationControllerFactory,
  ValidateInstruction
} from '@aurelia/validation';
import { Spy } from '../Spy';
import { Person, Organization } from './_test-resources';
import { createSpecFunction, TestFunction, TestExecutionContext, ToNumberValueConverter } from '../util';

describe('validate-biniding-behavior', function () {
  const $atob = typeof atob === 'function' ? atob : (b64: string) => Buffer.from(b64, 'base64').toString();
  const $btoa = typeof btoa === 'function' ? btoa : (plainText: string) => Buffer.from(plainText).toString('base64');

  class App {
    public validatableProp: string = (void 0)!;
    public person: Person = new Person((void 0)!, (void 0)!);
    public tempController: ValidationController;
    public controller: ValidationController;
    public controller2: ValidationController;
    public controllerSpy: Spy;
    public controller2Spy: Spy;
    public trigger: ValidationTrigger = ValidationTrigger.change;
    public ageMinRule: PropertyRule;
    public tempAgeRule: PropertyRule[] = (void 0)!;
    public org: Organization = new Organization([], void 0);
    public employeesMediator: BindingMediator<'handleEmployeesChange'>;
    public employeeObserver: ArrayObserver;
    public readonly scheduler: IScheduler;
    private readonly obj: any;
    private readonly validationRules: IValidationRules;

    public constructor(
      private readonly container: IContainer,
      observeCollection = false,
    ) {
      const factory = new ValidationControllerFactory();
      this.scheduler = container.get(IScheduler);
      this.controllerSpy = new Spy();
      this.controller2Spy = new Spy();

      // mocks ValidationControllerFactory#createForCurrentScope
      const controller = this.controller = this.controllerSpy.getMock(factory.construct(container)) as unknown as ValidationController;
      Registration.instance(IValidationController, controller).register(container);

      this.controller2 = this.controller2Spy.getMock(factory.construct(container)) as unknown as ValidationController;

      const validationRules = this.validationRules = container.get(IValidationRules);
      const rules = validationRules
        .on(this.person)

        .ensure('name')
        .required()

        .ensure('age')
        .required()
        .min(42)

        .ensure((p) => p.address.pin)
        .satisfies((pin, _) => !Number.isNaN(Number(pin)))
        .rules;

      const { validationRules: vrs, messageProvider, property, $rules } = rules.find((rule) => rule.property.name === 'age')!;
      this.ageMinRule = new PropertyRule(vrs, messageProvider, property, [[$rules[0].find((rule) => rule instanceof RangeRule)]]);

      validationRules
        .on(this.org)

        .ensure('employees')
        .minItems(1)

        .ensure((o) => o.employees[0].address.pin)
        .satisfies((pin, _) => !Number.isNaN(Number(pin)));

      if (observeCollection) {
        this.employeesMediator = new BindingMediator('handleEmployeesChange', this, this.container.get(IObserverLocator), this.container);
        this.employeeObserver = new ArrayObserver(LifecycleFlags.none, this.container.get(ILifecycle), this.org.employees);
        this.employeeObserver.getLengthObserver().addSubscriber(this.employeesMediator);
      }

      this.obj = { coll: [{ a: 1 }, { a: 2 }] };
      validationRules
        .on(this.obj)

        .ensure((o) => o.coll[0].a)
        .equals(11)

        .ensure('coll[1].a')
        .equals(11)

        .on(this)
        .ensure('validatableProp')
        .displayName('Property')
        .required();
    }

    public async handleEmployeesChange() {
      await this.scheduler.getPostRenderTaskQueue().queueTask(async () => {
        await this.controller.validate();
      }).result;
    }

    public beforeUnbind() {
      this.validationRules.off();
    }
  }

  @customElement({ name: 'text-box', template: `<input value.two-way="value"/>` })
  class TextBox {
    @bindable public value: unknown;
  }
  @customElement({
    name: 'employee-list',
    template: `
    <button id="hire-replace" click.delegate="hireReplace()">hire</button>
    <button id="fire-replace" click.delegate="fireReplace()">fire</button>
    <button id="hire-in-place" click.delegate="hireInPlace()">hire</button>
    <button id="fire-in-place" click.delegate="fireInPlace()">fire</button>
    <span repeat.for="employee of employees" style="display: block">\${$index}. \${employee.name}</span>
    `
  })
  class EmployeeList {
    @bindable public employees: Person[];
    private readonly names: string[] = [
      "Brigida Brayboy",
      "Anya Dinapoli",
      "Warren Asberry",
      "Rudy Melone",
      "Alexis Kinnaird",
      "Lisa Goines",
      "Carson Boyce",
      "Carolann Rosales",
      "Fabiola Jacome",
      "Leoma Metro",
    ];

    private createPerson() {
      const age = Math.floor(Math.random() * this.names.length);
      return new Person(this.names[age], age);
    }

    private hireInPlace() {
      this.employees.push(this.createPerson());
    }

    private hireReplace() {
      this.employees = [...this.employees, this.createPerson()];
    }

    private fireInPlace() {
      this.employees.pop();
    }

    private fireReplace() {
      const clone = this.employees.splice(0);
      clone.pop();
      this.employees = clone;
    }
  }
  @customAttribute({ name: 'foo-bar' })
  class FooBar {
    public static staticText: string = 'from foo-bar ca';
    @bindable public value: unknown;
    @bindable public triggeringEvents: string[];
    private readonly node: HTMLElement;

    public constructor(@INode node: INode) {
      this.node = node as HTMLElement;
    }

    public beforeBind() {
      for (const event of this.triggeringEvents) {
        this.node.addEventListener(event, this);
      }
    }

    public handleEvent(_event: Event) {
      this.value = FooBar.staticText;
    }
  }
  @valueConverter('b64ToPlainText')
  class B64ToPlainTextValueConverter {
    public fromView(b64: string): string { return $atob(b64); }
  }
  @bindingBehavior('interceptor')
  class InterceptorBindingBehavior extends BindingInterceptor {
    public updateSource(value: unknown, flags: LifecycleFlags) {
      if (this.interceptor !== this) {
        this.interceptor.updateSource(value, flags);
      } else {
        let binding = this as BindingInterceptor;
        while (binding.binding !== void 0) {
          binding = binding.binding as BindingInterceptor;
        }
        binding.updateSource(value, flags);
      }
    }
  }
  @bindingBehavior('vanilla')
  class VanillaBindingBehavior implements BindingBehaviorInstance {
    public bind(_flags: LifecycleFlags, _scope: IScope, _binding: IBinding): void {
      return;
    }
    public unbind(_flags: LifecycleFlags, _scope: IScope, _binding: IBinding): void {
      return;
    }
  }
  @customElement({ name: 'editor', template: `<div replaceable="content"></div><div>static content</div>` })
  class Editor {
    public readonly person = new Person(void 0, void 0);
    public constructor(@IValidationRules validationRules: IValidationRules) {
      validationRules
        .on(this.person)
        .ensure("name")
        .satisfies((name) => name === "foo")
        .withMessage("Not foo");
    }
  }
  interface TestSetupContext {
    template: string;
    customDefaultTrigger?: ValidationTrigger;
    observeCollection?: boolean;
  }
  async function runTest(
    testFunction: TestFunction<TestExecutionContext<App>>,
    { template, customDefaultTrigger, observeCollection }: TestSetupContext
  ) {
    const ctx = TestContext.createHTMLTestContext();
    const container = ctx.container;
    const host = ctx.dom.createElement('app');
    ctx.doc.body.appendChild(host);
    let app: App;
    const au = new Aurelia(container);
    await au
      .register(
        customDefaultTrigger
          ? ValidationConfiguration.customize((options) => {
            options.DefaultTrigger = customDefaultTrigger;
          })
          : ValidationConfiguration,
        TextBox,
        EmployeeList,
        FooBar,
        ToNumberValueConverter,
        B64ToPlainTextValueConverter,
        InterceptorBindingBehavior,
        VanillaBindingBehavior,
        Editor
      )
      .app({
        host,
        component: app = (() => {
          const ca = CustomElement.define({ name: 'app', isStrictBinding: true, template }, App);
          return new ca(container, observeCollection);
        })()
      })
      .start()
      .wait();

    await testFunction({ app, host, container, scheduler: app.scheduler, ctx });

    await au.stop().wait();
    ctx.doc.body.removeChild(host);
  }

  const $it = createSpecFunction(runTest);

  function assertControllerBinding(controller: ValidationController, rawExpression: string, target: INode, controllerSpy: Spy) {
    controllerSpy.methodCalledTimes('registerBinding', 1);
    const bindings = Array.from((controller['bindings'] as Map<IBinding, any>).keys()) as BindingWithBehavior[];
    assert.equal(bindings.length, 1);

    const binding = bindings[0];
    assert.equal(binding.target, target);
    assert.equal(Unparser.unparse(binding.sourceExpression.expression), rawExpression);
  }

  async function assertEventHandler(target: HTMLElement, event: 'change' | 'blur', callCount: number, scheduler: IScheduler, controllerSpy: Spy, ctx: HTMLTestContext) {
    controllerSpy.clearCallRecords();
    target.dispatchEvent(new ctx.Event(event));
    await scheduler.yieldAll(10);
    controllerSpy.methodCalledTimes('validateBinding', callCount);
    controllerSpy.methodCalledTimes('validate', callCount);
  }

  // #region trigger
  $it('registers binding to the controller with default **blur** trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'person.name', target, controllerSpy);

      assert.equal(controller.results.filter((r) => !r.valid).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid).length, 1, 'error2');

      target.value = 'foo';
      await assertEventHandler(target, 'change', 0, scheduler, controllerSpy, ctx);
      await assertEventHandler(target, 'blur', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 0, 'error3');
    },
    { template: `<input id="target" type="text" value.two-way="person.name & validate">` }
  );

  $it('a default trigger can be registered - **change**',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'person.name', target, controllerSpy);

      assert.equal(controller.results.filter((r) => !r.valid).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid).length, 1, 'error2');

      target.value = 'foo';
      await assertEventHandler(target, 'blur', 0, scheduler, controllerSpy, ctx);
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 0, 'error3');
    },
    { template: `<input id="target" type="text" value.two-way="person.name & validate:'change'">`, customDefaultTrigger: ValidationTrigger.change }
  );

  $it('supports **changeOrBlur** validation trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'person.name', target, controllerSpy);

      await assertEventHandler(target, 'blur', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 1, 'error3');

      target.value = 'foo';
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 0, 'error4');
    },
    { template: `<input id="target" type="text" value.two-way="person.name & validate:'changeOrBlur'">` }
  );

  $it('supports **manual** validation trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'person.name', target, controllerSpy);

      controllerSpy.clearCallRecords();
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 1, 'error2');

      await assertEventHandler(target, 'blur', 0, scheduler, controllerSpy, ctx);
      target.value = 'foo';
      await assertEventHandler(target, 'change', 0, scheduler, controllerSpy, ctx);

      controllerSpy.clearCallRecords();
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 1, 'error3');
      await controller.validate();
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 0, 'error4');
    },
    { template: `<input id="target" type="text" value.two-way="person.name & validate:'manual'">` }
  );

  $it('handles changes in dynamically bound trigger value',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'person.name', target, controllerSpy);

      assert.equal(app.trigger, ValidationTrigger.change);
      target.value = 'foo';
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      await assertEventHandler(target, 'blur', 0, scheduler, controllerSpy, ctx);

      app.trigger = ValidationTrigger.blur;
      await assertEventHandler(target, 'blur', 1, scheduler, controllerSpy, ctx);
      target.value = 'bar';
      await assertEventHandler(target, 'change', 0, scheduler, controllerSpy, ctx);

      app.trigger = ValidationTrigger.changeOrBlur;
      await assertEventHandler(target, 'blur', 1, scheduler, controllerSpy, ctx);
      target.value = 'foo';
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);

      app.trigger = ValidationTrigger.manual;
      await assertEventHandler(target, 'blur', 0, scheduler, controllerSpy, ctx);
      target.value = 'bar';
      await assertEventHandler(target, 'change', 0, scheduler, controllerSpy, ctx);
    },
    { template: `<input id="target" type="text" value.two-way="person.name & validate:trigger">` }
  );
  // #endregion

  // #region controller
  $it('respects bound controller',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const controller2 = app.controller2;
      const controller2Spy = app.controller2Spy;

      const target1: HTMLInputElement = host.querySelector("#target1");
      const target2: HTMLInputElement = host.querySelector("#target2");
      assertControllerBinding(controller, 'person.name', target1, controllerSpy);
      assertControllerBinding(controller2, 'person.age', target2, controller2Spy);

      target1.value = 'foo';
      target2.value = '42';
      await assertEventHandler(target1, 'change', 1, scheduler, controllerSpy, ctx);
      await assertEventHandler(target2, 'change', 1, scheduler, controller2Spy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 0, 'error5');
      assert.equal(controller.results.filter((e) => e.propertyName === 'age').length, 0, 'error6');
      assert.equal(controller2.results.filter((e) => !e.valid && e.propertyName === 'name').length, 0, 'error7');
      assert.equal(controller2.results.filter((e) => e.propertyName === 'name').length, 0, 'error8');
    },
    {
      template: `
    <input id="target1" type="text" value.two-way="person.name & validate:'change'">
    <input id="target2" type="text" value.two-way="person.age & validate:'change':controller2">
    ` }
  );

  $it('handles value change of the bound controller',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const controller2 = app.controller2;
      const controller2Spy = app.controller2Spy;

      const target1: HTMLInputElement = host.querySelector("#target1");
      assertControllerBinding(controller, 'person.name', target1, controllerSpy);

      await assertEventHandler(target1, 'blur', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 1, 'error1');
      assert.equal(controller2.results.filter((e) => !e.valid && e.propertyName === 'name').length, 0, 'error2');

      app.tempController = controller2;
      await scheduler.yieldAll(10);
      controllerSpy.methodCalledTimes('unregisterBinding', 1);
      assertControllerBinding(controller2, 'person.name', target1, controller2Spy);

      await assertEventHandler(target1, 'blur', 1, scheduler, controller2Spy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 0, 'error1');
      assert.equal(controller2.results.filter((e) => !e.valid && e.propertyName === 'name').length, 1, 'error2');
    },
    {
      template: `
    <input id="target1" type="text" value.two-way="person.name & validate:'blur':tempController">
    ` }
  );

  $it('handles the trigger-controller combo correctly',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const controller2 = app.controller2;
      const controller2Spy = app.controller2Spy;

      const target1: HTMLInputElement = host.querySelector("#target1");
      const target2: HTMLInputElement = host.querySelector("#target2");
      assertControllerBinding(controller, 'person.name', target1, controllerSpy);
      assertControllerBinding(controller2, 'person.age', target2, controller2Spy);

      await assertEventHandler(target1, 'blur', 1, scheduler, controllerSpy, ctx);
      await assertEventHandler(target2, 'blur', 0, scheduler, controller2Spy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 1, 'error1');
      assert.equal(controller2.results.filter((e) => !e.valid && e.propertyName === 'age').length, 0, 'error2');

      target1.value = 'foo';
      target2.value = '41';
      await assertEventHandler(target1, 'change', 0, scheduler, controllerSpy, ctx);
      await assertEventHandler(target2, 'change', 1, scheduler, controller2Spy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 1, 'error3');
      assert.equal(controller2.results.filter((e) => !e.valid && e.propertyName === 'age').length, 1, 'error4');
    },
    {
      template: `
    <input id="target1" type="text" value.two-way="person.name & validate:'blur':controller">
    <input id="target2" type="text" value.two-way="person.age & validate:'change':controller2">
    ` }
  );
  // #endregion

  // #region rules
  $it('respects bound rules',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target2: HTMLInputElement = host.querySelector("#target2");
      assertControllerBinding(controller, 'person.age', target2, controllerSpy);

      target2.value = '41';
      await assertEventHandler(target2, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => e.propertyName === 'age').length, 1, 'error2');

      target2.value = '42';
      await assertEventHandler(target2, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'age').length, 0, 'error3');
    },
    {
      template: `
    <input id="target2" type="text" value.two-way="person.age & validate:'change':controller1:[ageMinRule]">
    ` }
  );

  $it('respects change in value of bound rules',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target2: HTMLInputElement = host.querySelector("#target2");
      assertControllerBinding(controller, 'person.age', target2, controllerSpy);

      target2.value = '41';
      await assertEventHandler(target2, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'age' && e.rule instanceof RangeRule).length, 1, 'error2');
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'age' && e.rule instanceof RequiredRule).length, 0, 'error3');

      target2.value = '42';
      await assertEventHandler(target2, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'age').length, 0, 'error4');

      app.tempAgeRule = [app.ageMinRule];
      await scheduler.yieldAll();

      target2.value = '';
      await assertEventHandler(target2, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'age' && e.rule instanceof RequiredRule).length, 0, 'error5');

      target2.value = '41';
      await assertEventHandler(target2, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'age' && e.rule instanceof RangeRule).length, 1, 'error6');

      target2.value = '42';
      await assertEventHandler(target2, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'age').length, 0, 'error7');
    },
    {
      template: `
    <input id="target2" type="text" value.two-way="person.age & validate:'change':controller1:tempAgeRule">
    ` }
  );
  // #endregion

  // #region argument parsing
  const negativeTestData = [
    { args: `'chaos'`, expectedError: 'is not a supported validation trigger' },
    { args: `controller`, expectedError: 'is not a supported validation trigger' },
    { args: `ageMinRule`, expectedError: 'is not a supported validation trigger' },
    { args: `controller:'change'`, expectedError: 'is not a supported validation trigger' },
    { args: `'change':'foo'`, expectedError: 'foo is not of type ValidationController' },
    { args: `'change':{}`, expectedError: 'is not of type ValidationController' },
    { args: `'change':ageMinRule`, expectedError: 'is not of type ValidationController' },
    { args: `'change':controller:ageMinRule:'foo'`, expectedError: 'Unconsumed argument#4 for validate binding behavior: foo' },
  ];
  for (const { args, expectedError } of negativeTestData) {
    it(`throws error if the arguments are not provided in correct order - ${args}`, async function () {
      const ctx = TestContext.createHTMLTestContext();
      const container = ctx.container;
      const host = ctx.dom.createElement('app');
      const template = `<input id="target2" type="text" value.two-way="person.age & validate:${args}">`;
      ctx.doc.body.appendChild(host);
      const au = new Aurelia(container);
      try {
        await au
          .register(ValidationConfiguration)
          .app({
            host,
            component: (() => {
              const ca = CustomElement.define({ name: 'app', isStrictBinding: true, template }, App);
              return new ca(container);
            })()
          })
          .start()
          .wait();
      } catch (e) {
        assert.equal(e.message.endsWith(expectedError), true);
      }
      await au.stop().wait();
      ctx.doc.body.removeChild(host);
    });
  }

  // #endregion

  // #region custom element
  $it('can be used with custom element - change trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;

      const ceHost: HTMLElement = host.querySelector("#target");
      const input: HTMLInputElement = ceHost.querySelector("input");

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 1, 'error2');

      input.value = 'foo';
      await assertEventHandler(input, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error3');
    },
    { template: `<text-box id="target" value.two-way="person.name & validate:'change'"></text-box>` }
  );
  $it('can be used with custom element - blur trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;

      const ceHost: HTMLElement = host.querySelector("#target");

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 1, 'error2');

      controllerSpy.clearCallRecords();
      person.name = 'foo';
      await scheduler.yieldAll(10);
      controllerSpy.methodCalledTimes('validateBinding', 0);
      controllerSpy.methodCalledTimes('validate', 0);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 1, 'error3');

      controllerSpy.clearCallRecords();
      ceHost.focus();
      await scheduler.yieldAll();
      await assertEventHandler(ceHost, 'blur', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error4');
    },
    { template: `<text-box tabindex="-1" id="target" value.two-way="person.name & validate:'blur'"></text-box>` }
  );
  $it('can be used with custom element - changeOrBlur trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;

      const ceHost: HTMLElement = host.querySelector("#target");
      const input: HTMLInputElement = ceHost.querySelector("input");

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 1, 'error2');

      input.value = 'foo';
      await assertEventHandler(input, 'change', 1, scheduler, controllerSpy, ctx);

      controllerSpy.clearCallRecords();
      ceHost.focus();
      await scheduler.yieldAll();
      await assertEventHandler(ceHost, 'blur', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error4');
    },
    { template: `<text-box tabindex="-1" id="target" value.two-way="person.name & validate:'changeOrBlur'"></text-box>` }
  );
  $it('can be used with custom element - manual trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;

      const ceHost: HTMLElement = host.querySelector("#target");
      const input: HTMLInputElement = ceHost.querySelector("input");

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 1, 'error2');

      input.value = 'foo';
      await assertEventHandler(input, 'change', 0, scheduler, controllerSpy, ctx);

      controllerSpy.clearCallRecords();
      ceHost.focus();
      await scheduler.yieldAll();
      await assertEventHandler(ceHost, 'blur', 0, scheduler, controllerSpy, ctx);
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error4');
    },
    { template: `<text-box tabindex="-1" id="target" value.two-way="person.name & validate:'manual'"></text-box>` }
  );
  // #endregion

  // #region custom attribute
  $it('can be used with custom attribute - change trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;

      const caHost: HTMLDivElement = host.querySelector("#target");

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 1, 'error2');

      controllerSpy.clearCallRecords();
      caHost.click();
      await scheduler.yieldAll(10);
      controllerSpy.methodCalledTimes('validateBinding', 1);
      controllerSpy.methodCalledTimes('validate', 1);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error3');
    },
    { template: `<div id="target" foo-bar="value.two-way:person.name & validate:'change'; triggering-events.bind:['click']"></div>` }
  );
  $it('can be used with custom attribute - blur trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;

      const caHost: HTMLDivElement = host.querySelector("#target");

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 1, 'error2');

      controllerSpy.clearCallRecords();
      caHost.focus();
      await scheduler.yieldAll();
      await assertEventHandler(caHost, 'blur', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error3');
    },
    { template: `<div id="target" tabindex="-1" foo-bar="value.two-way:person.name & validate:'blur'; triggering-events.bind:['blur']"></div>` }
  );
  $it('can be used with custom attribute - changeOrBlur trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;

      const caHost: HTMLDivElement = host.querySelector("#target");

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 1, 'error2');

      controllerSpy.clearCallRecords();
      caHost.click();
      await scheduler.yieldAll(10);
      controllerSpy.methodCalledTimes('validateBinding', 1);
      controllerSpy.methodCalledTimes('validate', 1);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error3');

      controllerSpy.clearCallRecords();
      caHost.focus();
      await scheduler.yieldAll();
      await assertEventHandler(caHost, 'blur', 1, scheduler, controllerSpy, ctx);
    },
    { template: `<div id="target" tabindex="-1" foo-bar="value.two-way:person.name & validate:'changeOrBlur'; triggering-events.bind:['click']"></div>` }
  );
  $it('can be used with custom attribute - manual trigger',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;

      const caHost: HTMLDivElement = host.querySelector("#target");

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 1, 'error2');

      controllerSpy.clearCallRecords();
      caHost.click();
      await scheduler.yieldAll(10);
      controllerSpy.methodCalledTimes('validateBinding', 0);
      controllerSpy.methodCalledTimes('validate', 0);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 1, 'error3');

      controllerSpy.clearCallRecords();
      caHost.focus();
      await scheduler.yieldAll();
      await assertEventHandler(caHost, 'blur', 0, scheduler, controllerSpy, ctx);

      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'name' && r.object === person).length, 0, 'error5');
    },
    { template: `<div id="target" tabindex="-1" foo-bar="value.two-way:person.name & validate:'manual'; triggering-events.bind:['click', 'blur']"></div>` }
  );
  // #endregion

  // #region VC, BB
  $it('can be used with value converter',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'person.age|toNumber', target, controllerSpy);

      assert.equal(controller.results.filter((r) => !r.valid).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'age').length, 1, 'error2');

      target.value = '123';
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'age').length, 0, 'error3');
      assert.equal(person.age, 123);

      target.value = 'foo';
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'age').length, 1, 'error4');
      assert.equal(person.age, undefined);
    },
    { template: `<input id="target" value.two-way="person.age | toNumber & validate:'change'">` }
  );
  $it('can be used with multiple value converters',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'person.age|toNumber|b64ToPlainText', target, controllerSpy);

      assert.equal(controller.results.filter((r) => !r.valid).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'age').length, 1, 'error2');

      target.value = $btoa('1234');
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'age').length, 0, 'error3');
      assert.equal(person.age, 1234);

      target.value = $btoa('foobar');
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'age').length, 1, 'error4');
      assert.equal(person.age, undefined);
    },
    { template: `<input id="target" value.two-way="person.age | toNumber | b64ToPlainText & validate:'change'">` }
  );
  const bindingBehaviorTestData = [
    { expr: `person.name & validate:'change' & vanilla`, rawExpr: 'person.name&validate:(\'change\')' },
    { expr: `person.name & vanilla & validate:'change'`, rawExpr: 'person.name&vanilla' },
    { expr: `person.name & validate:'change' & interceptor`, rawExpr: 'person.name&validate:(\'change\')' },
    { expr: `person.name & interceptor & validate:'change'`, rawExpr: 'person.name&interceptor' },
    { expr: `person.name & validate:'change' & vanilla & interceptor`, rawExpr: 'person.name&validate:(\'change\')&vanilla' },
    { expr: `person.name & validate:'change' & interceptor & vanilla`, rawExpr: 'person.name&validate:(\'change\')&interceptor' },
    { expr: `person.name & vanilla & validate:'change' & interceptor`, rawExpr: 'person.name&vanilla&validate:(\'change\')' },
    { expr: `person.name & interceptor & validate:'change' & vanilla`, rawExpr: 'person.name&interceptor&validate:(\'change\')' },
    { expr: `person.name & vanilla & interceptor & validate:'change'`, rawExpr: 'person.name&vanilla&interceptor' },
    { expr: `person.name & interceptor & vanilla & validate:'change'`, rawExpr: 'person.name&interceptor&vanilla' },
  ];
  for (const { expr, rawExpr } of bindingBehaviorTestData) {
    $it(`can be used with other binding behavior - ${expr}`,
      async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
        const controller = app.controller;
        const controllerSpy = app.controllerSpy;

        const target: HTMLInputElement = host.querySelector("#target");
        assertControllerBinding(controller, rawExpr, target, controllerSpy);

        assert.equal(controller.results.filter((r) => !r.valid).length, 0, 'error1');
        await controller.validate();
        assert.equal(controller.results.filter((r) => !r.valid).length, 1, 'error2');

        target.value = 'foo';
        await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
        assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'name').length, 0, 'error3');
      },
      { template: `<input id="target" value.two-way="${expr}">` }
    );
  }
  // #endregion

  $it('can be used to validate simple property',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'validatableProp', target, controllerSpy);

      assert.equal(controller.results.filter((r) => !r.valid).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid).length, 1, 'error2');

      target.value = 'foo';
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'validatableProp').length, 0, 'error3');
    },
    { template: `<input id="target" value.two-way="validatableProp & validate:'change'">` }
  );
  // #region collection and nested properties
  $it('can be used to validate nested collection - collection replace',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target: HTMLInputElement = host.querySelector("#target");
      controllerSpy.methodCalledTimes('registerBinding', 1);
      const bindings = Array.from((controller['bindings'] as Map<IBinding, any>).keys()) as BindingWithBehavior[];
      assert.equal(bindings.length, 1);

      const binding = bindings[0];
      assert.equal(Unparser.unparse(binding.sourceExpression.expression), 'org.employees');

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'employees').length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'employees').length, 1, 'error2');

      controllerSpy.clearCallRecords();
      (target.querySelector('button#hire-replace') as HTMLButtonElement).click();
      await scheduler.yieldAll(10);
      controllerSpy.methodCalledTimes('validateBinding', 1);
      controllerSpy.methodCalledTimes('validate', 1);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'employees').length, 0, 'error3');

      controllerSpy.clearCallRecords();
      (target.querySelector('button#fire-replace') as HTMLButtonElement).click();
      await scheduler.yieldAll(10);
      controllerSpy.methodCalledTimes('validateBinding', 1);
      controllerSpy.methodCalledTimes('validate', 1);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'employees').length, 1, 'error4');
    },
    { template: `<employee-list id="target" employees.two-way="org.employees & validate:'change'"></employee-list>` }
  );
  $it('can be used to validate nested collection - collection observer',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      assert.equal(!!app.employeesMediator, true, "mediator should have been instantiated");
      assert.equal(!!app.employeeObserver, true, "observer should have been instantiated");
      const target: HTMLInputElement = host.querySelector("#target");
      controllerSpy.methodCalledTimes('registerBinding', 1);
      const bindings = Array.from((controller['bindings'] as Map<IBinding, any>).keys()) as BindingWithBehavior[];
      assert.equal(bindings.length, 1);

      const binding = bindings[0];
      assert.equal(Unparser.unparse(binding.sourceExpression.expression), 'org.employees');

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'employees').length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'employees').length, 1, 'error2');

      controllerSpy.clearCallRecords();
      (target.querySelector('button#hire-in-place') as HTMLButtonElement).click();
      await scheduler.yieldAll(10);
      assert.equal(app.org.employees.length, 1);
      controllerSpy.methodCalledTimes('validate', 1);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'employees').length, 0, 'error3');

      controllerSpy.clearCallRecords();
      (target.querySelector('button#fire-in-place') as HTMLButtonElement).click();
      await scheduler.yieldAll(10);
      assert.equal(app.org.employees.length, 0);
      controllerSpy.methodCalledTimes('validate', 1);
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'employees').length, 1, 'error4');
    },
    { template: `<employee-list id="target" employees.two-way="org.employees & validate:'change'"></employee-list>`, observeCollection: true }
  );
  $it('can be used to validate nested collection property by index',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target1: HTMLInputElement = host.querySelector("#target1");
      const target2: HTMLInputElement = host.querySelector("#target2");

      controllerSpy.methodCalledTimes('registerBinding', 2);
      const bindings = Array.from((controller['bindings'] as Map<IBinding, any>).keys()) as BindingWithBehavior[];
      assert.equal(bindings.length, 2);
      assert.equal(bindings[0].target, target1);
      assert.equal(Unparser.unparse(bindings[0].sourceExpression.expression), 'obj.coll[(0)].a|toNumber');
      assert.equal(bindings[1].target, target2);
      assert.equal(Unparser.unparse(bindings[1].sourceExpression.expression), 'obj.coll[(1)].a|toNumber');

      assert.equal(controller.results.filter((r) => !r.valid && (r.propertyName === 'coll[0].a' || r.propertyName === 'coll[1].a')).length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && (r.propertyName === 'coll[0].a' || r.propertyName === 'coll[1].a')).length, 2, 'error2');

      target1.value = '42';
      await assertEventHandler(target1, 'change', 1, scheduler, controllerSpy, ctx);
      target2.value = '42';
      await assertEventHandler(target2, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((r) => !r.valid && (r.propertyName === 'coll[0].a' || r.propertyName === 'coll[1].a')).length, 2, 'error3');

      target1.value = '11';
      await assertEventHandler(target1, 'change', 1, scheduler, controllerSpy, ctx);
      target2.value = '11';
      await assertEventHandler(target2, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((r) => !r.valid && (r.propertyName === 'coll[0].a' || r.propertyName === 'coll[1].a')).length, 0, 'error4');
    },
    {
      template: `
    <input id="target1" value.two-way="obj.coll[0].a | toNumber & validate:'change'">
    <input id="target2" value.two-way="obj.coll[1].a | toNumber & validate:'change'">
    `
    }
  );
  $it('can be used to validate nested property - intial non-undefined',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const person = app.person;
      person.address = { pin: 'foobar' as unknown as number, city: 'foobar', line1: 'foobar' };
      await scheduler.yieldAll();

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'person.address.pin|toNumber', target, controllerSpy);

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'address.pin').length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'address.pin').length, 1, 'error2');

      target.value = '123456';
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'address.pin').length, 0, 'error3');
    },
    {
      template: `<input id="target" value.two-way="person.address.pin | toNumber & validate:'change'">`
    }
  );
  $it('can be used to validate nested property - intial undefined',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'person.address.pin|toNumber', target, controllerSpy);

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'address.pin').length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'address.pin').length, 0, 'error2');

      target.value = '123456';
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'address.pin').length, 0, 'error3');
    },
    {
      template: `<input id="target" value.two-way="person.address.pin | toNumber & validate:'change'">`
    }
  );
  $it('can be used to validate multi-level nested property',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;
      const org = app.org;
      org.employees.push(new Person((void 0)!, (void 0)!, { pin: 'foobar' as unknown as number, city: 'foobar', line1: 'foobar' }));
      await scheduler.yieldAll();

      const target: HTMLInputElement = host.querySelector("#target");
      assertControllerBinding(controller, 'org.employees[(0)].address.pin|toNumber', target, controllerSpy);

      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'employees[0].address.pin').length, 0, 'error1');
      await controller.validate();
      assert.equal(controller.results.filter((r) => !r.valid && r.propertyName === 'employees[0].address.pin').length, 1, 'error2');

      target.value = '123456';
      await assertEventHandler(target, 'change', 1, scheduler, controllerSpy, ctx);
      assert.equal(controller.results.filter((e) => !e.valid && e.propertyName === 'employees[0].address.pin').length, 0, 'error3');
    },
    {
      template: `<input id="target" value.two-way="org.employees[0].address.pin | toNumber & validate:'change'">`
    }
  );
  // #endregion

  // #region replaceable
  $it('works with replaceable - replaced part',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target: HTMLInputElement = host.querySelector("editor #target");
      assertControllerBinding(controller, 'person.name', target, controllerSpy);

      assert.deepStrictEqual(controller.results.filter((r) => !r.valid).map((r) => r.toString()), []);
      await controller.validate();
      assert.deepStrictEqual(controller.results.filter((r) => !r.valid).map((r) => r.toString()), ["Not foo"]);

      target.value = 'foo';
      await assertEventHandler(target, 'change', 0, scheduler, controllerSpy, ctx);
      await assertEventHandler(target, 'blur', 1, scheduler, controllerSpy, ctx);
      assert.deepStrictEqual(controller.results.filter((r) => !r.valid).map((r) => r.toString()), []);
    },
    {
      template: `<editor><input id="target" value.two-way="person.name & validate" replace="content"><editor>`
    }
  );

  $it('works with replaceable - non-replaced part',
    async function ({ app, host, scheduler, ctx }: TestExecutionContext<App>) {
      const controller = app.controller;
      const controllerSpy = app.controllerSpy;

      const target: HTMLInputElement = host.querySelector("editor #target");
      assertControllerBinding(controller, 'person.name', target, controllerSpy);

      assert.deepStrictEqual(controller.results.filter((r) => !r.valid).map((r) => r.toString()), []);
      await controller.validate();
      assert.deepStrictEqual(controller.results.filter((r) => !r.valid).map((r) => r.toString()), ["Name is required."]);

      target.value = 'foo';
      await assertEventHandler(target, 'change', 0, scheduler, controllerSpy, ctx);
      await assertEventHandler(target, 'blur', 1, scheduler, controllerSpy, ctx);
      assert.deepStrictEqual(controller.results.filter((r) => !r.valid).map((r) => r.toString()), []);
    },
    {
      template: `<editor><input id="target" value.two-way="person.name & validate"><editor>`
    }
  );
  // #endregion

  const negativeTestData1 = [
    { text: 'listener binding', template: `<button click.delegate="handleClick() & validate"></button>` },
    { text: 'call binding', template: `<button action.call="handleClick() & validate"></button>` },
  ];
  for (const { text, template } of negativeTestData1) {
    it(`cannot be used with ${text}`, async function () {
      const ctx = TestContext.createHTMLTestContext();
      const container = ctx.container;
      const host = ctx.dom.createElement('app');
      ctx.doc.body.appendChild(host);
      let app: App;
      const au = new Aurelia(container).register(ValidationConfiguration);

      try {
        await au
          .app({
            host,
            component: app = (() => {
              const ca = CustomElement.define({ name: 'app', isStrictBinding: true, template }, App);
              return new ca(container);
            })()
          })
          .start()
          .wait();
      } catch (e) {
        assert.equal(e.message, 'Unable to set property binding');
      }
      await au.stop().wait();
      ctx.doc.body.removeChild(host);
    });
  }
});
