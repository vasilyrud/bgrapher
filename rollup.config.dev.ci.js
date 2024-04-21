import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import polyfillNode from 'rollup-plugin-polyfill-node';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';

let config = {
  input: 'dev/index.js',
  plugins: [
    postcss({
      extensions: ['.css'],
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    nodeResolve({
      preferBuiltins: false,
      extensions: ['.js', '.jsx']
    }),
    polyfillNode({}),
    commonjs({
      include: ['node_modules/**']
    }),
    babel({}),
    json({}),
  ],
  output: {
    file: 'dev/app.js',
    format: 'es',
    sourcemap: true
  },
};

export default config;
