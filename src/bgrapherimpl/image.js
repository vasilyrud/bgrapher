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

function ImageBgraph(
    imageWidth, imageHeight, 
    buffer,     blocksLookup, 
) {
    this.canvas = document.createElement('canvas');

    this.imageWidth  = imageWidth;
    this.imageHeight = imageHeight;
    this.buffer = buffer;
    this.blocksLookup = blocksLookup;
    
    this.blocksData   = null;
    this.edgeEndsData = null;
}

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
        (x,y)-indexed array of 32-bit (4-byte) numbers.
    */
    this.width  = width;
    this.height = height;
    this.buffer = new ArrayBuffer(4 * this.height * this.width);
    this.data   = new Int32Array(this.buffer).fill(-1);

    this.get = function(x, y) {
        return this.data[y * this.width + x];
    };
    this.set = function(x, y, val) {
        this.data[y * this.width + x] = val;
    };
}

function toCanvas(bgraphState, coord, value) {
    return ((value + bgraphState.offset[coord]) * bgraphState.zoom);
}

function curBgraphPixel(bgraphState, coord) {
    return Math.floor(
        (bgraphState.cur[coord] / bgraphState.zoom) - bgraphState.offset[coord]
    );
}

function generateBlockPixels(img, imgWidth, blockData, lookup, depths) {
    let id = blockData.id;
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

function generateEdgeEndPixels(img, imgWidth, edgeEndData) {
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
        let numBlocks = inputData.blocks.length;
        let numEdgeEnds = inputData.edgeEnds.length;

        let depths = new xyArray(imgWidth, imgHeight);
        for (let i = 0; i < numBlocks; i++) {
            let block = inputData.blocks[i];
            generateBlockPixels(img, imgWidth, block, lookup, depths);
        }

        for (let i = 0; i < numEdgeEnds; i++) {
            let edgeEnd = inputData.edgeEnds[i];
            generateEdgeEndPixels(img, imgWidth, edgeEnd);
        }
    }
}

