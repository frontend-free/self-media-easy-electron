import react from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      viteStaticCopy({
        targets: [
          {
            src: resolve(__dirname, 'resources/fonts/SourceHanSansSC-Medium-2.otf'),
            dest: 'resources/fonts',
          },
        ],
      }),
    ],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [react()],
  },
});
