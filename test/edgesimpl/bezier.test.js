import { expect, use } from 'chai';
import chaiAlmost from 'chai-almost';
use(chaiAlmost(0.1));

import { Direction } from 'common/lookup.js';
import bezierRewire, { bezierImpl } from 'edgesimpl/bezier.js';
const curveSameDirection = bezierRewire.__get__('curveSameDirection');
const start = bezierRewire.__get__('start');

describe(require('path').basename(__filename), () => {

describe('pipePath helpers', () => {
    [
        ['reverse', 'up'   , [], Direction.down ],
        ['reverse', 'down' , [], Direction.up   ],
        ['reverse', 'left' , [], Direction.right],
        ['reverse', 'right', [], Direction.left ],

        ['anchor', 'up'   , [5,6, 2], [5,4]],
        ['anchor', 'down' , [5,6, 2], [5,8]],
        ['anchor', 'left' , [5,6, 2], [3,6]],
        ['anchor', 'right', [5,6, 2], [7,6]],

        ['halfwayPoint', 'up'   , [1,2, 5,6], [3,4]],
        ['halfwayPoint', 'up'   , [5,2, 1,6], [3,4]],
        ['halfwayPoint', 'down' , [1,2, 5,6], [3,4]],
        ['halfwayPoint', 'down' , [5,2, 1,6], [3,4]],
        ['halfwayPoint', 'left' , [1,2, 5,6], [3,4]],
        ['halfwayPoint', 'left' , [1,6, 5,2], [3,4]],
        ['halfwayPoint', 'right', [1,2, 5,6], [3,4]],
        ['halfwayPoint', 'right', [1,6, 5,2], [3,4]],
        ['halfwayPoint', 'up'   , [1,2, 1,2], [1,2]],
        ['halfwayPoint', 'left' , [1,2, 1,2], [1,2]],
        ['halfwayPoint', 'up'   , [-1,-2, -5,-6], [-3,-4]],
        ['halfwayPoint', 'left' , [-1,-2, -5,-6], [-3,-4]],

        ['aroundPoint', 'up'   , [1,2, 5,6], [7.3,4]],
        ['aroundPoint', 'up'   , [5,2, 1,6], [7.3,4]],
        ['aroundPoint', 'up'   , [5,2, 5,6], [7.3,4]],
        ['aroundPoint', 'down' , [1,2, 5,6], [-1.3,4]],
        ['aroundPoint', 'down' , [5,2, 1,6], [-1.3,4]],
        ['aroundPoint', 'down' , [1,2, 1,6], [-1.3,4]],
        ['aroundPoint', 'left' , [1,2, 5,6], [3,8.3]],
        ['aroundPoint', 'left' , [1,6, 5,2], [3,8.3]],
        ['aroundPoint', 'left' , [1,6, 5,6], [3,8.3]],
        ['aroundPoint', 'right', [1,2, 5,6], [3,-0.3]],
        ['aroundPoint', 'right', [1,6, 5,2], [3,-0.3]],
        ['aroundPoint', 'right', [1,2, 5,2], [3,-0.3]],

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

        ['diffMultiplier', 'up'   , [1,2, 1,6], 0.9],
        ['diffMultiplier', 'up'   , [1,2, 5,6], 0.6],
        ['diffMultiplier', 'up'   , [1,2, 5000000,6], 0.5],
        ['diffMultiplier', 'down' , [1,2, 1,6], 0.9],
        ['diffMultiplier', 'down' , [1,2, 5,6], 0.6],
        ['diffMultiplier', 'down' , [1,2, 5000000,6], 0.5],
        ['diffMultiplier', 'left' , [1,2, 5,2], 0.9],
        ['diffMultiplier', 'left' , [1,2, 5,6], 0.6],
        ['diffMultiplier', 'left' , [1,2, 5,6000000], 0.5],
        ['diffMultiplier', 'right', [1,2, 5,2], 0.9],
        ['diffMultiplier', 'right', [1,2, 5,6], 0.6],
        ['diffMultiplier', 'right', [1,2, 5,6000000], 0.5],

        ['endIsAhead', 'up'   , [1,2, 5,6], false],
        ['endIsAhead', 'up'   , [1,6, 5,2], true],
        ['endIsAhead', 'up'   , [1,2, 5,2], false],
        ['endIsAhead', 'down' , [1,2, 5,6], true],
        ['endIsAhead', 'down' , [1,6, 5,2], false],
        ['endIsAhead', 'down' , [1,2, 5,2], false],
        ['endIsAhead', 'left' , [1,2, 5,6], false],
        ['endIsAhead', 'left' , [5,2, 1,6], true],
        ['endIsAhead', 'left' , [1,2, 1,6], false],
        ['endIsAhead', 'right', [1,2, 5,6], true],
        ['endIsAhead', 'right', [5,2, 1,6], false],
        ['endIsAhead', 'right', [1,2, 1,6], false],

        ['endIsCloseSideways', 'up'   , [1,2, 5,6, 2], false],
        ['endIsCloseSideways', 'up'   , [1,2, 2,6, 2], true],
        ['endIsCloseSideways', 'up'   , [1,2, 0,6, 2], true],
        ['endIsCloseSideways', 'up'   , [1,2, 1,6, 2], true],
        ['endIsCloseSideways', 'down' , [1,2, 5,6, 2], false],
        ['endIsCloseSideways', 'down' , [1,2, 0,6, 2], true],
        ['endIsCloseSideways', 'left' , [1,2, 5,6, 2], false],
        ['endIsCloseSideways', 'left' , [1,2, 5,3, 2], true],
        ['endIsCloseSideways', 'left' , [1,2, 5,1, 2], true],
        ['endIsCloseSideways', 'left' , [1,2, 5,2, 2], true],
        ['endIsCloseSideways', 'right', [1,2, 5,6, 2], false],
        ['endIsCloseSideways', 'right', [1,2, 5,3, 2], true],

    ].forEach(([func, direction, input, result]) => {
        it(`${func} ${direction} ${input}`, () => {
            expect(
                bezierRewire.__get__(func)(Direction[direction], ...input)
            ).to.almost.eql(result);
        });
    });
});

describe('pipePath interface', () => {
    const f = 2.5;
    const bn = 2.0; // normal side dist
    const be = 2.7; // extra side dist
    const bz = 1.0; // zero side dist
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

    ].forEach(([func, direction, startPoint, endPoint, result]) => {
        it(`path points ${func} ${direction} ${startPoint} ${endPoint}`, () => {
            expect(
                start(...startPoint, Direction[direction])
                [func](...endPoint)
                .points
            ).to.almost.eql(result);
        });
    });

    [
        ['forward', 'up'   , 'up'   ],
        ['forward', 'down' , 'down' ],
        ['forward', 'left' , 'left' ],
        ['forward', 'right', 'right'],

        ['back', 'up'   , 'down' ],
        ['back', 'down' , 'up'   ],
        ['back', 'left' , 'right'],
        ['back', 'right', 'left' ],

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

describe('curveSameDirection', () => {
    it('returns forward curve basic', () => {
        expect(curveSameDirection(1,2,3,4,Direction.down)).to.almost.eql([
            1, 2, 1, 3.4, 3, 2.6, 
            3, 4
        ]);
    });

    it('returns forward curve flipped X', () => {
        expect(curveSameDirection(3,2,1,4,Direction.down)).to.almost.eql([
            3, 2, 3, 3.4, 1, 2.6, 
            1, 4
        ]);
    });

    it('returns direct back curve basic', () => {
        expect(curveSameDirection(10,20,1,2,Direction.down)).to.almost.eql([
            10, 20, 10, 22.1, 5.5, 22.1, 
            5.5, 11, 5.5, -0.1, 1, -0.1, 
            1, 2
        ]);
    });

    it('returns direct back curve flipped X', () => {
        expect(curveSameDirection(1,20,10,2,Direction.down)).to.almost.eql([
            1, 20, 1, 22.1, 5.5, 22.1, 
            5.5, 11, 5.5, -0.1, 10, -0.1, 
            10, 2
        ]);
    });

    it('returns around back curve short bottom', () => {
        expect(curveSameDirection(1,20,2,3,Direction.down)).to.almost.eql([
            1, 20, 1, 21.5, -1.3, 21.5, 
            -1.3, 11.5, -1.3, 1.1, 2, 1.1, 
            2, 3
        ]);
    });

    it('returns around back curve short top', () => {
        expect(curveSameDirection(2,20,1,3,Direction.down)).to.almost.eql([
            2, 20, 2, 21.8, -1.3, 21.8, 
            -1.3, 11.5, -1.3, 1.4, 1, 1.4, 
            1, 3
        ]);
    });
});

describe('generatePoints', () => {
    describe('vertical', () => {
        const expectedDirectPoints = [
            1.5, 3, 1.5, 3.7, 3.5, 3.3, 
            3.5, 4
        ];

        it ('returns direct from source', () => {
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
            })).to.almost.eql(expectedDirectPoints);
        });

        it ('returns direct from dest', () => {
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
            })).to.almost.eql(expectedDirectPoints);
        });
    });

    describe('horizontal', () => {
        const expectedDirectPoints = [
            2, 2.5, 2.7, 2.5, 2.3, 4.5, 
            3, 4.5
        ];

        it ('returns direct from source', () => {
            expect(bezierImpl.generatePoints({
                isSource: true,
                direction: Direction['right'],
                x: 1,
                y: 2,
            },{
                isSource: false,
                direction: Direction['right'],
                x: 3,
                y: 4,
            })).to.almost.eql(expectedDirectPoints);
        });

        it ('returns direct from dest', () => {
            expect(bezierImpl.generatePoints({
                isSource: false,
                direction: Direction['right'],
                x: 3,
                y: 4,
            },{
                isSource: true,
                direction: Direction['right'],
                x: 1,
                y: 2,
            })).to.almost.eql(expectedDirectPoints);
        });
    });

    describe('unsupported', () => {
        const invalidDirections = [
            ['left' , 'right'],
            ['left' , 'up'   ],
            ['left' , 'down' ],
            ['up'   , 'left' ],
            ['up'   , 'right'],
            ['up'   , 'down' ],
            ['right', 'left' ],
            ['right', 'up'   ],
            ['right', 'down' ],
            ['down' , 'left' ],
            ['down' , 'right'],
            ['down' , 'up'   ],
        ];

        invalidDirections.forEach(([from, to]) => {
            it (`disallows invalid directions ${from} ${to}`, () => {
                expect(() => bezierImpl.generatePoints({
                    isSource: true,
                    direction: Direction[from],
                    x: 1, y: 2,
                },{
                    isSource: false,
                    direction: Direction[to],
                    x: 3, y: 4,
                })).to.throw(/Unsupported edge directions/);
            });
        });
    });
});

});
