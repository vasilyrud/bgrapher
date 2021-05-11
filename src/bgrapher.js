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

    this.hoverBlockCallback    = ()=>{};
    this.hoverEdgeEndCallback  = ()=>{};
    this.toggleBlockCallback   = ()=>{};
    this.toggleEdgeEndCallback = ()=>{};
    this.selectBlockCallback   = ()=>{};
    this.selectEdgeEndCallback = ()=>{};

    this.onHoverBlock    = function(cb) { this.hoverBlockCallback    = cb; }
    this.onHoverEdgeEnd  = function(cb) { this.hoverEdgeEndCallback  = cb; }
    this.onToggleBlock   = function(cb) { this.toggleBlockCallback   = cb; }
    this.onToggleEdgeEnd = function(cb) { this.toggleEdgeEndCallback = cb; }
    this.onSelectBlock   = function(cb) { this.selectBlockCallback   = cb; }
    this.onSelectEdgeEnd = function(cb) { this.selectEdgeEndCallback = cb; }

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

        this._hoveredBlockID = null;
        this._hoveredEdgeEndID = null;

        this._activeBlockIDs = new Set();
        this._hoveredEdgeEndIDs = new Set();
        this._activeEdgeEndIDs = new Set();
        this._hoveredEdgeIDs = new EdgeSet();
        this._activeEdgeIDs = new EdgeSet();
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

    this.bgraphWidth = function() {
        return this._grapherImpl.getBgraphWidth(this._grapherState); }
    this.bgraphHeight = function() {
        return this._grapherImpl.getBgraphHeight(this._grapherState); }

    this.clientWidth = function() {
        return this._grapherImpl.getClientWidth(this._grapherState); }
    this.clientHeight = function() {
        return this._grapherImpl.getClientHeight(this._grapherState); }

    this.updateBgraphSize = function() {
        this._grapherImpl.setClientSize(this._grapherState, 
            this._bgraphElement.clientWidth, 
            this._bgraphElement.clientHeight
        );
    }

    this.draw = function(bgraphState) {
        this._grapherImpl.drawBgraph(bgraphState, this._grapherState);
        this._drawBlocks(bgraphState);
        this._drawEdgeEnds(bgraphState);
        this._drawEdges(bgraphState);

        if (this.doDrawHoverInfo) {
            this._drawHoverInfo(bgraphState);
        }

        if (process.env.NODE_ENV === 'development') {
            this._printCoords(bgraphState);
        }
    }

    this._setActiveBlock = function(blockID) {
        if (blockID === null) return;
        this._activeBlockIDs.add(blockID);

        for (const edgeEndID of this.blocksData[blockID].edgeEnds) {
            this._setActiveEdgeEnd(edgeEndID);
        }
    }

    this._unsetActiveBlock = function(blockID) {
        if (blockID === null) return;
        this._activeBlockIDs.delete(blockID);

        for (const edgeEndID of this.blocksData[blockID].edgeEnds) {
            this._unsetActiveEdgeEnd(edgeEndID);
        }
    }

    this.toggleBlock = function(blockID) {
        if (blockID === null || 
            !(blockID in this.blocksData)
        ) return false;

        if (this._activeBlockIDs.has(blockID)) {
            this._unsetActiveBlock(blockID);
        } else {
            this._setActiveBlock(blockID);
        }

        this.toggleBlockCallback(this.blocksData[blockID]);
        return true;
    }

    this._edgeData = function(startID, endID) {
        return [
            this.edgeEndsData[startID], 
            this.edgeEndsData[endID]
        ];
    }

    this._orderedEdgeIDs = function(startID, endID) {
        const [start,end] = this._edgeData(startID, endID);
        if (!start || !end) return [null, null];
        return start.isSource
            ? [startID, endID]
            : [endID, startID];
    }

    this._edgeEndEdges = function*(id) {
        const edgeEnd = this.edgeEndsData[id];
        if (!edgeEnd) return;

        for (const otherID of edgeEnd.edgeEnds) {
            yield this._orderedEdgeIDs(id, otherID);
        }
    }

    this._doCreateEdgeEnd = function(id) {
        if (this.edgeEndsData[id].edgeEnds.length === 0 &&
            !this._activeEdgeEndIDs.has(id)
        ) return true;

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            if (!this._activeEdgeIDs.has(startID, endID))
                return true;
        }
        return false;
    }

    this._setHoveredEdgeEnd = function(id) {
        if (id === null) return;
        this._hoveredEdgeEndIDs.add(id);

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            if (id === startID) this._hoveredEdgeEndIDs.add(endID);
            else this._hoveredEdgeEndIDs.add(startID);

            this._hoveredEdgeIDs.add(startID, endID);
        }
    }

    this._unsetHoveredEdgeEnd = function(id) {
        if (id === null) return;
        this._hoveredEdgeEndIDs.delete(id);

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            if (id === startID) this._hoveredEdgeEndIDs.delete(endID);
            else this._hoveredEdgeEndIDs.delete(startID);

            this._hoveredEdgeIDs.delete(startID, endID);
        }
    }

    this._setActiveEdgeEnd = function(id) {
        if (id === null) return;
        this._activeEdgeEndIDs.add(id);

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            if (id === startID) this._activeEdgeEndIDs.add(endID);
            else this._activeEdgeEndIDs.add(startID);

            this._activeEdgeIDs.add(startID, endID);
        }
    }

    this._doUnsetEdgeEnd = function(id) {
        for (const edgeEndID of this.edgeEndsData[id].edgeEnds) {
            if (this._activeEdgeIDs.has(...this._orderedEdgeIDs(id, edgeEndID)))
                return false;
        }
        return true;
    }

    this._unsetActiveEdgeEnd = function(id) {
        if (id === null) return;
        this._activeEdgeEndIDs.delete(id);

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            this._activeEdgeIDs.delete(startID, endID);
        }

        for (const edgeEndID of this.edgeEndsData[id].edgeEnds) {
            if (!this._doUnsetEdgeEnd(edgeEndID)) continue;
            this._activeEdgeEndIDs.delete(edgeEndID);
        }
    }

    this.toggleEdgeEnd = function(edgeEndID) {
        if (edgeEndID === null ||
            !(edgeEndID in this.edgeEndsData)
        ) return false;

        if (this._doCreateEdgeEnd(edgeEndID)) {
            this._setActiveEdgeEnd(edgeEndID);
        } else {
            this._unsetActiveEdgeEnd(edgeEndID);
        }

        this.toggleEdgeEndCallback(this.edgeEndsData[edgeEndID]);
        return true;
    }

    this.activeBlocks = function*() {
        let seenBlocks = new Set();

        for (const activeBlockID of this._activeBlockIDs) {
            const block = this.blocksData[activeBlockID];
            if (!block ||
                seenBlocks.has(block.id)
            ) continue;

            seenBlocks.add(block.id);
            yield block;
        }

        const hoveredBlock = this.hoveredBlock();
        if (!hoveredBlock ||
            seenBlocks.has(hoveredBlock.id)
        ) return;

        seenBlocks.add(hoveredBlock.id);
        yield hoveredBlock;
    }

    this.activeEdgeEnds = function*() {
        let seenEdgeEnds = new Set();

        for (const activeEdgeEndID of this._activeEdgeEndIDs) {
            const edgeEnd = this.edgeEndsData[activeEdgeEndID];
            if (!edgeEnd ||
                seenEdgeEnds.has(edgeEnd.id)
            ) continue;

            seenEdgeEnds.add(edgeEnd.id);
            yield edgeEnd;
        }

        for (const hoveredEdgeEndID of this._hoveredEdgeEndIDs) {
            const edgeEnd = this.edgeEndsData[hoveredEdgeEndID];
            if (!edgeEnd ||
                seenEdgeEnds.has(edgeEnd.id)
            ) continue;

            seenEdgeEnds.add(edgeEnd.id);
            yield edgeEnd;
        }
    }

    this.activeEdges = function*() {
        let seenEdges = new EdgeSet();

        for (const [startID, endID] of this._activeEdgeIDs) {
            const [start, end] = this._edgeData(startID, endID);

            if (!start || 
                !end   || 
                seenEdges.has(startID, endID)
            ) continue;

            seenEdges.add(startID, endID);
            yield [start, end];
        }

        for (const [startID, endID] of this._hoveredEdgeIDs) {
            const [start, end] = this._edgeData(startID, endID);

            if (!start || 
                !end   || 
                seenEdges.has(startID, endID)
            ) continue;

            seenEdges.add(startID, endID);
            yield [start, end];
        }
    }

    this._drawBlocks = function(bgraphState) {
        for (const block of this.activeBlocks())
            this._grapherImpl.drawBlock(bgraphState, this._grapherState, block);
    }

    this._drawEdgeEnds = function(bgraphState) {
        for (const edgeEnd of this.activeEdgeEnds())
            this._grapherImpl.drawEdgeEnd(bgraphState, this._grapherState, edgeEnd);
    }

    this._drawEdges = function(bgraphState) {
        for (const [start, end] of this.activeEdges())
            this._grapherImpl.drawBezierEdge(bgraphState, this._grapherState, 
                this._edgesImpl.generatePoints(start, end)
            );
    }

    this._drawHoverInfo = function() {
        const hoveredBlock   = this.hoveredBlock();
        const hoveredEdgeEnd = this.hoveredEdgeEnd();

        if (hoveredBlock) this._grapherImpl.drawHoverInfo(
            this._grapherState, hoveredBlock, 'B');
        if (hoveredEdgeEnd) this._grapherImpl.drawHoverInfo(
            this._grapherState, hoveredEdgeEnd, 'E');
    }

    this.selectBlock = function(blockID) {
        if (blockID === null || 
            !(blockID in this.blocksData)
        ) return false;

        this.selectBlockCallback(this.blocksData[blockID]);
        return true;
    }

    this.selectEdgeEnd = function(edgeEndID) {
        if (edgeEndID === null || 
            !(edgeEndID in this.edgeEndsData)
        ) return false;

        this.selectEdgeEndCallback(this.edgeEndsData[edgeEndID]);
        return true;
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
        const hoveredBlock = this.blocksData[blockID];
        if (blockID !== null && !hoveredBlock) return false;

        const prevHoveredBlockID = this._hoveredBlockID;
        this._hoveredBlockID = blockID;

        if (this._hoveredBlockID === prevHoveredBlockID) return false;

        const prevHoveredBlock = this.blocksData[prevHoveredBlockID];
        if (prevHoveredBlock) {
            for (const prevHoveredEdgeEndID of this.blocksData[prevHoveredBlockID].edgeEnds) {
                this._unsetHoveredEdgeEnd(prevHoveredEdgeEndID);
            }
        }

        if (hoveredBlock) {
            for (const edgeEndID of this.blocksData[this._hoveredBlockID].edgeEnds) {
                this._setHoveredEdgeEnd(edgeEndID);
            }
        }

        this.hoverBlockCallback(this.hoveredBlock());
        return true;
    }

    this.hoverEdgeEnd = function(edgeEndID) {
        const hoveredEdgeEnd = this.edgeEndsData[edgeEndID];
        if (edgeEndID !== null && !hoveredEdgeEnd) return false;

        const prevHoveredEdgeEndID = this._hoveredEdgeEndID;
        this._hoveredEdgeEndID = edgeEndID;

        if (this._hoveredEdgeEndID === prevHoveredEdgeEndID) return false;

        const prevHoveredEdgeEnd = this.edgeEndsData[prevHoveredEdgeEndID];
        if (prevHoveredEdgeEnd) {
            this._unsetHoveredEdgeEnd(prevHoveredEdgeEndID);
        }

        if (hoveredEdgeEnd) {
            this._setHoveredEdgeEnd(edgeEndID);
        }

        this.hoverEdgeEndCallback(this.hoveredEdgeEnd());
        return true;
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

    this._printCoords = function(bgraphState) {
        const cur = this._eventsImpl.cur(this._eventState);
        return this._grapherImpl.printCoords(this._grapherState,
            curBgraphPixel('x', bgraphState, cur),
            curBgraphPixel('y', bgraphState, cur),
        );
    }
};

export { BGrapher }
