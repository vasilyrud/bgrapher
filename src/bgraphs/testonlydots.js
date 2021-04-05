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

function testOnlyDots(numCols, numRows) {
    let width  = numCols * 2;
    let height = numRows * 2;
    let numBlocks = numCols * numRows;
    if (process.env.NODE_ENV !== 'test') {
        console.log('Making ' + numBlocks + ' test blocks.');
    }

    let testInput = {
        width : width, height  : height,
        blocks:    [], edgeEnds:     [],
    }

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
        x += 2;
        if (x >= width) {
            x = 0;
            y += 2;
        }
    }

    return testInput;
}

export default testOnlyDots;
