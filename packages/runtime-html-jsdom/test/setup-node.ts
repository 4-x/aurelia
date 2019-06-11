import * as chai from 'chai';
import { JSDOM } from 'jsdom';
import * as sinonChai from 'sinon-chai';
import { addChaiAsserts_$state, HTMLTestContext, TestContext } from '../../runtime-html/test/util';

const jsdom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`);

export function createHTMLTestContext(): HTMLTestContext {
  return HTMLTestContext.create(
    jsdom.window,
    jsdom.window.UIEvent,
    jsdom.window.Event,
    jsdom.window.CustomEvent,
    jsdom.window.Node,
    jsdom.window.Element,
    jsdom.window.HTMLElement,
    jsdom.window.HTMLDivElement,
    jsdom.window.Text,
    jsdom.window.Comment
  );
}

TestContext.createHTMLTestContext = createHTMLTestContext;
TestContext.Node = jsdom.window.Node;
TestContext.Element = jsdom.window.Element;
TestContext.HTMLElement = jsdom.window.HTMLElement;
TestContext.HTMLDivElement = jsdom.window.HTMLDivElement;

chai.use(sinonChai);
chai.use(addChaiAsserts_$state);
