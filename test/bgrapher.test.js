import { expect } from 'chai';

import emptyBgraph from 'bgraphs/empty.json';
import nonZeroSizeBgraph from 'bgraphs/nonzerosize.json';
import basicBgraph from 'bgraphs/basic.json';
import basicEdgesBgraph from 'bgraphs/basicedges.json';
import oneEdgeBgraph from 'bgraphs/oneedge.json';
import overlapBgraph from 'bgraphs/overlap.json';
import sameDepthBgraph from 'bgraphs/samedepth.json';

import { BgraphState } from 'bgraphstate.js'
import testOnlyDots from 'bgraphs/testonlydots.js';
import testDotsEdges from 'bgraphs/testdotsedges.js';
import bgrapherRewire, {BGrapher} from 'bgrapher.js'

describe(require('path').basename(__filename), () => {

const fakeGrapher = {
    initBgraph: () => {},
    initTestBgraphLarge: () => {},
};

describe('initBgraph data', () => {
    describe('onlyDots', () => {
        const inputData = testOnlyDots(2,2);
        const expectedIDs = [0,1,2,3];
        const expectedXYs = [[0,0],[2,0],[0,2],[2,2]];

        let bgraphers = {
            'object': new BGrapher(fakeGrapher),
            'string': new BGrapher(fakeGrapher),
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

    describe('dotsEdges', () => {
        const inputData = testDotsEdges(2,2);
        const expectedBlocksData = [
            [0,[ 0, 1, 2, 3]],
            [1,[ 4, 5, 6, 7]],
            [2,[ 8, 9,10,11]],
            [3,[12,13,14,15]],
        ];
        const expectedEdgeEndsData = [
            [ 0,[14],false],[ 1,[15],false],[ 2,[ 4],true],[ 3,[ 5],true],
            [ 4,[ 2],false],[ 5,[ 3],false],[ 6,[ 8],true],[ 7,[ 9],true],
            [ 8,[ 6],false],[ 9,[ 7],false],[10,[12],true],[11,[13],true],
            [12,[10],false],[13,[11],false],[14,[ 0],true],[15,[ 1],true],
        ];

        let bgrapher = new BGrapher(fakeGrapher);
        bgrapher.initBgraph(inputData);

        it(`Generates the right block edgeEnds data`, () => {
            expectedBlocksData.forEach(([id, edgeEnds]) => {
                expect(bgrapher.blocksData[id]['edgeEnds']).to.eql(edgeEnds);
            });
        });

        it(`Generates the right edgeEnds data`, () => {
            expectedEdgeEndsData.forEach(([id, edgeEnds, isSource]) => {
                expect(bgrapher.edgeEndsData[id]['edgeEnds']).to.eql(edgeEnds);
                expect(bgrapher.edgeEndsData[id]['isSource']).to.eql(isSource);
            });
        });
    });

    describe('sample graphs', () => {
        it('Generates empty bgraph', () => {
            let bgrapher = new BGrapher(fakeGrapher);
            bgrapher.initBgraph(emptyBgraph);
    
            expect(bgrapher.blocksData)  .to.eql({});
            expect(bgrapher.edgeEndsData).to.eql({});
        });
    
        it('Generates the right edgeEnd data', () => {
            let bgrapher = new BGrapher(fakeGrapher);
            bgrapher.initBgraph(basicEdgesBgraph);
    
            expect(bgrapher.edgeEndsData).to.have.all.keys(0,100);
            expect(bgrapher.edgeEndsData[100].id)       .to.eql(100);
            expect(bgrapher.edgeEndsData[100].x)        .to.eql(1);
            expect(bgrapher.edgeEndsData[100].y)        .to.eql(1);
            expect(bgrapher.edgeEndsData[100].direction).to.eql(1);
            expect(bgrapher.edgeEndsData[100].isSource) .to.eql(false);
            expect(bgrapher.edgeEndsData[100].edgeEnds) .to.eql([0]);
        });
    
        it('Generates the right block edgeEnd data', () => {
            let bgrapher = new BGrapher(fakeGrapher);
            bgrapher.initBgraph(oneEdgeBgraph);
    
            expect(bgrapher.blocksData[0].edgeEnds).to.eql([0,100]);
        });
    });
});

describe('initBgraph lookup block', () => {
    describe('testOnlyDots', () => {
        let bgrapher = new BGrapher(fakeGrapher);
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
                expect(bgrapher._blocksLookup.get(x, y)).to.equal(id);
            });
        });

        invalidCoords.forEach(([x,y]) => {
            it (`doesn't return any block for ${x} ${y}`, () => {
                expect(bgrapher._blocksLookup.get(x, y)).to.be.null;
            });
        });
    });

    describe('initTestBgraphLarge', () => {
        let bgrapher = new BGrapher(fakeGrapher);
        bgrapher._initTestBgraphLarge(2,2);
        const bgraphState = new BgraphState();

        it (`does not generate lookup`, () => {
            expect(bgrapher.curBlock(bgraphState, {x: 0,y: 0})).to.be.null;
            expect(bgrapher.curBlock(bgraphState, {x: 1,y: 1})).to.be.null;
            expect(bgrapher.curBlock(bgraphState, {x:-1,y:-1})).to.be.null;
        });
    });

    describe('sample graphs', () => {
        function testLookup(bgrapher, i, expectedID) {
            const foundID = bgrapher._blocksLookup.get(
                i%bgrapher._blocksLookup.width, 
                Math.floor(i/bgrapher._blocksLookup.width)
            );

            expect(foundID).to.equal(expectedID);
        }

        let testBlackDotLocations = [0,2,8,10];
        let testWhiteDotLocations = [1,3,4,5,6,7,9,11];

        it (`empty bgraph`, () => {
            let bgrapher = new BGrapher(fakeGrapher);
            bgrapher.initBgraph(emptyBgraph);
            expect(bgrapher._blocksLookup).is.not.undefined;
            expect(bgrapher._blocksLookup.get(0, 0)).to.be.null;
        });

        it (`non-zero size bgraph`, () => {
            let bgrapher = new BGrapher(fakeGrapher);
            bgrapher.initBgraph(nonZeroSizeBgraph);
            expect(bgrapher._blocksLookup).is.not.undefined;
            expect(bgrapher._blocksLookup.get(0, 0)).to.be.null;
            expect(bgrapher._blocksLookup.width).to.equal(4);
            expect(bgrapher._blocksLookup.height).to.equal(4);
        });

        it('basic bgraph', () => {
            let bgrapher = new BGrapher(fakeGrapher);
            bgrapher.initBgraph(basicBgraph);
            const basicExpectedIDs = basicBgraph.blocks.map(e => e.id);

            testBlackDotLocations.forEach((i, index) => testLookup(bgrapher, i, basicExpectedIDs[index]));
            testWhiteDotLocations.forEach((i)        => testLookup(bgrapher, i, null));
        });

        it('overlapping bgraph', () => {
            let bgrapher = new BGrapher(fakeGrapher);
            bgrapher.initBgraph(overlapBgraph);

            [0,1,4].forEach(i => testLookup(bgrapher, i, 0));
            [5,6,9,10].forEach(i => testLookup(bgrapher, i, 100));
            [11,14,15].forEach(i => testLookup(bgrapher, i, 2));
            [2,3,7,8,12,13].forEach(i => testLookup(bgrapher, i, null));
        });

        it('same depth bgraph', () => {
            let bgrapher = new BGrapher(fakeGrapher);
            bgrapher.initBgraph(sameDepthBgraph);

            [0,1,4].forEach(i => testLookup(bgrapher, i, 0));
            [5,6,9,10].forEach(i => testLookup(bgrapher, i, 100));
        });
    });
});

});
