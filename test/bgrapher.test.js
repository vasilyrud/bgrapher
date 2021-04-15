import { expect } from 'chai';

import testOnlyDots from 'bgraphs/testonlydots.js';
import { BgraphState } from 'bgraphstate.js'
import bgrapherRewire, {BGrapher} from 'bgrapher.js'
const curBgraphPixel = bgrapherRewire.__get__('curBgraphPixel');
const EdgeSet = bgrapherRewire.__get__('EdgeSet');

const FakeGrapher = {
    initBgraph: () => {},
};

describe('initBgraph onlyDots', () => {
    const inputData = testOnlyDots(2,2);
    const expectedIDs = [0,1,2,3];
    const expectedXYs = [[0,0],[2,0],[0,2],[2,2]];

    let bgraphers = {
        'from object': new BGrapher(FakeGrapher),
        'from string': new BGrapher(FakeGrapher),
    };
    bgraphers['from object'].initBgraph(inputData);
    bgraphers['from string'].initBgraph(JSON.stringify(inputData));

    Object.entries(bgraphers).forEach(([description,bgrapher]) => {
        it(`Generates the right block data ${description}`, () => {
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

describe('initBgraph', () => {
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
        expect(bgrapher.getBlockData(0)).to.be.null;
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
        expect(bgrapher.edgeEndsData[100]).to.eql({
            id: 100,
            x: 1, y: 1,
            direction: 'up',
            isSource: false,
            edgeEnds: [
                0
            ],
        });
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

        expect(bgrapher.getBlockData(0).edgeEnds).to.eql([0,100]);
    });
});

describe('EdgeSet', () => {
    it('Default empty can query', () => {
        let seen = new EdgeSet();
        expect(seen.has(0,0)).to.be.false;
        expect(seen.has(1,2)).to.be.false;
        expect(seen.has(2,1)).to.be.false;
    });

    it('Simple add', () => {
        let seen = new EdgeSet();
        seen.add(1,2);
        expect(seen.has(1,2)).to.be.true;
        expect(seen.has(1,1)).to.be.false;
        expect(seen.has(2,2)).to.be.false;
    });
    
    it('Reverse add', () => {
        let seen = new EdgeSet();
        seen.add(2,1);
        expect(seen.has(2,1)).to.be.true;
        expect(seen.has(1,1)).to.be.false;
        expect(seen.has(2,2)).to.be.false;
    });
    
    it('Equal add', () => {
        let seen = new EdgeSet();
        seen.add(0,0);
        expect(seen.has(0,0)).to.be.true;
        expect(seen.has(0,1)).to.be.false;
        expect(seen.has(1,0)).to.be.false;
    });

    it('Add the same', () => {
        let seen = new EdgeSet();
        seen.add(1,2);
        seen.add(1,2);
        expect(seen.has(1,2)).to.be.true;
        expect(Object.keys(seen.seen).length).to.be.equal(1);
        expect(seen.seen[1].size).to.be.equal(1);
    });

    it('Add and has in reverse', () => {
        let seen = new EdgeSet();
        seen.add(0,0);
        seen.add(1,2);
        seen.add(4,3);
        expect(seen.has(0,0)).to.be.true;
        expect(seen.has(2,1)).to.be.true;
        expect(seen.has(3,4)).to.be.true;
    });

    it('Add the same in reverse', () => {
        let seen = new EdgeSet();
        seen.add(1,2);
        seen.add(2,1);
        expect(seen.has(1,2)).to.be.true;
        expect(Object.keys(seen.seen).length).to.be.equal(1);
        expect(seen.seen[1].size).to.be.equal(1);
    });
});

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
