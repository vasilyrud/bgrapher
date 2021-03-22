import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';

export default {
    input: 'src/index.js',
    plugins: [
        postcss({
            extensions: ['.css'],
        }),
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify('development')
        }),
        nodeResolve({
            extensions: ['.js', '.jsx']
        }),
        commonjs({
            include: ['node_modules/**']
        }),
        babel({}),
        serve({
            open: false,
            verbose: true,
            contentBase: ['', 'dist'],
            historyApiFallback: true,
            host: 'localhost',
            port: 3000
        }),
        livereload({
            watch: 'dist'
        })
    ],
    output: {
        file: 'dist/app.js',
        format: 'es',
        sourcemap: true
    }
};