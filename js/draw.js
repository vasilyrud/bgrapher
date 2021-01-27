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

import { canvasType, defaultBG } from './const.js'

function pixelateImage(context) {
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;
}

function resetBG(context, width, height) {
    context.fillStyle = defaultBG;
    context.fillRect(0, 0, width, height);
}

function drawImage(canvas, image, x, y, width, height) {
    canvas.width  = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

    var context = canvas.getContext(canvasType);
    resetBG(context, canvas.width, canvas.height);
    pixelateImage(context);

    context.drawImage(image, x, y, width, height);
}

export { drawImage }
