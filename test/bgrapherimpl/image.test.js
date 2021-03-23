import { expect } from 'chai';

import imageRewire from 'bgrapherimpl/image.js';
const pointsFlipYAxis = imageRewire.__get__('pointsFlipYAxis');
const pointsMove = imageRewire.__get__('pointsMove');
const pointsRotateCounterCW = imageRewire.__get__('pointsRotateCounterCW');
const pointsRotateCW = imageRewire.__get__('pointsRotateCW');
const makeCurve = imageRewire.__get__('makeCurve');
const makeEdge = imageRewire.__get__('makeEdge');

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

    describe('pointsFlipYAxis', () => {
        it('flips points along Y axis', () => {
            expect (pointsFlipYAxis(input)).to.eql([
                -0,  0,
                -1,  0,
                -0,  2,
                 3, -4,
                -5, -6,
                 7,  8,
                -9, 10,
            ]);
        });
    })

    describe('pointsMove', () => {
        it('translates points forward', () => {
            expect (pointsMove(input, 5, 2)).to.eql([
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
            expect (pointsMove(input, -5, -2)).to.eql([
                -5, -2,
                -4, -2,
                -5,  0,
                -8, -6,
                 0, -8,
                -12, 6,
                 4,  8,
            ]);
        });
    })

    describe('pointsRotateCounterCW', () => {
        it('Rotates counter-clockwise around origin', () => {
            expect (pointsRotateCounterCW(input)).to.eql([
                 0, -0,
                 0, -1,
                 2, -0,
                -4,  3,
                -6, -5,
                 8,  7,
                10, -9,
            ]);
        });
    })

    describe('pointsRotateCW', () => {
        it('Rotates clockwise around origin', () => {
            expect (pointsRotateCW(input)).to.eql([
                -0,  0,
                -0,  1,
                -2,  0,
                 4, -3,
                 6,  5,
                -8, -7,
                -10, 9,
            ]);
        });
    })
});

describe('makeCurve', () => {
    it('returns forward curve', () => {
        expect(makeCurve(1,2,3,4)).to.eql([
            1, 2, 1, 4, 3, 2, 
            3, 4
        ]);
    });

    it('returns direct back curve', () => {
        expect(makeCurve(10,20,1,2)).to.eql([
            10, 20, 10, 24.25, 5.5, 24.25, 
            5.5, 20, 5.5, 2, 5.5, 20, 
            5.5, 2, 5.5, -2.25, 1, -2.25, 
            1, 2
        ]);
    });

    it('returns around back curve short bottom', () => {
        expect(makeCurve(1,20,2,3)).to.eql([
            1, 20, 1, 22, -1, 22, 
            -1, 20, -1, 3, -1, 20, 
            -1, 3, -1, 0, 2, 0, 
            2, 3
        ]);
    });

    it('returns around back curve short top', () => {
        expect(makeCurve(2,20,1,3)).to.eql([
            2, 20, 2, 23, -1, 23, 
            -1, 20, -1, 3, -1, 20, 
            -1, 3, -1, 1, 1, 1, 
            1, 3
        ]);
    });
});

describe('makeEdge', () => {
    describe('vertical', () => {
        const expectedDirectPoints = [
            1.5, 3, 1.5, 4, 3.5, 3, 
            3.5, 4
        ];

        it ('returns direct from source', () => {
            expect(makeEdge({
                isSource: true,
                direction: "down",
                x: 1,
                y: 2,
            },{
                isSource: false,
                direction: "down",
                x: 3,
                y: 4,
            })).to.eql(expectedDirectPoints);
        });

        it ('returns direct from dest', () => {
            expect(makeEdge({
                isSource: false,
                direction: "down",
                x: 3,
                y: 4,
            },{
                isSource: true,
                direction: "down",
                x: 1,
                y: 2,
            })).to.eql(expectedDirectPoints);
        });
    });

    describe('horizontal', () => {
        const expectedDirectPoints = [
            2, 2.5, 3, 2.5, 2, 4.5, 
            3, 4.5
        ];

        it ('returns direct from source', () => {
            expect(makeEdge({
                isSource: true,
                direction: 'right',
                x: 1,
                y: 2,
            },{
                isSource: false,
                direction: 'right',
                x: 3,
                y: 4,
            })).to.eql(expectedDirectPoints);
        });

        it ('returns direct from dest', () => {
            expect(makeEdge({
                isSource: false,
                direction: 'right',
                x: 3,
                y: 4,
            },{
                isSource: true,
                direction: 'right',
                x: 1,
                y: 2,
            })).to.eql(expectedDirectPoints);
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
                expect(() => makeEdge({
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
