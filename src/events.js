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
const ZOOM_FRICTION = 550; // Higher number means lower speed
const MARGIN_PIXELS = 100;
const BGRAPH_DEBUG = true;

function getLocal(coord, event) {
    return ((coord === 'x')
        ? event.clientX - event.target.getBoundingClientRect().left
        : event.clientY - event.target.getBoundingClientRect().top
    );
}

function getZoom(bgraphState, event) {
    let newZoom = bgraphState.zoom * (1 - event.deltaY / ZOOM_FRICTION);

    // 1 pixel blocks no longer possible to tell apart 
    // when zoomed out.
    if (newZoom < ZOOM_MIN) {
        newZoom = ZOOM_MIN;
    } else
    if (newZoom > ZOOM_MAX) {
        newZoom = ZOOM_MAX;
    }

    let deltaUsed = ZOOM_FRICTION * (1 - newZoom / bgraphState.zoom);

    return [newZoom, deltaUsed];
}

function coordValues(coord, bgrapher) {
    return ((coord === 'x')
        ? [bgrapher.bgraphWidth() , bgrapher.clientWidth() ]
        : [bgrapher.bgraphHeight(), bgrapher.clientHeight()]
    );
}

function getMargin(bgraphState, bgraphSize, clientSize) {
    return Math.max(
        MARGIN_PIXELS / bgraphState.zoom,
        (clientSize - (bgraphSize * bgraphState.zoom)) / (2 * bgraphState.zoom)
    );
}

function constrainOffset(offset, bgraphState, bgraphSize, clientSize) {
    let margin = getMargin(bgraphState, bgraphSize, clientSize)
    let innerLimit = margin;
    let outerLimit = (clientSize / bgraphState.zoom - bgraphSize) - margin;

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

function getInitOffset(coord, bgraphState, bgrapher) {
    const [bgraphSize, clientSize] = coordValues(coord, bgrapher);

    let newOffset = bgraphState.offset[coord];

    return constrainOffset(newOffset, bgraphState, bgraphSize, clientSize);
}

function getPanOffset(coord, bgraphState, bgrapher) {
    const [bgraphSize, clientSize] = coordValues(coord, bgrapher);

    let newOffset = bgraphState.offset[coord] + 
        (bgraphState.cur[coord] - bgraphState.panningPrev[coord]) / bgraphState.zoom;

    return constrainOffset(newOffset, bgraphState, bgraphSize, clientSize);
}

function getZoomOffset(coord, bgraphState, bgrapher, deltaUsed) {
    const [bgraphSize, clientSize] = coordValues(coord, bgrapher);

    let newOffset = bgraphState.offset[coord] + 
        ((bgraphState.cur[coord] * deltaUsed) / (bgraphState.zoom * ZOOM_FRICTION));

    return constrainOffset(newOffset, bgraphState, bgraphSize, clientSize);
}

function mousemovePan(bgraphState, bgrapher, bgraphElement, event) {
    bgraphState.offset.x = getPanOffset('x', bgraphState, bgrapher);
    bgraphState.offset.y = getPanOffset('y', bgraphState, bgrapher);

    bgraphState.update();

    bgraphState.panningPrev.x = getLocal('x', event);
    bgraphState.panningPrev.y = getLocal('y', event);
}

function mousemoveHover(bgraphState, bgrapher, event) {
    let [hoveredBlockID, hoveredBlockData] = bgrapher.curBlock(bgraphState);
    if (hoveredBlockID === null) {
        return;
    }

    if (hoveredBlockData) {
        bgrapher.drawEdges(bgraphState, hoveredBlockID);
    }

    if (hoveredBlockData && hoveredBlockData.text) {
        // console.log('ID: ' + hoveredBlockID + ', text: ' + hoveredBlockData.text);
        return;
    }
    
    // console.log(hoveredBlockID);
}

let BgraphEvents = (function () {
    return {
        bgraphFirstDraw: function(bgraphState, bgrapher, bgraphElement, event) {
            bgraphState.offset.x = getInitOffset('x', bgraphState, bgrapher);
            bgraphState.offset.y = getInitOffset('y', bgraphState, bgrapher);
        },
        wheel: function(bgraphState, bgrapher, bgraphElement, event) {
            bgraphState.cur.x = getLocal('x', event);
            bgraphState.cur.y = getLocal('y', event);

            // Offset depends on new zoom value 
            // and on how much of the "scroll" was used for zoom.
            const [newZoom, deltaUsed] = getZoom(bgraphState, event);
            bgraphState.zoom = newZoom;

            bgraphState.offset.x = getZoomOffset('x', bgraphState, bgrapher, deltaUsed);
            bgraphState.offset.y = getZoomOffset('y', bgraphState, bgrapher, deltaUsed);

            bgraphState.update();

            if (BGRAPH_DEBUG) { bgrapher.printCoords(bgraphState); }
        },
        mousedown: function(bgraphState, bgrapher, bgraphElement, event) {
            // Ignore non-left clicks
            if (event.button !== 0) return;

            bgraphState.panning = true;
            bgraphState.panningPrev.x = getLocal('x', event);
            bgraphState.panningPrev.y = getLocal('y', event);
        },
        mouseup: function(bgraphState, bgrapher, bgraphElement, event) {
            bgraphState.panning = false;
        },
        mouseout: function(bgraphState, bgrapher, bgraphElement, event) {
            bgraphState.panning = false;
        },
        mousemove: function(bgraphState, bgrapher, bgraphElement, event) {
            bgraphState.cur.x = getLocal('x', event);
            bgraphState.cur.y = getLocal('y', event);

            if (bgraphState.panning) {
                mousemovePan(bgraphState, bgrapher, bgraphElement, event);
            } else {
                mousemoveHover(bgraphState, bgrapher, event);
            }

            if (BGRAPH_DEBUG) { bgrapher.printCoords(bgraphState); }
        },
        resize: function(bgraphState, bgrapher, bgraphElement, event) {
            bgraphState.offset.x = getInitOffset('x', bgraphState, bgrapher);
            bgraphState.offset.y = getInitOffset('y', bgraphState, bgrapher);

            bgraphState.update();
        },
    };
})();

function initBgraphEvents(bgraphState, bgrapher, bgraphElement) {

    for (let eventType in BgraphEvents) {
        let target = bgraphElement;
        if (eventType === 'resize') { target = window; }

        target.addEventListener(eventType, 
            BgraphEvents[eventType].bind(null, bgraphState, bgrapher, bgraphElement)
        );
    }
}

export { initBgraphEvents }
