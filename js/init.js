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

function init(width, height) {
    var tmpCanvas  = document.createElement('canvas');
    var tmpContext = tmpCanvas.getContext('2d');

    var img = tmpContext.createImageData(width, height);
    testBlackPixelArray(img, width, height);

    var htmlImage = imagedataToImage(img);
    tmpCanvas.remove();

    return htmlImage;
}

export { init }
