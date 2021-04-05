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

import { ImageImpl } from './grapherimpl/image.js'
import { BezierImpl } from './edgesimpl/bezier.js'
import { BgraphEventsImpl } from './eventsimpl/bgraphevents.js'

function curBgraphPixel(coord, bgraphState, cur) {
    return Math.floor(
        (cur[coord] / bgraphState.zoom) - bgraphState.offset[coord]
    );
}

function getBlocksData(inputData) {
    const numBlocks = inputData.blocks.length;
    let blocksData  = {};

    for (let i = 0; i < numBlocks; i++) {
        const block = inputData.blocks[i];

        blocksData[block.id] = {
            text:     block.text,
            edgeEnds: block.edgeEnds,
        };
    }

    return blocksData;
}

function getEdgeEndsData(inputData) {
    const numEdgeEnds = inputData.edgeEnds.length;
    let edgeEndsData  = {};

    for (let i = 0; i < numEdgeEnds; i++) {
        const edgeEnd = inputData.edgeEnds[i];

        edgeEndsData[edgeEnd.id] = {
            x: edgeEnd.x,
            y: edgeEnd.y,
            direction: edgeEnd.direction,
            isSource:  edgeEnd.isSource,
            edgeEnds:  edgeEnd.edgeEnds,
        };
    }

    return edgeEndsData;
}

var BGrapher = function(
    GrapherImpl = ImageImpl,
    EdgesImpl   = BezierImpl,
    EventsImpl  = BgraphEventsImpl,
) {
    this.GrapherImpl = GrapherImpl;
    this.EdgesImpl   = EdgesImpl;
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

    this.initBgraph = function(bgraph) {
        const inputData = ((typeof bgraph === 'string' || bgraph instanceof String)
            ? JSON.parse(bgraph)
            : bgraph
        );

        this.grapherState = this.GrapherImpl.initBgraph(inputData);
        this.blocksData   = getBlocksData(inputData);
        this.edgeEndsData = getEdgeEndsData(inputData);
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
        if (!this.blocksData) return null;
        if (!(blockID in this.blocksData)) return null;
        return this.blocksData[blockID];
    }

    this.drawEdges = function(bgraphState, blockID) {
        const blockData = this.getBlockData(blockID);
        if (blockData === null) return;

        for (const startEdgeEndID of this.blocksData[blockID].edgeEnds) {
            let startEdgeEnd = this.edgeEndsData[startEdgeEndID];

            for (const endEdgeEndID of startEdgeEnd.edgeEnds) {
                let endEdgeEnd = this.edgeEndsData[endEdgeEndID];

                let points = this.EdgesImpl.generatePoints(startEdgeEnd, endEdgeEnd);
                this.GrapherImpl.drawBezierEdge(bgraphState, this.grapherState, points);
            }
        }
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
