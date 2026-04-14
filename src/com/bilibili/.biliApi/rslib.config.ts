import { defineConfig } from '@rslib/core';

export default defineConfig({
  output: {
    sourceMap: true,
  },
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: true,
    },
    {
      format: 'cjs',
      syntax: ['node 18'],
    },
  ],
});
