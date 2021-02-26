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

import { Locations } from './locations.js'

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

function imagedataToImage(imagedata) {
    let tmpCanvas  = document.createElement('canvas');
    let tmpContext = tmpCanvas.getContext('2d');

    tmpCanvas.width  = imagedata.width;
    tmpCanvas.height = imagedata.height;
    tmpContext.putImageData(imagedata, 0, 0);

    let image = new Image();
    image.src = tmpCanvas.toDataURL();
    tmpCanvas.remove();

    return image;
}

function testPixelArray(img, width, height, borderWidth=0, pixelSize=2, bgCB=(x,y)=>[0,0,0]) {
    for (let i=0; i < width*height; i++) {
        let x = i%width;
        let y = Math.floor(i/width);
        let p = i*4;

        if (borderWidth !== 0 && (
            x <= borderWidth || x >= (width -borderWidth-1) || 
            y <= borderWidth || y >= (height-borderWidth-1)
        )) {
            img.data[p+0] = 255;
            img.data[p+1] = 0;
            img.data[p+2] = 0;
            img.data[p+3] = 255;
        } else if (
            (Math.floor(x/pixelSize)%2) == 0 || 
            (Math.floor(y/pixelSize)%2) == 0
        ) {
            let bg = bgCB(x,y);
            img.data[p+0] = bg[0];
            img.data[p+1] = bg[1];
            img.data[p+2] = bg[2];
            img.data[p+3] = 255;
        } else {
            img.data[p+0] = 255;
            img.data[p+1] = 255;
            img.data[p+2] = 255;
            img.data[p+3] = 255;
        }
    }
}

function color2RGB(color) {
    let r = color.substring(1,3);
    let g = color.substring(3,5);
    let b = color.substring(5,7);
    return [parseInt(r,16), parseInt(g,16), parseInt(b,16)];
}

function generatePixels(img, locs) {
    let depths = new Array(locs.height).fill(Array(locs.width).fill(0));

    for (const block of Object.values(locs.data.blocks)) {
        for (let y = block.y; y < block.y + block.height; y++) {
            for (let x = block.x; x < block.x + block.width; x++) {
                if (block.depth < depths[y][x]) {
                    continue;
                }

                let p = (y * locs.width + x) * 4;
                let [r, g, b] = color2RGB(block.color);

                img.data[p+0] = r;
                img.data[p+1] = g;
                img.data[p+2] = b;
                img.data[p+3] = 255;

                depths[y][x] = block.depth
            }
        }
    }

    for (const edge_end of Object.values(locs.data.edge_ends)) {
        let p = (edge_end.y * locs.width + edge_end.x) * 4;

        img.data[p+0] = 0;
        img.data[p+1] = 0;
        img.data[p+2] = 0;
        img.data[p+3] = 255;
    }
}

function ImageBgraph(width, height, img, locs=null) {
    this.width  = width;
    this.height = height;
    this.img = img;
    this.locs = locs;
}

let ImageImpl = (function () {
    return {

        initBgraph: function(bgraphStr) {
            let tmpCanvas  = document.createElement('canvas');
            let tmpContext = tmpCanvas.getContext('2d');
 
            let locs = new Locations(bgraphStr);
            let imagedata = tmpContext.createImageData(locs.width, locs.height);
            generatePixels(imagedata, locs);
            
            let htmlImage = imagedataToImage(imagedata);
            tmpCanvas.remove();

            return new ImageBgraph(
                locs.width, locs.height,
                new Promise(function(resolve, reject) {
                    htmlImage.onload = resolve(htmlImage);
                }), locs
            );
        },

        initTestBgraph: function(width, height) {
            let tmpCanvas  = document.createElement('canvas');
            let tmpContext = tmpCanvas.getContext('2d');
 
            let imagedata = tmpContext.createImageData(width, height);
            testPixelArray(imagedata, width, height, 4, 4, (x,y)=>{
                let s = (x+y)*255/(width+height);
                return [(255-s)/2, (s)/1, (255-s)/1];
            });
 
            let htmlImage = imagedataToImage(imagedata);
            tmpCanvas.remove();

            return new ImageBgraph(
                width, height, 
                new Promise(function(resolve, reject) {
                    htmlImage.onload = resolve(htmlImage);
                })
            );
        },

        drawBgraph: function(bgraphContext, imgBgraph) {
            let canvas = bgraphContext.canvas;            
            let context = canvas.getContext(CANVAS_TYPE);
            resetBG(context, canvas.width, canvas.height);

            if (bgraphContext.zoom > 2.5) {
                pixelateImage(context);
            }

            imgBgraph.img.then(function(bgraphContext, imgBgraph, img) {
                context.drawImage(img,
                    bgraphContext.zoom * bgraphContext.offset.x,
                    bgraphContext.zoom * bgraphContext.offset.y,
                    bgraphContext.zoom * imgBgraph.width ,
                    bgraphContext.zoom * imgBgraph.height,
                );
            }.bind(null, bgraphContext, imgBgraph));
        }
    };
})();

export { ImageImpl }
