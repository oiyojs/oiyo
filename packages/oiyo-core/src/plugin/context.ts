import type { OiyoConfig } from '@oiyo/config'

import type { Logger } from '~/logger'

import { OiyoModLayout } from '#/layout'
import { OiyoModManifest } from '#/manifest'
import { OiyoModRoute } from '#/route'
import { resolveOiyoConfig } from '@oiyo/config'

import { createLogger } from '~/logger'
import { OiyoState } from '~/state'

export interface OiyoContext {
  config: OiyoConfig;
  logger: Logger;
  layout: OiyoModLayout;
  manifest: OiyoModManifest;
  state: OiyoState;
  route: OiyoModRoute;
}

export function createOiyoContext(userConfig?: Partial<OiyoConfig>, mode: string = 'development'): OiyoContext {
  const config = resolveOiyoConfig(userConfig)
  const logger = createLogger(import.meta.env.NODE_ENV === 'development' ? 'verbose' : 'info')

  const configLogger = logger.withScope('CONFIG')

  configLogger.debug(`项目路径: ${config.rootDir}`)
  configLogger.debug(`应用路径: ${config.srcDir}`)
  configLogger.debug(`应用模式: ${mode}`)

  const oiyoState = new OiyoState(config, mode)

  const oiyoLayout = new OiyoModLayout(config, {
    logger,
    oiyoState,
  })

  const oiyoManifest = new OiyoModManifest(config, {
    logger,
    oiyoState,
  })

  const oiyoRoute = new OiyoModRoute(config, {
    logger,
    oiyoState,
    oiyoLayout,
  })

  return {
    logger,
    config,
    layout: oiyoLayout,
    state: oiyoState,
    route: oiyoRoute,
    manifest: oiyoManifest,
  }
}
