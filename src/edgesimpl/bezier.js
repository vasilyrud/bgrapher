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

function reverse(direction) {
    switch (direction) {
    case Direction.up:
        return Direction.down;
    case Direction.down:
        return Direction.up;
    case Direction.left:
        return Direction.right;
    case Direction.right:
        return Direction.left;
    }
}

function anchor(direction, 
    curX, curY, 
    intensity,
) {
    switch (direction) {
    case Direction.up:
        return [curX, curY - intensity];
    case Direction.down:
        return [curX, curY + intensity];
    case Direction.left:
        return [curX - intensity, curY];
    case Direction.right:
        return [curX + intensity, curY];
    }
}

function halfwayPoint(direction, 
    curX, curY, 
    newX, newY,
) {
    return [
        curX + (newX - curX)/2,
        curY + (newY - curY)/2,
    ];
}

function aroundPoint(direction, 
    curX, curY, 
    newX, newY,
) {
    const curveDistance = 2.35;

    switch (direction) {
    case Direction.up:
        return [
            (newX < curX) ? curX+curveDistance : newX+curveDistance,
            curY + (newY - curY)/2,
        ];
    case Direction.down:
        return [
            (newX > curX) ? curX-curveDistance : newX-curveDistance,
            curY + (newY - curY)/2,
        ];
    case Direction.left:
        return [
            curX + (newX - curX)/2,
            (newY < curY) ? curY+curveDistance : newY+curveDistance,
        ];
    case Direction.right:
        return [
            curX + (newX - curX)/2,
            (newY > curY) ? curY-curveDistance : newY-curveDistance,
        ];
    }
}

function forwardDiff(direction, 
    curX, curY, 
    newX, newY,
) {
    switch (direction) {
    case Direction.up:
    case Direction.down:
        return Math.abs(newY - curY);
    case Direction.left:
    case Direction.right:
        return Math.abs(newX - curX);
    }
}

function sideDiff(direction, 
    curX, curY, 
    newX, newY,
) {
    switch (direction) {
    case Direction.up:
    case Direction.down:
        return Math.abs(newX - curX);
    case Direction.left:
    case Direction.right:
        return Math.abs(newY - curY);
    }
}

function diffMultiplier(direction, 
    curX, curY, 
    newX, newY, 
    atZero = 0.9, 
    atInf  = 0.5, 
    decreaseRate = 0.5,
) {
    const diff = sideDiff(direction, curX, curY, newX, newY);
    return ((atZero - atInf) / (decreaseRate * diff + 1)) + atInf;
}

function endIsAhead(direction, 
    startX, startY, 
    endX, endY,
) {
    switch (direction) {
    case Direction.up:
        return startY > endY;
    case Direction.down:
        return startY < endY;
    case Direction.left:
        return startX > endX;
    case Direction.right:
        return startX < endX;
    }
}

function endIsCloseSideways(direction, 
    startX, startY, 
    endX, endY, 
    dist=5,
) {
    switch (direction) {
    case Direction.up:
    case Direction.down:
        return Math.abs(endX - startX) < dist;
    case Direction.left:
    case Direction.right:
        return Math.abs(endY - startY) < dist;
    }
}

function Curve(x, y, direction) {
    this.curX = x;
    this.curY = y;
    this.direction = direction;
    this.points = [this.curX, this.curY];

    this.forward = function(newX, newY) {
        let intensity = forwardDiff(this.direction, this.curX, this.curY, newX, newY);
        intensity *= diffMultiplier(this.direction, this.curX, this.curY, newX, newY);

        this.points = this.points.concat(anchor(this.direction, this.curX, this.curY, intensity));
        this.points = this.points.concat(anchor(reverse(this.direction), newX, newY, intensity));
        this.points = this.points.concat([newX, newY]);

        this.curX = newX;
        this.curY = newY;

        return this;
    };

    this.back = function(newX, newY) {
        const diff = sideDiff(this.direction, this.curX, this.curY, newX, newY);
        const small = 1 + diff / 4;
        const big = small + forwardDiff(this.direction, this.curX, this.curY, newX, newY);
        const [curI, newI] = endIsAhead(this.direction, this.curX, this.curY, newX, newY)
            ? [big, small]
            : [small, big];

        this.points = this.points.concat(anchor(this.direction, this.curX, this.curY, curI));
        this.points = this.points.concat(anchor(this.direction, newX, newY, newI));
        this.points = this.points.concat([newX, newY]);

        this.direction = reverse(this.direction);
        this.curX = newX;
        this.curY = newY;

        return this;
    };
}

function start(x, y, direction) {
    return new Curve(x, y, direction);
}

function curveSameDirection(startX, startY, endX, endY, direction) {

    if (!endIsAhead(direction, startX, startY, endX, endY)) {
        if (endIsCloseSideways(direction, startX, startY, endX, endY)) {

            return start(startX, startY, direction)
                .back(...aroundPoint(direction, startX, startY, endX, endY))
                .back(endX, endY)
                .points;

        } else {

            return start(startX, startY, direction)
                .back(...halfwayPoint(direction, startX, startY, endX, endY))
                .back(endX, endY)
                .points;
        }
    }

    return start(startX, startY, direction)
        .forward(endX, endY)
        .points;
}

const startOffset = Object.freeze({
    [Direction.up]    : [0.5, 0],
    [Direction.right] : [1, 0.5],
    [Direction.down]  : [0.5, 1],
    [Direction.left]  : [0, 0.5],
});

const endOffset = Object.freeze({
    [Direction.up]    : [0.5, 1],
    [Direction.right] : [0, 0.5],
    [Direction.down]  : [0.5, 0],
    [Direction.left]  : [1, 0.5],
});

const bezierImpl = {

    generatePoints: function(startEdgeEnd, endEdgeEnd) {
        const [start       , end         ] = ((startEdgeEnd.isSource)
            ? [startEdgeEnd, endEdgeEnd  ] 
            : [endEdgeEnd  , startEdgeEnd]);

        const startX = start.x + startOffset[start.direction][0];
        const startY = start.y + startOffset[start.direction][1];
        const endX = end.x + endOffset[end.direction][0];
        const endY = end.y + endOffset[end.direction][1];

        if (start.direction === end.direction) {
            return curveSameDirection(startX, startY, endX, endY, start.direction);
        }

        throw new Error(`Unsupported edge directions: from ${start.direction} to ${end.direction}.`);
    },
};

export { bezierImpl }
