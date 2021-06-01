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

const ITEM_WIDTH  = 3;
const ITEM_HEIGHT = 4;
const BLACK = 0;
const WHITE = 16777215;

function testDotsEdges(numCols, numRows) {
    /*
        Creates a numCols x numRows grid of 2x1 blocks.
        Creates 2 edges between each pair of consecutive blocks.
    */
    let width  = numCols * ITEM_WIDTH;
    let height = numRows * ITEM_HEIGHT;
    let numBlocks = numCols * numRows;
    let numEdgeEnds = numBlocks * 4;
    if (process.env.NODE_ENV !== 'test') {
        console.log(`Making ${numBlocks} test blocks and ${numEdgeEnds} edge ends.`);
    }

    let testInput = {
        width : width, height: height,
        bgColor: WHITE, highlightBgColor: WHITE, highlightFgColor: BLACK,
        blocks: [], edgeEnds: [],
    };

    let b = 0, e = 0, x = 0, y = 0;
    let pe0 = numEdgeEnds - 2;
    let pe1 = numEdgeEnds - 1;

    while (b < numBlocks) {
        testInput.blocks[b] = {
            id: b,
            x : x, y: y+1,
            width: 2, height: 1,
            depth: 1, color : 13421772,
            text: `This is block ${x} ${y}`,
            edgeEnds: [
                e+0,
                e+1,
                e+2,
                e+3,
            ],
        };
        b += 1;

        testInput.edgeEnds[e] = {
            id: e,
            x : x, y: y,
            direction: 'down',
            isSource : false,
            edgeEnds : [pe0],
        };
        e += 1;

        testInput.edgeEnds[e] = {
            id: e,
            x : x+1, y: y,
            direction: 'down',
            isSource : false,
            edgeEnds : [pe1],
        };
        e += 1;

        testInput.edgeEnds[e] = {
            id: e,
            x : x, y: y+2,
            direction: 'down',
            isSource : true,
            edgeEnds : [e+2],
        };
        pe0 = e;
        e += 1;

        testInput.edgeEnds[e] = {
            id: e,
            x : x+1, y: y+2,
            direction: 'down',
            isSource : true,
            edgeEnds : [e+2],
        };
        pe1 = e;
        e += 1;

        x += ITEM_WIDTH;
        if (x >= width) {
            x = 0;
            y += ITEM_HEIGHT;
        }
    }

    testInput.edgeEnds[numEdgeEnds - 2].edgeEnds[0] = 0;
    testInput.edgeEnds[numEdgeEnds - 1].edgeEnds[0] = 1;

    return testInput;
}

export default testDotsEdges;
