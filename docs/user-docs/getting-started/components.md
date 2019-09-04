---
description: The basics of building components with Aurelia.
---

# Building Components

Aurelia applications are built out of components, from top to bottom. At startup, an app declares a _root component_, but inside of that component's view, other components are used, and inside of those components, even more components. In this fashion, the entire user interface is constructed.

{% hint style="success" %}
**Here's what you'll learn...**

* How to create and use components.
* How to leverage conventions to work smarter and not harder.
* What component lifecycle hooks are available to you.
{% endhint %}

## Creating and Using Components

Components in Aurelia follow the Model-View-ViewModel design pattern \(a descendant of MVC and MVP\) and are represented in HTML as _custom elements_. Each component has a JavaScript class, which serves as the _view-model_, providing the state and behavior for the component. Each component has an HTML template or _view_, which provides the rendering instructions for the component. Optionally, components can have a separate _model_ to provide unique business logic or a separate CSS file to provide styles.

### The Basics

To define a component, you only need to create your JavaScript or TypeScript file with the same name as your HTML file. By convention, Aurelia will recognize these as the view-model and view of a component, and will assemble them for you. Here's an example of a simple "hello world" component:

{% code-tabs %}
{% code-tabs-item title="say-hello.ts" %}
```typescript
export class SayHello {

}
```
{% endcode-tabs-item %}

{% code-tabs-item title="say-hello.html" %}
```markup
<h2>Hello World!</h2>
```
{% endcode-tabs-item %}

{% code-tabs-item title="my-app.html" %}
```markup
<say-hello></say-hello>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

{% hint style="warning" %}
**Naming Components**

The component name, derived from the file name, **must** contain a hyphen when working with Shadow DOM \(see [Styling Components](../app-basics/styling-components.md)\). This is part of the W3C Web Components standard and is designed to serve as a namespacing mechanism for custom HTML elements. A typical best practice is to choose a two to three character prefix to use consistently across your app or company. For example, all components provided by Aurelia have the prefix `au-`.
{% endhint %}

The `say-hello` custom element we've created isn't very interesting yet, so lets spice it up by allowing the user to providing a "to" property so that we can personalize the message. To create "bindable" properties for your HTML element, you declare them using the `@bindable` decorator as shown in the next example.

{% code-tabs %}
{% code-tabs-item title="say-hello.ts" %}
```typescript
import { bindable } from '@aurelia/runtime';

export class SayHello {
  @bindable to = 'World';
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="say-hello.html" %}
```markup
<h2>Hello ${to}!</h2>
```
{% endcode-tabs-item %}

{% code-tabs-item title="my-app.html" %}
```markup
<say-hello to="John"></say-hello>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

By declaring a _bindable_, not only can your template access the property via string interpolation, but those who use the custom element in HTML can set that property directly through an HTML attribute or even bind the `to` attribute to their own model.

{% hint style="success" %}
**CSS Conventions**

Want to define component-specific CSS? Simply name your CSS file the same as your view-model and view, and Aurelia will include the styles in your component automatically. So, for the component defined above, we only need to add a `say-hello.css` file.
{% endhint %}

Now, what if we want our component to do something in response to user interaction? Let's see how we can set up DOM events to trigger methods on our component.

{% code-tabs %}
{% code-tabs-item title="say-hello.ts" %}
```typescript
import { bindable } from '@aurelia/runtime';

export class SayHello {
  @bindable to = 'World';
  message = 'Hello';

  leave() {
    this.message = 'Goodbye';
  }
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="say-hello.html" %}
```markup
<h2>${message} ${to}!</h2>
<button click.trigger="leave()">Leave</button>
```
{% endcode-tabs-item %}

{% code-tabs-item title="my-app.html" %}
```markup
<say-hello to="John"></say-hello>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

Now, when the user clicks the button, the `leave` method will get called. It then updates the message property, which causes the DOM to respond by updating as well.

{% hint style="info" %}
**Further Reading**

Interested to learn more about how you can display data with Aurelia's templating engine or how you can leverage events to respond to changes and interactions within your app? The next few docs on [Displaying Basic Data](displaying-basic-data.md), [Rendering Collections](rendering-collections.md), [Conditional Rendering](conditional-rendering.md), and [Handling Events](handling-events.md) will give you all the nitty, gritty details.
{% endhint %}

### Component Registration

By default, components you create aren't global. What that means is that you can't use a component within another component, unless that component has been imported. Let's imagine that our "say-hello" component wants to use a "name-tag" component internally. To do that, we need to add an import in our view. Here's how that works:

{% code-tabs %}
{% code-tabs-item title="say-hello.html" %}
```markup
<import from="./name-tag">

<h2>${message} <name-tag name.bind="to"></name-tag>!</h2>
<button click.trigger="leave()">Leave</button>
```
{% endcode-tabs-item %}

{% code-tabs-item title="say-hello.ts" %}
```typescript
import { bindable } from '@aurelia/runtime';

export class SayHello {
  @bindable to = 'World';
  message = 'Hello';

