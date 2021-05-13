import { expect, use } from 'chai';
import chaiAlmost from 'chai-almost';
use(chaiAlmost(0.1));

import { Direction } from 'common/lookup.js';
import bezierRewire, { bezierImpl } from 'edgesimpl/bezier.js';
const pointsFlipXY = bezierRewire.__get__('pointsFlipXY');
const pointsFlipY = bezierRewire.__get__('pointsFlipY');
const pointsMove = bezierRewire.__get__('pointsMove');
const makeCurve = bezierRewire.__get__('makeCurve');

describe(require('path').basename(__filename), () => {

describe('Points transformation', () => {
    const input = [
         0,  0,
         1,  0,
         0,  2,
        -3, -4,
         5, -6,
        -7,  8,
         9, 10,
    ];

    describe('pointsFlipXY', () => {
        it('changes x and y around', () => {
            expect(pointsFlipXY(input)).to.eql([
                 0,  0,
                 0,  1,
                 2,  0,
                -4, -3,
                -6,  5,
                 8, -7,
                10,  9,
            ]);
        });
    });

    describe('pointsFlipY', () => {
        it('negates y', () => {
            expect(pointsFlipY(input)).to.eql([
                 0,  -0,
                 1,  -0,
                 0,  -2,
                -3,   4,
                 5,   6,
                -7,  -8,
                 9, -10,
            ]);
        });
    });

    describe('pointsMove', () => {
        it('translates points forward', () => {
            expect(pointsMove(input, 5, 2)).to.eql([
                 5,  2,
                 6,  2,
                 5,  4,
                 2, -2,
                10, -4,
                -2, 10,
                14, 12,
            ]);
        });

        it('translates points backward', () => {
            expect(pointsMove(input, -5, -2)).to.eql([
                -5, -2,
                -4, -2,
                -5,  0,
                -8, -6,
                 0, -8,
                -12, 6,
                 4,  8,
            ]);
        });
    });
});

describe('makeCurve', () => {
    it('returns forward curve basic', () => {
        expect(makeCurve(1,2,3,4)).to.almost.eql([
            1, 2, 1, 3.3, 3, 2.6, 
            3, 4
        ]);
    });

    it('returns forward curve flipped X', () => {
        expect(makeCurve(3,2,1,4)).to.almost.eql([
            3, 2, 3, 3.3, 1, 2.6, 
            1, 4
        ]);
    });

    it('returns direct back curve basic', () => {
        expect(makeCurve(10,20,1,2)).to.almost.eql([
            10, 20, 10, 22.1, 5.5, 22.1, 
            5.5, 11, 5.5, -0.1, 1, -0.1, 
            1, 2
        ]);
    });

    it('returns direct back curve flipped X', () => {
        expect(makeCurve(1,20,10,2)).to.almost.eql([
            1, 20, 1, 22.1, 5.5, 22.1, 
            5.5, 11, 5.5, -0.1, 10, -0.1, 
            10, 2
        ]);
    });

    it('returns around back curve short bottom', () => {
        expect(makeCurve(1,20,2,3)).to.almost.eql([
            1, 20, 1, 22, -1.3, 22, 
            -1.3, 11.5, -1.3, 0, 2, 0, 
            2, 3
        ]);
    });

    it('returns around back curve short top', () => {
        expect(makeCurve(2,20,1,3)).to.almost.eql([
            2, 20, 2, 23, -1.3, 23, 
            -1.3, 11.5, -1.3, 1, 1, 1, 
            1, 3
        ]);
    });
});

describe('generatePoints', () => {
    describe('vertical', () => {
        const expectedDirectPoints = [
            1.5, 3, 1.5, 3.6, 3.5, 3.3, 
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
            2, 2.5, 2.6, 2.5, 2.3, 4.5, 
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
            ['left' , 'left' ],
            ['left' , 'right'],
            ['left' , 'up'   ],
            ['left' , 'down' ],
            ['up'   , 'left' ],
            ['up'   , 'right'],
            ['up'   , 'up'   ],
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
                    direction: from,
                    x: 1, y: 2,
                },{
                    isSource: false,
                    direction: to,
                    x: 3, y: 4,
                })).to.throw(`Unsupported edge directions: from ${from} to ${to}.`);
            });
        });
    });
});

});
