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

function computeWidth(data) {
    let maxX = 0
    for (const block of Object.values(data.blocks)) {
        maxX = Math.max(maxX, block.x + block.width);
    }
    for (const edge_end of Object.values(data.edge_ends)) {
        maxX = Math.max(maxX, edge_end.x + 1);
    }
    return maxX;
}

function computeHeight(data) {
    let maxY = 0;
    for (const block of Object.values(data.blocks)) {
        maxY = Math.max(maxY, block.y + block.height);
    }
    for (const edge_end of Object.values(data.edge_ends)) {
        maxY = Math.max(maxY, edge_end.y + 1);
    }
    return maxY;
}

function Locations(bgraphStr) {
    this.data = JSON.parse(bgraphStr);
    this.width  = computeWidth(this.data);
    this.height = computeHeight(this.data);
}

export { Locations }
