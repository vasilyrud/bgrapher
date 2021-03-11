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

const ZOOM_MIN = 1;
const ZOOM_MAX = 100;
const ZOOM_SPEED = 550; // Higher number means lower speed
const MARGIN_PIXELS = 100;
const BGRAPH_DEBUG = true;

function getZoom(bgraphContext, event) {
    let newZoom = bgraphContext.zoom * (1 - event.deltaY / ZOOM_SPEED);

    // 1 pixel blocks no longer possible to tell apart 
    // when zoomed out.
    if (newZoom < ZOOM_MIN) {
        newZoom = ZOOM_MIN;
    } else
    if (newZoom > ZOOM_MAX) {
        newZoom = ZOOM_MAX;
    }

    let deltaUsed = ZOOM_SPEED * (1 - newZoom / bgraphContext.zoom);

    return [newZoom, deltaUsed];
}

function coordValues(coord, bgraphContext, bgraph) {
    if (coord === 'x') {
        return [
            bgraph.width(),
            bgraphContext.canvas.clientWidth,
        ]
    } else if (coord === 'y') {
        return [
            bgraph.height(),
            bgraphContext.canvas.clientHeight,
        ]
    }
}

function getMargin(bgraphContext, bgraphSize, canvasSize) {
    return Math.max(
        MARGIN_PIXELS / bgraphContext.zoom,
        (canvasSize - (bgraphSize * bgraphContext.zoom)) / (2 * bgraphContext.zoom)
    );
}

function constrainOffset(offset, bgraphContext, bgraphSize, canvasSize) {
    let margin = getMargin(bgraphContext, bgraphSize, canvasSize)
    let innerLimit = margin;
    let outerLimit = (canvasSize / bgraphContext.zoom - bgraphSize) - margin;

    // Prevent going past left/top
    if (offset > innerLimit) {
        return innerLimit;

    // Prevent going past right/bottom
    } else if (offset < outerLimit) {
        return outerLimit;
    }

    // Not out of bounds
    return offset;
}

function getInitOffset(coord, bgraphContext, bgraph) {
    const [bgraphSize, canvasSize] = 
        coordValues(coord, bgraphContext, bgraph);

    let newOffset = bgraphContext.offset[coord];

    return constrainOffset(newOffset, bgraphContext, bgraphSize, canvasSize);
}

function getPanOffset(coord, bgraphContext, bgraph) {
    const [bgraphSize, canvasSize] = 
        coordValues(coord, bgraphContext, bgraph);

    let newOffset = bgraphContext.offset[coord] + 
        (bgraphContext.cur[coord] - bgraphContext.panningPrev[coord]) / bgraphContext.zoom;

    return constrainOffset(newOffset, bgraphContext, bgraphSize, canvasSize);
}

function getZoomOffset(coord, bgraphContext, bgraph, deltaUsed) {
    const [bgraphSize, canvasSize] = 
        coordValues(coord, bgraphContext, bgraph);

    let newOffset = bgraphContext.offset[coord] + 
        ((bgraphContext.cur[coord] * deltaUsed) / (bgraphContext.zoom * ZOOM_SPEED));

    return constrainOffset(newOffset, bgraphContext, bgraphSize, canvasSize);
}

function mousemovePan(bgraphContext, bgraph, event) {
    bgraphContext.offset.x = getPanOffset('x', bgraphContext, bgraph);
    bgraphContext.offset.y = getPanOffset('y', bgraphContext, bgraph);
    
    bgraph.draw(bgraphContext);

    bgraphContext.panningPrev.x = event.clientX;
    bgraphContext.panningPrev.y = event.clientY;
}

function mousemoveHover(bgraphContext, bgraph, event) {
    let [hoveredBlockID, hoveredBlockData] = bgraph.curBlock(bgraphContext);
    if (hoveredBlockID === null) {
        return;
    }

    if (hoveredBlockData) {
        bgraph.drawEdges(bgraphContext, hoveredBlockID);
    }

    if (hoveredBlockData && hoveredBlockData.text) {
        // console.log('ID: ' + hoveredBlockID + ', text: ' + hoveredBlockData.text);
        return;
    }
    
    // console.log(hoveredBlockID);
}

let BgraphEvents = (function () {
    return {
        bgraphFirstDraw: function(bgraphContext, bgraph, event) {
            bgraphContext.offset.x = getInitOffset('x', bgraphContext, bgraph);
            bgraphContext.offset.y = getInitOffset('y', bgraphContext, bgraph);
        },
        wheel: function(bgraphContext, bgraph, event) {
            bgraphContext.cur.x = event.clientX;
            bgraphContext.cur.y = event.clientY;

            // Offset depends on new zoom value 
            // and on how much of the "scroll" was used for zoom.
            const [newZoom, deltaUsed] = getZoom(bgraphContext, event);
            bgraphContext.zoom = newZoom;

            bgraphContext.offset.x = getZoomOffset('x', bgraphContext, bgraph, deltaUsed);
            bgraphContext.offset.y = getZoomOffset('y', bgraphContext, bgraph, deltaUsed);

            bgraph.draw(bgraphContext);
            
            if (BGRAPH_DEBUG) { bgraph.printCoords(bgraphContext); }
        },
        mousedown: function(bgraphContext, bgraph, event) {
            // Ignore non-left clicks
            if (event.button !== 0) return;

            bgraphContext.panning = true;
            bgraphContext.panningPrev.x = event.clientX;
            bgraphContext.panningPrev.y = event.clientY;
        },
        mouseup: function(bgraphContext, bgraph, event) {
            bgraphContext.panning = false;
        },
        mouseout: function(bgraphContext, bgraph, event) {
            bgraphContext.panning = false;
        },
        mousemove: function(bgraphContext, bgraph, event) {
            bgraphContext.cur.x = event.clientX;
            bgraphContext.cur.y = event.clientY;

            if (bgraphContext.panning) {
                mousemovePan(bgraphContext, bgraph, event);
            } else {
                mousemoveHover(bgraphContext, bgraph, event);
            }

            if (BGRAPH_DEBUG) { bgraph.printCoords(bgraphContext); }
        },
        resize: function(bgraphContext, bgraph, event) {
            bgraphContext.offset.x = getInitOffset('x', bgraphContext, bgraph);
            bgraphContext.offset.y = getInitOffset('y', bgraphContext, bgraph);

            bgraph.draw(bgraphContext);
        },
    };
})();

function initBgraphEvents(bgraphContext, bgraph) {

    for (let eventType in BgraphEvents) {
        let target = bgraphContext.canvas;
        if (eventType === 'resize') { target = window; }

        target.addEventListener(eventType, 
            BgraphEvents[eventType].bind(null, bgraphContext, bgraph)
        );
    }
}

export { initBgraphEvents }
