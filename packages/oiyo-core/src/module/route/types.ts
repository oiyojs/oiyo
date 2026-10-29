import type { StrictOmit } from '#/shared/type'
import type { GlobalStyle, Page, PagesJson, TabBarItem } from '@oiyo/config'

export interface Route {
  pagePath: string;
  filePath: string;
  pageBelong: string;
  pageMeta: ResolvedPageMeta | null;
}

export type MetaValue =
  | string
  | number
  | boolean
  | object
  | null
  | MetaObject
  | MetaValue[]

export interface MetaObject {
  [key: string]: MetaValue | undefined;
}

export interface Tab extends StrictOmit<TabBarItem, 'pagePath'> {
  index: number;
}

export interface BasePageMeta {
  type?: 'page' | 'home';
  layout?: string | false;
  style?: GlobalStyle;
  tab?: Tab;
}

export interface ResolvedPageMeta extends BasePageMeta, MetaObject {}

export interface PageInfo extends MetaObject {
  path: string;
  style?: GlobalStyle;
}

export interface ResolvedPagesJson extends PagesJson {
  pages: Page[];
}
