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

function imagedataToImage(imagedata) {
    var tmpCanvas  = document.createElement('canvas');
    var tmpContext = tmpCanvas.getContext('2d');

    tmpCanvas.width  = imagedata.width;
    tmpCanvas.height = imagedata.height;
    tmpContext.putImageData(imagedata, 0, 0);

    var image = new Image();
    image.src = tmpCanvas.toDataURL();
    tmpCanvas.remove();

    return image;
}

function testBlackPixelArray(img, width, height) {
    for (var i=0, p=0; i < width*height; i++, p+=4) {
        if ((Math.floor(i/2)%2) == 0 && (Math.floor(i/(width*2))%2) == 0) {
            img.data[p+0] = 0;
            img.data[p+1] = 0;
            img.data[p+2] = 0;
            img.data[p+3] = 255;
        } else {
            img.data[p+0] = 255;
            img.data[p+1] = 255;
            img.data[p+2] = 255;
            img.data[p+3] = 255;
        }
    }
}

function ImageBgraph(width, height, img) {
    this.width  = width;
    this.height = height;
    this.img = img;
}

var ImageImpl = (function () {
    return {

        initTestBgraph: function(bgraphContext, width, height) {
            var tmpCanvas  = document.createElement('canvas');
            var tmpContext = tmpCanvas.getContext('2d');
 
            var imagedata = tmpContext.createImageData(width, height);
            testBlackPixelArray(imagedata, width, height);
 
            var htmlImage = imagedataToImage(imagedata);
            tmpCanvas.remove();

            return new Promise(function(resolve, reject) {
                htmlImage.onload = resolve(new ImageBgraph(width, height, htmlImage));
            })
        },

        drawBgraph: function(bgraphContext, bgraph) {
            var canvas = bgraphContext.canvas;

            var context = canvas.getContext(CANVAS_TYPE);
            resetBG(context, canvas.width, canvas.height);
            pixelateImage(context);

            context.drawImage(bgraph.img, 0, 0, bgraph.width, bgraph.height);
        }
    };
})();

export { ImageImpl }
