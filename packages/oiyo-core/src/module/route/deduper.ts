import type { PagesJson } from '@oiyo/config'

import { dedupeArray } from '#/shared/array'
import { defu } from 'defu'

export function dedupePagesConfig(source: PagesJson, ...targets: PagesJson[]): PagesJson {
  const config = defu(source, ...targets)

  if (config.pages) {
    config.pages = dedupeArray(config.pages, page => page.path)
  }

  if (config.subPackages) {
    for (const subPackage of config.subPackages) {
      subPackage.pages = dedupeArray(subPackage.pages, page => page.path)
    }
  }

  if (config.tabBar && config.tabBar.list) {
    config.tabBar.list = dedupeArray(config.tabBar.list, item => item.pagePath)
  }

  return config
}
