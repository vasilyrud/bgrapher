import devConfig from './rollup.config.dev.ci';

import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

let config = devConfig;
config.plugins.push(
    serve({
        open: false,
        verbose: true,
        contentBase: ['', 'dev'],
        historyApiFallback: true,
        host: 'localhost',
        port: 3000
    })
);
config.plugins.push(
    livereload({
        watch: 'dev'
    })
);

export default config;
