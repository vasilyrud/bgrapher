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

import { ImageImpl } from './bgrapherimpl/image.js'

const firstDrawEvent = new CustomEvent('bgraphFirstDraw');

var BGrapher = function(GrapherImpl = ImageImpl) {
    this.GrapherImpl = GrapherImpl;

    this.width = function() {
        return this.bgraph.width;
    }

    this.height = function() {
        return this.bgraph.height;
    }

    this.initBgraph = function(bgraphContext, bgraphStr) {
        this.bgraph = this.GrapherImpl.initBgraph(JSON.parse(bgraphStr));
        bgraphContext.didFirstDraw = false;
    }

    this.initTestBgraph = function(bgraphContext, numCols, numRows) {
        this.bgraph = this.GrapherImpl.initTestBgraph(numCols, numRows);
        bgraphContext.didFirstDraw = false;
    }

    this.initTestBgraphLarge = function(bgraphContext, numCols, numRows) {
        this.bgraph = this.GrapherImpl.initTestBgraphLarge(numCols, numRows);
        bgraphContext.didFirstDraw = false;
    }

    this.draw = function(bgraphContext) {
        bgraphContext.canvas.width  = document.body.clientWidth;
        bgraphContext.canvas.height = document.body.clientHeight;

        if (!bgraphContext.didFirstDraw) {
            bgraphContext.didFirstDraw = true;
            bgraphContext.canvas.dispatchEvent(firstDrawEvent);
        }
        this.GrapherImpl.drawBgraph(bgraphContext, this.bgraph);
    }

    this.drawEdges = function(bgraphContext, blockID) {
        this.GrapherImpl.drawEdges(bgraphContext, this.bgraph, blockID);
    }

    this.curBlock = function(bgraphContext) {
        return this.GrapherImpl.getCurBlock(bgraphContext, this.bgraph);
    }
};

export { BGrapher }
