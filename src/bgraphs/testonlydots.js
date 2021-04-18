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

const ITEM_WIDTH  = 2;
const ITEM_HEIGHT = 2;

function testOnlyDots(numCols, numRows) {
    /*
        Creates a numCols x numRows grid of 1x1 blocks.
        Does not create any edges.
    */
    let width  = numCols * ITEM_WIDTH;
    let height = numRows * ITEM_HEIGHT;
    let numBlocks = numCols * numRows;
    if (process.env.NODE_ENV !== 'test') {
        console.log(`Making ${numBlocks} test blocks.`);
    }

    let testInput = {
        width : width, height  : height,
        blocks:    [], edgeEnds:     [],
    };

    let i = 0, x = 0, y = 0;
    while (i < numBlocks) {

        testInput.blocks[i] = {
            id   : i,
            x    : x, y     : y,
            width: 1, height: 1,
            depth: 1, color : 0,
            text: `This is block ${x} ${y}`,
            edgeEnds: [],
        };

        i += 1;
        x += ITEM_WIDTH;
        if (x >= width) {
            x = 0;
            y += ITEM_HEIGHT;
        }
    }

    return testInput;
}

export default testOnlyDots;
