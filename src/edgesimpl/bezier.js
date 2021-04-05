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

function pointsMove(points, x, y) {
    let newPoints = [];
    for (let i = 0; i < points.length; i+=2) {
        newPoints.push(points[i]   + x);
        newPoints.push(points[i+1] + y);
    }
    return newPoints;
}

function pointsFlipXY(points) {
    let newPoints = [];
    for (let i = 0; i < points.length; i+=2) {
        newPoints.push(points[i+1]);
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

let BezierImpl = (function () {
    return {
        generatePoints: function(startEdgeEndIn, endEdgeEndIn) {
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
                let [startX, startY, endX, endY] = pointsFlipXY([
                    startEdgeEnd.x + 1,
                    startEdgeEnd.y + 0.5,
                    endEdgeEnd.x   + 0,
                    endEdgeEnd.y   + 0.5,
                ]);

                points = makeCurve(startX, startY, endX, endY);
                points = pointsFlipXY(points);
            } else {
                throw new Error(`Unsupported edge directions: from ${startEdgeEnd.direction} to ${endEdgeEnd.direction}.`);
            }

            return points;
        },
    };
})();

export { BezierImpl }
