import type { OiyoConfig } from './types'

import process from 'node:process'

export const DEFAULT_EXCLUDE = ['**/components/**', '**/composables/**', '**/utils/**']

export const defaultConfig: OiyoConfig = {
  rootDir: process.cwd(),
  srcDir: 'src',
  dir: {
    mainPackage: 'pages',
    subPackages: [],
    layouts: 'layouts',
  },
  exclude: DEFAULT_EXCLUDE,
  ide: {
    open: false,
    path: {},
  },
}
