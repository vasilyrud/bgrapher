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
import { initBgraphEvents } from './events.js'

const firstDrawEvent = new CustomEvent('bgraphFirstDraw');

var BGrapher = function(GrapherImpl = ImageImpl) {
    this.GrapherImpl = GrapherImpl;

    this.bgraphWidth = function() {
        return this.GrapherImpl.getBgraphWidth(this.bgraphImpl);
    }

    this.bgraphHeight = function() {
        return this.GrapherImpl.getBgraphHeight(this.bgraphImpl);
    }

    this.clientWidth = function() {
        return this.GrapherImpl.getClientWidth(this.bgraphImpl);
    }

    this.clientHeight = function() {
        return this.GrapherImpl.getClientHeight(this.bgraphImpl);
    }

    this.initBgraph = function(bgraphStr) {
        this.bgraphImpl = this.GrapherImpl.initBgraph(JSON.parse(bgraphStr));
        this.didFirstDraw = false;
    }

    this.initTestBgraph = function(numCols, numRows) {
        this.bgraphImpl = this.GrapherImpl.initTestBgraph(numCols, numRows);
        this.didFirstDraw = false;
    }

    this.initTestBgraphLarge = function(numCols, numRows) {
        this.bgraphImpl = this.GrapherImpl.initTestBgraphLarge(numCols, numRows);
        this.didFirstDraw = false;
    }

    this.populateElement = function(bgraphState, bgraphElement) {
        this.bgraphElement = bgraphElement;

        this.GrapherImpl.populateElement(this.bgraphImpl, this.bgraphElement);
        initBgraphEvents(bgraphState, this, this.bgraphElement);

        bgraphState.attach(this);
        this.draw(bgraphState);
    }

    this.draw = function(bgraphState) {
        this.GrapherImpl.setClientSize(this.bgraphImpl, 
            this.bgraphElement.clientWidth, 
            this.bgraphElement.clientHeight
        );

        if (!this.didFirstDraw) {
            this.didFirstDraw = true;
            this.bgraphElement.dispatchEvent(firstDrawEvent);
        }
        this.GrapherImpl.drawBgraph(bgraphState, this.bgraphImpl);
    }

    this.getBlockData = function(blockID) {
        return this.GrapherImpl.getBlockData(this.bgraphImpl, blockID);
    }

    this.drawEdges = function(bgraphState, blockID) {
        this.GrapherImpl.drawEdges(bgraphState, this.bgraphImpl, blockID);
    }

    this.curBlock = function(bgraphState) {
        return this.GrapherImpl.getCurBlock(bgraphState, this.bgraphImpl);
    }

    this.printCoords = function(bgraphState) {
        return this.GrapherImpl.printCoords(bgraphState, this.bgraphImpl);
    }
};

export { BGrapher }