  leave() {
    this.message = 'Goodbye';
  }
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="app.html" %}
```markup
<say-hello to="John"></say-hello>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

In practice, most people want to side-step this feature and make most of their general-purpose components global, so they can remove the majority of their imports. To make a component global, simply register it with the application's root dependency injection container at startup:

{% code-tabs %}
{% code-tabs-item title="mail.ts" %}
```typescript
import { DebugConfiguration } from '@aurelia/debug';
import { BasicConfiguration } from '@aurelia/jit-html-browser';
import { Aurelia } from '@aurelia/runtime';
import { App } from './app';
import { NameTag } from './name-tag';

new Aurelia()
  .register(
    BasicConfiguration,
    DebugConfiguration,
    NameTag // Here it is!
  ).app({ host: document.querySelector('app'), component: App })
   .start();
```
{% endcode-tabs-item %}
{% endcode-tabs %}

As a best practice, we recommend an alternate approach to registering each component individually in this way. Instead, create a folder where you keep all your shared components. In that folder, create a `registry.ts` module where you re-export your components. Then, import that registry module and pass it to the application's `register` method at startup.

{% code-tabs %}
{% code-tabs-item title="components/register.ts" %}
```typescript
export * from './say-hello';
export * from './name-tag';
```
{% endcode-tabs-item %}

{% code-tabs-item title="main.ts" %}
```typescript
import { DebugConfiguration } from '@aurelia/debug';
import { BasicConfiguration } from '@aurelia/jit-html-browser';
import { Aurelia } from '@aurelia/runtime';
import { App } from './app';
import * as globalComponents from './components/registry';

new Aurelia()
  .register(
    BasicConfiguration,
    DebugConfiguration,
    globalComponents // This globalizes all the exports of our registry.
  ).app({ host: document.querySelector('app'), component: App })
   .start();
```
{% endcode-tabs-item %}
{% endcode-tabs %}

{% hint style="info" %}
**Aurelia Architecture**

Did you notice how the default Aurelia startup code involves importing and registering `BasicConfiguration`? The `BasicConfiguration` export is a type of `registry,` just like the one we described above. Since all of Aurelia's internals are pluggable and extensible, we provide this convenience registry to setup the standard options you would want in a typical application.
{% endhint %}

### Working without Conventions

So far, we've described how components are created by simply naming your JavaScript and HTML files with the same name, and that the component name is automatically derived from the file name. However, if you don't want to leverage conventions, or need to override the default behavior for an individual component, you can always explicitly provide the configuration yourself. To do this, use the `@customElement` decorator. Here's how we would define the previous component, without using conventions.

{% code-tabs %}
{% code-tabs-item title="say-hello.ts" %}
```typescript
import { customElement, bindable } from '@aurelia/runtime';
import * as template from './say-hello.html';

@customElement({
  name: 'say-hello',
  template
})
export class SayHello {
  @bindable to = 'World';
  message = 'Hello';

  leave() {
    this.message = 'Goodbye';
  }
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="say-hello.html" %}
```markup
<h2>${message} ${to}!</h2>
<button click.trigger="leave()">Leave</button>
```
{% endcode-tabs-item %}

