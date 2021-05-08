import { expect } from 'chai';

import emptyBgraph from 'bgraphs/empty.json';
import nonZeroSizeBgraph from 'bgraphs/nonzerosize.json';
import basicBgraph from 'bgraphs/basic.json';
import basicEdgesBgraph from 'bgraphs/basicedges.json';
import oneEdgeBgraph from 'bgraphs/oneedge.json';
import overlapBgraph from 'bgraphs/overlap.json';
import sameDepthBgraph from 'bgraphs/samedepth.json';
import overlapEdgeEndBlockBgraph from 'bgraphs/overlapedgeendblock.json';
import edgesBgraph from 'bgraphs/edges.json';

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
        let bgrapher;
        beforeEach(function() {
            bgrapher = new BGrapher(fakeGrapher);
        });

        it('Generates empty bgraph', () => {
            bgrapher.initBgraph(emptyBgraph);
    
            expect(bgrapher.blocksData)  .to.eql({});
            expect(bgrapher.edgeEndsData).to.eql({});
        });
    
        it('Generates the right edgeEnd data', () => {
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
            bgrapher.initBgraph(oneEdgeBgraph);
    
            expect(bgrapher.blocksData[0].edgeEnds).to.eql([0,100]);
        });
    });
});

describe('initBgraph lookups', () => {
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
            [  -1,   -1],
            [   1,    1],
            [ 100,  100],
            [-100,  100],
            [ 100, -100],
            [-100, -100],
        ];

        validCoords.forEach(([x,y,id]) => {
            it (`returns the right block for ${x} ${y}`, () => {
                expect(bgrapher._blocksLookup.get(x, y)).to.equal(id);
                expect(bgrapher._edgeEndsLookup.get(x, y)).to.be.null;
            });
        });

        invalidCoords.forEach(([x,y]) => {
            it (`doesn't return any block for ${x} ${y}`, () => {
                expect(bgrapher._blocksLookup.get(x, y)).to.be.null;
                expect(bgrapher._edgeEndsLookup.get(x, y)).to.be.null;
            });
        });
    });

    describe('testDotsEdges', () => {
        let bgrapher = new BGrapher(fakeGrapher);
        bgrapher.initBgraph(testDotsEdges(2,2));

        const validBlockCoords = [
            [0,1,0],[1,1,0],
            [3,5,3],[4,5,3],
        ];
        const validEdgeEndCoords = [
            [0,0, 0],[1,0, 1],[0,2, 2],[1,2, 3],
            [3,4,12],[4,4,13],[3,6,14],[4,6,15],
        ];

        const invalidBlockCoords = [
            [0,0],[1,0], // is edgeEnd, not block
            [2,0],[2,3], // empty
        ];
        const invalidEdgeEndCoords = [
            [0,1],[1,1], // is block, not edgeEnd
            [2,0],[2,3], // empty
        ];

        validBlockCoords.forEach(([x,y,id]) => {
            it (`returns the right block for ${x} ${y}`, () => {
                expect(bgrapher._blocksLookup.get(x, y)).to.equal(id);
            });
        });

        validEdgeEndCoords.forEach(([x,y,id]) => {
            it (`returns the right edgeEnd for ${x} ${y}`, () => {
                expect(bgrapher._edgeEndsLookup.get(x, y)).to.equal(id);
            });
        });

        invalidBlockCoords.forEach(([x,y]) => {
            it (`doesn't return any block for ${x} ${y}`, () => {
                expect(bgrapher._blocksLookup.get(x, y)).to.be.null;
            });
        });

        invalidEdgeEndCoords.forEach(([x,y]) => {
            it (`doesn't return any edgeEnd for ${x} ${y}`, () => {
                expect(bgrapher._edgeEndsLookup.get(x, y)).to.be.null;
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
        let bgrapher;
        beforeEach(function() {
            bgrapher = new BGrapher(fakeGrapher);
        });

        function testLookup(lookup, i, expectedID) {
            const foundID = lookup.get(
                i%lookup.width, Math.floor(i/lookup.width)
            );

            expect(foundID).to.equal(expectedID);
        }

        let testBlackDotLocations = [0,2,8,10];
        let testWhiteDotLocations = [1,3,4,5,6,7,9,11];

        it (`empty bgraph`, () => {
            bgrapher.initBgraph(emptyBgraph);
            expect(bgrapher._blocksLookup).is.not.undefined;
            expect(bgrapher._edgeEndsLookup).is.not.undefined;

            expect(bgrapher._blocksLookup.get(0, 0)).to.be.null;
            expect(bgrapher._edgeEndsLookup.get(0, 0)).to.be.null;
        });

        it (`non-zero size bgraph`, () => {
            bgrapher.initBgraph(nonZeroSizeBgraph);
            expect(bgrapher._blocksLookup).is.not.undefined;
            expect(bgrapher._edgeEndsLookup).is.not.undefined;

            expect(bgrapher._blocksLookup.get(0, 0)).to.be.null;
            expect(bgrapher._edgeEndsLookup.get(0, 0)).to.be.null;

            expect(bgrapher._blocksLookup.width).to.equal(4);
            expect(bgrapher._blocksLookup.height).to.equal(4);
            expect(bgrapher._edgeEndsLookup.width).to.equal(4);
            expect(bgrapher._edgeEndsLookup.height).to.equal(4);
        });

        it('basic bgraph', () => {
            bgrapher.initBgraph(basicBgraph);
            const basicExpectedIDs = basicBgraph.blocks.map(e => e.id);

            testBlackDotLocations.forEach((i, index) => 
                testLookup(bgrapher._blocksLookup, i, basicExpectedIDs[index]));
            testWhiteDotLocations.forEach((i) => 
                testLookup(bgrapher._blocksLookup, i, null));
        });

        it('basic edges bgraph', () => {
            bgrapher.initBgraph(basicEdgesBgraph);

            testLookup(bgrapher._edgeEndsLookup, 0, 0);
            testLookup(bgrapher._edgeEndsLookup, 5, 100);
            [1,2,3,4,6,7,8].forEach(i => testLookup(bgrapher._edgeEndsLookup, i, null));
        });

        it('overlapping bgraph', () => {
            bgrapher.initBgraph(overlapBgraph);

            [0,1,4].forEach(i => testLookup(bgrapher._blocksLookup, i, 0));
            [5,6,9,10].forEach(i => testLookup(bgrapher._blocksLookup, i, 100));
            [11,14,15].forEach(i => testLookup(bgrapher._blocksLookup, i, 2));
            [2,3,7,8,12,13].forEach(i => testLookup(bgrapher._blocksLookup, i, null));
        });

        it('same depth bgraph', () => {
            bgrapher.initBgraph(sameDepthBgraph);

            [0,1,4].forEach(i => testLookup(bgrapher._blocksLookup, i, 0));
            [5,6,9,10].forEach(i => testLookup(bgrapher._blocksLookup, i, 100));
        });

        it('overlapping edgEnd and block', () => {
            bgrapher.initBgraph(overlapEdgeEndBlockBgraph);

            testLookup(bgrapher._blocksLookup, 0, 0);
            testLookup(bgrapher._blocksLookup, 1, 0);
            testLookup(bgrapher._edgeEndsLookup, 0, null);
            testLookup(bgrapher._edgeEndsLookup, 1, 0);
        });
    });
});


describe('interaction', () => {
    let bgrapher;
    beforeEach(function() {
        bgrapher = new BGrapher(fakeGrapher);
        bgrapher.initBgraph(edgesBgraph);
    });

    function activeBlockIDs(bgrapher) {
        return [...bgrapher.activeBlocks()]
            .map(b=>b.id);
    }

    function activeEdgeIDs(bgrapher) {
        return [...bgrapher.activeEdges()]
            .map(([s,e])=>[s.id,e.id]);
    }

    const functionMap = {
        hover: {
            block:   'hoverBlock',
            edgeEnd: 'hoverEdgeEnd'
        },
        toggle: {
            block:   'toggleBlock',
            edgeEnd: 'toggleEdgeEnd'
        },
    };

    function testInteractions(interactions, checkOrder=false) {
        interactions.forEach(interaction => {
            const description = interaction.actns
                .map(([a,c,id]) => [a,c,id === null ? 'null' : id])
                .map(a => `${a.join(' ')}`)
                .join(', ');

            it (`${description}`, () => {
                interaction.actns.forEach(([action, component, id]) => {
                    bgrapher[functionMap[action][component]](id);
                });

                if (checkOrder) {
                    expect( activeEdgeIDs(bgrapher)).to.eql(interaction.edges);
                    expect(activeBlockIDs(bgrapher)).to.eql(interaction.blcks);
                } else {
                    // console.log(new Set(activeEdgeIDs(bgrapher).map(e => e.toString())));
                    // console.log(new Set(interaction.edges.map(e => e.toString())));

                    expect(new Set(
                        activeEdgeIDs(bgrapher).map(e => e.toString())
                    )).to.eql(new Set(
                        interaction.edges.map(e => e.toString())
                    ));

                    expect(new Set(
                        activeBlockIDs(bgrapher).map(b => b.toString())
                    )).to.eql(new Set(
                        interaction.blcks.map(b => b.toString())
                    ));
                }
            });
        });
    }

    describe('hover block', () => {
        testInteractions([
            {
                actns: [['hover','block',null]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['hover','block',0]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['hover','block',1]],
                edges: [[0,2],[1,2],[0,3],[1,3]],
                blcks: [1],
            },
            {
                actns: [['hover','block',2]],
                edges: [[0,4]],
                blcks: [2],
            },
            {
                actns: [['hover','block',3]],
                edges: [],
                blcks: [3],
            },
            {
                actns: [['hover','block',2],
                        ['hover','block',2]],
                edges: [[0,4]],
                blcks: [2],
            },
            {
                actns: [['hover','block',0], 
                        ['hover','block',null]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['hover','block',1], 
                        ['hover','block',null]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['hover','block',2], 
                        ['hover','block',null]],
                edges: [],
                blcks: [],
            },
        ]);
    });

    describe('toggle block', () => {
        testInteractions([
            {
                actns: [['toggle','block',null]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','block',0]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','block',1]],
                edges: [[0,2],[1,2],[0,3],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','block',2]],
                edges: [[0,4]],
                blcks: [2],
            },
            {
                actns: [['toggle','block',3]],
                edges: [],
                blcks: [3],
            },
            {
                actns: [['toggle','block',2],
                        ['toggle','block',null]],
                edges: [[0,4]],
                blcks: [2],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',0]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','block',1]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','block',2],
                        ['toggle','block',2]],
                edges: [],
                blcks: [],
            },
        ]);
    });

    describe('hover edge end', () => {
        testInteractions([
            {
                actns: [['hover','edgeEnd',null]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['hover','edgeEnd',0]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['hover','edgeEnd',1]],
                edges: [[1,2],[1,3]],
                blcks: [],
            },
            {
                actns: [['hover','edgeEnd',2]],
                edges: [[0,2],[1,2]],
                blcks: [],
            },
            {
                actns: [['hover','edgeEnd',3]],
                edges: [[0,3],[1,3]],
                blcks: [],
            },
            {
                actns: [['hover','edgeEnd',4]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['hover','edgeEnd',5]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['hover','edgeEnd',4],
                        ['hover','edgeEnd',4]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['hover','edgeEnd',0],
                        ['hover','edgeEnd',null]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['hover','edgeEnd',4],
                        ['hover','edgeEnd',null]],
                edges: [],
                blcks: [],
            },
        ]);
    });

    describe('toggle edge end', () => {
        testInteractions([
            {
                actns: [['toggle','edgeEnd',null]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',1]],
                edges: [[1,2],[1,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',2]],
                edges: [[0,2],[1,2]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',3]],
                edges: [[0,3],[1,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',5]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',null]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',0]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',4]],
                edges: [],
                blcks: [],
            },
        ]);
    });

    describe('hover block after toggles', () => {
        testInteractions([
            {
                actns: [['toggle','edgeEnd',4],
                        ['hover','block',3]],
                edges: [[0,4]],
                blcks: [3],
            },
            {
                actns: [['toggle','edgeEnd',5],
                        ['hover','block',3]],
                edges: [],
                blcks: [3],
            },
            {
                actns: [['toggle','edgeEnd',5],
                        ['hover','block',2]],
                edges: [[0,4]],
                blcks: [2],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['hover','block',0]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['hover','block',0]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['hover','block',1]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','edgeEnd',2],
                        ['hover','block',0]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['hover','block',2]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [2],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['hover','block',2]],
                edges: [[0,4]],
                blcks: [2],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['hover','block',1]],
                edges: [[0,4],[0,2],[0,3],[1,2],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['hover','block',0],
                        ['hover','block',null]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['hover','block',0],
                        ['hover','block',null]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['hover','block',1],
                        ['hover','block',null]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',2],
                        ['hover','block',0],
                        ['hover','block',null]],
                edges: [[0,2],[1,2]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['hover','block',2],
                        ['hover','block',null]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['hover','block',2],
                        ['hover','block',null]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['hover','block',1],
                        ['hover','block',null]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','block',3],
                        ['hover','block',2]],
                edges: [[0,4]],
                blcks: [3,2],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','block',2],
                        ['hover','block',0]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [1,2,0],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',2],
                        ['hover','block',1]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0,2,1],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',1],
                        ['hover','block',2]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0,1,2],
            },
            {
                actns: [['toggle','block',2],
                        ['hover','block',0]],
                edges: [[0,4],[0,2],[0,3],[1,2],[1,3]],
                blcks: [2,0],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','block',2],
                        ['hover','block',0],
                        ['hover','block',null]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [1,2],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',2],
                        ['hover','block',1],
                        ['hover','block',null]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0,2],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',1],
                        ['hover','block',2],
                        ['hover','block',null]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0,1],
            },
            {
                actns: [['toggle','block',2],
                        ['hover','block',0],
                        ['hover','block',null]],
                edges: [[0,4]],
                blcks: [2],
            },
        ]);
    });

    describe('toggle block after toggles', () => {
        testInteractions([
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','block',3]],
                edges: [[0,4]],
                blcks: [3],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','block',0]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','block',2]],
                edges: [[0,4]],
                blcks: [2],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['toggle','block',0]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['toggle','block',1]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','edgeEnd',2],
                        ['toggle','block',0]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','block',2]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [2],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','block',2]],
                edges: [[0,4]],
                blcks: [2],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','block',1]],
                edges: [[0,4],[0,2],[0,3],[1,2],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','block',3],
                        ['toggle','block',2]],
                edges: [[0,4]],
                blcks: [3,2],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','block',2],
                        ['toggle','block',0]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [1,2,0],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',2],
                        ['toggle','block',1]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0,2,1],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',1],
                        ['toggle','block',2]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0,1,2],
            },
            {
                actns: [['toggle','block',2],
                        ['toggle','block',0]],
                edges: [[0,4],[0,2],[0,3],[1,2],[1,3]],
                blcks: [2,0],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','block',0],
                        ['toggle','block',0]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['toggle','block',0],
                        ['toggle','block',0]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['toggle','block',1],
                        ['toggle','block',1]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','block',2],
                        ['toggle','block',2]],
                edges: [[0,2],[0,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','block',2],
                        ['toggle','block',2]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','block',1],
                        ['toggle','block',1]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','block',2],
                        ['toggle','block',0],
                        ['toggle','block',0]],
                edges: [],
                blcks: [2],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','block',2],
                        ['toggle','block',0],
                        ['toggle','block',0]],
                edges: [],
                blcks: [1,2],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',1],
                        ['toggle','block',1]],
                edges: [[0,4]],
                blcks: [0],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',2],
                        ['toggle','block',1],
                        ['toggle','block',1]],
                edges: [[0,4]],
                blcks: [0,2],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',1],
                        ['toggle','block',2],
                        ['toggle','block',2]],
                edges: [[0,2],[0,3],[1,2],[1,3]],
                blcks: [0,1],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',2],
                        ['toggle','block',2]],
                edges: [[0,2],[0,3],[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','block',2],
                        ['toggle','block',2]],
                edges: [[0,2],[1,2],[0,3],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','edgeEnd',4],
                        ['toggle','block',0]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [1,0],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','edgeEnd',4],
                        ['toggle','block',0],
                        ['toggle','block',0]],
                edges: [],
                blcks: [1],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','edgeEnd',0],
                        ['toggle','block',0]],
                edges: [],
                blcks: [],
            },
        ]);
    });

    describe('hover edge end after toggles', () => {
        testInteractions([
            {
                actns: [['toggle','edgeEnd',5],
                        ['hover','edgeEnd',4]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['hover','edgeEnd',5]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['hover','edgeEnd',0]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['hover','edgeEnd',0]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['hover','edgeEnd',1]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['hover','edgeEnd',2]],
                edges: [[0,2],[0,3],[0,4],[1,2]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',2],
                        ['hover','edgeEnd',0]],
                edges: [[0,2],[1,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['hover','edgeEnd',2]],
                edges: [[0,4],[0,2],[1,2]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['hover','edgeEnd',0]],
                edges: [[0,4],[0,2],[0,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['hover','edgeEnd',0],
                        ['hover','edgeEnd',null]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['hover','edgeEnd',0],
                        ['hover','edgeEnd',null]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['hover','edgeEnd',1],
                        ['hover','edgeEnd',null]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['hover','edgeEnd',2],
                        ['hover','edgeEnd',null]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',2],
                        ['hover','edgeEnd',0],
                        ['hover','edgeEnd',null]],
                edges: [[0,2],[1,2]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['hover','edgeEnd',2],
                        ['hover','edgeEnd',null]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['hover','edgeEnd',0],
                        ['hover','edgeEnd',null]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','block',3],
                        ['hover','edgeEnd',4]],
                edges: [[0,4]],
                blcks: [3],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','block',2],
                        ['hover','edgeEnd',0]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [1,2],
            },
            {
                actns: [['toggle','block',1],
                        ['hover','edgeEnd',4]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','block',1],
                        ['hover','edgeEnd',0]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','block',0],
                        ['hover','edgeEnd',2]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',1],
                        ['hover','edgeEnd',4]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0,1],
            },
            {
                actns: [['toggle','block',2],
                        ['hover','edgeEnd',0]],
                edges: [[0,4],[0,2],[0,3]],
                blcks: [2],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','block',2],
                        ['hover','edgeEnd',0],
                        ['hover','edgeEnd',null]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [1,2],
            },
            {
                actns: [['toggle','block',1],
                        ['hover','edgeEnd',4],
                        ['hover','edgeEnd',null]],
                edges: [[0,2],[1,2],[0,3],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','block',1],
                        ['hover','edgeEnd',0],
                        ['hover','edgeEnd',null]],
                edges: [[0,2],[1,2],[0,3],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','block',0],
                        ['hover','edgeEnd',2],
                        ['hover','edgeEnd',null]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',1],
                        ['hover','edgeEnd',4],
                        ['hover','edgeEnd',null]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0,1],
            },
            {
                actns: [['toggle','block',2],
                        ['hover','edgeEnd',0],
                        ['hover','edgeEnd',null]],
                edges: [[0,4]],
                blcks: [2],
            },
        ]);
    });

    describe('toggle edge end after toggles', () => {
        testInteractions([
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',5],
                        ['toggle','edgeEnd',5]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',5],
                        ['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',4]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',3],
                        ['toggle','edgeEnd',3]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['toggle','edgeEnd',0]],
                edges: [[1,2],[1,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',1],
                        ['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',2],
                        ['toggle','edgeEnd',0]],
                edges: [[0,2],[1,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',2]],
                edges: [[0,2],[0,3],[0,4],[1,2]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',2]],
                edges: [[0,4],[0,2],[1,2]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',0]],
                edges: [[0,4],[0,2],[0,3]],
                blcks: [],
            },
            {
                actns: [['toggle','block',3],
                        ['toggle','edgeEnd',4]],
                edges: [[0,4]],
                blcks: [3],
            },
            {
                actns: [['toggle','block',2],
                        ['toggle','edgeEnd',5]],
                edges: [[0,4]],
                blcks: [2],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','block',2],
                        ['toggle','edgeEnd',0]],
                edges: [[1,2],[1,3]],
                blcks: [1,2],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','edgeEnd',0]],
                edges: [[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','edgeEnd',2]],
                edges: [[0,3],[0,4],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','block',1],
                        ['toggle','edgeEnd',4]],
                edges: [[0,2],[0,3],[1,2],[1,3]],
                blcks: [0,1],
            },
            {
                actns: [['toggle','block',2],
                        ['toggle','edgeEnd',0]],
                edges: [[0,4],[0,2],[0,3]],
                blcks: [2],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','edgeEnd',4]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','edgeEnd',0]],
                edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
                blcks: [1],
            },
            {
                actns: [['toggle','edgeEnd',1],
                        ['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',0]],
                edges: [[1,2],[1,3]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',1],
                        ['toggle','edgeEnd',1]],
                edges: [[0,2],[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',2],
                        ['toggle','edgeEnd',2]],
                edges: [[0,3],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',2],
                        ['toggle','edgeEnd',2]],
                edges: [[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',2],
                        ['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',3],
                        ['toggle','edgeEnd',3]],
                edges: [[0,2],[1,2],[0,4]],
                blcks: [],
            },
            {
                actns: [['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',0]],
                edges: [],
                blcks: [],
            },
            {
                actns: [['toggle','block',2],
                        ['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',0]],
                edges: [],
                blcks: [2],
            },
            {
                actns: [['toggle','block',0],
                        ['toggle','edgeEnd',4],
                        ['toggle','edgeEnd',4]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0],
            },
            {
                actns: [['toggle','block',1],
                        ['toggle','edgeEnd',0],
                        ['toggle','edgeEnd',0]],
                edges: [[1,2],[1,3]],
                blcks: [1],
            },
        ]);
    });

    describe('hover after hover', () => {
        testInteractions([
            {
                actns: [['hover','block',null],
                        ['hover','edgeEnd',1],
                        ['hover','edgeEnd',null],
                        ['hover','block',0]],
                edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
                blcks: [0],
            },
        ]);
    });
});

});
