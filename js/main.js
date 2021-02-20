/*
Copyright 2021 Vasily Rudchenko - bgraph

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { BgraphContext } from './bgraphcontext.js'
import { BGrapher } from './bgrapher.js'
import { onMouseWheel } from './events.js'


function main() {

    let bgraphContext = new BgraphContext(
        document.getElementById('main_canvas')
    );

    let bgraph = new BGrapher();
    bgraph.initTest(bgraphContext, 2500, 2500);
    bgraph.draw(bgraphContext);

    bgraphContext.canvas.addEventListener('wheel', 
        onMouseWheel.bind(null, bgraphContext, bgraph)
    );
}

main();
