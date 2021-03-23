import { expect } from 'chai';

import imageRewire from 'bgrapherimpl/image.js';
const makeForwardCurve = imageRewire.__get__('makeForwardCurve');
const pointsFlipYAxis = imageRewire.__get__('pointsFlipYAxis');
const pointsMove = imageRewire.__get__('pointsMove');
const pointsRotateCounterCW = imageRewire.__get__('pointsRotateCounterCW');
const pointsRotateCW = imageRewire.__get__('pointsRotateCW');

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
    it('returns correct forward curve', () => {
        expect(makeForwardCurve(5,8)).to.eql([
            0, 0, 0, 8, 5, 0, 
            5, 8
        ]);
    });
});
