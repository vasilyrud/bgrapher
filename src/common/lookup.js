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

import { ArrayXY } from './struct.js'

function colorToRGB(c) {
    return [
        c >> 16 & 255,
        c >>  8 & 255,
        c >>  0 & 255,
    ];
}

function curBgraphPixel(coord, bgraphState, cur) {
    return Math.floor(
        (cur[coord] / bgraphState.zoom) - bgraphState.offset[coord]
    );
}

const Direction = Object.freeze({
    up:    1,
    right: 2,
    down:  3,
    left:  4,
});

function BlocksLookup(data) {
    this.width  = data.width;
    this.height = data.height;
    this.lookup = new ArrayXY(this.width, this.height);
    this.depths = new ArrayXY(this.width, this.height);
    
    const numBlocks = data.blocks.length;
    for (let i = 0; i < numBlocks; i++) {
        const block = data.blocks[i];
        const depth = block.depth;
        const minY = block.y;
        const minX = block.x;
        const maxY = minY + block.height;
        const maxX = minX + block.width;

        for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
                if (depth < this.depths.get(x,y)) continue;
                this.depths.set(x,y,depth);
                this.lookup.set(x,y,block.id);
            }
        }
    }

    this.get = function(x, y) {
        if (y < 0 || y >= this.lookup.height) return null;
        if (x < 0 || x >= this.lookup.width ) return null;

        const id = this.lookup.get(x, y);
        return (id === -1) ? null : id;
    };
}

export { colorToRGB, curBgraphPixel, Direction, BlocksLookup }
