import type { OiyoConfig } from '@oiyo/config'
import type { Plugin, UserConfig } from 'vite'

import { loadConfig } from 'c12'
import { defu } from 'defu'
import * as path from 'pathe'

import { createOiyoContext } from './context'

export function OiyoCommonPlugin(userInlineConfig?: Partial<OiyoConfig>): Plugin[] {
  return [
    {
      name: 'oiyo:deps',
      enforce: 'pre',
      async config(config, { mode }) {
        const { config: userFileConfig } = await loadConfig<OiyoConfig>({ name: 'oiyo', cwd: config.root })

        const userConfig = userFileConfig || userInlineConfig

        const ctx = createOiyoContext(userConfig, mode)

        return defu(config, {
          oiyo: ctx,
          resolve: {
            alias: {
              '~': path.resolve(ctx.config.rootDir!, ctx.config.srcDir!),
              '@': path.resolve(ctx.config.rootDir!, ctx.config.srcDir!),
              '@@': path.normalize(ctx.config.rootDir!),
              '~~': path.normalize(ctx.config.rootDir!),
            },
          },
          optimizeDeps: {
            exclude: ['@oiyojs/oiyo'],
          },
        } as UserConfig)
      },
    },
  ]
}