{% code-tabs-item title="my-app.html" %}
```markup
<say-hello to="John"></say-hello>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

{% hint style="warning" %}
**Don't Skip the Conventions**

We highly recommend that you leverage conventions where possible. A few benefits include:

* Reduction of boilerplate.
* Cleaner, more portable code.
* Improved readability and learnability of code.
* Less setup work and maintenance over time.
* Ease of migration to future versions and platforms.
{% endhint %}

## The Component Lifecycle

Every component instance has a lifecycle that you can tap into. This makes it easy for you to perform various actions at particular times. For example, you may want to execute some code as soon as your component properties are bound, but before the component is first rendered. Or, you may want to run some code to manipulate the DOM as soon as possible after your element is attached to the document. Below is a summary of the various lifecycle callbacks that you can hook into in your component.

| Lifecycle Callback | Description |
| :--- | :--- |
| `constructor` | When the framework instantiates a component, it calls your class's constructor, just like any JavaScript class. This is the best place to put basic initialization code that is not dependent on bindable properties. |
| `created` | The "created" hook runs just after the constructor and can be treated very similarly. The only difference is that the component's `Controller` has been instantiated and is accessible through the `$controller` property, for advanced scenarios. |
| `binding` | If your component has a method named "binding", then the framework will invoke it when it has begun binding values to your bindable properties. In terms of the component hierarchy, the binding hooks execute top-down, from parent to child, so your bindables will have their values set by the owning components, but the bindings in your view are not yet set. This is a good place to perform any work or make changes to anything that your view would depend on because data still flows down synchronously. This is the best time to do anything that might affect children as well. We prefer using this hook over `bound`, unless you specifically need `bound` for a situation when `binding` is too early. You can optionally return a `Promise` or `ILifecycleTask`. If you do so, it will be awaited before the children start binding. This is useful for fetch/save of data before render. |
| `bound` | If your component has a method named "bound", then the framework will invoke it when it has fully bound your component, including its children. In terms of the component hierarchy, the bound hooks execute bottom-up, from child to parent. The bindings in the child views are bound, but the parent is not yet bound. This is the best place to do anything that requires children to be fully initialized and/or needs to propagate back up to the parent. |
| `attaching` | If your component has a method named "attaching", then the framework will invoke it when it has begun attaching your HTML element to the document. In terms of the component hierarchy, the attaching hooks execute top-down. However, nothing is mounted to the DOM just yet. This is the last chance to attach specific behaviors or mutate the DOM nodes in your view before they are mounted. You can queue animations or initialize certain 3rd party libraries that don't depend on the nodes being connected to the document. |
| `attached` | If your component has a method named "attached", then the framework will invoke it when it has fully attached your HTML element to the document, along with its children. In terms of the component hierarchy, the attached hooks execute bottom-up. This is the best time to invoke code that requires measuring of elements or integrating a 3rd party JavaScript library that requires being mounted to the DOM. |
| `detaching` | If your component has a method named "detaching", then the framework will invoke it when it is about to remove your HTML element from the document. In terms of the component hierarchy, the detaching hooks execute top-down. However, nothing is unmounted from the DOM just yet. |
| `caching` | If your component has a method named "caching", then the framework will invoke it immediately after the DOM nodes are unmounted. This is an advanced hook mostly useful for clean up of resources and references to views you own before they are put into the cache by the framework. |
| `detached` | If your component has a method named "detached", then the framework will invoke it when it has fully removed your HTML element from the document. In terms of the component hierarchy, the detached hooks execute bottom-up. |
| `unbinding` | If your component has a method named "unbinding", then the framework will invoke it when it has begun disconnecting bindings from your component. In terms of the component hierarchy, the unbinding hooks execute top-down. You can optionally return a `Promise` or `ILifecycleTask`. If you do so, it will be awaited before the children start unbinding. This is useful for fetch/save of data before final data disconnect. |
| `unbound` | If your component has a method named "unbound", then the framework will invoke it when it has fully disconnected bindings from your component. In terms of the component hierarchy, the unbound hooks execute bottom-up. |

To tap into any of these hooks, simply implement the method on your class:

{% code-tabs %}
{% code-tabs-item title="say-hello.ts" %}
```typescript
import { bindable } from '@aurelia/runtime';

export class SayHello {
  @bindable to = 'World';
  message = 'Hello';

  leave() {
    this.message = 'Goodbye';
  }

  attaching() {
    // your special lifecycle-dependent code goes here...
  }
}
```
{% endcode-tabs-item %}
{% endcode-tabs %}

### Component Constructors

All components are instantiated by the framework's dependency injection system. As a result, you can share common services across components and get access to component-specific services by declaring that you want the framework to "inject" them into your constructor. The most common component-specific thing you may want to inject into your component is the `HTMLElement` that serves as the host element for your component. In the examples above, this is the `say-hello` element itself \(rather than an element within its template\). Should you need access to the host for any component, you can declare that like this:

{% code-tabs %}
{% code-tabs-item title="say-hello.ts" %}
```typescript
export class SayHello {
  static inject = [HTMLElement];

  constructor(element) {
    this.element = element;
  }
}
```
{% endcode-tabs-item %}
{% endcode-tabs %}

{% hint style="info" %}
**Dependency Injection**

There are various ways to tell the framework what you want to inject. The above code sample shows the most vanilla JS approach, by using a public static field named "inject". See [the dependency injection documentation](../app-basics/dependency-injection.md) for more information on other approaches that use decorators or TS-specific metadata, as well as an in-depth look at dependency injection in general.
{% endhint %}

{% hint style="success" %}
**Referencing View Elements**

If you need access to a DOM element from within your view, rather than the host, place a `ref` attribute on the desired element in your template and the framework will set a property of the same name on your class to reference that element. For more information on this, see the documentation on [displaying basic data](displaying-basic-data.md#referencing-dom-elements).
{% endhint %}

## Shadow DOM and Slots

// TODO

## HTML-Only Components

// TODO

## Odds and Ends

Aurelia's component system is rich with features, designed to enable you to tackle any scenario that your app demands.

### Bindable Options

// TODO

### Containerless Components

// TODO

### The `@children` Decorator

// TODO

### The `as-element` Attribute

In some cases, especially when creating table rows out of Aurelia custom elements, you may need to have a custom element masquerade as a standard HTML element. For example, if you're trying to fill table rows with data, you may need your custom element to appear as a `<tr>` row or `<td>` cell. This is where the `as-element` attribute comes in handy.

{% code-tabs %}
{% code-tabs-item title="my-app.html" %}
```markup
<import from="./hello-row.html">

<table>
  <tr as-element="hello-row">
</table>
```
{% endcode-tabs-item %}

{% code-tabs-item title="hello-row.html" %}
```markup
<td>Hello</td>
<td>World</td>
```
{% endcode-tabs-item %}
{% endcode-tabs %}

The `as-element` attribute tells Aurelia that we want the content of the table row to be exactly what our `hello-row` template wraps. The way different browsers render tables means this may be necessary sometimes.

