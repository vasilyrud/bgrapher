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
    return direction > 2 ? direction - 2 : direction + 2;
}

function left(direction) {
    return direction > 1 ? direction - 1 : 4;
}

function right(direction) {
    return direction < 4 ? direction + 1 : 1;
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

function halfway(direction, 
    curX, curY, 
    newX, newY,
) {
    return [
        curX + (newX - curX)/2,
        curY + (newY - curY)/2,
    ];
}

function getBackAroundVal(direction,
    curX, curY,
    newX, newY,
    dist,
) {
    switch (direction) {
    case Direction.up:
        return newX < curX ? curX + dist : newX + dist;
    case Direction.down:
        return newX > curX ? curX - dist : newX - dist;
    case Direction.left:
        return newY < curY ? curY + dist : newY + dist;
    case Direction.right:
        return newY > curY ? curY - dist : newY - dist;
    }
}

function aroundBack(direction, 
    curX, curY, 
    newX, newY,
    dist = 2.35,
) {
    const around = getBackAroundVal(direction, 
        curX, curY, newX, newY, dist);

    switch (direction) {
    case Direction.up:
    case Direction.down:
        return [around, curY + (newY - curY)/2];
    case Direction.left:
    case Direction.right:
        return [curX + (newX - curX)/2, around];
    }
}

function getAroundAheadVal(direction,
    curX, curY,
    newX, newY,
    dist,
) {
    switch (direction) {
    case Direction.up:
        return newX < curX ? newX + dist : newX - dist;
    case Direction.down:
        return newX > curX ? newX - dist : newX + dist;
    case Direction.left:
        return newY < curY ? newY + dist : newY - dist;
    case Direction.right:
        return newY > curY ? newY - dist : newY + dist;
    }
}

function aroundAhead(direction, 
    curX, curY, 
    newX, newY,
    dist = 2,
) {
    const around = getAroundAheadVal(direction, 
        curX, curY, newX, newY, dist);

    switch (direction) {
    case Direction.up:
    case Direction.down:
        return [around, newY];
    case Direction.left:
    case Direction.right:
        return [newX, around];
    }
}

function getAroundBehindVal(direction,
    curX, curY,
    newX, newY,
    dist,
) {
    switch (direction) {
    case Direction.up:
        return newX < curX ? curX - dist : curX + dist;
    case Direction.down:
        return newX > curX ? curX + dist : curX - dist;
    case Direction.left:
        return newY < curY ? curY - dist : curY + dist;
    case Direction.right:
        return newY > curY ? curY + dist : curY - dist;
    }
}

function aroundBehind(direction, 
    curX, curY, 
    newX, newY,
    dist = 2,
) {
    const around = getAroundBehindVal(direction, 
        curX, curY, newX, newY, dist);

    switch (direction) {
    case Direction.up:
    case Direction.down:
        return [around, curY];
    case Direction.left:
    case Direction.right:
        return [curX, around];
    }
}

function getAroundVal(direction,
    newX, newY,
    dist,
) {
    switch (direction) {
    case Direction.up:
        return newX - dist;
    case Direction.down:
        return newX + dist;
    case Direction.left:
        return newY + dist;
    case Direction.right:
        return newY - dist;
    }
}

function rightBehindRight(direction, 
    curX, curY, 
    newX, newY,
    dist = 1.5,
) {
    let around = getAroundVal(direction, newX, newY, dist);

    switch (direction) {
    case Direction.up:
        return [around, curY - 2 + (newY-curY)/2];
    case Direction.down:
        return [around, curY + 2 + (newY-curY)/2];
    case Direction.left:
        return [curX - 2 + (newX-curX)/2, around];
    case Direction.right:
        return [curX + 2 + (newX-curX)/2, around];
    }
}

function rightAheadLeft(direction, 
    curX, curY, 
    newX, newY,
    atZero = 0.2,
    atInf  = 2,
) {
    let around = getAroundVal(direction, newX, newY, 
        forwardGradual(direction, curX, curY, newX, newY, atZero, atInf, 0.1));

    switch (direction) {
    case Direction.up:
    case Direction.down:
        return [around, curY + 0.9*(newY-curY)];
    case Direction.left:
    case Direction.right:
        return [curX + 0.9*(newX-curX), around];
    }
}

function rightBehindLeft(direction,
    curX, curY,
    newX, newY,
    minF = 1.5,
    minS = 2,
) {
    switch (direction) {
    case Direction.up:
        return [
            Math.min(curX - minS, curX + (newX-curX)/2),
            Math.min(curY - minF, newY - minF)
        ];
    case Direction.down:
        return [
            Math.max(curX + minS, curX + (newX-curX)/2),
            Math.max(curY + minF, newY + minF)
        ];
    case Direction.left:
        return [
            Math.min(curX - minF, newX - minF), 
            Math.max(curY + minS, curY + (newY-curY)/2)
        ];
    case Direction.right:
        return [
            Math.max(curX + minF, newX + minF), 
            Math.min(curY - minS, curY + (newY-curY)/2)
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

function forwardGradual(direction, 
    curX, curY, 
    newX, newY, 
    atZero = 0.9, 
    atInf  = 0.5, 
    decreaseRate = 0.5,
) {
    const diff = forwardDiff(direction, curX, curY, newX, newY);
    return atInf + 
        (atZero - atInf) / 
        (decreaseRate * diff + 1);
}

function sideGradual(direction, 
    curX, curY, 
    newX, newY, 
    atZero = 0.9, 
    atInf  = 0.5, 
    decreaseRate = 0.5,
) {
    const diff = sideDiff(direction, curX, curY, newX, newY);
    return atInf + 
        (atZero - atInf) / 
        (decreaseRate * diff + 1);
}

function endIsAhead(direction, 
    curX, curY, 
    newX, newY,
    dist = 0,
) {
    switch (direction) {
    case Direction.up:
        return curY - dist > newY;
    case Direction.down:
        return curY + dist < newY;
    case Direction.left:
        return curX - dist > newX;
    case Direction.right:
        return curX + dist < newX;
    }
}

function endIsLeft(direction, 
    curX, curY, 
    newX, newY,
    dist = 0,
) {
    switch (direction) {
    case Direction.up:
        return curX - dist > newX;
    case Direction.down:
        return curX + dist < newX;
    case Direction.left:
        return curY + dist < newY;
    case Direction.right:
        return curY - dist > newY;
    }
}

function endIsCloseSideways(direction, 
    curX, curY, 
    newX, newY, 
    dist = 5,
) {
    switch (direction) {
    case Direction.up:
    case Direction.down:
        return Math.abs(newX - curX) < dist;
    case Direction.left:
    case Direction.right:
        return Math.abs(newY - curY) < dist;
    }
}

function Curve(x, y, direction) {
    this.curX = x;
    this.curY = y;
    this.direction = direction;
    this.points = [this.curX, this.curY];

    this.forward = function(newX, newY) {
        let intensity = forwardDiff(this.direction, this.curX, this.curY, newX, newY);
        intensity *= sideGradual(this.direction, this.curX, this.curY, newX, newY);

        this.points.push(...anchor(this.direction, this.curX, this.curY, intensity));
        this.points.push(...anchor(reverse(this.direction), newX, newY, intensity));
        this.points.push(...[newX, newY]);

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

        this.points.push(...anchor(this.direction, this.curX, this.curY, curI));
        this.points.push(...anchor(this.direction, newX, newY, newI));
        this.points.push(...[newX, newY]);

        this.direction = reverse(this.direction);
        this.curX = newX;
        this.curY = newY;

        return this;
    };

    this.left = function(newX, newY) {
        let curI = forwardDiff(this.direction, this.curX, this.curY, newX, newY);
        curI *= sideGradual(this.direction, this.curX, this.curY, newX, newY, 0.5, 0.9);
        let newI = sideDiff(this.direction, this.curX, this.curY, newX, newY);
        newI *= forwardGradual(this.direction, this.curX, this.curY, newX, newY, 0.5, 0.9);

        this.points.push(...anchor(this.direction, this.curX, this.curY, curI));
        this.points.push(...anchor(right(this.direction), newX, newY, newI));
        this.points.push(...[newX, newY]);

        this.direction = left(this.direction);
        this.curX = newX;
        this.curY = newY;

        return this;
    };

    this.right = function(newX, newY) {
        let curI = forwardDiff(this.direction, this.curX, this.curY, newX, newY);
        curI *= sideGradual(this.direction, this.curX, this.curY, newX, newY, 0.5, 0.9);
        let newI = sideDiff(this.direction, this.curX, this.curY, newX, newY);
        newI *= forwardGradual(this.direction, this.curX, this.curY, newX, newY, 0.5, 0.9);

        this.points.push(...anchor(this.direction, this.curX, this.curY, curI));
        this.points.push(...anchor(left(this.direction), newX, newY, newI));
        this.points.push(...[newX, newY]);

        this.direction = right(this.direction);
        this.curX = newX;
        this.curY = newY;

        return this;
    };
}

function start(x, y, direction) {
    return new Curve(x, y, direction);
}

function curveSameDirection(sX, sY, eX, eY, direction) {
    let curve = start(sX, sY, direction);

    if (endIsAhead(direction, sX, sY, eX, eY)) {
        return curve
            .forward(eX, eY)
            .points;
    }

    if (endIsCloseSideways(direction, sX, sY, eX, eY, 5)) {
        return curve
            .back(...aroundBack(direction, sX, sY, eX, eY, 2.35))
            .back(eX, eY)
            .points;
    } else {
        return curve
            .back(...halfway(direction, sX, sY, eX, eY))
            .back(eX, eY)
            .points;
    }
}

function curveOppositeDirection(sX, sY, eX, eY, direction) {
    const threshold = 2;
    let curve = start(sX, sY, direction);

    if (!endIsCloseSideways(direction, sX, sY, eX, eY, threshold)) {
        return curve
            .back(eX, eY)
            .points;
    }

    if (endIsAhead(direction, sX, sY, eX, eY)) {
        return curve
            .forward(...aroundAhead(direction, sX, sY, eX, eY, threshold))
            .back(eX, eY)
            .points;
    } else {
        return curve
            .back(...aroundBehind(direction, sX, sY, eX, eY, threshold))
            .forward(eX, eY)
            .points;
    }
}

function curveLeftDirection(sX, sY, eX, eY, direction) {
    let curve = start(sX, sY, direction);

    // TODO: curve left
    return curve
        .left(eX, eY)
        .points;
}

function curveRightDirection(sX, sY, eX, eY, direction) {
    let curve = start(sX, sY, direction);

    if (!endIsLeft(direction, sX, sY, eX, eY) &&
        endIsAhead(direction, sX, sY, eX, eY)
    ) {
        return curve
            .right(eX, eY)
            .points;
    }

    if (endIsLeft(direction, sX, sY, eX, eY, -2) &&
        !endIsAhead(direction, sX, sY, eX, eY, 2)
    ) {
        return curve
            .left(...rightBehindLeft(direction, sX, sY, eX, eY))
            .back(eX, eY)
            .points;
    }

    if (endIsAhead(direction, sX, sY, eX, eY, 2)) {
        return curve
            .forward(...rightAheadLeft(direction, sX, sY, eX, eY))
            .right(eX, eY)
            .points;
    } else {
        return curve
            .back(...rightBehindRight(direction, sX, sY, eX, eY))
            .left(eX, eY)
            .points;
    }
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

        if (end.direction === start.direction) {
            return curveSameDirection(
                startX, startY, endX, endY, 
                start.direction);

        } else if (end.direction === reverse(start.direction)) {
            return curveOppositeDirection(
                startX, startY, endX, endY, 
                start.direction);

        } else if (end.direction === left(start.direction)) {
            return curveLeftDirection(
                startX, startY, endX, endY,
                start.direction);

        } else if (end.direction === right(start.direction)) {
            return curveRightDirection(
                startX, startY, endX, endY,
                start.direction);
        }
    },
};

export { bezierImpl }
