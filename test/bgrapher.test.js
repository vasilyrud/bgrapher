import { expect } from 'chai';

import { BgraphState } from 'bgraphstate.js'
import bgrapherRewire from 'bgrapher.js'
const curBgraphPixel = bgrapherRewire.__get__('curBgraphPixel');

describe('curBgraphPixel', () => {
    function testCurBgraphPixel(
        x, y, expectedX, expectedY, 
        z=1.0, ox=0, oy=0
    ) {
        const bgraphState = new BgraphState();
        bgraphState.zoom = z;
        bgraphState.offset = {x: ox, y: oy};
        const cur = {x: x, y: y};

        expect(curBgraphPixel('x', bgraphState, cur)).to.equal(expectedX);
        expect(curBgraphPixel('y', bgraphState, cur)).to.equal(expectedY);
    }

    const testCoords = [
        [0,0,0,0],
        [0.5,0.5,0,0],
        [2.5,2.5,2,2],
        [1,1,1,1],
        [-0.1,-0.1,-1,-1],
        [100,100,100,100],
        [-100,100,-100,100],
        [100,-100,100,-100],
        [-100,-100,-100,-100],
    ];

    describe('without zoom and offset', () => {
        it ('returns the right bgraph coord', () => {
            testCoords.forEach(([x,y,expectedX,expectedY]) => {
                testCurBgraphPixel(x, y, expectedX, expectedY);
            });
        });
    });

    describe('with zoom and offset', () => {
        [
            [1,50,100],
            [10,0,0],
            [10,50,100],
            [1,-50,-100],
            [10,-50,-100],
        ].forEach(([z,ox,oy]) => {
            it (`returns the right bgraph coord with z=${z},ox=${ox},oy=${oy}`, () => {
                testCoords.map(([x,y,expectedX,expectedY]) => [
                    (x+ox)*z, (y+oy)*z, expectedX, expectedY
                ]).forEach(([x,y,expectedX,expectedY]) => {
                    testCurBgraphPixel(x, y, expectedX, expectedY, z, ox, oy);
                });
            });
        });
    });
});
