import { defineConfig } from 'tsdown'

export default defineConfig({
  name: '@oiyo/plugin',
  entry: './src/index.ts',
  outputOptions: {
    exports: 'named',
  },
  alias: {
    '~': './src',
  },
  format: ['esm', 'cjs'],
  clean: true,
  dts: true,
  failOnWarn: true,
  shims: true,
  attw: {
    profile: 'node16',
  },
})
