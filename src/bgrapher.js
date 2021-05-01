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

import { curBgraphPixel, Direction, BlocksLookup, EdgeEndsLookup } from './common/lookup.js'
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

    this.doDrawHoverInfo = true;

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

        this.blocksData   = _initBlocksData(inputData);
        this.edgeEndsData = _initEdgeEndsData(inputData);

        this._blocksLookup   = new BlocksLookup(inputData);
        this._edgeEndsLookup = new EdgeEndsLookup(inputData);

        this._activeBlockIDs   = new Set();
        this._activeEdgeEndIDs = new Set();
    }

    this._initTestBgraphLarge = function(numCols, numRows) {
        this._grapherState = this._grapherImpl.initTestBgraphLarge(numCols, numRows);
        this.blocksData   = {};
        this.edgeEndsData = {};
        this._activeBlockIDs = new Set();
    }

    this.populateElement = function(bgraphState, bgraphElement) {
        this._bgraphElement = bgraphElement;
        this.selectCallback = ()=>{};
        this.hoverCallback  = ()=>{};

        this._grapherImpl.populateElement(this._grapherState, this._bgraphElement);
        this.updateBgraphSize();
        this._eventState = this._eventsImpl.initEvents(bgraphState, this, this._bgraphElement);

        bgraphState.attach(this);
        this.draw(bgraphState);
    }

    this.setSelectCallback = function(cbSelect) {
        this.selectCallback = cbSelect;
    }

    this.setHoverCallback = function(cbHover) {
        this.hoverCallback = cbHover;
    }

    this.updateBgraphSize = function() {
        this._grapherImpl.setClientSize(this._grapherState, 
            this._bgraphElement.clientWidth, 
            this._bgraphElement.clientHeight
        );
    }

    this.draw = function(bgraphState) {
        const cur = this._eventsImpl.cur(this._eventState);

        this._grapherImpl.drawBgraph(bgraphState, this._grapherState);
        this._drawBlocks(bgraphState);
        this._drawEdgeEnds(bgraphState);
        this._drawEdges(bgraphState);

        if (this.doDrawHoverInfo) {
            this._drawHoverInfo(bgraphState, cur);
        }

        if (process.env.NODE_ENV === 'development') {
            this._printCoords(bgraphState, cur);
        }
    }

    this.setActiveBlock = function(blockID) {
        if (blockID === null) return;
        this._activeBlockIDs.add(blockID);

        for (const edgeEndID of this.blocksData[blockID].edgeEnds) {
            this._activeEdgeEndIDs.add(edgeEndID);
        }
    }

    this.unsetActiveBlock = function(blockID) {
        if (blockID === null) return;
        this._activeBlockIDs.delete(blockID);

        for (const edgeEndID of this.blocksData[blockID].edgeEnds) {
            this._activeEdgeEndIDs.delete(edgeEndID);
        }
    }

    this.toggleActiveBlock = function(blockID) {
        if (blockID === null) return;

        if (this._activeBlockIDs.has(blockID)) {
            this.unsetActiveBlock(blockID);
        } else {
            this.setActiveBlock(blockID);
        }
    }

    this.setActiveEdgeEnd = function(edgeEndID) {
        if (edgeEndID === null) return;
        this._activeEdgeEndIDs.add(edgeEndID);

        for (const otherEdgeEndID of this.edgeEndsData[edgeEndID].edgeEnds) {
            this._activeEdgeEndIDs.add(otherEdgeEndID);
        }
    }

    this.unsetActiveEdgeEnd = function(edgeEndID) {
        if (edgeEndID === null) return;
        this._activeEdgeEndIDs.delete(edgeEndID);

        for (const otherEdgeEndID of this.edgeEndsData[edgeEndID].edgeEnds) {
            this._activeEdgeEndIDs.delete(otherEdgeEndID);
        }
    }

    this.toggleActiveEdgeEnd = function(edgeEndID) {
        if (edgeEndID === null) return;

        if (this._activeEdgeEndIDs.has(edgeEndID)) {
            this.unsetActiveEdgeEnd(edgeEndID);
        } else {
            this.setActiveEdgeEnd(edgeEndID);
        }
    }

    this._activeHoveredBlock = function*() {
        const hoveredBlockID = this._eventsImpl.hoveredBlockID(this._eventState);
        if (!this._activeBlockIDs.has(hoveredBlockID)) {
            const blockData = this.blocksData[hoveredBlockID];
            if (blockData) yield blockData;
        }
    }

    this.activeBlocks = function*() {
        for (const activeBlockID of this._activeBlockIDs) {
            const blockData = this.blocksData[activeBlockID];
            if (blockData) yield blockData;
        }

        for (const hoveredBlockData of this._activeHoveredBlock()) {
            yield hoveredBlockData;
        }
    }

    this._activeHoveredEdgeEnd = function*() {
        const hoveredEdgeEndID = this._eventsImpl.hoveredEdgeEndID(this._eventState);
        if (!this._activeEdgeEndIDs.has(hoveredEdgeEndID)) {
            const edgeEndData = this.edgeEndsData[hoveredEdgeEndID];
            if (edgeEndData) yield edgeEndData;
        }
    }

    this.activeEdgeEnds = function*() {
        for (const activeEdgeEndID of this._activeEdgeEndIDs) {
            const edgeEndData = this.edgeEndsData[activeEdgeEndID];
            if (edgeEndData) yield edgeEndData;
        }

        for (const hoveredEdgeEndData of this._activeHoveredEdgeEnd()) {
            yield hoveredEdgeEndData;
        }

        for (const hoveredBlockData of this._activeHoveredBlock()) {
            for (const hoveredBlockEdgeEndID of hoveredBlockData.edgeEnds) {
                const edgeEndData = this.edgeEndsData[hoveredBlockEdgeEndID];
                if (edgeEndData) yield edgeEndData;
            }
        }
    }

    this.activeEdges = function*() {
        for (const startEdgeEndData of this.activeEdgeEnds()) {
            if (!startEdgeEndData) continue;

            for (const endEdgeEndID of startEdgeEndData.edgeEnds) {
                const endEdgeEndData = this.edgeEndsData[endEdgeEndID];
                if (!endEdgeEndData) continue;

                yield [startEdgeEndData, endEdgeEndData];
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
        this.selectCallback(this.blocksData[blockID]);
    }

    this.hoverBlock = function(blockID) {
        if (!blockID || !(blockID in this.blocksData)) return;
        this.hoverCallback(this.blocksData[blockID]);
    }

    this.curBlock = function(bgraphState, cur) {
        const x = curBgraphPixel('x', bgraphState, cur);
        const y = curBgraphPixel('y', bgraphState, cur);

        if (!this._blocksLookup) return null;
        return this.blocksData[this._blocksLookup.get(x,y)];
    }

    this.curEdgeEnd = function(bgraphState, cur) {
        const x = curBgraphPixel('x', bgraphState, cur);
        const y = curBgraphPixel('y', bgraphState, cur);

        if (!this._edgeEndsLookup) return null;
        return this.edgeEndsData[this._edgeEndsLookup.get(x,y)];
    }

    this._printCoords = function(bgraphState, cur) {
        return this._grapherImpl.printCoords(this._grapherState,
            curBgraphPixel('x', bgraphState, cur),
            curBgraphPixel('y', bgraphState, cur),
        );
    }
};

export { BGrapher }
