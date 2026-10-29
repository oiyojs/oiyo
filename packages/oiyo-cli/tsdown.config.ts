import { defineConfig } from 'tsdown'

export default defineConfig({
  name: '@oiyo/cli',
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
  shims: true,
  failOnWarn: true,
  attw: {
    profile: 'node16',
  },
})
