import {
  DI,
  IContainer
} from '@aurelia/kernel';
import { expect } from 'chai';
import {
  Binding,
  LifecycleFlags,
  ThrottleBindingBehavior
} from '../../../src/index';

describe('ThrottleBindingBehavior', function () {
  const container: IContainer = DI.createContainer();
  let sut: ThrottleBindingBehavior;
  let binding: Binding;
  let originalFn: (value: unknown, flags: LifecycleFlags) => void;

  beforeEach(function () {
    sut = new ThrottleBindingBehavior();
    binding = new Binding(undefined, undefined, undefined, undefined, undefined, container);
    originalFn = binding.updateTarget;
    sut.bind(undefined, undefined, binding as any);
  });

  // TODO: test properly (whether throttling works etc)
  it('bind()   should apply the correct behavior', function () {
    expect(binding['throttledMethod'] === originalFn).to.equal(true);
    expect(binding['throttledMethod'].originalName).to.equal('updateTarget');
    expect(binding.updateTarget === originalFn).to.equal(false);
    expect(typeof binding.updateTarget).to.equal('function');
    expect(binding['throttleState']).not.to.equal(null);
    expect(typeof binding['throttleState']).to.equal('object');
  });

  it('unbind() should revert the original behavior', function () {
    sut.unbind(undefined, undefined, binding as any);
    expect(binding['throttledMethod']).to.equal(null);
    expect(binding.updateTarget === originalFn).to.equal(true);
    expect(typeof binding.updateTarget).to.equal('function');
    expect(binding['throttleState']).to.equal(null);
  });
});
