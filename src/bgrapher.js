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
    this.selectBlockCallback = ()=>{};
    this.selectEdgeEndCallback = ()=>{};
    this.hoverBlockCallback = ()=>{};
    this.hoverEdgeEndCallback = ()=>{};

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

        this._activeBlockIDs = new Set();
        this._activeEdgeIDs  = new EdgeSet();
        this._hoveredEdgeIDs = new EdgeSet();

        this._hoveredBlockID   = null;
        this._hoveredEdgeEndID = null;
    }

    this._initTestBgraphLarge = function(numCols, numRows) {
        this._grapherState = this._grapherImpl.initTestBgraphLarge(numCols, numRows);
        this.blocksData   = {};
        this.edgeEndsData = {};
        this._activeBlockIDs   = new Set();
        this._activeEdgeEndIDs = new Set();
    }

    this.populateElement = function(bgraphState, bgraphElement) {
        this._bgraphElement = bgraphElement;

        this._grapherImpl.populateElement(this._grapherState, this._bgraphElement);
        this.updateBgraphSize();
        this._eventState = this._eventsImpl.initEvents(bgraphState, this, this._bgraphElement);

        bgraphState.attach(this);
        this.draw(bgraphState);
    }

    this.onBlockSelect = function(cbSelect) {
        this.selectBlockCallback = cbSelect;
    }

    this.onEdgeEndSelect = function(cbSelect) {
        this.selectEdgeEndCallback = cbSelect;
    }

    this.onBlockHover = function(cbHover) {
        this.hoverBlockCallback = cbHover;
    }

    this.onEdgeEndHover = function(cbHover) {
        this.hoverEdgeEndCallback = cbHover;
    }

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

    this._setActiveBlock = function(blockID) {
        if (blockID === null) return;
        this._activeBlockIDs.add(blockID);

        for (const edgeEndID of this.blocksData[blockID].edgeEnds) {
            this._setEdgeEnd(edgeEndID, '_activeEdgeIDs');
        }
    }

    this._unsetActiveBlock = function(blockID) {
        if (blockID === null) return;
        this._activeBlockIDs.delete(blockID);

        for (const edgeEndID of this.blocksData[blockID].edgeEnds) {
            this._unsetEdgeEnd(edgeEndID, '_activeEdgeIDs');
        }
    }

    this.toggleBlock = function(blockID) {
        if (blockID === null) return;

        if (this._activeBlockIDs.has(blockID)) {
            this._unsetActiveBlock(blockID);
        } else {
            this._setActiveBlock(blockID);
        }
    }

    this._edgeData = function(startID, endID) {
        return [
            this.edgeEndsData[startID], 
            this.edgeEndsData[endID]
        ];
    }

    this._orderEdgeIDs = function(startID, endID) {
        const [start,end] = this._edgeData(startID, endID);
        if (!start || !end) return [null, null];
        return start.isSource
            ? [startID, endID]
            : [endID, startID];
    }

    this._edgeEndEdges = function*(id) {
        const edgeEnd = this.edgeEndsData[id];
        if (edgeEnd) {
            for (const otherID of edgeEnd.edgeEnds) {
                yield this._orderEdgeIDs(id, otherID);
            }
        }
    }

    this._doCreateEdgeEnd = function(id) {
        for (const [startID, endID] of this._edgeEndEdges(id)) {
            if (!this._activeEdgeIDs.has(startID, endID))
                return true;
        }
        return false;
    }

    this._setEdgeEnd = function(id, attr) {
        if (id === null) return;

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            this[attr].add(startID, endID);
        }
    }

    this._unsetEdgeEnd = function(id, attr) {
        if (id === null) return;

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            this[attr].delete(startID, endID);
        }
    }

    this.toggleEdgeEnd = function(edgeEndID) {
        if (edgeEndID === null) return;

        if (this._doCreateEdgeEnd(edgeEndID)) {
            this._setEdgeEnd(edgeEndID, '_activeEdgeIDs');
        } else {
            this._unsetEdgeEnd(edgeEndID, '_activeEdgeIDs');
        }
    }

    this._activeHoveredBlock = function*() {
        if (!this._activeBlockIDs.has(this._hoveredBlockID)) {
            const blockData = this.blocksData[this._hoveredBlockID];
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

    this.activeEdges = function*() {
        for (const [startID, endID] of this._activeEdgeIDs) {
            const [start, end] = this._edgeData(startID, endID);
            if (!start || !end) continue;

            yield [start, end];
        }

        for (const [startID, endID] of this._hoveredEdgeIDs) {
            const [start, end] = this._edgeData(startID, endID);
            if (!start || !end) continue;

            yield [start, end];
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
        for (const [start, end] of this.activeEdges()) {
            this._grapherImpl.drawBezierEdge(bgraphState, this._grapherState, 
                this._edgesImpl.generatePoints(start, end)
            );
        }
    }

    this._drawHoverInfo = function(bgraphState, cur) {
        const edgeEndData = this.curEdgeEnd(bgraphState, cur);
        if (edgeEndData) {
            this._grapherImpl.drawHoverInfo(this._grapherState, edgeEndData, 'E');
            return;
        }

        const blockData = this.curBlock(bgraphState, cur);
        if (blockData) {
            this._grapherImpl.drawHoverInfo(this._grapherState, blockData, 'B');
            return;
        }
    }

    this.selectBlock = function(blockID) {
        if (blockID === null || !(blockID in this.blocksData)) return;
        this.selectBlockCallback(this.blocksData[blockID]);
    }

    this.selectEdgeEnd = function(edgeEndID) {
        if (edgeEndID === null || !(edgeEndID in this.edgeEndsData)) return;
        this.selectEdgeEndCallback(this.edgeEndsData[edgeEndID]);
    }

    this.hoveredBlock = function() {
        if (this._hoveredBlockID === null || 
            !(this._hoveredBlockID in this.blocksData)
        ) return null;

        return this.blocksData[this._hoveredBlockID];
    }

    this.hoveredEdgeEnd = function() {
        if (this._hoveredEdgeEndID === null || 
            !(this._hoveredEdgeEndID in this.edgeEndsData)
        ) return null;

        return this.edgeEndsData[this._hoveredEdgeEndID];
    }

    this.hoverBlock = function(blockID) {
        const prevHoveredBlockID = this._hoveredBlockID;
        this._hoveredBlockID = blockID;

        if (this._hoveredBlockID === prevHoveredBlockID) return;

        const prevHoveredBlock = this.blocksData[prevHoveredBlockID];
        if (prevHoveredBlock) {
            for (const edgeEndID of this.blocksData[prevHoveredBlockID].edgeEnds) {
                this._unsetEdgeEnd(edgeEndID, '_hoveredEdgeIDs');
            }
        }

        const hoveredBlock = this.blocksData[this._hoveredBlockID];
        if (hoveredBlock) {
            for (const edgeEndID of this.blocksData[this._hoveredBlockID].edgeEnds) {
                this._setEdgeEnd(edgeEndID, '_hoveredEdgeIDs');
            }
        }

        this.hoverBlockCallback(this.hoveredBlock());
    }

    this.hoverEdgeEnd = function(edgeEndID) {
        const prevHoveredEdgeEndID = this._hoveredEdgeEndID;
        this._hoveredEdgeEndID = edgeEndID;

        if (this._hoveredEdgeEndID === prevHoveredEdgeEndID) return;

        const prevHoveredEdgeEnd = this.edgeEndsData[prevHoveredEdgeEndID];
        if (prevHoveredEdgeEnd) {
            this._unsetEdgeEnd(prevHoveredEdgeEndID, '_hoveredEdgeIDs');
        }

        const hoveredEdgeEnd = this.edgeEndsData[this._hoveredEdgeEndID];
        if (hoveredEdgeEnd) {
            this._setEdgeEnd(this._hoveredEdgeEndID, '_hoveredEdgeIDs');
        }

        this.hoverEdgeEndCallback(this.hoveredEdgeEnd());
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
