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

const ZOOM_MIN = 1;
const ZOOM_MAX = 100;
const ZOOM_FRICTION = 550; // Higher number means lower speed
const MARGIN_PIXELS = 100;
const CLICK_DELTA = 1;

function BgraphEventState() {
  this.isClick = false;
  this.clickStart = {
    x: 0,
    y: 0,
  };

  this.withinClickRange = function() {
    return (Math.abs(this.cur.x - this.clickStart.x) <= CLICK_DELTA &&
            Math.abs(this.cur.y - this.clickStart.y) <= CLICK_DELTA);
  };

  this.panning = false;
  this.panningPrev = {
    x: 0,
    y: 0,
  };

  this.hover = false;
  this.cur = {
    x: 0,
    y: 0,
  };
}

function getLocal(coord, event) {
  return coord === 'x'
    ? event.clientX - event.target.getBoundingClientRect().left
    : event.clientY - event.target.getBoundingClientRect().top;
}

function getZoom(bgraphState, event) {
  let newZoom = bgraphState.zoom * (1 - event.deltaY / ZOOM_FRICTION);

  // 1 pixel blocks no longer possible to tell apart 
  // when zoomed out.
  if (newZoom < ZOOM_MIN) {
    newZoom = ZOOM_MIN;

  } else if (newZoom > ZOOM_MAX) {
    newZoom = ZOOM_MAX;
  }

  let deltaUsed = ZOOM_FRICTION * (1 - newZoom / bgraphState.zoom);

  return [newZoom, deltaUsed];
}

function coordValues(coord, bgrapher) {
  return coord === 'x'
    ? [bgrapher.width , bgrapher.clientWidth() ]
    : [bgrapher.height, bgrapher.clientHeight()];
}

function getMargin(bgraphState, bgraphSize, clientSize) {
  return Math.max(
    MARGIN_PIXELS / bgraphState.zoom,
    (clientSize - bgraphSize * bgraphState.zoom) / (2 * bgraphState.zoom)
  );
}

