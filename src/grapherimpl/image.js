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

function ImageState(
    imageWidth, imageHeight, 
    buffer,     blocksLookup, 
) {
    this.canvas = document.createElement('canvas');

    this.imageWidth  = imageWidth;
    this.imageHeight = imageHeight;
    this.buffer = buffer;
    this.blocksLookup = blocksLookup;
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

function colorToRGB(c) {
    return [
        c >> 16 & 255,
        c >>  8 & 255,
        c >>  0 & 255,
    ];
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
            [
                img.data[p+0], 
                img.data[p+1], 
                img.data[p+2]
            ] = colorToRGB(color);
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

    if (imageWidth * imageHeight == 0) {
        return new ImageState(
            imageWidth, imageHeight,
        );
    }

    let imagedata = bufferContext.createImageData(imageWidth, imageHeight);
    let lookup = new xyArray(imageWidth, imageHeight);

    cbPixels(imagedata, lookup);
    bufferContext.putImageData(imagedata, 0, 0);

    return new ImageState(
        imageWidth, imageHeight,
        buffer,     lookup, 
    );
}

function toCanvas(coord, bgraphState, value) {
    return ((value + bgraphState.offset[coord]) * bgraphState.zoom);
}

function drawBezierSingleCurve(bgraphState, context, points, lineWidth, lineColor) {
    for (let i = 0; i < points.length-1; i+=6) {
        context.beginPath();
        context.moveTo(
            toCanvas('x', bgraphState, points[i+0]), toCanvas('y', bgraphState, points[i+1])
        );
        context.bezierCurveTo(
            toCanvas('x', bgraphState, points[i+2]), toCanvas('y', bgraphState, points[i+3]), 
            toCanvas('x', bgraphState, points[i+4]), toCanvas('y', bgraphState, points[i+5]), 
            toCanvas('x', bgraphState, points[i+6]), toCanvas('y', bgraphState, points[i+7])
        );
        context.lineWidth = lineWidth;
        context.strokeStyle = lineColor;
        context.stroke();
    }
}

function drawBezierLine(bgraphState, context, points) {
    const zoom = bgraphState.zoom;
    let fgWidth;
    let bgWidth;

    if (zoom <= 1) {
        fgWidth = 1;
    } else {
        fgWidth = ((zoom - 1) / 5) + 1;
    }

    if (zoom <= 1) {
        bgWidth = 0;
    } else if (zoom <= 7.667) {
        bgWidth = ((zoom - 1) / 1) + 1;
    } else {
        bgWidth = ((zoom - 1) / 2.5) + 5;
    }

    drawBezierSingleCurve(bgraphState, context, points, bgWidth, '#ffffff');
    drawBezierSingleCurve(bgraphState, context, points, fgWidth, '#000000');
}

let ImageImpl = (function () {
    return {
        initBgraph: function(inputData) {
            return generateImage(
                inputData.width, inputData.height, 
                generatePixels(inputData)
            );
        },

        initTestBgraphLarge: function(numCols, numRows) {
            let width  = numCols * 2;
            let height = numRows * 2;
            let numBlocks = numCols * numRows;
            if (process.env.NODE_ENV !== 'test') {
                console.log('Making ' + numBlocks + ' test blocks.');
            }

            return generateImage(
                width, height, 
                generateTestPixels(numBlocks)
            );
        },

        populateElement: function(imageState, bgraphElement) {
            bgraphElement.appendChild(imageState.canvas);
        },

        drawBgraph: function(bgraphState, imageState) {
            let canvas = imageState.canvas;            
            let context = canvas.getContext(CANVAS_TYPE);
            resetBG(context, canvas.width, canvas.height);
            
            if (bgraphState.zoom > 2.5) {
                pixelateImage(context);
            }

            if (imageState.imageWidth * imageState.imageHeight == 0) {
                return;
            }

            context.drawImage(imageState.buffer,
                bgraphState.zoom * bgraphState.offset.x,
                bgraphState.zoom * bgraphState.offset.y,
                bgraphState.zoom * imageState.imageWidth ,
                bgraphState.zoom * imageState.imageHeight,
            );
        },

        drawBezierEdge: function(bgraphState, imageState, points) {
            let context = imageState.canvas.getContext(CANVAS_TYPE);
            drawBezierLine(bgraphState, context, points);
        },

        getCurBlock: function(imageState, x, y) {
            if (y < 0 || y >= imageState.imageHeight) return null;
            if (x < 0 || x >= imageState.imageWidth ) return null;

            let blockID = imageState.blocksLookup.get(x,y);
            if (blockID === -1) return null;

            return blockID;
        },

        printCoords: function(imageState, x, y) {
            let context = imageState.canvas.getContext(CANVAS_TYPE);

            context.fillStyle = '#ffffff';
            context.fillRect(5, 5, 50, 20);

            context.fillStyle = '#000000';
            context.font = '16px';
            context.fillText(
                `${x} ${y}`, 
                10, 20
            );
        },

        getBgraphWidth: function(imageState) {
            return imageState.imageWidth;
        },

        getBgraphHeight: function(imageState) {
            return imageState.imageHeight;
        },

        getClientWidth: function(imageState) {
            return imageState.canvas.width;
        },

        getClientHeight: function(imageState) {
            return imageState.canvas.height;
        },

        setClientSize: function(imageState, newWidth, newHeight) {
            imageState.canvas.width  = newWidth;
            imageState.canvas.height = newHeight;
        },
    };
})();

export { ImageImpl }
