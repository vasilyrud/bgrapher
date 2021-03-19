import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

export default {
    input: 'src/index.js',
    plugins: [
        serve({
            open: true,
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