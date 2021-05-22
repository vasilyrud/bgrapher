import { expect, use } from 'chai';
import chaiAlmost from 'chai-almost';
use(chaiAlmost(0.1));

import { Direction } from 'common/lookup.js';
import bezierRewire, { bezierImpl } from 'edgesimpl/bezier.js';
const curveSameDirection = bezierRewire.__get__('curveSameDirection');
const curveOppositeDirection = bezierRewire.__get__('curveOppositeDirection');
const curveLeftDirection = bezierRewire.__get__('curveLeftDirection');
const curveRightDirection = bezierRewire.__get__('curveRightDirection');
const start = bezierRewire.__get__('start');

describe(require('path').basename(__filename), () => {

describe('Curve helpers', () => {
    [
        ['reverse', 'up'   , [], Direction.down ],
        ['reverse', 'down' , [], Direction.up   ],
        ['reverse', 'left' , [], Direction.right],
        ['reverse', 'right', [], Direction.left ],
        ['left'   , 'up'   , [], Direction.left ],
        ['left'   , 'down' , [], Direction.right],
        ['left'   , 'left' , [], Direction.down ],
        ['left'   , 'right', [], Direction.up   ],
        ['right'  , 'up'   , [], Direction.right],
        ['right'  , 'down' , [], Direction.left ],
        ['right'  , 'left' , [], Direction.up   ],
        ['right'  , 'right', [], Direction.down ],

        ['anchor', 'up'   , [5,6, 2], [5,4]],
        ['anchor', 'down' , [5,6, 2], [5,8]],
        ['anchor', 'left' , [5,6, 2], [3,6]],
        ['anchor', 'right', [5,6, 2], [7,6]],

        ['forwardDiff', 'up'   , [1,2, 5,6], 4],
        ['forwardDiff', 'up'   , [1,6, 5,2], 4],
        ['forwardDiff', 'down' , [1,2, 5,6], 4],
        ['forwardDiff', 'down' , [1,6, 5,2], 4],
        ['forwardDiff', 'left' , [1,2, 5,6], 4],
        ['forwardDiff', 'left' , [5,2, 1,6], 4],
        ['forwardDiff', 'right', [1,2, 5,6], 4],
        ['forwardDiff', 'right', [5,2, 1,6], 4],
        ['forwardDiff', 'up'   , [1,2, 1,2], 0],
        ['forwardDiff', 'left' , [1,2, 1,2], 0],

        ['sideDiff', 'up'   , [1,2, 5,6], 4],
        ['sideDiff', 'up'   , [5,2, 1,6], 4],
        ['sideDiff', 'down' , [1,2, 5,6], 4],
        ['sideDiff', 'down' , [5,2, 1,6], 4],
        ['sideDiff', 'left' , [1,2, 5,6], 4],
        ['sideDiff', 'left' , [1,6, 5,2], 4],
        ['sideDiff', 'right', [1,2, 5,6], 4],
        ['sideDiff', 'right', [1,6, 5,2], 4],
        ['sideDiff', 'up'   , [1,2, 1,2], 0],
        ['sideDiff', 'left' , [1,2, 1,2], 0],

        ['forwardGradual', 'up'   , [1,2, 5,2], 0.9],
        ['forwardGradual', 'up'   , [1,2, 5,6], 0.6],
        ['forwardGradual', 'up'   , [1,2, 5,5000000], 0.5],
        ['forwardGradual', 'down' , [1,2, 5,2], 0.9],
        ['forwardGradual', 'down' , [1,2, 5,6], 0.6],
        ['forwardGradual', 'down' , [1,2, 5,5000000], 0.5],
        ['forwardGradual', 'left' , [1,2, 1,6], 0.9],
        ['forwardGradual', 'left' , [1,2, 5,6], 0.6],
        ['forwardGradual', 'left' , [1,2, 5000000,6], 0.5],
        ['forwardGradual', 'right', [1,2, 1,6], 0.9],
        ['forwardGradual', 'right', [1,2, 5,6], 0.6],
        ['forwardGradual', 'right', [1,2, 5000000,6], 0.5],

        ['sideGradual', 'up'   , [1,2, 1,6], 0.9],
        ['sideGradual', 'up'   , [1,2, 5,6], 0.6],
        ['sideGradual', 'up'   , [1,2, 5000000,6], 0.5],
        ['sideGradual', 'down' , [1,2, 1,6], 0.9],
        ['sideGradual', 'down' , [1,2, 5,6], 0.6],
        ['sideGradual', 'down' , [1,2, 5000000,6], 0.5],
        ['sideGradual', 'left' , [1,2, 5,2], 0.9],
        ['sideGradual', 'left' , [1,2, 5,6], 0.6],
        ['sideGradual', 'left' , [1,2, 5,6000000], 0.5],
        ['sideGradual', 'right', [1,2, 5,2], 0.9],
        ['sideGradual', 'right', [1,2, 5,6], 0.6],
        ['sideGradual', 'right', [1,2, 5,6000000], 0.5],

        ['endIsAhead', 'up'   , [1,2, 5,6], false],
        ['endIsAhead', 'up'   , [1,6, 5,2], true ],
        ['endIsAhead', 'up'   , [1,2, 5,2], false],
        ['endIsAhead', 'up'   , [1,2, 5,2, -8], true],
        ['endIsAhead', 'up'   , [1,6, 5,2, 8], false],
        ['endIsAhead', 'down' , [1,2, 5,6], true ],
        ['endIsAhead', 'down' , [1,6, 5,2], false],
        ['endIsAhead', 'down' , [1,2, 5,2], false],
        ['endIsAhead', 'down' , [1,2, 5,2, -8], true],
        ['endIsAhead', 'down' , [1,2, 5,6, 8], false],
        ['endIsAhead', 'left' , [1,2, 5,6], false],
        ['endIsAhead', 'left' , [5,2, 1,6], true ],
        ['endIsAhead', 'left' , [1,2, 1,6], false],
        ['endIsAhead', 'left' , [1,2, 1,6, -8], true],
        ['endIsAhead', 'left' , [5,2, 1,6, 8], false],
        ['endIsAhead', 'right', [1,2, 5,6], true ],
        ['endIsAhead', 'right', [5,2, 1,6], false],
        ['endIsAhead', 'right', [1,2, 1,6], false],
        ['endIsAhead', 'right', [1,2, 1,6, -8], true],
        ['endIsAhead', 'right', [1,2, 5,6, 8], false],

        ['endIsLeft', 'up'   , [1,2, 5,6], false],
        ['endIsLeft', 'up'   , [5,2, 1,6], true ],
        ['endIsLeft', 'up'   , [1,2, 1,6], false],
        ['endIsLeft', 'up'   , [1,2, 1,6, -8], true],
        ['endIsLeft', 'up'   , [5,2, 1,6, 8], false],
        ['endIsLeft', 'down' , [1,2, 5,6], true ],
        ['endIsLeft', 'down' , [5,2, 1,6], false],
        ['endIsLeft', 'down' , [1,2, 1,6], false],
        ['endIsLeft', 'down' , [1,2, 1,6, -8], true],
        ['endIsLeft', 'down' , [1,2, 5,6, 8], false],
        ['endIsLeft', 'left' , [1,2, 5,6], true ],
        ['endIsLeft', 'left' , [1,6, 5,2], false],
        ['endIsLeft', 'left' , [1,2, 5,2], false],
        ['endIsLeft', 'left' , [1,2, 5,2, -8], true],
        ['endIsLeft', 'left' , [1,2, 5,6, 8], false],
        ['endIsLeft', 'right', [1,2, 5,6], false],
        ['endIsLeft', 'right', [1,6, 5,2], true ],
        ['endIsLeft', 'right', [1,2, 5,2], false],
        ['endIsLeft', 'right', [1,2, 5,2, -8], true],
        ['endIsLeft', 'right', [1,6, 5,2, 8], false],

        ['endIsCloseSideways', 'up'   , [1,2, 5,6, 2], false],
        ['endIsCloseSideways', 'up'   , [1,2, 2,6, 2], true ],
        ['endIsCloseSideways', 'up'   , [1,2, 0,6, 2], true ],
        ['endIsCloseSideways', 'up'   , [1,2, 1,6, 2], true ],
        ['endIsCloseSideways', 'down' , [1,2, 5,6, 2], false],
        ['endIsCloseSideways', 'down' , [1,2, 0,6, 2], true ],
        ['endIsCloseSideways', 'left' , [1,2, 5,6, 2], false],
        ['endIsCloseSideways', 'left' , [1,2, 5,3, 2], true ],
        ['endIsCloseSideways', 'left' , [1,2, 5,1, 2], true ],
        ['endIsCloseSideways', 'left' , [1,2, 5,2, 2], true ],
        ['endIsCloseSideways', 'right', [1,2, 5,6, 2], false],
        ['endIsCloseSideways', 'right', [1,2, 5,3, 2], true ],

    ].forEach(([func, direction, input, result]) => {
        it(`${func} ${direction} ${input}`, () => {
            expect(
                bezierRewire.__get__(func)(Direction[direction], ...input)
            ).to.almost.eql(result);
        });
    });
});

describe('Curve interface', () => {
    const f = 2.5;
    const bn = 2.0; // normal side dist
    const be = 2.7; // extra side dist
    const bz = 1.0; // zero side dist
    const l = 3.0;
    const r = 3.0;
    [
        ['forward', 'up'   , [1,2], [5,6], [1,2, 1,2-f, 5,6+f, 5,6]],
        ['forward', 'down' , [1,2], [5,6], [1,2, 1,2+f, 5,6-f, 5,6]],
        ['forward', 'left' , [1,2], [5,6], [1,2, 1-f,2, 5+f,6, 5,6]],
        ['forward', 'right', [1,2], [5,6], [1,2, 1+f,2, 5-f,6, 5,6]],
        ['forward', 'up'   , [1,2], [1,2], [1,2, 1,2, 1,2, 1,2]],

        ['back', 'up'   , [1,2], [5,6], [1,2, 1,2-bn, 5,2-bn, 5,6]],
        ['back', 'up'   , [1,6], [5,2], [1,6, 1,2-bn, 5,2-bn, 5,2]],
        ['back', 'up'   , [5,6], [1,2], [5,6, 5,2-bn, 1,2-bn, 1,2]],
        ['back', 'up'   , [5,2], [1,6], [5,2, 5,2-bn, 1,2-bn, 1,6]],
        ['back', 'up'   , [1,2], [8,6], [1,2, 1,2-be, 8,2-be, 8,6]],
        ['back', 'up'   , [1,2], [1,2], [1,2, 1,2-bz, 1,2-bz, 1,2]],

        ['back', 'down' , [1,2], [5,6], [1,2, 1,6+bn, 5,6+bn, 5,6]],
        ['back', 'down' , [1,6], [5,2], [1,6, 1,6+bn, 5,6+bn, 5,2]],
        ['back', 'down' , [5,6], [1,2], [5,6, 5,6+bn, 1,6+bn, 1,2]],
        ['back', 'down' , [5,2], [1,6], [5,2, 5,6+bn, 1,6+bn, 1,6]],
        ['back', 'down' , [1,2], [8,6], [1,2, 1,6+be, 8,6+be, 8,6]],
        ['back', 'down' , [1,6], [1,6], [1,6, 1,6+bz, 1,6+bz, 1,6]],

        ['back', 'left' , [1,2], [5,6], [1,2, 1-bn,2, 1-bn,6, 5,6]],
        ['back', 'left' , [1,6], [5,2], [1,6, 1-bn,6, 1-bn,2, 5,2]],
        ['back', 'left' , [5,6], [1,2], [5,6, 1-bn,6, 1-bn,2, 1,2]],
        ['back', 'left' , [5,2], [1,6], [5,2, 1-bn,2, 1-bn,6, 1,6]],
        ['back', 'left' , [1,2], [5,9], [1,2, 1-be,2, 1-be,9, 5,9]],
        ['back', 'left' , [1,2], [1,2], [1,2, 1-bz,2, 1-bz,2, 1,2]],

        ['back', 'right', [1,2], [5,6], [1,2, 5+bn,2, 5+bn,6, 5,6]],
        ['back', 'right', [1,6], [5,2], [1,6, 5+bn,6, 5+bn,2, 5,2]],
        ['back', 'right', [5,6], [1,2], [5,6, 5+bn,6, 5+bn,2, 1,2]],
        ['back', 'right', [5,2], [1,6], [5,2, 5+bn,2, 5+bn,6, 1,6]],
        ['back', 'right', [1,2], [5,9], [1,2, 5+be,2, 5+be,9, 5,9]],
        ['back', 'right', [5,2], [5,2], [5,2, 5+bz,2, 5+bz,2, 5,2]],

        ['left', 'up'   , [1,6], [5,2], [1,6, 1,6-l, 5+l,2, 5,2]],
        ['left', 'up'   , [5,2], [1,6], [5,2, 5,2-l, 1+l,6, 1,6]],
        ['left', 'down' , [1,6], [5,2], [1,6, 1,6+l, 5-l,2, 5,2]],
        ['left', 'down' , [5,2], [1,6], [5,2, 5,2+l, 1-l,6, 1,6]],
        ['left', 'left' , [5,6], [1,2], [5,6, 5-l,6, 1,2-l, 1,2]],
        ['left', 'left' , [1,2], [5,6], [1,2, 1-l,2, 5,6-l, 5,6]],
        ['left', 'right', [1,2], [5,6], [1,2, 1+l,2, 5,6+l, 5,6]],
        ['left', 'right', [5,6], [1,2], [5,6, 5+l,6, 1,2+l, 1,2]],
        ['left', 'up'   , [1,2], [1,2], [1,2, 1,2, 1,2, 1,2]],

        ['right', 'up'   , [1,6], [5,2], [1,6, 1,6-r, 5-r,2, 5,2]],
        ['right', 'up'   , [5,2], [1,6], [5,2, 5,2-r, 1-r,6, 1,6]],
        ['right', 'down' , [1,6], [5,2], [1,6, 1,6+r, 5+r,2, 5,2]],
        ['right', 'down' , [5,2], [1,6], [5,2, 5,2+r, 1+r,6, 1,6]],
        ['right', 'left' , [1,2], [5,6], [1,2, 1-r,2, 5,6+r, 5,6]],
        ['right', 'left' , [5,6], [1,2], [5,6, 5-r,6, 1,2+r, 1,2]],
        ['right', 'right', [1,2], [5,6], [1,2, 1+r,2, 5,6-r, 5,6]],
        ['right', 'right', [5,6], [1,2], [5,6, 5+r,6, 1,2-r, 1,2]],
        ['right', 'up'   , [1,2], [1,2], [1,2, 1,2, 1,2, 1,2]],

    ].forEach(([func, direction, startPoint, endPoint, result]) => {
        it(`path points ${func} ${direction} ${startPoint} ${endPoint}`, () => {
            expect(
                start(...startPoint, Direction[direction])
                [func](...endPoint)
                .points
            ).to.almost.eql(result);
        });
    });
});

describe('Curve state', () => {
    [
        ['forward', 'up'   , 'up'   ],
        ['forward', 'down' , 'down' ],
        ['forward', 'left' , 'left' ],
        ['forward', 'right', 'right'],

        ['back', 'up'   , 'down' ],
        ['back', 'down' , 'up'   ],
        ['back', 'left' , 'right'],
        ['back', 'right', 'left' ],

        ['left', 'up'   , 'left' ],
        ['left', 'down' , 'right'],
        ['left', 'left' , 'down' ],
        ['left', 'right', 'up'   ],

        ['right', 'up'   , 'right'],
        ['right', 'down' , 'left' ],
        ['right', 'left' , 'up'   ],
        ['right', 'right', 'down' ],

    ].forEach(([func, direction, endDirection]) => {
        const startPoint = [1,2];
        const endPoint = [5,6];

        it(`path state ${func} ${direction}`, () => {
            const path = start(...startPoint, Direction[direction])
                [func](...endPoint);
            expect(path.curX).to.equal(endPoint[0]);
            expect(path.curY).to.equal(endPoint[1]);
            expect(path.direction).to.equal(Direction[endDirection]);
        });
    });
});

describe('Curve offset helpers', () => {
    [
        ['sameBehindFar', 'up'   , [1,2, 5,6], [3,4]],
        ['sameBehindFar', 'up'   , [5,2, 1,6], [3,4]],
        ['sameBehindFar', 'down' , [1,2, 5,6], [3,4]],
        ['sameBehindFar', 'down' , [5,2, 1,6], [3,4]],
        ['sameBehindFar', 'left' , [1,2, 5,6], [3,4]],
        ['sameBehindFar', 'left' , [1,6, 5,2], [3,4]],
        ['sameBehindFar', 'right', [1,2, 5,6], [3,4]],
        ['sameBehindFar', 'right', [1,6, 5,2], [3,4]],
        ['sameBehindFar', 'up'   , [1,2, 1,2], [1,2]],
        ['sameBehindFar', 'left' , [1,2, 1,2], [1,2]],
        ['sameBehindFar', 'up'   , [-1,-2, -5,-6], [-3,-4]],
        ['sameBehindFar', 'left' , [-1,-2, -5,-6], [-3,-4]],

        ['sameBehindClose', 'up'   , [1,2, 5,6, 2], [7,4]],
        ['sameBehindClose', 'up'   , [5,2, 1,6, 2], [7,4]],
        ['sameBehindClose', 'up'   , [5,2, 5,6, 2], [7,4]],
        ['sameBehindClose', 'down' , [1,2, 5,6, 2], [-1,4]],
        ['sameBehindClose', 'down' , [5,2, 1,6, 2], [-1,4]],
        ['sameBehindClose', 'down' , [1,2, 1,6, 2], [-1,4]],
        ['sameBehindClose', 'left' , [1,2, 5,6, 2], [3,8]],
        ['sameBehindClose', 'left' , [1,6, 5,2, 2], [3,8]],
        ['sameBehindClose', 'left' , [1,6, 5,6, 2], [3,8]],
        ['sameBehindClose', 'right', [1,2, 5,6, 2], [3,0]],
        ['sameBehindClose', 'right', [1,6, 5,2, 2], [3,0]],
        ['sameBehindClose', 'right', [1,2, 5,2, 2], [3,0]],

        ['oppositeAheadClose', 'up'   , [1,2, 5,6, 1], [4,6]],
        ['oppositeAheadClose', 'up'   , [5,2, 1,6, 1], [2,6]],
        ['oppositeAheadClose', 'up'   , [5,2, 5,6, 1], [4,6]],
        ['oppositeAheadClose', 'down' , [1,2, 5,6, 1], [4,6]],
        ['oppositeAheadClose', 'down' , [5,2, 1,6, 1], [2,6]],
        ['oppositeAheadClose', 'down' , [5,2, 5,6, 1], [6,6]],
        ['oppositeAheadClose', 'left' , [1,2, 5,6, 1], [5,5]],
        ['oppositeAheadClose', 'left' , [1,6, 5,2, 1], [5,3]],
        ['oppositeAheadClose', 'left' , [1,6, 5,6, 1], [5,5]],
        ['oppositeAheadClose', 'right', [1,2, 5,6, 1], [5,5]],
        ['oppositeAheadClose', 'right', [1,6, 5,2, 1], [5,3]],
        ['oppositeAheadClose', 'right', [1,6, 5,6, 1], [5,7]],

        ['oppositeBehindClose', 'up'   , [1,2, 5,6, 1], [2,2]],
        ['oppositeBehindClose', 'up'   , [5,2, 1,6, 1], [4,2]],
        ['oppositeBehindClose', 'up'   , [5,2, 5,6, 1], [6,2]],
        ['oppositeBehindClose', 'down' , [1,2, 5,6, 1], [2,2]],
        ['oppositeBehindClose', 'down' , [5,2, 1,6, 1], [4,2]],
        ['oppositeBehindClose', 'down' , [5,2, 5,6, 1], [4,2]],
        ['oppositeBehindClose', 'left' , [1,2, 5,6, 1], [1,3]],
        ['oppositeBehindClose', 'left' , [1,6, 5,2, 1], [1,5]],
        ['oppositeBehindClose', 'left' , [1,6, 5,6, 1], [1,7]],
        ['oppositeBehindClose', 'right', [1,2, 5,6, 1], [1,3]],
        ['oppositeBehindClose', 'right', [1,6, 5,2, 1], [1,5]],
        ['oppositeBehindClose', 'right', [1,6, 5,6, 1], [1,5]],

        ['rightVal', 'up'   , [5,6, 5],  0],
        ['rightVal', 'down' , [5,6, 5], 10],
        ['rightVal', 'left' , [5,6, 5], 11],
        ['rightVal', 'right', [5,6, 5],  1],

        ['rightBehindRight', 'up'   , [1,2, 5,6], [ 3.5,2]],
        ['rightBehindRight', 'up'   , [1,2, 5,2], [ 3.5,0]],
        ['rightBehindRight', 'up'   , [1,2, 5,8], [ 3.5,3]],
        ['rightBehindRight', 'down' , [5,6, 1,2], [ 2.5,6]],
        ['rightBehindRight', 'down' , [5,6, 1,6], [ 2.5,8]],
        ['rightBehindRight', 'down' , [5,6, 1,0], [ 2.5,5]],
        ['rightBehindRight', 'left' , [1,6, 5,2], [ 1,3.5]],
        ['rightBehindRight', 'left' , [1,6, 1,2], [-1,3.5]],
        ['rightBehindRight', 'left' , [1,6, 7,2], [ 2,3.5]],
        ['rightBehindRight', 'right', [5,2, 1,6], [ 5,4.5]],
        ['rightBehindRight', 'right', [5,2, 5,6], [ 7,4.5]],
        ['rightBehindRight', 'right', [5,2,-1,6], [ 4,4.5]],

        ['rightAheadLeft', 'up'   , [5,6, 1,2], [ 0.2,2.4]],
        ['rightAheadLeft', 'up'   , [5,6, 1,0], [ 0.1,0.6]],
        ['rightAheadLeft', 'down' , [1,2, 5,6], [ 5.8,5.6]],
        ['rightAheadLeft', 'down' , [1,2, 5,8], [ 5.9,7.4]],
        ['rightAheadLeft', 'left' , [5,2, 1,6], [ 1.4,6.8]],
        ['rightAheadLeft', 'left' , [5,2,-1,6], [-0.4,6.9]],
        ['rightAheadLeft', 'right', [1,6, 5,2], [ 4.6,1.2]],
        ['rightAheadLeft', 'right', [1,6, 7,2], [ 6.4,1.1]],

        ['rightBehindLeft', 'up'   , [15, 2,  1,16], [ 8, 0.5]],
        ['rightBehindLeft', 'up'   , [15, 2,  1, 1], [ 8,-0.5]],
        ['rightBehindLeft', 'up'   , [15, 2, 17,16], [13, 0.5]],
        ['rightBehindLeft', 'down' , [ 1,16, 15, 2], [ 8,17.5]],
        ['rightBehindLeft', 'down' , [ 1,16, 15,17], [ 8,18.5]],
        ['rightBehindLeft', 'down' , [ 1,16, -1, 2], [ 3,17.5]],
        ['rightBehindLeft', 'left' , [ 1, 2, 15,16], [-0.5, 9]],
        ['rightBehindLeft', 'left' , [ 1, 2,  0,16], [-1.5, 9]],
        ['rightBehindLeft', 'left' , [ 1, 2, 15, 0], [-0.5, 4]],
        ['rightBehindLeft', 'right', [15,16,  1, 2], [16.5, 9]],
        ['rightBehindLeft', 'right', [15,16, 16, 2], [17.5, 9]],
        ['rightBehindLeft', 'right', [15,16,  1,18], [16.5,14]],

        ['flipEnd', 'up'   , [ 1,2,  1,2], [ 1, 2]],
        ['flipEnd', 'up'   , [ 1,2,  5,6], [-3, 6]],
        ['flipEnd', 'up'   , [ 5,2,  1,6], [ 9, 6]],
        ['flipEnd', 'up'   , [-1,2,  5,6], [-7, 6]],
        ['flipEnd', 'up'   , [ 1,2, -5,6], [ 7, 6]],
        ['flipEnd', 'up'   , [-1,2, -5,6], [ 3, 6]],
        ['flipEnd', 'down' , [ 1,2,  1,2], [ 1, 2]],
        ['flipEnd', 'down' , [ 1,2,  5,6], [-3, 6]],
        ['flipEnd', 'down' , [ 5,2,  1,6], [ 9, 6]],
        ['flipEnd', 'down' , [-1,2,  5,6], [-7, 6]],
        ['flipEnd', 'down' , [ 1,2, -5,6], [ 7, 6]],
        ['flipEnd', 'down' , [-1,2, -5,6], [ 3, 6]],
        ['flipEnd', 'left' , [1, 2, 1, 2], [1,  2]],
        ['flipEnd', 'left' , [1, 2, 5, 6], [5, -2]],
        ['flipEnd', 'left' , [1, 6, 5, 2], [5, 10]],
        ['flipEnd', 'left' , [1,-2, 5, 6], [5,-10]],
        ['flipEnd', 'left' , [1, 2, 5,-6], [5, 10]],
        ['flipEnd', 'left' , [1,-2, 5,-6], [5,  2]],
        ['flipEnd', 'right', [1, 2, 1, 2], [1,  2]],
        ['flipEnd', 'right', [1, 2, 5, 6], [5, -2]],
        ['flipEnd', 'right', [1, 6, 5, 2], [5, 10]],
        ['flipEnd', 'right', [1,-2, 5, 6], [5,-10]],
        ['flipEnd', 'right', [1, 2, 5,-6], [5, 10]],
        ['flipEnd', 'right', [1,-2, 5,-6], [5,  2]],

        ['flipPoints', 'up'   , [ 1, 2, [1,2, 5,6, -5,6]], [1,2, -3,6, 7,6]],
        ['flipPoints', 'up'   , [-1, 2, [5,6, -5,6     ]], [-7,6, 3,6     ]],
        ['flipPoints', 'up'   , [ 5, 2, [1,6           ]], [9,6           ]],
        ['flipPoints', 'down' , [ 1, 2, [1,2, 5,6, -5,6]], [1,2, -3,6, 7,6]],
        ['flipPoints', 'down' , [-1, 2, [5,6, -5,6     ]], [-7,6, 3,6     ]],
        ['flipPoints', 'down' , [ 5, 2, [1,6           ]], [9,6           ]],
        ['flipPoints', 'left' , [ 1, 2, [1,2, 5,6, 5,-6]], [1,2, 5,-2, 5,10]],
        ['flipPoints', 'left' , [ 1,-2, [5,6, 5,-6     ]], [5,-10, 5,2     ]],
        ['flipPoints', 'left' , [ 1, 6, [5,2           ]], [5,10           ]],
        ['flipPoints', 'right', [ 1, 2, [1,2, 5,6, 5,-6]], [1,2, 5,-2, 5,10]],
        ['flipPoints', 'right', [ 1,-2, [5,6, 5,-6     ]], [5,-10, 5,2     ]],
        ['flipPoints', 'right', [ 1, 6, [5,2           ]], [5,10           ]],

    ].forEach(([func, direction, input, result]) => {
        it(`${func} ${direction} ${input}`, () => {
            expect(
                bezierRewire.__get__(func)(Direction[direction], ...input)
            ).to.almost.eql(result);
        });
    });
});

function runCurveTests(func, cases) {
    cases.forEach(([direction, input, result]) =>
        it(`${direction} ${input}`, () =>
            expect(func(...input, Direction[direction]))
                .to.almost.eql(result)));
}

describe('curveSameDirection', () => {
    describe('same direction forward curve', () => 
    runCurveTests(curveSameDirection, [
        ['down', [1,2,3,4], [
            1, 2, 1, 3.4, 3, 2.6, 
            3, 4
        ]],
        ['down', [3,2,1,4], [
            3, 2, 3, 3.4, 1, 2.6, 
            1, 4
        ]],
    ]));

    describe('same direction direct back curve', () => 
    runCurveTests(curveSameDirection, [
        ['down', [10,20,1,2], [
            10,  20, 10,  22.1, 5.5, 22.1, 
            5.5, 11, 5.5, -0.1, 1,   -0.1, 
            1,   2
        ]],
        ['down', [1,20,10,2], [
            1,   20, 1,   22.1, 5.5, 22.1, 
            5.5, 11, 5.5, -0.1, 10,  -0.1, 
            10,  2
        ]],
    ]));

    describe('same direction around back curve', () => 
    runCurveTests(curveSameDirection, [
        ['down', [1,20,2,3], [
            1,    20,   1,    21.5, -1.3, 21.5, 
            -1.3, 11.5, -1.3, 1.1,  2,    1.1, 
            2,    3
        ]],
        ['down', [2,20,1,3], [
            2,    20,   2,    21.8, -1.3, 21.8, 
            -1.3, 11.5, -1.3, 1.4,  1,    1.4, 
            1,    3
        ]],
    ]));
});

describe('curveOppositeDirection', () => {
    describe('opposite direction back curve', () => 
    runCurveTests(curveOppositeDirection, [
        ['down', [1,2,3,1], [
            1, 2, 1, 3.5, 3, 3.5, 
            3, 1
        ]],
        ['down', [3,2,1,1], [
            3, 2, 3, 3.5, 1, 3.5, 
            1, 1
        ]],
        ['down', [3,1,1,2], [
            3, 1, 3, 3.5, 1, 3.5, 
            1, 2
        ]],
    ]));

    describe('opposite direction ahead', () => 
    runCurveTests(curveOppositeDirection, [
        ['up', [1,2,2,0], [
            1, 2, 1, 0.5,  0, 1.5, 
            0, 0, 0, -1.5, 2, -1.5, 
            2, 0
        ]],
        ['up', [3,2,2,0], [
            3, 2, 3, 0.5,  4, 1.5, 
            4, 0, 4, -1.5, 2, -1.5, 
            2, 0
        ]],
    ]));

    describe('opposite direction behind', () => 
    runCurveTests(curveOppositeDirection, [
        ['down', [1,2,2,0], [
            1, 2, 1, 3.5, 3, 3.5, 
            3, 2, 3, 0.5, 2, 1.5, 
            2, 0
        ]],
        ['down', [3,2,2,0], [
            3, 2, 3, 3.5, 1, 3.5, 
            1, 2, 1, 0.5, 2, 1.5, 
            2, 0
        ]],
    ]));
});

describe('curveLeftDirection', () => {
    describe('left ahead', () => 
    runCurveTests(curveLeftDirection, [
        ['up', [5,5,4,4], [
            5, 5, 5, 4.3, 4.6, 4, 
            4, 4
        ]],
        ['up', [5,5,1,0], [
            5, 5, 5, 1.1, 4.1, 0, 
            1, 0
        ]],
        ['up', [5,5,4,0], [
            5, 5, 5, 1.8, 4.7, 0, 
            4, 0
        ]],
        ['up', [5,5,1,4], [
            5, 5, 5, 4.2, 3.5, 4, 
            1, 4
        ]],
    ]));

    describe('right ahead', () => 
    runCurveTests(curveLeftDirection, [
        ['up', [5,5,9,0], [
            5,   5,   5,   2.2, 9.8, 3.2, 
            9.8, 0.5, 9.8, 0.2, 9.4, 0, 
            9,   0
        ]],
        ['up', [5,5,9,4], [
            5, 5,   5,    3.2, 5.5,  2.5, 
            7, 2.5, 10.3, 2.5, 10.3, 4, 
            9, 4
        ]],
    ]));

    describe('left behind', () => 
    runCurveTests(curveLeftDirection, [
        ['up', [5,5,1,9], [
            5,   5,   5, 3.4, 2.5, 3.4, 
            2.5, 5, 2.5, 7.7, 2.1, 9, 
            1,   9
        ]],
        ['up', [5,5,4,9], [
            5,   5, 5,   3.9, 5.6, 3.5, 
            7, 3.5, 9.3, 3.5, 9.3, 9, 
            4,   9
        ]],
    ]));

    describe('right behind', () => 
    runCurveTests(curveLeftDirection, [
        ['up', [5,5,9,9], [
            5, 5,   5,    3.9, 5.6,  3.5, 
            7, 3.5, 11.3, 3.5, 11.3, 9, 
            9, 9
        ]],
    ]));
});

describe('curveRightDirection', () => {
    describe('right ahead', () => 
    runCurveTests(curveRightDirection, [
        ['up', [5,5,6,4], [
            5, 5, 5, 4.3, 5.3, 4, 
            6, 4
        ]],
        ['up', [5,5,9,0], [
            5, 5, 5, 1.1, 5.8, 0, 
            9, 0
        ]],
        ['up', [5,5,6,0], [
            5, 5, 5, 1.8, 5.2, 0, 
            6, 0
        ]],
        ['up', [5,5,9,4], [
            5, 5, 5, 4.2, 6.4, 4, 
            9, 4
        ]],
    ]));

    describe('left ahead', () => 
    runCurveTests(curveRightDirection, [
        ['up', [5,5,1,0], [
            5,   5,   5,   2.2, 0.2, 3.2, 
            0.2, 0.5, 0.2, 0.2, 0.5, 0, 
            1,   0
        ]],
        ['up', [5,5,1,4], [
            5, 5,   5,    3.2, 4.4,  2.5, 
            3, 2.5, -0.3, 2.5, -0.3, 4, 
            1, 4
        ]],
    ]));

    describe('right behind', () => 
    runCurveTests(curveRightDirection, [
        ['up', [5,5,6,9], [
            5, 5,   5,   4,   4.3, 3.5, 
            3, 3.5, 0.6, 3.5, 0.6, 9, 
            6, 9
        ]],
        ['up', [5,5,9,9], [
            5,   5, 5,   3.3, 7.5, 3.3, 
            7.5, 5, 7.5, 7.6, 7.8, 9, 
            9,   9
        ]],
    ]));

    describe('left behind', () => 
    runCurveTests(curveRightDirection, [
        ['up', [5,5,1,9], [
            5, 5,   5,    4,   4.3,  3.5, 
            3, 3.5, -1.3, 3.5, -1.3, 9, 
            1, 9
        ]],
    ]));
});

describe('generatePoints', () => {
    const expectedSameDirection = [
        1.5, 3, 1.5, 3.7, 3.5, 3.3, 
        3.5, 4
    ];
    it ('generate same direction from source', () => {
        expect(bezierImpl.generatePoints({
            isSource: true,
            direction: Direction['down'],
            x: 1,
            y: 2,
        },{
            isSource: false,
            direction: Direction['down'],
            x: 3,
            y: 4,
        })).to.almost.eql(expectedSameDirection);
    });
    it ('generate same direction from dest', () => {
        expect(bezierImpl.generatePoints({
            isSource: false,
            direction: Direction['down'],
            x: 3,
            y: 4,
        },{
            isSource: true,
            direction: Direction['down'],
            x: 1,
            y: 2,
        })).to.almost.eql(expectedSameDirection);
    });

    it ('generate opposite direction start up', () => {
        expect(bezierImpl.generatePoints({
            isSource: true,
            direction: Direction['up'],
            x: 1,
            y: 2,
        },{
            isSource: false,
            direction: Direction['down'],
            x: 3,
            y: 4,
        })).to.almost.eql([
            1.5, 2, 1.5, 0.5, 3.5, 0.5, 
            3.5, 4
        ]);
    });

    it ('generate opposite direction start left', () => {
        expect(bezierImpl.generatePoints({
            isSource: true,
            direction: Direction['left'],
            x: 1,
            y: 2,
        },{
            isSource: false,
            direction: Direction['right'],
            x: 3,
            y: 4,
        })).to.almost.eql([
            1, 2.5, -0.5, 2.5, -0.5, 4.5, 
            3, 4.5
        ]);
    });

    it ('generate right direction', () => {
        expect(bezierImpl.generatePoints({
            isSource: true,
            direction: Direction['right'],
            x: 1,
            y: 2,
        },{
            isSource: false,
            direction: Direction['down'],
            x: 3,
            y: 4,
        })).to.almost.eql([
            2,   2.5, 3.0, 2.5, 3.5, 3.0, 
            3.5, 4
        ]);
    });

    it ('generate left direction', () => {
        expect(bezierImpl.generatePoints({
            isSource: true,
            direction: Direction['up'],
            x: 3,
            y: 4,
        },{
            isSource: false,
            direction: Direction['left'],
            x: 1,
            y: 2,
        })).to.almost.eql([
            3.5, 4, 3.5, 3.0, 3.0, 2.5, 
            2,   2.5
        ]);
    });
});

});
