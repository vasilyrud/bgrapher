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

import { Direction } from '../common/lookup.js'

function pointsMove(points, x, y) {
    let newPoints = [];
    for (let i = 0; i < points.length; i+=2) {
        newPoints.push(points[i]   + x);
        newPoints.push(points[i+1] + y);
    }
    return newPoints;
}

function pointsFlipXY(points) {
    /*
        Changes x and y around, which 
        causes flip along y=x line.
    */
    let newPoints = [];
    for (let i = 0; i < points.length; i+=2) {
        newPoints.push(points[i+1]);
        newPoints.push(points[i]);
    }
    return newPoints;
}

function pointsFlipY(points) {
    /*
        Negates y, which causes
        flip along y=0 line.
    */
    let newPoints = [];
    for (let i = 0; i < points.length; i+=2) {
        newPoints.push(points[i]);
        newPoints.push(-points[i+1]);
    }
    return newPoints;
}

function makeForwardCurve(x, y) {
    /*
        Assumes y is positive.
        x can be both positive or negative.
    */

    // Decreases curve intensity:
    // By   0 at small x
    // By y/2 at large x
    const diff = (Math.abs(x) * (y/2)) / (Math.abs(x) + 1);

    return [
        0, 0, 0, y-diff, x, 0+diff, 
        x, y
    ];
}

function makeUTurnCurve(x, y, intensity) {
    /*
        Assumes intensity is positive.
        x can be both positive or negative.
    */
    const base = Math.max(0, y);
    return [
        0, 0, 0, base+intensity, x, base+intensity,
        x, y
    ];
}

function concatCurves(...curves) {
    let result = [];

    for (let i = 0; i < curves.length - 1; i++) {
        const curve = curves[i];
        if (curve[curve.length - 2] !== curves[i+1][0] ||
            curve[curve.length - 1] !== curves[i+1][1]
        ) throw new Error('Curve doesn\'t connect');

        curve.pop();
        curve.pop();
        result = result.concat(curve);
    }
    result = result.concat(curves[curves.length - 1])

    return result;
}

function makeBackCurveDirect(x, y) {
    /*
        Assumes y is negative.
        x can be both positive or negative.
    */

    // Increases curve intensity:
    // By  ~1 at small x
    // By x/8 at large x
    const curveIntensity = 1 + Math.abs(x) / 8;

    return concatCurves(
        makeUTurnCurve(x/2, y/2, curveIntensity), 
        pointsMove(
            pointsFlipY(
                makeUTurnCurve(x/2, -y/2, curveIntensity)
            ), 
            x/2, y/2
        ),
    );
}

function makeBackCurveAround(x, y) {
    /*
        Assumes y is negative.
        x can be both positive or negative.
    */

    // Tuned for visual effect
    const curveDistance = 2.35;
    const small = 2;
    const big   = 2 + Math.abs(x);
    const [startCurveIntensity, endCurveIntensity] = (x < 0) ? [big, small] : [small, big]
    const c = (x < 0) ? x : 0;

    return concatCurves(
        makeUTurnCurve(c-curveDistance, y/2, startCurveIntensity), 
        pointsMove(
            pointsFlipY(
                makeUTurnCurve(curveDistance-c+x, -y/2, endCurveIntensity)
            ), 
            c-curveDistance, y/2
        ),
    );
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

const bezierImpl = {

    generatePoints: function(startEdgeEndIn, endEdgeEndIn) {
        let [startEdgeEnd  , endEdgeEnd    ] = ((startEdgeEndIn.isSource) ? 
            [startEdgeEndIn, endEdgeEndIn  ] : 
            [endEdgeEndIn  , startEdgeEndIn]);

        if (
            startEdgeEnd.direction == Direction.down && 
            endEdgeEnd.direction   == Direction.down
        ) {
            let [startX, startY, endX, endY] = [
                startEdgeEnd.x + 0.5,
                startEdgeEnd.y + 1,
                endEdgeEnd.x   + 0.5, 
                endEdgeEnd.y   + 0,
            ];

            return makeCurve(startX, startY, endX, endY);

        } else if (
            startEdgeEnd.direction == Direction.right && 
            endEdgeEnd.direction   == Direction.right
        ) {
            let [startX, startY, endX, endY] = pointsFlipXY([
                startEdgeEnd.x + 1,
                startEdgeEnd.y + 0.5,
                endEdgeEnd.x   + 0,
                endEdgeEnd.y   + 0.5,
            ]);

            return pointsFlipXY(makeCurve(startX, startY, endX, endY));
        }

        throw new Error(`Unsupported edge directions: from ${startEdgeEnd.direction} to ${endEdgeEnd.direction}.`);
    },
};

export { bezierImpl }
