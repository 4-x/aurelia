import { DebugConfiguration } from '@aurelia/debug';
import { HttpClient } from '@aurelia/fetch-client';
import { BasicConfiguration } from '@aurelia/jit-html-browser';
import { RouterConfiguration } from '@aurelia/router';
import { Aurelia } from '@aurelia/runtime';
import 'promise-polyfill/lib/polyfill';
import { HttpInterceptor } from 'shared/services/http-interceptor';
import { App } from './app';
import { ArticleComponent } from './components/article/article';
import { CommentCustomElement } from './components/article/comment';
import { AuthComponent } from './components/auth/auth';
import { EditorComponent } from './components/editor/editor';
import { HomeComponent } from './components/home/home';
import { ProfileComponent } from './components/profile/profile';
import { ProfileArticleComponent } from './components/profile/profile-article';
import { ProfileFavoritesComponent } from './components/profile/profile-favorites';
import { SettingsComponent } from './components/settings/settings';
import { ArticleList } from './resources/elements/article-list';
import { ArticlePreview } from './resources/elements/article-preview';
import { DateValueConverter } from './resources/value-converters/date';
import { FormatHtmlValueConverter } from './resources/value-converters/format-html';
import { KeysValueConverter } from './resources/value-converters/keys';
import { MarkdownHtmlValueConverter } from './resources/value-converters/markdown-html';
import { FavoriteButton } from './shared/buttons/favorite-button';
import { FollowButton } from './shared/buttons/follow-button';
import { FooterLayout } from './shared/layouts/footer-layout';
import { HeaderLayout } from './shared/layouts/header-layout';
import { SharedState } from './shared/state/shared-state';

const container =
  BasicConfiguration.createContainer().register(
    App,
    HomeComponent,
    HeaderLayout,
    FooterLayout,
    FavoriteButton,
    FollowButton,
    ArticleList,
    ArticlePreview,
    ArticleComponent,
    ProfileComponent,
    EditorComponent,
    AuthComponent,
    DateValueConverter,
    FormatHtmlValueConverter,
    KeysValueConverter,
    SharedState,
    SettingsComponent,
    ProfileArticleComponent,
    ProfileFavoritesComponent,
    CommentCustomElement,
    MarkdownHtmlValueConverter,
    HttpClient,
  );

(global as any).au = new Aurelia(container)
  .register(BasicConfiguration, DebugConfiguration, RouterConfiguration)
  .app({
    component: App,
    host: document.querySelector('app')!,
  })
  .start();
