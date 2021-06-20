/*
Copyright 2021 Vasily Rudchenko - bgrapher

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

import {
    curBgraphPixel, 
    Direction, 
    BlocksLookup, 
    EdgeEndsLookup,
} from './common/lookup.js'
import { EdgeSet } from './common/struct.js'
import { imageImpl } from './grapherimpl/image.js'
import { bezierImpl } from './edgesimpl/bezier.js'
import { bgraphEventsImpl } from './eventsimpl/bgraphevents.js'
import { BgraphState } from './bgraphstate.js'

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

var Bgrapher = function(
    bgraph  = null,
    element = null,
    bgraphState = null,
) {
    this._grapherImpl = imageImpl;
    this._edgesImpl   = bezierImpl;
    this._eventsImpl  = bgraphEventsImpl;

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
        const inputData = (typeof bgraph === 'string' || bgraph instanceof String)
            ? JSON.parse(bgraph)
            : bgraph;

        this._grapherState = this._grapherImpl.initBgraph(inputData);

        this.width  = inputData.width;
        this.height = inputData.height;
        this.bgColor = inputData.bgColor;
        this.highlightBgColor = inputData.highlightBgColor;
        this.highlightFgColor = inputData.highlightFgColor;
        this.blocksData   = _initBlocksData(inputData);
        this.edgeEndsData = _initEdgeEndsData(inputData);

        this._blocksLookup   = new BlocksLookup(inputData);
        this._edgeEndsLookup = new EdgeEndsLookup(inputData);

        this._hoveredBlockID = null;
        this._hoveredEdgeEndID = null;

        this._toggledBlockIDs = new Set();
        this._hoveredEdgeEndIDs = new Set();
        this._toggledEdgeEndIDs = new Set();
        this._hoveredEdgeIDs = new EdgeSet();
        this._toggledEdgeIDs = new EdgeSet();
    }

    this.populateElement = function(bgraphElement, bgraphState = null) {
        this._bgraphElement = bgraphElement;
        let useBgraphState = bgraphState === null
            ? new BgraphState()
            : bgraphState;

        this._grapherImpl.populateElement(this._grapherState, this._bgraphElement);
        this.updateClientSize();
        this._eventState = this._eventsImpl.initEvents(useBgraphState, this, this._bgraphElement);

        useBgraphState.attach(this);
        this.bgraphState = useBgraphState;
        this.draw();
    }

    this.clientWidth = function() {
        return this._grapherImpl.getClientWidth(this._grapherState); }
    this.clientHeight = function() {
        return this._grapherImpl.getClientHeight(this._grapherState); }

    this.updateClientSize = function() {
        this._grapherImpl.setClientSize(this._grapherState, 
            this._bgraphElement.clientWidth, 
            this._bgraphElement.clientHeight
        );
    }

    this.draw = function() {
        this._grapherImpl.drawBgraph(this.bgraphState, 
            this._grapherState, this.width, this.height, this.bgColor);

        this._drawBlocks();
        this._drawEdgeEnds();
        this._drawEdges();

        if (process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'test'
        ) {
            this._drawHoverInfo();
            this._printCoords();
        }
    }

    this._drawBlocks = function() {
        for (const block of this.activeBlocks())
            this._grapherImpl.drawBlock(this.bgraphState, this._grapherState,
                block, this.highlightBgColor, this.highlightFgColor);
    }

    this._drawEdgeEnds = function() {
        for (const edgeEnd of this.activeEdgeEnds())
            this._grapherImpl.drawEdgeEnd(this.bgraphState, this._grapherState,
                edgeEnd, this.highlightBgColor, this.highlightFgColor);
    }

    this._drawEdges = function() {
        for (const [start, end] of this.activeEdges())
            this._grapherImpl.drawBezierEdge(this.bgraphState, this._grapherState,
                this._edgesImpl.generatePoints(start, end),
                this.highlightBgColor, this.highlightFgColor);
    }

    this._drawHoverInfo = function() {
        const hoveredBlock   = this.hoveredBlock();
        const hoveredEdgeEnd = this.hoveredEdgeEnd();

        if (hoveredBlock) this._grapherImpl.drawHoverInfo(
            this._grapherState, hoveredBlock, 'B');
        if (hoveredEdgeEnd) this._grapherImpl.drawHoverInfo(
            this._grapherState, hoveredEdgeEnd, 'E');
    }

    this._printCoords = function() {
        const cur = this._eventsImpl.cur(this._eventState);
        if (cur.x === null || cur.y === null) return;

        return this._grapherImpl.printCoords(this._grapherState,
            curBgraphPixel('x', this.bgraphState, cur),
            curBgraphPixel('y', this.bgraphState, cur),
        );
    }

    this.activeBlocks = function*() {
        let seenBlocks = new Set();

        for (const activeBlockID of this._toggledBlockIDs) {
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

        for (const activeEdgeEndID of this._toggledEdgeEndIDs) {
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

        for (const [startID, endID] of this._toggledEdgeIDs) {
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

    this._setActiveBlock = function(blockID) {
        if (blockID === null) return;
        this._toggledBlockIDs.add(blockID);

        for (const edgeEndID of this.blocksData[blockID].edgeEnds) {
            this._setActiveEdgeEnd(edgeEndID);
        }
    }

    this._unsetActiveBlock = function(blockID) {
        if (blockID === null) return;
        this._toggledBlockIDs.delete(blockID);

        for (const edgeEndID of this.blocksData[blockID].edgeEnds) {
            this._unsetActiveEdgeEnd(edgeEndID);
        }
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
            !this._toggledEdgeEndIDs.has(id)
        ) return true;

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            if (!this._toggledEdgeIDs.has(startID, endID))
                return true;
        }
        return false;
    }

    this._setHoveredEdgeEnd = function(id) {
        if (id === null) return;

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            this._hoveredEdgeIDs.add(startID, endID);
        }

        this._hoveredEdgeEndIDs.add(id);
        for (const edgeEndID of this.edgeEndsData[id].edgeEnds) {
            this._hoveredEdgeEndIDs.add(edgeEndID);
        }
    }

    this._unsetHoveredEdgeEnd = function(id) {
        if (id === null) return;

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            this._hoveredEdgeIDs.delete(startID, endID);
        }

        this._hoveredEdgeEndIDs.delete(id);
        for (const edgeEndID of this.edgeEndsData[id].edgeEnds) {
            this._hoveredEdgeEndIDs.delete(edgeEndID);
        }
    }

    this._setActiveEdgeEnd = function(id) {
        if (id === null) return;

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            this._toggledEdgeIDs.add(startID, endID);
        }

        this._toggledEdgeEndIDs.add(id);
        for (const edgeEndID of this.edgeEndsData[id].edgeEnds) {
            this._toggledEdgeEndIDs.add(edgeEndID);
        }
    }

    this._doUnsetEdgeEnd = function(id) {
        for (const edgeEndID of this.edgeEndsData[id].edgeEnds) {
            if (this._toggledEdgeIDs.has(...this._orderedEdgeIDs(id, edgeEndID)))
                return false;
        }
        return true;
    }

    this._unsetActiveEdgeEnd = function(id) {
        if (id === null) return;

        for (const [startID, endID] of this._edgeEndEdges(id)) {
            this._toggledEdgeIDs.delete(startID, endID);
        }

        this._toggledEdgeEndIDs.delete(id);
        for (const edgeEndID of this.edgeEndsData[id].edgeEnds) {
            if (this._doUnsetEdgeEnd(edgeEndID))
                this._toggledEdgeEndIDs.delete(edgeEndID);
        }
    }

    this.toggleBlock = function(blockID) {
        if (blockID === null || 
            !(blockID in this.blocksData)
        ) return false;

        if (this._toggledBlockIDs.has(blockID)) {
            this._unsetActiveBlock(blockID);
        } else {
            this._setActiveBlock(blockID);
        }

        this.toggleBlockCallback(this.blocksData[blockID]);
        return true;
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

    this.curBlock = function(cur) {
        const x = curBgraphPixel('x', this.bgraphState, cur);
        const y = curBgraphPixel('y', this.bgraphState, cur);

        if (!this._blocksLookup) return null;
        return this.blocksData[this._blocksLookup.get(x,y)];
    }

    this.curEdgeEnd = function(cur) {
        const x = curBgraphPixel('x', this.bgraphState, cur);
        const y = curBgraphPixel('y', this.bgraphState, cur);

        if (!this._edgeEndsLookup) return null;
        return this.edgeEndsData[this._edgeEndsLookup.get(x,y)];
    }

    if (bgraph !== null) {
        this.initBgraph(bgraph); }
    if (element !== null) {
        this.populateElement(element, bgraphState); }
};

export { Bgrapher }
