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

let BgraphEvents = (function () {
    return {
        wheel: function(bgraphContext, bgraph, event) {
            let newZoom = bgraphContext.zoom * (1 - event.deltaY/450);

            // 1 pixel blocks no longer possible to tell apart 
            // when zoomed out.
            if (newZoom < 1) {
                newZoom = 1;
            }
        
            bgraphContext.zoom = newZoom;
            bgraph.draw(bgraphContext);
        },
        mousedown: function(bgraphContext, bgraph, event) {
            // Ignore non-left clicks
            if (event.button !== 0) return;

            bgraphContext.panning = true;
            bgraphContext.panningPrevX = event.pageX;
            bgraphContext.panningPrevY = event.pageY;
        },
        mouseup: function(bgraphContext, bgraph, event) {
            bgraphContext.panning = false;
        },
        mouseout: function(bgraphContext, bgraph, event) {
            bgraphContext.panning = false;
        },
        mousemove: function(bgraphContext, bgraph, event) {
            if (!bgraphContext.panning) return;

            let offsetX = bgraphContext.offsetX + 
                (event.pageX - bgraphContext.panningPrevX) / bgraphContext.zoom;
            let offsetY = bgraphContext.offsetY + 
                (event.pageY - bgraphContext.panningPrevY) / bgraphContext.zoom;

            bgraphContext.offsetX = offsetX;
            bgraphContext.offsetY = offsetY;
            
            bgraph.draw(bgraphContext);

            bgraphContext.panningPrevX = event.pageX;
            bgraphContext.panningPrevY = event.pageY;
        },
    };
})();

function initBgraphEvents(bgraphContext, bgraph) {
    for (let eventType in BgraphEvents) {
        bgraphContext.canvas.addEventListener(eventType, 
            BgraphEvents[eventType].bind(null, bgraphContext, bgraph)
        );
    }
}

export { initBgraphEvents }