function generateTestPixels(numBlocks) {
    return (img, lookup) => {
        let width  = lookup.width;
        let height = lookup.height;
        let id = 0, x = 0, y = 0, i = 0, p = 0;

        while (id < numBlocks) {
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

function generateImage(imageWidth, imageHeight, cbPixels) {
    let buffer = document.createElement('canvas');
    let bufferContext = buffer.getContext(CANVAS_TYPE);

    buffer.width  = imageWidth;
    buffer.height = imageHeight;
    let imagedata = bufferContext.createImageData(imageWidth, imageHeight);
    let lookup = new xyArray(imageWidth, imageHeight);

    cbPixels(imagedata, lookup);
    bufferContext.putImageData(imagedata, 0, 0);

    return new ImageBgraph(
        imageWidth, imageHeight,
        buffer,     lookup, 
    );
}

function drawLine(bgraphState, context, points) {
    let lineWidth = (bgraphState.zoom / 50) + 0.5;

    for (let i = 0; i < points.length-1; i+=6) {
        context.beginPath();
        context.moveTo(
            toCanvas(bgraphState, 'x', points[i+0]), toCanvas(bgraphState, 'y', points[i+1])
        );
        context.bezierCurveTo(
            toCanvas(bgraphState, 'x', points[i+2]), toCanvas(bgraphState, 'y', points[i+3]), 
            toCanvas(bgraphState, 'x', points[i+4]), toCanvas(bgraphState, 'y', points[i+5]), 
            toCanvas(bgraphState, 'x', points[i+6]), toCanvas(bgraphState, 'y', points[i+7])
        );
        context.strokeStyle = '#ff0000';
        context.lineWidth = lineWidth;
        context.stroke();
    }
}

function makeForwardCurve(x, y) {
    return [
        0, 0, 0, y, x, 0, 
        x, y
    ];
}

function makeBackCurveDirect(x, y) {
    let diff = x/2;
    let curveIntensity = 2 + Math.abs(diff)/2;

    return [
        0, 0, 0, curveIntensity, diff, curveIntensity, 
        diff, 0, x-diff, y, diff, 0, 
        x-diff, y, x-diff, y-curveIntensity, x, y-curveIntensity, 
        x, y
    ];
}

function makeBackCurveAround(x, y) {
    let curveDistance = 2;
    let small = 2;
    let big   = 2 + Math.abs(x);
    let [startCurveIntensity, endCurveIntensity] = (x < 0) ? [big, small] : [small, big]
    let c = (x < 0) ? x : 0;

    return [
        0, 0, 0, startCurveIntensity, c-curveDistance, startCurveIntensity, 
        c-curveDistance, 0, c-curveDistance, y, c-curveDistance, 0, 
        c-curveDistance, y, c-curveDistance, y-endCurveIntensity, x, y-endCurveIntensity, 
        x, y
    ]
}

function isX(i) {
    return (i % 2 == 0);
}

function pointsFlipYAxis(points) {
    return points.map((val, i) => {
        return (isX(i) ? -val : val);
    });
}

function pointsMove(points, x, y) {
    return points.map((val, i) => {
        return (isX(i) ? val+x : val+y);
    });
}

function pointsRotateCounterCW(points) {
    let newPoints = [];
    for (let i = 0; i < points.length; i+=2) {
        newPoints.push(points[i+1]);
        newPoints.push(-points[i]);
    }
    return newPoints;
}

function pointsRotateCW(points) {
    let newPoints = [];
    for (let i = 0; i < points.length; i+=2) {
        newPoints.push(-points[i+1]);
        newPoints.push(points[i]);
    }
    return newPoints;
}

function makeCurve(startX, startY, endX, endY) {
    let points;
    let x = endX - startX;
    let y = endY - startY;

    if (startY < endY) {
        points = makeForwardCurve(x, y);
    } else {
        if (Math.abs(endX - startX) < 5) {
            points = makeBackCurveAround(x, y);
        } else {
            points = makeBackCurveDirect(x, y);
        }
    }

    return pointsMove(points, startX, startY);
}

function makeEdge(startEdgeEndIn, endEdgeEndIn) {
    let points;

    let [startEdgeEnd  , endEdgeEnd] = ((startEdgeEndIn.isSource) ? 
        [startEdgeEndIn, endEdgeEndIn] : 
        [endEdgeEndIn  , startEdgeEndIn]);

    if (
        startEdgeEnd.direction == 'down' && 
        endEdgeEnd.direction   == 'down'
    ) {
        let [startX, startY, endX, endY] = [
            startEdgeEnd.x + 0.5, 
            startEdgeEnd.y + 1, 
            endEdgeEnd.x   + 0.5, 
            endEdgeEnd.y   + 0,
        ];

        points = makeCurve(startX, startY, endX, endY);

    } else if (
        startEdgeEnd.direction == 'right' && 
        endEdgeEnd.direction   == 'right'
    ) {
        let [startX, startY, endX, endY] = pointsRotateCounterCW(pointsFlipYAxis([
            startEdgeEnd.x + 1,
            startEdgeEnd.y + 0.5,
            endEdgeEnd.x   + 0,
            endEdgeEnd.y   + 0.5,
        ]));

        points = makeCurve(startX, startY, endX, endY);
        points = pointsFlipYAxis(pointsRotateCW(points));
    } else {
        throw new Error(`Unsupported edge directions: from ${startEdgeEnd.direction} to ${endEdgeEnd.direction}.`);
    }

    return points;
}

function drawEdge(bgraphState, context, startEdgeEndIn, endEdgeEndIn) {

    let points = makeEdge(startEdgeEndIn, endEdgeEndIn);
    drawLine(bgraphState, context, points);
}

let ImageImpl = (function () {
    return {

        initBgraph: function(inputData) {
            let width  = inputData.width;
            let height = inputData.height;
            let numBlocks = inputData.blocks.length;
            let maxEdgeEndID = inputData.edgeEnds.length;

            let bgraph = generateImage(width, height, generatePixels(inputData));
            bgraph.blocksData = {};
            bgraph.edgeEndsData = {};

            for (let i = 0; i < numBlocks; i++) {
                let block = inputData.blocks[i];

                bgraph.blocksData[block.id] = {
                    text:     block.text,
                    edgeEnds: block.edgeEnds,
                };
            }

            for (let i = 0; i < maxEdgeEndID; i++) {
                let edgeEnd = inputData.edgeEnds[i];

                bgraph.edgeEndsData[edgeEnd.id] = {
                    x: edgeEnd.x,
                    y: edgeEnd.y,
                    direction: edgeEnd.direction,
                    isSource:  edgeEnd.isSource,
                    edgeEnds:  edgeEnd.edgeEnds,
                };
            }

            return bgraph;
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

            let i = 0, x = 0, y = 0;
            while (i < numBlocks) {

                testInput.blocks[i] = {
                    id   : i,
                    x    : x, y     : y,
                    width: 1, height: 1,
                    depth: 1, color : 0,
                    text: 'This is block ' + x.toString() + ' ' + y.toString(),
                    edgeEnds: [],
                };

                i += 1;
                x += 2;
                if (x >= width) {
                    x = 0;
                    y += 2;
                }
            }

            return ImageImpl.initBgraph(testInput);
        },

        populateDiv: function(imgBgraph, bgraphDiv) {
            bgraphDiv.appendChild(imgBgraph.canvas);
        },

        drawBgraph: function(bgraphState, imgBgraph) {
            let canvas = imgBgraph.canvas;            
            let context = canvas.getContext(CANVAS_TYPE);
            resetBG(context, canvas.width, canvas.height);
            
            if (bgraphState.zoom > 2.5) {
                pixelateImage(context);
            }

            context.drawImage(imgBgraph.buffer,
                bgraphState.zoom * bgraphState.offset.x,
                bgraphState.zoom * bgraphState.offset.y,
                bgraphState.zoom * imgBgraph.imageWidth ,
                bgraphState.zoom * imgBgraph.imageHeight,
            );
        },

        drawEdges: function(bgraphState, imgBgraph, blockID) {
            let context = imgBgraph.canvas.getContext(CANVAS_TYPE);

            for (const startEdgeEndID of imgBgraph.blocksData[blockID].edgeEnds) {
                let startEdgeEnd = imgBgraph.edgeEndsData[startEdgeEndID];

                for (const endEdgeEndID of startEdgeEnd.edgeEnds) {
                    let endEdgeEnd = imgBgraph.edgeEndsData[endEdgeEndID];

                    drawEdge(bgraphState, context, startEdgeEnd, endEdgeEnd);
                }
            }
        },

        getCurBlock: function(bgraphState, imgBgraph) {
            let x = curBgraphPixel(bgraphState, 'x');
            let y = curBgraphPixel(bgraphState, 'y');

            if (y < 0 || y >= imgBgraph.imageHeight) { return [null, null]; }
            if (x < 0 || x >= imgBgraph.imageWidth)  { return [null, null]; }

            let blockID = imgBgraph.blocksLookup.get(x,y);
            if (blockID === -1) { return [null, null]; }

            let blockData = null;
            if (imgBgraph.blocksData && imgBgraph.blocksData.hasOwnProperty(blockID)) {
                blockData = imgBgraph.blocksData[blockID];
            }

            return [blockID, blockData];
        },

        printCoords: function(bgraphState, imgBgraph) {
            let context = imgBgraph.canvas.getContext(CANVAS_TYPE);

            context.fillStyle = '#ffffff';
            context.fillRect(5, 5, 50, 20);

            context.fillStyle = '#000000';
            context.font = '16px';
            context.fillText(
                `${curBgraphPixel(bgraphState, 'x')} ${curBgraphPixel(bgraphState, 'y')}`, 
                10, 20
            );
        },

        getBgraphWidth: function(imgBgraph) {
            return imgBgraph.imageWidth;
        },

        getBgraphHeight: function(imgBgraph) {
            return imgBgraph.imageHeight;
        },

        getClientWidth: function(imgBgraph) {
            return imgBgraph.canvas.width;
        },

        getClientHeight: function(imgBgraph) {
            return imgBgraph.canvas.height;
        },

        setClientSize: function(imgBgraph, newWidth, newHeight) {
            imgBgraph.canvas.width  = newWidth;
            imgBgraph.canvas.height = newHeight;
        },
    };
})();

export { ImageImpl }
