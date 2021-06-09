import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';

import pkg from './package.json';
const prodFile = 'src/index.js';

export default [
	{ // For npm install
		input: prodFile,
		plugins: [nodeResolve()],
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
	{ // For <script> tag
		input: prodFile,
		plugins: [nodeResolve(), babel({babelHelpers: 'bundled'}), terser()],
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
