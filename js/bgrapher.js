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

    this.bgraphWidth = function() {
        return this.GrapherImpl.getBgraphWidth(this.bgraph);
    }

    this.bgraphHeight = function() {
        return this.GrapherImpl.getBgraphHeight(this.bgraph);
    }

    this.clientWidth = function() {
        return this.GrapherImpl.getClientWidth(this.bgraph);
    }

    this.clientHeight = function() {
        return this.GrapherImpl.getClientHeight(this.bgraph);
    }

    this.initBgraph = function(bgraphState, bgraphStr) {
        this.bgraph = this.GrapherImpl.initBgraph(JSON.parse(bgraphStr));
        bgraphState.didFirstDraw = false;
    }

    this.initTestBgraph = function(bgraphState, numCols, numRows) {
        this.bgraph = this.GrapherImpl.initTestBgraph(numCols, numRows);
        bgraphState.didFirstDraw = false;
    }

    this.initTestBgraphLarge = function(bgraphState, numCols, numRows) {
        this.bgraph = this.GrapherImpl.initTestBgraphLarge(numCols, numRows);
        bgraphState.didFirstDraw = false;
    }

    this.populateDiv = function(bgraphDiv) {
        this.GrapherImpl.populateDiv(this.bgraph, bgraphDiv);
    }

    this.draw = function(bgraphState, bgraphDiv) {
        this.GrapherImpl.setClientSize(this.bgraph, 
            bgraphDiv.clientWidth, 
            bgraphDiv.clientHeight
        );

        if (!bgraphState.didFirstDraw) {
            bgraphState.didFirstDraw = true;
            bgraphDiv.dispatchEvent(firstDrawEvent);
        }
        this.GrapherImpl.drawBgraph(bgraphState, this.bgraph);
    }

    this.drawEdges = function(bgraphState, blockID) {
        this.GrapherImpl.drawEdges(bgraphState, this.bgraph, blockID);
    }

    this.curBlock = function(bgraphState) {
        return this.GrapherImpl.getCurBlock(bgraphState, this.bgraph);
    }

    this.printCoords = function(bgraphState) {
        return this.GrapherImpl.printCoords(bgraphState, this.bgraph);
    }
};

export { BGrapher }
