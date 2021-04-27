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

import { curBgraphPixel, BlocksLookup, Direction } from './common/lookup.js'
import { EdgeSet } from './common/struct.js'
import { ImageImpl } from './grapherimpl/image.js'
import { BezierImpl } from './edgesimpl/bezier.js'
import { BgraphEventsImpl } from './eventsimpl/bgraphevents.js'

function initBlocksData(inputData) {
    let blocksData = {};
    const numBlocks = inputData.blocks.length;

    for (let i = 0; i < numBlocks; i++) {
        const block = inputData.blocks[i];
        blocksData[block.id] = block;
    }

    return blocksData;
}

function initEdgeEndsData(inputData) {
    let edgeEndsData = {};
    const numEdgeEnds = inputData.edgeEnds.length;

    for (let i = 0; i < numEdgeEnds; i++) {
        const edgeEnd = inputData.edgeEnds[i];
        edgeEndsData[edgeEnd.id] = edgeEnd;
        edgeEndsData[edgeEnd.id].direction = Direction[edgeEnd.direction];
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

        this.blocksData = initBlocksData(inputData);
        this.lookup = new BlocksLookup(inputData);
        this.edgeEndsData = initEdgeEndsData(inputData);

        this.activeBlockIDs = new Set();
    }

    this.initTestBgraphLarge = function(numCols, numRows) {
        this.grapherState = this.GrapherImpl.initTestBgraphLarge(numCols, numRows);
        this.blocksData   = {};
        this.edgeEndsData = {};
        this.activeBlockIDs = new Set();
    }

    this.populateElement = function(bgraphState, bgraphElement, cbSelect=()=>{}) {
        this.bgraphElement = bgraphElement;
        this.cbSelect = cbSelect;

        this.GrapherImpl.populateElement(this.grapherState, this.bgraphElement);
        this.updateBgraphSize();
        this.eventState = this.EventsImpl.initEvents(bgraphState, this, this.bgraphElement);

        bgraphState.attach(this);
        this.draw(bgraphState);
    }

    this.updateBgraphSize = function() {
        this.GrapherImpl.setClientSize(this.grapherState, 
            this.bgraphElement.clientWidth, 
            this.bgraphElement.clientHeight
        );
    }

    this.update = function(bgraphState) {
        bgraphState.update();
    }

    this.draw = function(bgraphState) {
        const cur = this.EventsImpl.getCur(this.eventState);

        this.GrapherImpl.drawBgraph(bgraphState, this.grapherState);
        this.drawBlocks(bgraphState);
        this.drawEdgeEnds(bgraphState);
        this.drawEdges(bgraphState);
        this.drawHoverInfo(bgraphState, cur);

        if (process.env.NODE_ENV === 'development') {
            this.printCoords(bgraphState, cur);
        }
    }

    this.setActiveBlock = function(blockID) {
        this.activeBlockIDs.add(blockID);
    }

    this.unsetActiveBlock = function(blockID) {
        this.activeBlockIDs.delete(blockID);
    }

    this.toggleActiveBlock = function(blockID) {
        if (this.activeBlockIDs.has(blockID)) {
            this.activeBlockIDs.delete(blockID);
        } else {
            this.activeBlockIDs.add(blockID);
        }
    }

    this.activeBlocks = function*() {
        for (const activeBlockID of this.activeBlockIDs) {
            const blockData = this.blocksData[activeBlockID];
            if (blockData) yield blockData;
        }

        const hoveredBlockID = this.EventsImpl.hoveredBlockID(this.eventState);
        if (!this.activeBlockIDs.has(hoveredBlockID)) {
            const blockData = this.blocksData[hoveredBlockID];
            if (blockData) yield blockData;
        }
    }

    this.activeEdges = function*() {
        for (const blockData of this.activeBlocks()) {
            for (const startEdgeEndID of blockData.edgeEnds) {
                const startEdgeEndData = this.edgeEndsData[startEdgeEndID];
                if (!startEdgeEndData) continue;

                for (const endEdgeEndID of startEdgeEndData.edgeEnds) {
                    const endEdgeEndData = this.edgeEndsData[endEdgeEndID];
                    if (!endEdgeEndData) continue;

                    yield [startEdgeEndData, endEdgeEndData];
                }
            }
        }
    }

    this.drawBlocks = function(bgraphState) {
        let seenBlocks = new Set();

        for (const block of this.activeBlocks()) {
            if (!seenBlocks.has(block.id)) {
                seenBlocks.add(block.id);

                this.GrapherImpl.drawBlock(bgraphState, this.grapherState, block);
            }
        }
    }

    this.drawEdgeEnds = function(bgraphState) {
        let seenEdgeEnds = new Set();

        for (const [start, end] of this.activeEdges()) {
            if (!seenEdgeEnds.has(start.id)) {
                seenEdgeEnds.add(start.id);

                this.GrapherImpl.drawEdgeEnd(bgraphState, this.grapherState, start);
            }

            if (!seenEdgeEnds.has(end.id)) {
                seenEdgeEnds.add(end.id);

                this.GrapherImpl.drawEdgeEnd(bgraphState, this.grapherState, end);
            }
        }
    }

    this.drawEdges = function(bgraphState) {
        let seenEdges = new EdgeSet();

        for (const [start, end] of this.activeEdges()) {
            if (!seenEdges.has(start.id, end.id)) {
                seenEdges.add(start.id, end.id);

                this.GrapherImpl.drawBezierEdge(bgraphState, this.grapherState, 
                    this.EdgesImpl.generatePoints(start, end)
                );
            }
        }
    }

    this.drawHoverInfo = function(bgraphState, cur) {
        const blockData = this.curBlock(bgraphState, cur);
        if (!blockData) return;

        return this.GrapherImpl.drawHoverInfo(this.grapherState, blockData);
    }

    this.notifyParent = function(bgraphState, cur) {
        const blockData = this.curBlock(bgraphState, cur);
        if (!blockData) return;

        this.cbSelect(blockData);
    }

    this.curBlock = function(bgraphState, cur) {
        const x = curBgraphPixel('x', bgraphState, cur);
        const y = curBgraphPixel('y', bgraphState, cur);

        if (!this.lookup) return null;
        return this.blocksData[this.lookup.get(x,y)];
    }

    this.printCoords = function(bgraphState, cur) {
        return this.GrapherImpl.printCoords(this.grapherState,
            curBgraphPixel('x', bgraphState, cur),
            curBgraphPixel('y', bgraphState, cur),
        );
    }
};

export { BGrapher }
