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
import { initBgraphEvents } from './events.js'

function setupBgraph(bgraphForm, event) {
    event.preventDefault();
    bgraphForm.remove();

    let mainCanvas = document.createElement('canvas', {id: 'mainCanvas'});
    document.body.appendChild(mainCanvas);

    let bgraphContext = new BgraphContext(mainCanvas);
    let bgrapher = new BGrapher();

    initBgraphEvents(bgraphContext, bgrapher);

    // bgrapher.initTestBgraph(bgraphContext, 1000, 10000);
    // bgrapher.initTestBgraphLarge(bgraphContext, 5000, 10000);
    bgrapher.initBgraph(bgraphContext, event.target.elements.bgraphJSON.value);

    bgrapher.draw(bgraphContext);    
}

function main() {

    let bgraphForm = document.getElementById('bgraphJSONForm');
    bgraphForm.addEventListener('submit', setupBgraph.bind(null, bgraphForm));

}

main();
