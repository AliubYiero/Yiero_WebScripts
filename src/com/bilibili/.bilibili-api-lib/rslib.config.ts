import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: ['esnext'],
      dts: true,
    },
    {
      format: 'umd',
      syntax: ['esnext'],
      umdName: 'bili',
      output: {
        filename: {
          js: '[name].umd.js',
        },
      },
    },
  ],
});
