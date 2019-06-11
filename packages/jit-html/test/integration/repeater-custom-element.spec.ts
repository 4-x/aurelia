import {
  Aurelia,
  bindable,
  customElement,
  CustomElementResource,
  LifecycleFlags
} from '@aurelia/runtime';
import { expect } from 'chai';
import { getVisibleText, HTMLTestContext, TestContext } from '../util';
import {
  setup,
  setupAndStart,
  tearDown
} from './util';

const spec = 'repeater-custom-element';

describe(spec, function () {
  let ctx: HTMLTestContext;

  beforeEach(function () {
    ctx = TestContext.createHTMLTestContext();
  });

  // repeater with custom element
  it('103.', function () {
    @customElement({ name: 'foo', template: '<template>a</template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { }
    const { au, lifecycle, host, component } = setupAndStart(ctx, `<template><foo repeat.for="i of count"></foo></template>`, null, Foo);
    component.count = 3;
    lifecycle.processFlushQueue(LifecycleFlags.none);

    expect(host.textContent).to.equal('aaa');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with different name than outer property
  it('104.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text: string; }
    const { au, lifecycle, host, component } = setupAndStart(ctx, `<template><foo text.bind="theText" repeat.for="i of count"></foo></template>`, class {
      public theText = 'b';
    },                                                       Foo);
    component.count = 3;
    component.theText = 'a';
    lifecycle.processFlushQueue(LifecycleFlags.none);

    expect(host.textContent).to.equal('aaa');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with same name as outer property
  it('105.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text: string; }
    const { au, lifecycle, host, component } = setupAndStart(ctx, `<template><foo text.bind="text" repeat.for="i of count"></foo></template>`, class {
      public text = 'b';
    },                                                       Foo);
    component.count = 3;
    component.text = 'a';
    lifecycle.processFlushQueue(LifecycleFlags.none);

    expect(host.textContent).to.equal('aaa');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with different name than outer property, reversed, undefined property
  it('106.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text: string; }
    const { au, lifecycle, host, component } = setupAndStart(ctx, `<template><foo repeat.for="i of count" text.bind="theText"></foo></template>`, null, Foo);

    component.count = 3;
    component.theText = 'a';
    lifecycle.processFlushQueue(LifecycleFlags.none);

    expect(host.textContent).to.equal('undefinedundefinedundefined');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with same name as outer property, reversed, undefined property
  it('107.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text: string; }
    const { au, lifecycle, host, component } = setupAndStart(ctx, `<template><foo repeat.for="i of count" text.bind="text"></foo></template>`, null, Foo);
    component.count = 3;
    component.text = 'a';
    lifecycle.processFlushQueue(LifecycleFlags.none);

    expect(host.textContent).to.equal('undefinedundefinedundefined');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with different name than outer property, reversed
  it('108.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text; }
    const { au, lifecycle, host, component } = setup(ctx, `<template><foo repeat.for="i of count" text.bind="theText"></foo></template>`, null, Foo);
    component.theText = 'a';
    component.count = 3;

    au.app({ host, component }).start();

    expect(host.textContent).to.equal('aaa');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with same name as outer property, reversed
  it('109.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text; }
    const { au, lifecycle, host, component } = setup(ctx, `<template><foo repeat.for="i of count" text.bind="theText"></foo></template>`, null, Foo);
    component.theText = 'a';
    component.count = 3;

    au.app({ host, component }).start();

    expect(host.textContent).to.equal('aaa');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element with repeater
  it('110.', function () {
    @customElement({ name: 'foo', template: '<template><div repeat.for="item of todos">${item}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public todos: any[]; }
    const { au, lifecycle, host, component } = setup(ctx, `<template><foo repeat.for="i of count" todos.bind="todos"></foo></template>`, null, Foo);
    component.todos = ['a', 'b', 'c'];
    component.count = 3;

    au.app({ host, component }).start();

    expect(host.textContent).to.equal('abcabcabc');

    component.count = 1;
    lifecycle.processFlushQueue(LifecycleFlags.none);
    expect(host.textContent).to.equal('abc');

    component.count = 3;
    lifecycle.processFlushQueue(LifecycleFlags.none);
    expect(host.textContent).to.equal('abcabcabc');

    tearDown(au, lifecycle, host);
  });

  // repeater with custom element with repeater, nested arrays
  it('111.', function () {
    @customElement({ name: 'foo', template: '<template><div repeat.for="innerTodos of todos"><div repeat.for="item of innerTodos">${item}</div></div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public todos: any[]; }
    const { au, lifecycle, host, component } = setup(ctx, `<template><foo repeat.for="i of count" todos.bind="todos"></foo></template>`, null, Foo);
    component.todos = [['a', 'b', 'c'], ['a', 'b', 'c'], ['a', 'b', 'c']];
    component.count = 3;

    au.app({ host, component }).start();

    expect(host.textContent).to.equal('abcabcabcabcabcabcabcabcabc');

    component.count = 1;
    lifecycle.processFlushQueue(LifecycleFlags.none);
    expect(host.textContent).to.equal('abcabcabc');

    component.count = 3;
    lifecycle.processFlushQueue(LifecycleFlags.none);
    expect(host.textContent).to.equal('abcabcabcabcabcabcabcabcabc');

    tearDown(au, lifecycle, host);
  });

  // repeater with custom element and children observer
  it('112.', async function () {
    this.timeout(10000);
    let childrenCount = 0;
    let childrenChangedCount = 0;
    const FooEl = CustomElementResource.define({
      name: 'foo-el',
      template: `<template>\${txt}<foo-el if.bind="cur<max" cnt.bind="cnt" max.bind="max" cur.bind="cur+1" txt.bind="txt" repeat.for="i of cnt"></foo-el></template>`
    },                                         class {
      public static shadowOptions = { mode: 'open' };
      public static bindables = {
        cnt: { property: 'cnt', attribute: 'cnt' },
        max: { property: 'max', attribute: 'max' },
        cur: { property: 'cur', attribute: 'cur' },
        txt: { property: 'txt', attribute: 'txt' }
      };
      public $children;
      public attached() {
        childrenCount += this.$children.length;
      }
      public $childrenChanged() {
        childrenChangedCount++;
      }
    });
    const App = CustomElementResource.define({
      name: 'app',
      template: `<template><foo-el cnt.bind="cnt" max.bind="max" cur="0" txt.bind="txt" repeat.for="i of cnt" ref.bind="'foo'+i"></foo-el></template>`
    },                                       class {
      public static shadowOptions = { mode: 'open' };
      public cnt = 10;
      public max = 3;
      public txt = 'a';
      public $children;
    });
    const container = ctx.container;
    container.register(FooEl);
    const au = new Aurelia(container);
    const host = ctx.createElement('div');
    const component = new App();
    au.app({ host, component });

    au.start();

    expect(getVisibleText(au, host).length).to.equal(1110);
    expect(getVisibleText(au, host)).to.equal('a'.repeat(1110));

    expect(childrenChangedCount).to.equal(0);

    expect(childrenCount).to.equal(1100);
    expect(component['$children'].length).to.equal(10);

    component['cnt'] = 11;

    await Promise.resolve();

    // TODO: find out why this shadow dom mutation observer thing doesn't work correctly in jsdom
    if (typeof window !== 'undefined') {
      expect(component['$children'].length).to.equal(11);
      expect(childrenChangedCount).to.equal(110);
      expect(childrenCount).to.equal(1100 + 110 * 2 + 11 * 2);
    }

    au.stop();
    expect(getVisibleText(au, host)).to.equal('');
  });

  // repeater with custom element
  it('203.', function () {
    @customElement({ name: 'foo', template: '<template>a</template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { }
    const { au, lifecycle, host, component } = setupAndStart(ctx, `<template><foo repeat.for="i of count & keyed"></foo></template>`, null, Foo);
    component.count = 3;
    lifecycle.processFlushQueue(LifecycleFlags.none);

    expect(host.textContent).to.equal('aaa');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with different name than outer property
  it('204.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text: string; }
    const { au, lifecycle, host, component } = setupAndStart(ctx, `<template><foo text.bind="theText" repeat.for="i of count & keyed"></foo></template>`, class {
      public theText = 'b';
    },                                                       Foo);
    component.count = 3;
    component.theText = 'a';
    lifecycle.processFlushQueue(LifecycleFlags.none);

    expect(host.textContent).to.equal('aaa');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with same name as outer property
  it('205.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text: string; }
    const { au, lifecycle, host, component } = setupAndStart(ctx, `<template><foo text.bind="text" repeat.for="i of count & keyed"></foo></template>`, class {
      public text = 'b';
    },                                                       Foo);
    component.count = 3;
    component.text = 'a';
    lifecycle.processFlushQueue(LifecycleFlags.none);

    expect(host.textContent).to.equal('aaa');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with different name than outer property, reversed, undefined property
  it('206.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text: string; }
    const { au, lifecycle, host, component } = setupAndStart(ctx, `<template><foo repeat.for="i of count & keyed" text.bind="theText"></foo></template>`, null, Foo);

    component.count = 3;
    component.theText = 'a';
    lifecycle.processFlushQueue(LifecycleFlags.none);

    expect(host.textContent).to.equal('undefinedundefinedundefined');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with same name as outer property, reversed, undefined property
  it('207.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text: string; }
    const { au, lifecycle, host, component } = setupAndStart(ctx, `<template><foo repeat.for="i of count & keyed" text.bind="text"></foo></template>`, null, Foo);
    component.count = 3;
    component.text = 'a';
    lifecycle.processFlushQueue(LifecycleFlags.none);

    expect(host.textContent).to.equal('undefinedundefinedundefined');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with different name than outer property, reversed
  it('208.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text; }
    const { au, lifecycle, host, component } = setup(ctx, `<template><foo repeat.for="i of count & keyed" text.bind="theText"></foo></template>`, null, Foo);
    component.theText = 'a';
    component.count = 3;

    au.app({ host, component }).start();

    expect(host.textContent).to.equal('aaa');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element + inner bindable with same name as outer property, reversed
  it('209.', function () {
    @customElement({ name: 'foo', template: '<template><div>${text}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public text; }
    const { au, lifecycle, host, component } = setup(ctx, `<template><foo repeat.for="i of count & keyed" text.bind="theText"></foo></template>`, null, Foo);
    component.theText = 'a';
    component.count = 3;

    au.app({ host, component }).start();

    expect(host.textContent).to.equal('aaa');

    tearDown(au, lifecycle, host);
    expect(host.textContent).to.equal('');
  });

  // repeater with custom element with repeater
  it('210.', function () {
    @customElement({ name: 'foo', template: '<template><div repeat.for="item of todos & keyed">${item}</div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public todos: any[]; }
    const { au, lifecycle, host, component } = setup(ctx, `<template><foo repeat.for="i of count & keyed" todos.bind="todos"></foo></template>`, null, Foo);
    component.todos = ['a', 'b', 'c'];
    component.count = 3;

    au.app({ host, component }).start();

    expect(host.textContent).to.equal('abcabcabc');

    component.count = 1;
    lifecycle.processFlushQueue(LifecycleFlags.none);
    expect(host.textContent).to.equal('abc');

    component.count = 3;
    lifecycle.processFlushQueue(LifecycleFlags.none);
    expect(host.textContent).to.equal('abcabcabc');

    tearDown(au, lifecycle, host);
  });

  // repeater with custom element with repeater, nested arrays
  it('211.', function () {
    @customElement({ name: 'foo', template: '<template><div repeat.for="innerTodos of todos & keyed"><div repeat.for="item of innerTodos & keyed">${item}</div></div></template>', instructions: [], build: { required: true, compiler: 'default' } })
    class Foo { @bindable public todos: any[]; }
    const { au, lifecycle, host, component } = setup(ctx, `<template><foo repeat.for="i of count & keyed" todos.bind="todos"></foo></template>`, null, Foo);
    component.todos = [['a', 'b', 'c'], ['a', 'b', 'c'], ['a', 'b', 'c']];
    component.count = 3;

    au.app({ host, component }).start();

    expect(host.textContent).to.equal('abcabcabcabcabcabcabcabcabc');

    component.count = 1;
    lifecycle.processFlushQueue(LifecycleFlags.none);
    expect(host.textContent).to.equal('abcabcabc');

    component.count = 3;
    lifecycle.processFlushQueue(LifecycleFlags.none);
    expect(host.textContent).to.equal('abcabcabcabcabcabcabcabcabc');

    tearDown(au, lifecycle, host);
  });

  // TODO: figure out why repeater in keyed mode gives different numbers
  // // repeater with custom element and children observer
  // it('212.', async function () {
  //   this.timeout(10000);
  //   let childrenCount = 0;
  //   let childrenChangedCount = 0;
  //   const FooEl = CustomElementResource.define({
  //     name: 'foo-el',
  //     template: `<template>\${txt}<foo-el if.bind="cur<max" cnt.bind="cnt" max.bind="max" cur.bind="cur+1" txt.bind="txt" repeat.for="i of cnt & keyed"></foo-el></template>`
  //   },                                         class {
  //     public static shadowOptions = { mode: 'open' };
  //     public static bindables = {
  //       cnt: { property: 'cnt', attribute: 'cnt' },
  //       max: { property: 'max', attribute: 'max' },
  //       cur: { property: 'cur', attribute: 'cur' },
  //       txt: { property: 'txt', attribute: 'txt' }
  //     };
  //     public $children;
  //     public attached() {
  //       childrenCount += this.$children.length;
  //     }
  //     public $childrenChanged() {
  //       childrenChangedCount++;
  //     }
  //   });
  //   const App = CustomElementResource.define({
  //     name: 'app',
  //     template: `<template><foo-el cnt.bind="cnt" max.bind="max" cur="0" txt.bind="txt" repeat.for="i of cnt & keyed" ref.bind="'foo'+i"></foo-el></template>`
  //   },                                       class {
  //     public static shadowOptions = { mode: 'open' };
  //     public cnt = 10;
  //     public max = 3;
  //     public txt = 'a';
  //     public $children;
  //   });
  //   const container = ctx.container;
  //   container.register(FooEl);
  //   const au = new Aurelia(container);
  //   const host = ctx.createElement('div');
  //   const component = new App();
  //   au.app({ host, component });

  //   au.start();

  //   expect(getVisibleText(au, host).length).to.equal(1110);
  //   expect(getVisibleText(au, host)).to.equal('a'.repeat(1110));

  //   expect(childrenChangedCount).to.equal(0);

  //   expect(childrenCount).to.equal(1100);
  //   expect(component['$children'].length).to.equal(10);

  //   component['cnt'] = 11;

  //   await Promise.resolve();

  //   // TODO: find out why this shadow dom mutation observer thing doesn't work correctly in jsdom
  //   if (typeof window !== 'undefined') {
  //     expect(component['$children'].length).to.equal(11);
  //     expect(childrenChangedCount).to.equal(110);
  //     expect(childrenCount).to.equal(1100 + 110 * 2 + 11 * 2);
  //   }

  //   au.stop();
  //   expect(getVisibleText(au, host)).to.equal('');
  // });

});
