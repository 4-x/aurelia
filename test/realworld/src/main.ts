import { DebugConfiguration } from '@aurelia/debug';
import { HttpClient } from '@aurelia/fetch-client';
import { BasicConfiguration } from '@aurelia/jit-html-browser';
import { IRegistry } from '@aurelia/kernel';
import { RouterConfiguration } from '@aurelia/router';
import { Aurelia } from '@aurelia/runtime';
import 'promise-polyfill/lib/polyfill';
import { App } from './app';
import { Auth } from './components/auth/auth';
import { DateValueConverter } from './resources/value-converters/date';
import { FormatHtmlValueConverter } from './resources/value-converters/format-html';
import { KeysValueConverter } from './resources/value-converters/keys';
import { MarkdownHtmlValueConverter } from './resources/value-converters/markdown-html';
import { SharedState } from './shared/state/shared-state';

const globalResources = [
  Auth,

  DateValueConverter,
  FormatHtmlValueConverter,
  KeysValueConverter,
  MarkdownHtmlValueConverter,

  SharedState,
  HttpClient,
] as unknown as IRegistry[];

(global as any).au = new Aurelia()
  .register(BasicConfiguration, DebugConfiguration, RouterConfiguration, ...globalResources)
  .app({
    component: App,
    host: document.querySelector('app')!,
  })
  .start();
