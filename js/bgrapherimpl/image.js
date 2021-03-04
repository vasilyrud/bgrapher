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

const CANVAS_TYPE = '2d';
const DEFAULT_BG = '#ffffff';

function pixelateImage(context) {
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;
}

function resetBG(context, width, height) {
    context.fillStyle = DEFAULT_BG;
    context.fillRect(0, 0, width, height);
}

function xyArray(width, height) {
    /*
        (x,y)-indexed array of 32-bit (4-byte) by numbers.
    */
    this.width  = width;
    this.height = height;
    this.buffer = new ArrayBuffer(4 * this.height * this.width);
    this.data   = new Uint32Array(this.buffer).fill(0);

    this.get = function(x, y) {
        return this.data[y * this.width + x];
    };
    this.set = function(x, y, val) {
        this.data[y * this.width + x] = val;
    };
}

function generateBlockPixels(img, lookup, inputData, depths, id) {
    let blockData = inputData.blocks[id-1];

    let imgWidth = inputData.width;
    let width  = blockData.width;
    let height = blockData.height;
    let depth = blockData.depth;
    let color = blockData.color;
    let minY = blockData.y;
    let minX = blockData.x;
    let maxY = minY + height;
    let maxX = minX + width;

    for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {

            if (depth < depths.get(x,y)) {
                continue;
            }

            let p = (y * imgWidth + x) * 4;
            img.data[p+0] = color >> 16 & 255;
            img.data[p+1] = color >>  8 & 255;
            img.data[p+2] = color >>  0 & 255;
            img.data[p+3] = 255;

            depths.set(x,y,depth);
            lookup.set(x,y,id);
        }
    }
}

function generateEdgeEndPixels(img, inputData, id) {
    let edgeEndData = inputData.edgeEnds[id-1];

    let imgWidth = inputData.width;
    let y = edgeEndData.y;
    let x = edgeEndData.x;

    let p = (y * imgWidth + x) * 4;
    img.data[p+0] = 0;
    img.data[p+1] = 0;
    img.data[p+2] = 0;
    img.data[p+3] = 255;
}

function generatePixels(inputData) {
    return (img, lookup) => {
        let imgWidth  = inputData.width;
        let imgHeight = inputData.height;
        let maxBlockID   = inputData.blocks.length   + 1;
        let maxEdgeEndID = inputData.edgeEnds.length + 1;

        let depths = new xyArray(imgWidth, imgHeight);
        for (let id = 1; id < maxBlockID; id++) {
            generateBlockPixels(img, lookup, inputData, depths, id);
        }

        for (let id = 1; id < maxEdgeEndID; id++) {
            generateEdgeEndPixels(img, inputData, id);
        }
    }
}

function generateTestPixels(numBlocks) {
    return (img, lookup) => {
        let width  = lookup.width;
        let height = lookup.height;
        let maxID = numBlocks + 1;
        let id = 1, x = 0, y = 0, i = 0, p = 0;

        while (id < maxID) {
            i = y * width + x;
            p = i * 4;

            img.data[p+0] = 0;
            img.data[p+1] = 0;
            img.data[p+2] = 0;
            img.data[p+3] = 255;

            lookup.data[i] = id;

            id += 1;
            x += 2;
            if (x >= width) {
                x = 0;
                y += 2;
            }
        }

        if (x != 0 || y < height) {
            throw 'Image dimensions don\'t match number of rows and columns.';
        }
    }
}

function ImageBgraph(
    width,  height, 
    buffer, blocksLookup, 
) {
    this.width  = width;
    this.height = height;
    this.buffer = buffer;
    this.blocksLookup = blocksLookup;

    this.blockData   = null;
    this.edgeEndData = null;
}

function generateImage(width, height, cbPixels) {
    let buffer = document.createElement('canvas');
    let bufferContext = buffer.getContext(CANVAS_TYPE);

    buffer.width  = width;
    buffer.height = height;
    let imagedata = bufferContext.createImageData(width, height);
    let lookup = new xyArray(width, height);

    cbPixels(imagedata, lookup);
    bufferContext.putImageData(imagedata, 0, 0);

    return new ImageBgraph(
        width,  height,
        buffer, lookup, 
    );
}

let ImageImpl = (function () {
    return {

        initBgraph: function(inputData) {
            let width  = inputData.width;
            let height = inputData.height;
            
            return generateImage(width, height, generatePixels(inputData));
        },

        initTestBgraphLarge: function(numCols, numRows) {
            let width  = numCols * 2;
            let height = numRows * 2;
            let numBlocks = numCols * numRows;
            console.log('Making ' + numBlocks + ' test blocks.');

            return generateImage(width, height, generateTestPixels(numBlocks));
        },

        initTestBgraph: function(numCols, numRows) {
            let width  = numCols * 2;
            let height = numRows * 2;
            let numBlocks = numCols * numRows;
            console.log('Making ' + numBlocks + ' test blocks.');

            let testInput = {
                width : width, height  : height,
                blocks:    [], edgeEnds:     [],
            }
            
            let maxID = numBlocks + 1;
            let id = 1, x = 0, y = 0;
            while (id < maxID) {

                testInput.blocks.push({
                    x    : x, y     : y,
                    width: 1, height: 1,
                    depth: 1, color : 0,
                    text: 'This is block ' + x.toString() + ' ' + y.toString(),
                    edgeEnds: [],
                });

                id += 1;
                x += 2;
                if (x >= width) {
                    x = 0;
                    y += 2;
                }
            }

            return ImageImpl.initBgraph(testInput);
        },

        drawBgraph: function(bgraphContext, imgBgraph) {
            let canvas = bgraphContext.canvas;            
            let context = canvas.getContext(CANVAS_TYPE);
            resetBG(context, canvas.width, canvas.height);

            if (bgraphContext.zoom > 2.5) {
                pixelateImage(context);
            }

            context.drawImage(imgBgraph.buffer,
                bgraphContext.zoom * bgraphContext.offset.x,
                bgraphContext.zoom * bgraphContext.offset.y,
                bgraphContext.zoom * imgBgraph.width ,
                bgraphContext.zoom * imgBgraph.height,
            );
        },

        getCurBlock: function(bgraphContext, imgBgraph) {
            let x = Math.floor(
                (bgraphContext.cur.x / bgraphContext.zoom) - bgraphContext.offset.x);
            let y = Math.floor(
                (bgraphContext.cur.y / bgraphContext.zoom) - bgraphContext.offset.y);

            if (y < 0 || y >= imgBgraph.height) { return [null, null]; }
            if (x < 0 || x >= imgBgraph.width)  { return [null, null]; }

            let blockID = imgBgraph.blocksLookup.get(x,y);
            return [blockID, null];
        },
    };
})();

export { ImageImpl }
