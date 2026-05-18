import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/runtime/server.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  noExternal: [/(.*)/],
});
