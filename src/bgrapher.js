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
import { imageImpl } from './grapherimpl/image.js'
import { bezierImpl } from './edgesimpl/bezier.js'
import { bgraphEventsImpl } from './eventsimpl/bgraphevents.js'

function _initBlocksData(inputData) {
    let blocksData = {};
    const numBlocks = inputData.blocks.length;

    for (let i = 0; i < numBlocks; i++) {
        const block = inputData.blocks[i];
        blocksData[block.id] = block;
    }

    return blocksData;
}

function _initEdgeEndsData(inputData) {
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
    grapherImpl = imageImpl,
    edgesImpl   = bezierImpl,
    eventsImpl  = bgraphEventsImpl,
) {
    this._grapherImpl = grapherImpl;
    this._edgesImpl   = edgesImpl;
    this._eventsImpl  = eventsImpl;

    this.bgraphWidth = function() {
        return this._grapherImpl.getBgraphWidth(this._grapherState);
    }

    this.bgraphHeight = function() {
        return this._grapherImpl.getBgraphHeight(this._grapherState);
    }

    this.clientWidth = function() {
        return this._grapherImpl.getClientWidth(this._grapherState);
    }

    this.clientHeight = function() {
        return this._grapherImpl.getClientHeight(this._grapherState);
    }

    this.initBgraph = function(bgraph) {
        const inputData = ((typeof bgraph === 'string' || bgraph instanceof String)
            ? JSON.parse(bgraph)
            : bgraph
        );

        this._grapherState = this._grapherImpl.initBgraph(inputData);

        this.blocksData = _initBlocksData(inputData);
        this.edgeEndsData = _initEdgeEndsData(inputData);

        this._lookup = new BlocksLookup(inputData);
        this._activeBlockIDs = new Set();
    }

    this._initTestBgraphLarge = function(numCols, numRows) {
        this._grapherState = this._grapherImpl.initTestBgraphLarge(numCols, numRows);
        this.blocksData   = {};
        this.edgeEndsData = {};
        this._activeBlockIDs = new Set();
    }

    this.populateElement = function(bgraphState, bgraphElement, cbSelect=()=>{}) {
        this._bgraphElement = bgraphElement;
        this.cbSelect = cbSelect;

        this._grapherImpl.populateElement(this._grapherState, this._bgraphElement);
        this.updateBgraphSize();
        this._eventState = this._eventsImpl.initEvents(bgraphState, this, this._bgraphElement);

        bgraphState.attach(this);
        this.draw(bgraphState);
    }

    this.updateBgraphSize = function() {
        this._grapherImpl.setClientSize(this._grapherState, 
            this._bgraphElement.clientWidth, 
            this._bgraphElement.clientHeight
        );
    }

    this.update = function(bgraphState) {
        bgraphState.update();
    }

    this.draw = function(bgraphState) {
        const cur = this._eventsImpl.cur(this._eventState);

        this._grapherImpl.drawBgraph(bgraphState, this._grapherState);
        this._drawBlocks(bgraphState);
        this._drawEdgeEnds(bgraphState);
        this._drawEdges(bgraphState);
        this._drawHoverInfo(bgraphState, cur);

        if (process.env.NODE_ENV === 'development') {
            this._printCoords(bgraphState, cur);
        }
    }

    this.setActiveBlock = function(blockID) {
        this._activeBlockIDs.add(blockID);
    }

    this.unsetActiveBlock = function(blockID) {
        this._activeBlockIDs.delete(blockID);
    }

    this.toggleActiveBlock = function(blockID) {
        if (this._activeBlockIDs.has(blockID)) {
            this._activeBlockIDs.delete(blockID);
        } else {
            this._activeBlockIDs.add(blockID);
        }
    }

    this.activeBlocks = function*() {
        for (const activeBlockID of this._activeBlockIDs) {
            const blockData = this.blocksData[activeBlockID];
            if (blockData) yield blockData;
        }

        const hoveredBlockID = this._eventsImpl.hoveredBlockID(this._eventState);
        if (!this._activeBlockIDs.has(hoveredBlockID)) {
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

    this._drawBlocks = function(bgraphState) {
        let seenBlocks = new Set();

        for (const block of this.activeBlocks()) {
            if (!seenBlocks.has(block.id)) {
                seenBlocks.add(block.id);

                this._grapherImpl.drawBlock(bgraphState, this._grapherState, block);
            }
        }
    }

    this._drawEdgeEnds = function(bgraphState) {
        let seenEdgeEnds = new Set();

        for (const [start, end] of this.activeEdges()) {
            if (!seenEdgeEnds.has(start.id)) {
                seenEdgeEnds.add(start.id);

                this._grapherImpl.drawEdgeEnd(bgraphState, this._grapherState, start);
            }

            if (!seenEdgeEnds.has(end.id)) {
                seenEdgeEnds.add(end.id);

                this._grapherImpl.drawEdgeEnd(bgraphState, this._grapherState, end);
            }
        }
    }

    this._drawEdges = function(bgraphState) {
        let seenEdges = new EdgeSet();

        for (const [start, end] of this.activeEdges()) {
            if (!seenEdges.has(start.id, end.id)) {
                seenEdges.add(start.id, end.id);

                this._grapherImpl.drawBezierEdge(bgraphState, this._grapherState, 
                    this._edgesImpl.generatePoints(start, end)
                );
            }
        }
    }

    this._drawHoverInfo = function(bgraphState, cur) {
        const blockData = this.curBlock(bgraphState, cur);
        if (!blockData) return;

        return this._grapherImpl.drawHoverInfo(this._grapherState, blockData);
    }

    this.selectBlock = function(blockID) {
        if (!blockID || !(blockID in this.blocksData)) return;
        this.cbSelect(this.blocksData[blockID]);
    }

    this.curBlock = function(bgraphState, cur) {
        const x = curBgraphPixel('x', bgraphState, cur);
        const y = curBgraphPixel('y', bgraphState, cur);

        if (!this._lookup) return null;
        return this.blocksData[this._lookup.get(x,y)];
    }

    this._printCoords = function(bgraphState, cur) {
        return this._grapherImpl.printCoords(this._grapherState,
            curBgraphPixel('x', bgraphState, cur),
            curBgraphPixel('y', bgraphState, cur),
        );
    }
};

export { BGrapher }
