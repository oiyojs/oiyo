import type { BasePageMeta } from './types'

export interface PageMeta extends BasePageMeta {
  [key: string]: unknown;
}

// eslint-disable-next-line unused-imports/no-unused-vars
export const definePageMeta = (meta: PageMeta): void => {}
