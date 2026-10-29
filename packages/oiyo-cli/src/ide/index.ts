import type { OiyoConfig } from '@oiyo/config'
import type { Logger } from '@oiyo/core'

import type { Platform } from '../platform'

import { blue } from 'ansis'

import { openWechatIDE } from './wechat'

export async function openMiniAppIDE(
  platform: Platform | null,
  config: OiyoConfig,
  logger: Logger,
): Promise<void> {
  const ideLogger = logger.withScope('IDE')

  switch (platform) {
    case 'mp-weixin':
      await openWechatIDE(config, ideLogger)
      break
    default:
      ideLogger.info(`请手动打开开发者工具，导入 ${blue(platform)} 产物运行`)
      break
  }
}
