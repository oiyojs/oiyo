import { defineConfig } from 'tsdown'

export default defineConfig({
  name: '@oiyo/config',
  entry: {
    index: './src/index.ts',
  },
  outputOptions: {
    exports: 'named',
  },
  format: ['esm', 'cjs'],
  clean: true,
  dts: true,
  failOnWarn: true,
  attw: {
    profile: 'node16',
  },
})
