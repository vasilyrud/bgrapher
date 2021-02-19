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

function onMouseWheel(bgraphContext, bgraph, event) {
    let newZoom = bgraphContext.zoom * (1 - event.deltaY/450);

    // 1 pixel blocks no longer possible to tell apart 
    // when zoomed out.
    if (newZoom < 1) {
        newZoom = 1;
    }

    bgraphContext.zoom = newZoom;
    bgraph.draw(bgraphContext);
}

export { onMouseWheel }
