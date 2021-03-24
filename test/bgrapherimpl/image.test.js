import { expect } from 'chai';

import imageRewire, { ImageImpl } from 'bgrapherimpl/image.js';
const xyArray = imageRewire.__get__('xyArray');
const pointsFlipXY = imageRewire.__get__('pointsFlipXY');
const pointsMove = imageRewire.__get__('pointsMove');
const makeCurve = imageRewire.__get__('makeCurve');
const makeEdge = imageRewire.__get__('makeEdge');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var document = (new JSDOM(`...`)).window.document;
global.document = document;

describe('Data structure', () => {
    describe('xyArray', () => {
        function countDefaults(arr) {
            return arr.data.filter(e => e == -1).length;
        }

        it('has the right length', () => {
            const arr = new xyArray(10, 20);
            expect(arr.data.length).to.equal(200);
        });

        it('initialized to -1', () => {
            const arr = new xyArray(10, 20);
            expect(countDefaults(arr)).to.equal(200);
        });

        it('can set first', () => {
            let arr = new xyArray(10, 20);
            arr.set(0, 0, 5);
            expect(arr.data[0]).to.equal(5);
            expect(countDefaults(arr)).to.equal(199);
        });

        it('can set', () => {
            const arr = new xyArray(10, 20);
            arr.set(1, 2, 5);
            expect(arr.data[21]).to.equal(5);
            expect(countDefaults(arr)).to.equal(199);
        });

        it('can set last', () => {
            const arr = new xyArray(10, 20);
            arr.set(9, 19, 5);
            expect(arr.data[199]).to.equal(5);
            expect(countDefaults(arr)).to.equal(199);
        });

        it('can get', () => {
            const arr = new xyArray(10, 20);
            arr.set(4, 2, 5);
            expect(arr.get(4, 2)).to.equal(5);
        });

        const emptyDimensions = [
            [0,0],
            [10,0],
            [0,10],
        ];

        emptyDimensions.forEach(([w, h]) => {
            it('has the right empty length', () => {
                const arr = new xyArray(w, h);
                expect(arr.data.length).to.equal(0);
            });
        });
    });
});

describe('Generate image', () => {
    function testColor(bgraph, i, color) {
        let img = bgraph
            .buffer
            .getContext('2d')
            .getImageData(0,0,bgraph.imageWidth,bgraph.imageHeight)
            .data;
        let p = i * 4;

        expect(img[p+0]).to.equal(color[0]);
        expect(img[p+1]).to.equal(color[1]);
        expect(img[p+2]).to.equal(color[2]);
        expect(img[p+3]).to.equal(color[3]);
    }

    let black = [0,0,0,255];
    let white = [0,0,0,0]; // white because of opacity

    describe('initTestBgraphLarge', () => {
        it('Generates the right image size', () => {
            const bgraph = ImageImpl.initTestBgraphLarge(2,2);
            expect(bgraph.imageWidth).to.equal(4);
            expect(bgraph.imageHeight).to.equal(4);
        });

        it('Generates the right image', () => {
            const bgraph = ImageImpl.initTestBgraphLarge(2,2);
            [0,2,8,10].forEach(i => testColor(bgraph, i, black));
            [1,3,4,5,6,7,9,11].forEach(i => testColor(bgraph, i, white));
        });
    });
});

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
    })

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
