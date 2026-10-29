import type { OiyoContext } from '~/plugin/context'

declare module 'vite' {
  interface UserConfig {
    oiyo?: OiyoContext;
  }
}
