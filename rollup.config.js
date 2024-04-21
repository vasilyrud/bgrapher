import { nodeResolve } from '@rollup/plugin-node-resolve';
import polyfillNode from 'rollup-plugin-polyfill-node';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';

import pkg from './package.json';
const prodFile = 'src/index.js';
const pluginsList = [
  nodeResolve({
    preferBuiltins: false,
  }),
  polyfillNode({}),
  commonjs({
    include: ['node_modules/**'],
  }),
  json({}),
];

export default [
  { // For ESM and CommonJS imports
    input: prodFile,
    plugins: pluginsList,
    output: [
      {
        dir: 'dist/esm',
        format: 'esm',
        exports: 'named',
        sourcemap: true,
      },
      {
        dir: 'dist/cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
      },
    ],
  },
  { // For <script> tag and RequireJS
    input: prodFile,
    plugins: pluginsList,
    output: {
      file: `dist/${pkg.name}.min.js`,
      name: `${pkg.name}`,
      format: 'umd',
      exports: 'named',
      sourcemap: true,
      esModule: false,
    },
  },
];
