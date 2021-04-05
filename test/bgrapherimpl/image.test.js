import { expect } from 'chai';

import testOnlyDots from 'bgraphs/testonlydots.js';
import imageRewire, { ImageImpl } from 'grapherimpl/image.js';
const xyArray = imageRewire.__get__('xyArray');
const colorToRGB = imageRewire.__get__('colorToRGB');

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

describe('Convert color', () => {
    [
        [0,[0,0,0]],
        [1,[0,0,1]],
        [256,[0,1,0]],
        [65536,[1,0,0]],
        [1193046,[18,52,86]],
        [16777215,[255,255,255]],
    ].forEach(([color, expectedRGB]) => {
        it(`Correctly converts color ${color}`, () => {
            expect(colorToRGB(color)).to.eql(expectedRGB);
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

    function testLookup(bgraph, i, expectedID) {
        const foundID = bgraph.blocksLookup.get(
            i%bgraph.imageWidth, 
            Math.floor(i/bgraph.imageWidth)
        );

        expect(foundID).to.equal(expectedID);
    }

    let black = [0,0,0,255];
    let white = [0,0,0,0]; // white because of opacity
    let test1 = [0,0,1,255];
    let test2 = [0,0,2,255];
    let test3 = [0,0,3,255];

    let testBlackDotLocations = [0,2,8,10];
    let testWhiteDotLocations = [1,3,4,5,6,7,9,11];

    describe('initTestBgraphLarge', () => {
        const bgraph = ImageImpl.initTestBgraphLarge(2,2);

        it('Generates the right image size', () => {
            expect(bgraph.imageWidth).to.equal(4);
            expect(bgraph.imageHeight).to.equal(4);
        });

        it('Generates the right image', () => {
            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, white));
        });

        it('Generates the right lookup', () => {
            testBlackDotLocations.forEach((i, index) => testLookup(bgraph, i, index));
            testWhiteDotLocations.forEach((i)        => testLookup(bgraph, i, -1));
        });
    });

    describe('initBgraph only dots', () => {
        const bgraph = ImageImpl.initBgraph(testOnlyDots(2,2));

        it('Generates the right image size', () => {
            expect(bgraph.imageWidth).to.equal(4);
            expect(bgraph.imageHeight).to.equal(4);
        });

        it('Generates the right image', () => {
            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, white));
        });

        it('Generates the right lookup', () => {
            testBlackDotLocations.forEach((i, index) => testLookup(bgraph, i, index));
            testWhiteDotLocations.forEach((i)        => testLookup(bgraph, i, -1));
        });
    });

    describe('initBgraph', () => {
        it('Generates empty bgraph', () => {
            const bgraph = ImageImpl.initBgraph({
                width:  0,
                height: 0,
                blocks: [],
                edgeEnds: [],
            });

            expect(bgraph.imageWidth).to.equal(0);
            expect(bgraph.imageHeight).to.equal(0);
            expect(bgraph.blocksLookup).to.be.undefined;
            expect(bgraph.buffer).to.be.undefined;
            expect(bgraph.canvas).not.to.be.undefined;
        });

        it('Generates the right non-zero size', () => {
            const bgraph = ImageImpl.initBgraph({
                width:  4,
                height: 4,
                blocks: [],
                edgeEnds: [],
            });

            expect(bgraph.imageWidth).to.equal(4);
            expect(bgraph.imageHeight).to.equal(4);
            expect(bgraph.blocksLookup).not.to.be.undefined;
            expect(bgraph.buffer).not.to.be.undefined;
            expect(bgraph.canvas).not.to.be.undefined;

            expect(bgraph.buffer.width).to.equal(4);
            expect(bgraph.buffer.height).to.equal(4);
            expect(bgraph.blocksLookup.width).to.equal(4);
            expect(bgraph.blocksLookup.height).to.equal(4);
        });

        const testBGraphBasic = {
            width:  4,
            height: 4,
            blocks: [
                {
                    id: 0,
                    x: 0, y: 0,
                    width: 1, height: 1,
                    depth: 0, color: 0,
                    edgeEnds: [],
                },
                {
                    id: 100,
                    x: 2, y: 0,
                    width: 1, height: 1,
                    depth: 0, color: 0,
                    edgeEnds: [],
                },
                {
                    id: 2,
                    x: 0, y: 2,
                    width: 1, height: 1,
                    depth: 0, color: 0,
                    edgeEnds: [],
                },
                {
                    id: 123,
                    x: 2, y: 2,
                    width: 1, height: 1,
                    depth: 0, color: 0,
                    edgeEnds: [],
                },
            ],
            edgeEnds: [],
        };

        it('Generates the right image', () => {
            const bgraph = ImageImpl.initBgraph(testBGraphBasic);

            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, white));
        });

        it('Generates the right lookup', () => {
            const bgraph = ImageImpl.initBgraph(testBGraphBasic);
            const basicExpectedIDs = testBGraphBasic.blocks.map(e => e.id);

            testBlackDotLocations.forEach((i, index) => testLookup(bgraph, i, basicExpectedIDs[index]));
            testWhiteDotLocations.forEach((i)        => testLookup(bgraph, i, -1));
        });

        const testBGraphOverlapping = {
            width:  4,
            height: 4,
            blocks: [
                {
                    id: 0,
                    x: 0, y: 0,
                    width: 2, height: 2,
                    depth: 0, color: 1,
                    edgeEnds: [],
                },
                {
                    id: 100,
                    x: 1, y: 1,
                    width: 2, height: 2,
                    depth: 1, color: 2,
                    edgeEnds: [],
                },
                {
                    id: 2,
                    x: 2, y: 2,
                    width: 2, height: 2,
                    depth: 0, color: 3,
                    edgeEnds: [],
                },
            ],
            edgeEnds: [],
        };

        it('Generates the right overlapping image', () => {
            const bgraph = ImageImpl.initBgraph(testBGraphOverlapping);

            [0,1,4].forEach(i => testColor(bgraph, i, test1));
            [5,6,9,10].forEach(i => testColor(bgraph, i, test2));
            [11,14,15].forEach(i => testColor(bgraph, i, test3));
            [2,3,7,8,12,13].forEach(i => testColor(bgraph, i, white));
        });

        it('Generates the right overlapping lookup', () => {
            const bgraph = ImageImpl.initBgraph(testBGraphOverlapping);

            [0,1,4].forEach(i => testLookup(bgraph, i, 0));
            [5,6,9,10].forEach(i => testLookup(bgraph, i, 100));
            [11,14,15].forEach(i => testLookup(bgraph, i, 2));
            [2,3,7,8,12,13].forEach(i => testLookup(bgraph, i, -1));
        });

        const testBGraphOverlappingSameDepth = {
            width:  4,
            height: 4,
            blocks: [
                {
                    id: 0,
                    x: 0, y: 0,
                    width: 2, height: 2,
                    depth: 0, color: 1,
                    edgeEnds: [],
                },
                {
                    id: 100,
                    x: 1, y: 1,
                    width: 2, height: 2,
                    depth: 0, color: 2,
                    edgeEnds: [],
                },
            ],
            edgeEnds: [],
        };

        it('Generates the right overlapping same depth image', () => {
            const bgraph = ImageImpl.initBgraph(testBGraphOverlappingSameDepth);

            [0,1,4].forEach(i => testColor(bgraph, i, test1));
            [5,6,9,10].forEach(i => testColor(bgraph, i, test2));
        });

        it('Generates the right overlapping same depth lookup', () => {
            const bgraph = ImageImpl.initBgraph(testBGraphOverlappingSameDepth);

            [0,1,4].forEach(i => testLookup(bgraph, i, 0));
            [5,6,9,10].forEach(i => testLookup(bgraph, i, 100));
        });
    });
});

describe('getCurBlock', () => {
    function testGetCurBlock(bgraph, x, y, expectedID) {
        const foundID = ImageImpl.getCurBlock(bgraph, x, y);

        if (expectedID === null) {
            expect(foundID).to.be.null;
        } else {
            expect(foundID).to.equal(expectedID);
        }
    }

    const bgraphWithoutData = ImageImpl.initTestBgraphLarge(2,2);
    const bgraphWithData    = ImageImpl.initBgraph(testOnlyDots(2,2));

    const validCoords = [
        [0,0,0],
        [2,2,3],
    ];

    const invalidCoords = [
        [1, 1, null],
        [-1, -1, null],
        [100, 100, null],
        [-100, 100, null],
        [100, -100, null],
        [-100, -100, null],
    ];

    it ('returns the right block', () => {
        validCoords.forEach(([x,y,id]) => {
            testGetCurBlock(bgraphWithoutData, x, y, id);
            testGetCurBlock(bgraphWithData,    x, y, id);
        });
    });

    it ('doesn\'t return any block', () => {
        invalidCoords.forEach(([x,y,id]) => {
            testGetCurBlock(bgraphWithoutData, x, y, id);
            testGetCurBlock(bgraphWithData,    x, y, id);
        });
    });
});
