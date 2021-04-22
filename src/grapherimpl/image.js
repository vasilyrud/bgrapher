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

import { colorToRGB, Direction } from '../common/lookup.js'
import { ArrayXY } from '../common/struct.js'

const CANVAS_TYPE = '2d';
const DEFAULT_BG = '#ffffff';
const LINE_COLOR_FG = '#000000';
const LINE_COLOR_BG = '#ffffff';

function ImageState(imageWidth, imageHeight, buffer) {
    this.canvas = document.createElement('canvas');

    this.imageWidth  = imageWidth;
    this.imageHeight = imageHeight;
    this.buffer = buffer;
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

function generateBlockPixels(img, imgWidth, blockData, depths) {
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
    return (img) => {
        let imgWidth  = inputData.width;
        let imgHeight = inputData.height;
        let numBlocks = inputData.blocks.length;
        let numEdgeEnds = inputData.edgeEnds.length;

        let depths = new ArrayXY(imgWidth, imgHeight);
        for (let i = 0; i < numBlocks; i++) {
            let block = inputData.blocks[i];
            generateBlockPixels(img, imgWidth, block, depths);
        }

        for (let i = 0; i < numEdgeEnds; i++) {
            let edgeEnd = inputData.edgeEnds[i];
            generateEdgeEndPixels(img, imgWidth, edgeEnd);
        }
    }
}

function generateTestPixels(numBlocks) {
    return (img) => {
        let width  = img.width;
        let height = img.height;
        let id = 0, x = 0, y = 0, i = 0, p = 0;

        while (id < numBlocks) {
            i = y * width + x;
            p = i * 4;

            img.data[p+0] = 0;
            img.data[p+1] = 0;
            img.data[p+2] = 0;
            img.data[p+3] = 255;

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
        return new ImageState(imageWidth, imageHeight);
    }

    let imagedata = bufferContext.createImageData(imageWidth, imageHeight);

    cbPixels(imagedata);
    bufferContext.putImageData(imagedata, 0, 0);

    return new ImageState(imageWidth, imageHeight, buffer);
}

function getLineWidths(zoom) {
    const width = 1/46;
    const bgMult = 2.5;
    const threshold = 2.586;
    let fgWidth;
    let bgWidth;

    if (zoom <= 1) {
        fgWidth = zoom;
    } else {
        fgWidth = ((zoom - 1) * width) + 1;
    }

    if (zoom <= 1) {
        bgWidth = 0;
    } else if (zoom <= threshold) {
        bgWidth = zoom;
    } else {
        bgWidth = fgWidth * bgMult;
    }

    return [fgWidth, bgWidth];
}

function toCanvas(coord, bgraphState, value) {
    return ((value + bgraphState.offset[coord]) * bgraphState.zoom);
}

function drawBezierSingleCurve(bgraphState, context, points, lineWidth, lineColor) {
    for (let i = 0; i < points.length-1; i+=6) {
        context.beginPath();
        context.moveTo(
            toCanvas('x', bgraphState, points[i+0]), toCanvas('y', bgraphState, points[i+1]),
        );
        context.bezierCurveTo(
            toCanvas('x', bgraphState, points[i+2]), toCanvas('y', bgraphState, points[i+3]), 
            toCanvas('x', bgraphState, points[i+4]), toCanvas('y', bgraphState, points[i+5]), 
            toCanvas('x', bgraphState, points[i+6]), toCanvas('y', bgraphState, points[i+7]),
        );
        context.lineWidth = lineWidth;
        context.strokeStyle = lineColor;
        context.stroke();
    }
}

function drawBezierLine(bgraphState, context, points) {
    const [fgWidth, bgWidth] = getLineWidths(bgraphState.zoom);

    drawBezierSingleCurve(bgraphState, context, points, bgWidth, LINE_COLOR_BG);
    drawBezierSingleCurve(bgraphState, context, points, fgWidth, LINE_COLOR_FG);
}

function drawSingleLine(bgraphState, context, points, lineWidth, lineColor) {
    context.beginPath();
    context.moveTo(
        toCanvas('x', bgraphState, points[0]), toCanvas('y', bgraphState, points[1])
    );
    context.lineTo(
        toCanvas('x', bgraphState, points[2]), toCanvas('y', bgraphState, points[3])
    );
    context.lineWidth = lineWidth;
    context.strokeStyle = lineColor;
    context.stroke();
}

function getArrowPoints(x, y, direction) {
    const lineDist  = 1/2;

    switch (direction) {
        case Direction.up:
        return [
            [x  , y+1, x+lineDist  , y],
            [x+1, y+1, x+1-lineDist, y],
        ];

        case Direction.right:
        return [
            [x, y  , x+1, y+lineDist  ],
            [x, y+1, x+1, y+1-lineDist],
        ];

        case Direction.down:
        return [
            [x  , y, x+lineDist  , y+1],
            [x+1, y, x+1-lineDist, y+1],
        ];

        case Direction.left:
        return [
            [x+1, y  , x, y+lineDist  ],
            [x+1, y+1, x, y+1-lineDist],
        ];
    }

    throw new Error(`Unsupported edge direction: ${direction}.`);
}

function drawEdgeEndHighlight(bgraphState, context, edgeEnd) {
    const [fgWidth, bgWidth] = getLineWidths(bgraphState.zoom);
    if (bgWidth === 0) return;

    const lineWidth = (bgWidth - fgWidth) / 2;

    for (const points of getArrowPoints(edgeEnd.x, edgeEnd.y, edgeEnd.direction)) {
        drawSingleLine(bgraphState, context, points, lineWidth, LINE_COLOR_BG);
    }
}

function drawInnerStrokeBox(bgraphState, context, [x, y, w, h], lineWidthIn, lineColor) {
    const width  = bgraphState.zoom * w;
    const height = bgraphState.zoom * h;
    const lineWidth = Math.min(lineWidthIn, width/2, height/2);

    context.beginPath();
    context.lineWidth   = lineWidth;
    context.strokeStyle = lineColor;
    context.rect(
        toCanvas('x', bgraphState, x) + lineWidth/2, 
        toCanvas('y', bgraphState, y) + lineWidth/2,
        width  - lineWidth,
        height - lineWidth,
    );
    context.stroke();
}

function drawBlockHighlight(bgraphState, context, block) {
    const [fgWidth, bgWidth] = getLineWidths(bgraphState.zoom);
    if (bgWidth === 0) return;

    const bgLineWidth = bgWidth - fgWidth;
    const fgLineWidth = bgLineWidth / 2;

    const points = [block.x, block.y, block.width, block.height];
    drawInnerStrokeBox(bgraphState, context, points, bgLineWidth, LINE_COLOR_FG);
    drawInnerStrokeBox(bgraphState, context, points, fgLineWidth, LINE_COLOR_BG);
}

function concatText(context, boxW, text) {
    const dots = '...';
    const dotsLen = context.measureText(dots).width;
    const rightPadding = 15;

    if (context.measureText(text).width > boxW - rightPadding) {
        let numChars = 8;
        while (context.measureText(text.slice(0, numChars)).width + dotsLen 
            < boxW - rightPadding) numChars++;

        return text.slice(0, numChars-1) + dots;
    }

    return text;
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

        drawBlock: function(bgraphState, imageState, blockData) {
            let context = imageState.canvas.getContext(CANVAS_TYPE);
            drawBlockHighlight(bgraphState, context, blockData);
        },

        drawEdgeEnd: function(bgraphState, imageState, edgeEndData) {
            let context = imageState.canvas.getContext(CANVAS_TYPE);
            drawEdgeEndHighlight(bgraphState, context, edgeEndData);
        },

        drawBezierEdge: function(bgraphState, imageState, points) {
            let context = imageState.canvas.getContext(CANVAS_TYPE);
            drawBezierLine(bgraphState, context, points);
        },

        drawHoverInfo: function(imageState, blockData) {
            let context = imageState.canvas.getContext(CANVAS_TYPE);
            if (!blockData.text) return;

            const boxW = 200;
            const boxH =  35;
            const posX =   5;
            const posY =   5;

            context.fillStyle = '#ffffff';
            context.fillRect(posX, posY, boxW, boxH);

            context.textAlign = 'left';
            context.fillStyle = '#aaaaaa';
            context.font = '10px sans-serif';
            context.fillText('Right click block to show more info.',  posX+4, posY+10);

            context.textAlign = 'left';
            context.fillStyle = '#000000';
            context.font = '16px sans-serif';
            context.fillText(`${concatText(context, boxW, blockData.text)}`, posX+4, posY+28);
        },

        printCoords: function(imageState, x, y) {
            let context = imageState.canvas.getContext(CANVAS_TYPE);

            const boxW = 120;
            const boxH =  18;
            const posX = imageState.canvas.width - boxW - 5;
            const posY =   5;

            context.fillStyle = '#ffffff';
            context.fillRect(posX, posY, boxW, boxH);

            context.textAlign = 'left';
            context.fillStyle = '#aaaaaa';
            context.font = '10px sans-serif';
            context.fillText(`x`, posX+ 2, posY+8);
            context.fillText(`y`, posX+62, posY+8);

            context.textAlign = 'right';
            context.fillStyle = '#000000';
            context.font = '12px sans-serif';
            context.fillText(`${x}`, posX+ 55, posY+13);
            context.fillText(`${y}`, posX+115, posY+13);
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