function constrainOffset(offset, bgraphState, bgraphSize, clientSize) {
  let margin = getMargin(bgraphState, bgraphSize, clientSize)
  let innerLimit = margin;
  let outerLimit = clientSize / bgraphState.zoom - bgraphSize - margin;

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

function getPanOffset(coord, bgraphState, eventState, bgrapher) {
  const [bgraphSize, clientSize] = coordValues(coord, bgrapher);

  let newOffset = bgraphState.offset[coord] + 
    (eventState.cur[coord] - eventState.panningPrev[coord]) / bgraphState.zoom;

  return constrainOffset(newOffset, bgraphState, bgraphSize, clientSize);
}

function getZoomOffset(coord, bgraphState, eventState, bgrapher, deltaUsed) {
  const [bgraphSize, clientSize] = coordValues(coord, bgrapher);

  let newOffset = bgraphState.offset[coord] + 
    ((eventState.cur[coord] * deltaUsed) / (bgraphState.zoom * ZOOM_FRICTION));

  return constrainOffset(newOffset, bgraphState, bgraphSize, clientSize);
}

function mousemovePan(bgraphState, eventState, bgrapher, event) {
  bgraphState.offset.x = getPanOffset('x', bgraphState, eventState, bgrapher);
  bgraphState.offset.y = getPanOffset('y', bgraphState, eventState, bgrapher);

  bgraphState.update();

  eventState.panningPrev.x = getLocal('x', event);
  eventState.panningPrev.y = getLocal('y', event);
}

function hoverBgraph(eventState, bgrapher) {
  const hoveredBlock   = bgrapher.curBlock(eventState.cur);
  const hoveredEdgeEnd = bgrapher.curEdgeEnd(eventState.cur);

  if (hoveredEdgeEnd) {
    bgrapher.hoverBlock(null);
    bgrapher.hoverEdgeEnd(hoveredEdgeEnd.id);
  } else if (hoveredBlock) {
    bgrapher.hoverEdgeEnd(null);
    bgrapher.hoverBlock(hoveredBlock.id);
  } else {
    bgrapher.hoverBlock(null);
    bgrapher.hoverEdgeEnd(null);
  }
}

function mousemoveHover(bgraphState, eventState, bgrapher) {
  hoverBgraph(eventState, bgrapher);
  bgraphState.update();
}

function initView(bgraphState, bgrapher) {
  bgraphState.offset.x = getInitOffset('x', bgraphState, bgrapher);
  bgraphState.offset.y = getInitOffset('y', bgraphState, bgrapher);
}

let eventHandlers = {
  wheel: function(bgraphState, eventState, bgrapher, event) {
    eventState.hover = true;

    eventState.cur.x = getLocal('x', event);
    eventState.cur.y = getLocal('y', event);

    // Offset depends on new zoom value 
    // and on how much of the "scroll" was used for zoom.
    const [newZoom, deltaUsed] = getZoom(bgraphState, event);
    bgraphState.zoom = newZoom;

    bgraphState.offset.x = getZoomOffset('x', bgraphState, eventState, bgrapher, deltaUsed);
    bgraphState.offset.y = getZoomOffset('y', bgraphState, eventState, bgrapher, deltaUsed);

    hoverBgraph(eventState, bgrapher);
    bgraphState.update();
  },
  mousedown: function(bgraphState, eventState, bgrapher, event) {
    // Ignore non-left clicks
    if (event.button !== 0) return;

    eventState.isClick = true;
    eventState.clickStart.x = getLocal('x', event);
    eventState.clickStart.y = getLocal('y', event);

    eventState.panning = true;
    eventState.panningPrev.x = getLocal('x', event);
    eventState.panningPrev.y = getLocal('y', event);
  },
  mouseup: function(bgraphState, eventState, bgrapher, event) {
    eventState.panning = false;
    const hoveredBlock   = bgrapher.hoveredBlock();
    const hoveredEdgeEnd = bgrapher.hoveredEdgeEnd();

    if (event.button === 0 && eventState.isClick) {
      eventState.isClick = false;
      if (hoveredBlock  ) bgrapher.toggleBlock(hoveredBlock.id);
      if (hoveredEdgeEnd) bgrapher.toggleEdgeEnd(hoveredEdgeEnd.id);

      bgraphState.update();

    // Right click, also depends on "contextmenu" handler
    } else if (event.button === 2) {
      if (hoveredBlock  ) bgrapher.selectBlock(hoveredBlock.id);
      if (hoveredEdgeEnd) bgrapher.selectEdgeEnd(hoveredEdgeEnd.id);
    }
  },
  contextmenu: function(bgraphState, eventState, bgrapher, event) {
    if (bgrapher.hoveredBlock() ||
        bgrapher.hoveredEdgeEnd()
    ) event.preventDefault();
  },
  mouseout: function(bgraphState, eventState, bgrapher, event) {
    eventState.hover   = false;
    eventState.panning = false;
    eventState.isClick = false;

    bgrapher.hoverBlock(null);
    bgrapher.hoverEdgeEnd(null);

    bgraphState.update();
  },
  mousemove: function(bgraphState, eventState, bgrapher, event) {
    eventState.hover = true;

    eventState.cur.x = getLocal('x', event);
    eventState.cur.y = getLocal('y', event);

    if (eventState.panning) {
      mousemovePan(bgraphState, eventState, bgrapher, event);
    } else {
      mousemoveHover(bgraphState, eventState, bgrapher);
    }

    if (eventState.isClick && 
        !eventState.withinClickRange()
    ) eventState.isClick = false;

    if (process.env.NODE_ENV === 'development' || 
        process.env.NODE_ENV === 'test'
    ) bgrapher._printCoords(bgraphState, eventState.cur);
  },
  resize: function(bgraphState, eventState, bgrapher, event) {
    initView(bgraphState, bgrapher);

    bgrapher.updateClientSize();
    bgraphState.update();
  },
};

const bgraphEventsImpl = {
  initEvents: function(bgraphState, bgrapher, bgraphElement) {
    let eventState = new BgraphEventState();

    for (const eventType in eventHandlers) {
      let target = (eventType === 'resize') ? window : bgraphElement;

      target.addEventListener(eventType, 
        eventHandlers[eventType]
          .bind(null, bgraphState, eventState, bgrapher)
      );
    }

    initView(bgraphState, bgrapher);
    return eventState;
  },

  cur: function(eventState) {
    if (!eventState.hover) return { x: null, y: null};
    return eventState.cur;
  },
};

export { bgraphEventsImpl }
