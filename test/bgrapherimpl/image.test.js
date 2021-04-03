import { expect } from 'chai';

import { BgraphState } from 'bgraphstate.js'
import imageRewire, { ImageImpl } from 'bgrapherimpl/image.js';
const xyArray = imageRewire.__get__('xyArray');
const colorToRGB = imageRewire.__get__('colorToRGB');
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

    describe('initTestBgraph', () => {
        const bgraph = ImageImpl.initTestBgraph(2,2);

        it('Generates the right image size', () => {
            expect(bgraph.imageWidth).to.equal(4);
            expect(bgraph.imageHeight).to.equal(4);
        });

        it('Generates the right image', () => {
            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, white));
        });

        it('Generates the right block data', () => {
            const expectedIDs = [0,1,2,3];
            const expectedXYs = [[0,0],[2,0],[0,2],[2,2]];

            expect(bgraph.blocksData).to.have.all.keys(expectedIDs);
            expectedIDs.forEach((id, i) => {
                expect(bgraph.blocksData[id]['text']).to.have.string('This is block');
                expect(bgraph.blocksData[id]['text']).to.have.string(expectedXYs[i][0]);
                expect(bgraph.blocksData[id]['text']).to.have.string(expectedXYs[i][1]);
                expect(bgraph.blocksData[id]['edgeEnds']).to.eql([]);
            });
        });

        it('Generates the right edgeEnd data', () => {
            expect(bgraph.edgeEndsData).to.eql({});
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

            expect(bgraph.blocksData).to.eql({});
            expect(bgraph.edgeEndsData).to.eql({});
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

        it('Generates the right edgeEnd data', () => {
            const bgraph = ImageImpl.initBgraph({
                width:  4,
                height: 4,
                blocks: [],
                edgeEnds: [
                    {
                        id: 0,
                        x: 0, y: 0,
                        direction: 'down',
                        isSource: true,
                        edgeEnds: [
                            1
                        ],
                    },
                    {
                        id: 100,
                        x: 1, y: 1,
                        direction: 'up',
                        isSource: false,
                        edgeEnds: [
                            0
                        ],
                    },
                ],
            });

            expect(bgraph.edgeEndsData).to.have.all.keys(0,100);
            expect(bgraph.edgeEndsData[100]).to.eql({
                x: 1, y: 1,
                direction: 'up',
                isSource: false,
                edgeEnds: [
                    0
                ],
            });
        });

        it('Generates the right block edgeEnd data', () => {
            const bgraph = ImageImpl.initBgraph({
                width:  4,
                height: 4,
                blocks: [
                    {
                        id: 0,
                        x: 0, y: 0,
                        width: 2, height: 1,
                        depth: 0, color: 1,
                        edgeEnds: [
                            0,
                            100,
                        ],
                    }
                ],
                edgeEnds: [
                    {
                        id: 0,
                        x: 0, y: 1,
                        direction: 'down',
                        isSource: true,
                        edgeEnds: [
                            1
                        ],
                    },
                    {
                        id: 100,
                        x: 1, y: 1,
                        direction: 'up',
                        isSource: false,
                        edgeEnds: [
                            0
                        ],
                    },
                ],
            });

            expect(bgraph.blocksData[0].edgeEnds).to.eql([0,100]);
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

describe('getCurBlock', () => {
    function checkFoundID(foundID, expectedID) {
        if (expectedID === null) {
            expect(foundID).to.be.null;
        } else {
            expect(foundID).to.equal(expectedID);
        }
    }

    function checkFoundData(foundData, expectedData) {
        if (expectedData === null) {
            expect(foundData).to.be.null;
        } else {
            expect(foundData.text).to.be.a('string');
        }
    }

    function testGetCurBlock(bgraph, x, y, 
        expectedID=null, expectedData=null, 
        z=null, ox=null, oy=null
    ) {
        const bgraphState = new BgraphState();
        bgraphState.cur = {x: x, y: y};

        if (z !== null) {
            bgraphState.zoom = z;
        }

        if (ox !== null && oy !== null) {
            bgraphState.offset = {x: ox, y: oy};
        }

        const foundID = ImageImpl.getCurBlock(bgraphState, bgraph);
        checkFoundID(foundID, expectedID);

        const foundData = ImageImpl.getBlockData(bgraph, foundID);
        checkFoundData(foundData, expectedData);
    }

    const bgraphWithoutData = ImageImpl.initTestBgraphLarge(2,2);
    const bgraphWithData    = ImageImpl.initTestBgraph(2,2);

    const validCoords = [
        [0,0,0],
        [0.5,0.5,0],
        [2.5,2.5,3],
    ];

    const invalidCoords = [
        [-0.1, -0.1, null],
        [-100, 100, null],
        [100, -100, null],
        [1, 1, null],
        [1.5, 1.5, null],
        [100, 100, null],
        [-100, -100, null],
        [100, 100, null],
    ];

    describe('without zoom and offset', () => {
        it ('returns the right block', () => {
            validCoords.forEach(([x,y,id]) => {
                testGetCurBlock(bgraphWithoutData, x, y, id, null);
                testGetCurBlock(bgraphWithData,    x, y, id, true);
            });
        });

        it ('doesn\'t return any block', () => {
            invalidCoords.forEach(([x,y,id]) => {
                testGetCurBlock(bgraphWithoutData, x, y, id, null);
                testGetCurBlock(bgraphWithData,    x, y, id, null);
            });
        });
    });

    describe('with zoom and offset', () => {
        function changeCoords(coords, z, ox, oy) {
            return coords.map(([x,y,id]) => {
                return [(x+ox)*z, (y+oy)*z, id];
            });
        }

        [
            [1,50,100],
            [10,0,0],
            [10,50,100],
            [1,-50,-100],
            [10,-50,-100],
        ].forEach(([z,ox,oy]) => {
            const changedValidCoords   = changeCoords(validCoords,   z, ox, oy);
            const changedInvalidCoords = changeCoords(invalidCoords, z, ox, oy);

            it (`returns the right  block with z=${z},ox=${ox},oy=${oy}`, () => {
                changedValidCoords.forEach(([x,y,id]) => {
                    testGetCurBlock(bgraphWithoutData, x, y, id, null, z, ox, oy);
                    testGetCurBlock(bgraphWithData,    x, y, id, true, z, ox, oy);
                });
            });

            it (`doesn't return any block with z=${z},ox=${ox},oy=${oy}`, () => {
                changedInvalidCoords.forEach(([x,y,id]) => {
                    testGetCurBlock(bgraphWithoutData, x, y, id, null, z, ox, oy);
                    testGetCurBlock(bgraphWithData,    x, y, id, null, z, ox, oy);
                });
            });
        });
    });
});
