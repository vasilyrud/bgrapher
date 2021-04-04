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
import { BgraphEventsImpl } from './events.js'

function curBgraphPixel(coord, bgraphState, cur) {
    return Math.floor(
        (cur[coord] / bgraphState.zoom) - bgraphState.offset[coord]
    );
}

var BGrapher = function(
    GrapherImpl = ImageImpl,
    EventsImpl  = BgraphEventsImpl,
) {
    this.GrapherImpl = GrapherImpl;
    this.EventsImpl  = EventsImpl;

    this.bgraphWidth = function() {
        return this.GrapherImpl.getBgraphWidth(this.grapherState);
    }

    this.bgraphHeight = function() {
        return this.GrapherImpl.getBgraphHeight(this.grapherState);
    }

    this.clientWidth = function() {
        return this.GrapherImpl.getClientWidth(this.grapherState);
    }

    this.clientHeight = function() {
        return this.GrapherImpl.getClientHeight(this.grapherState);
    }

    this.initBgraph = function(bgraphStr) {
        this.grapherState = this.GrapherImpl.initBgraph(JSON.parse(bgraphStr));
        this.didFirstDraw = false;
    }

    this.initTestBgraph = function(numCols, numRows) {
        this.grapherState = this.GrapherImpl.initTestBgraph(numCols, numRows);
        this.didFirstDraw = false;
    }

    this.initTestBgraphLarge = function(numCols, numRows) {
        this.grapherState = this.GrapherImpl.initTestBgraphLarge(numCols, numRows);
        this.didFirstDraw = false;
    }

    this.populateElement = function(bgraphState, bgraphElement) {
        this.bgraphElement = bgraphElement;

        this.GrapherImpl.populateElement(this.grapherState, this.bgraphElement);
        this.eventState = this.EventsImpl.initEvents(bgraphState, this, this.bgraphElement);

        bgraphState.attach(this);
        this.draw(bgraphState);
    }

    this.draw = function(bgraphState) {
        this.GrapherImpl.setClientSize(this.grapherState, 
            this.bgraphElement.clientWidth, 
            this.bgraphElement.clientHeight
        );

        if (!this.didFirstDraw) {
            this.didFirstDraw = true;
            this.bgraphElement.dispatchEvent(this.EventsImpl.firstDrawEvent);
        }
        this.GrapherImpl.drawBgraph(bgraphState, this.grapherState);
    }

    this.getBlockData = function(blockID) {
        return this.GrapherImpl.getBlockData(this.grapherState, blockID);
    }

    this.drawEdges = function(bgraphState, blockID) {
        this.GrapherImpl.drawEdges(bgraphState, this.grapherState, blockID);
    }

    this.curBlock = function(bgraphState) {
        const cur = EventsImpl.getCur(this.eventState);
        return this.GrapherImpl.getCurBlock(this.grapherState,
            curBgraphPixel('x', bgraphState, cur),
            curBgraphPixel('y', bgraphState, cur),
        );
    }

    this.printCoords = function(bgraphState) {
        const cur = EventsImpl.getCur(this.eventState);
        return this.GrapherImpl.printCoords(this.grapherState,
            curBgraphPixel('x', bgraphState, cur),
            curBgraphPixel('y', bgraphState, cur),
        );
    }
};

export { BGrapher }
