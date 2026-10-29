import type { OiyoCommandData } from './common'

import { OiyoModLayout, OiyoModManifest, OiyoModRoute, OiyoState } from '@oiyo/core'
import { defineCommand } from 'citty'

import { oiyoCommandArg, oiyoCommandPlugin } from './common'

export const prepareCommand = defineCommand({
  meta: {
    name: 'prepare',
    description: '执行 Oiyo 准备阶段',
  },
  plugins: [oiyoCommandPlugin],
  args: {
    ...oiyoCommandArg,
  },
  async run({ data }) {
    const { logger, config, mode } = data as OiyoCommandData

    const prepareLogger = logger.withScope('PREPARE')

    const oiyoState = new OiyoState(config, mode)
    const oiyoLayout = new OiyoModLayout(config, {
      logger,
      oiyoState,
    })
    const oiyoRoute = new OiyoModRoute(config, {
      logger,
      oiyoState,
      oiyoLayout,
    })

    const oiyoManifest = new OiyoModManifest(config, {
      logger,
      oiyoState,
    })

    await Promise.all([
      oiyoLayout.scanLayouts(),
      oiyoRoute.scanRoutes(),
      oiyoManifest.loadManifestConfig(),
    ])

    oiyoLayout.writeDeclaration()
    oiyoRoute.writePagesJson() && oiyoRoute.writeDeclaration()
    oiyoManifest.writeManifestJson()

    oiyoState.writeDeclarationEntry()
    oiyoState.markGenerated()

    prepareLogger.debug('准备阶段完成')
  },
})
