import { expect } from 'chai';

import emptyBgraph from 'bgraphs/empty.json';
import nonZeroSizeBgraph from 'bgraphs/nonzerosize.json';
import basicBgraph from 'bgraphs/basic.json';
import overlapBgraph from 'bgraphs/overlap.json';
import sameDepthBgraph from 'bgraphs/samedepth.json';

import { BgraphState } from 'bgraphstate.js'
import testOnlyDots from 'bgraphs/testonlydots.js';
import bgrapherRewire, {BGrapher} from 'bgrapher.js'

const FakeGrapher = {
    initBgraph: () => {},
    initTestBgraphLarge: () => {},
};

describe('initBgraph onlyDots', () => {
    const inputData = testOnlyDots(2,2);
    const expectedIDs = [0,1,2,3];
    const expectedXYs = [[0,0],[2,0],[0,2],[2,2]];

    let bgraphers = {
        'object': new BGrapher(FakeGrapher),
        'string': new BGrapher(FakeGrapher),
    };
    bgraphers['object'].initBgraph(inputData);
    bgraphers['string'].initBgraph(JSON.stringify(inputData));

    Object.entries(bgraphers).forEach(([description,bgrapher]) => {
        it(`Generates the right block data from ${description}`, () => {
            expect(bgrapher.blocksData).to.have.all.keys(expectedIDs);
            expectedIDs.forEach((id, i) => {
                expect(bgrapher.blocksData[id]['text']).to.have.string('This is block');
                expect(bgrapher.blocksData[id]['text']).to.have.string(expectedXYs[i][0]);
                expect(bgrapher.blocksData[id]['text']).to.have.string(expectedXYs[i][1]);
                expect(bgrapher.blocksData[id]['edgeEnds']).to.eql([]);
            });
        });

        it(`Generates the right edgeEnd data ${description}`, () => {
            expect(bgrapher.edgeEndsData).to.eql({});
        });
    });
});

describe('initBgraph data', () => {
    it('Generates empty bgraph', () => {
        let bgrapher = new BGrapher(FakeGrapher);
        bgrapher.initBgraph({
            width:  0,
            height: 0,
            blocks: [],
            edgeEnds: [],
        });

        expect(bgrapher.blocksData).to.eql({});
        expect(bgrapher.edgeEndsData).to.eql({});
        expect(bgrapher.blocksData[0]).to.be.null;
    });

    it('Generates the right edgeEnd data', () => {
        let bgrapher = new BGrapher(FakeGrapher);
        bgrapher.initBgraph({
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

        expect(bgrapher.edgeEndsData).to.have.all.keys(0,100);
        expect(bgrapher.edgeEndsData[100].id)       .to.eql(100);
        expect(bgrapher.edgeEndsData[100].x)        .to.eql(1);
        expect(bgrapher.edgeEndsData[100].y)        .to.eql(1);
        expect(bgrapher.edgeEndsData[100].direction).to.eql(1);
        expect(bgrapher.edgeEndsData[100].isSource) .to.eql(false);
        expect(bgrapher.edgeEndsData[100].edgeEnds) .to.eql([0]);
    });

    it('Generates the right block edgeEnd data', () => {
        let bgrapher = new BGrapher(FakeGrapher);
        bgrapher.initBgraph({
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

        expect(bgrapher.blocksData[0].edgeEnds).to.eql([0,100]);
    });
});

describe('lookup block testOnlyDots', () => {
    let bgrapher = new BGrapher(FakeGrapher);
    bgrapher.initBgraph(testOnlyDots(2,2));

    const validCoords = [
        [0,0,0],
        [2,0,1],
        [0,2,2],
        [2,2,3],
    ];

    const invalidCoords = [
        [   1,    1],
        [  -1,   -1],
        [ 100,  100],
        [-100,  100],
        [ 100, -100],
        [-100, -100],
    ];

    validCoords.forEach(([x,y,id]) => {
        it (`returns the right block for ${x} ${y}`, () => {
            expect(bgrapher.lookup.get(x, y)).to.equal(id);
        });
    });

    invalidCoords.forEach(([x,y]) => {
        it (`doesn't return any block for ${x} ${y}`, () => {
            expect(bgrapher.lookup.get(x, y)).to.be.null;
        });
    });
});

describe('lookup block initTestBgraphLarge', () => {
    let bgrapher = new BGrapher(FakeGrapher);
    bgrapher.initTestBgraphLarge(2,2);
    const bgraphState = new BgraphState();

    it (`does not generate lookup`, () => {
        expect(bgrapher.curBlock(bgraphState, {x: 0,y: 0})).to.be.null;
        expect(bgrapher.curBlock(bgraphState, {x: 1,y: 1})).to.be.null;
        expect(bgrapher.curBlock(bgraphState, {x:-1,y:-1})).to.be.null;
    });
});

describe('lookup block samples', () => {
    function testLookup(bgrapher, i, expectedID) {
        const foundID = bgrapher.lookup.get(
            i%bgrapher.lookup.width, 
            Math.floor(i/bgrapher.lookup.width)
        );

        expect(foundID).to.equal(expectedID);
    }

    let testBlackDotLocations = [0,2,8,10];
    let testWhiteDotLocations = [1,3,4,5,6,7,9,11];

    it (`empty bgraph`, () => {
        let bgrapher = new BGrapher(FakeGrapher);
        bgrapher.initBgraph(emptyBgraph);
        expect(bgrapher.lookup).is.not.undefined;
        expect(bgrapher.lookup.get(0, 0)).to.be.null;
    });

    it (`non-zero size bgraph`, () => {
        let bgrapher = new BGrapher(FakeGrapher);
        bgrapher.initBgraph(nonZeroSizeBgraph);
        expect(bgrapher.lookup).is.not.undefined;
        expect(bgrapher.lookup.get(0, 0)).to.be.null;
        expect(bgrapher.lookup.width).to.equal(4);
        expect(bgrapher.lookup.height).to.equal(4);
    });

    it('basic bgraph', () => {
        let bgrapher = new BGrapher(FakeGrapher);
        bgrapher.initBgraph(basicBgraph);
        const basicExpectedIDs = basicBgraph.blocks.map(e => e.id);

        testBlackDotLocations.forEach((i, index) => testLookup(bgrapher, i, basicExpectedIDs[index]));
        testWhiteDotLocations.forEach((i)        => testLookup(bgrapher, i, null));
    });

    it('overlapping bgraph', () => {
        let bgrapher = new BGrapher(FakeGrapher);
        bgrapher.initBgraph(overlapBgraph);

        [0,1,4].forEach(i => testLookup(bgrapher, i, 0));
        [5,6,9,10].forEach(i => testLookup(bgrapher, i, 100));
        [11,14,15].forEach(i => testLookup(bgrapher, i, 2));
        [2,3,7,8,12,13].forEach(i => testLookup(bgrapher, i, null));
    });

    it('same depth bgraph', () => {
        let bgrapher = new BGrapher(FakeGrapher);
        bgrapher.initBgraph(sameDepthBgraph);

        [0,1,4].forEach(i => testLookup(bgrapher, i, 0));
        [5,6,9,10].forEach(i => testLookup(bgrapher, i, 100));
    });
});
