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
import colorBgraph from 'bgraphs/color.json';

import { BgraphState } from 'bgraphstate.js'
import testOnlyDots from 'bgraphs/testonlydots.js';
import testDotsEdges from 'bgraphs/testdotsedges.js';
import bgrapherRewire, {Bgrapher} from 'bgrapher.js'

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var document = (new JSDOM(`...`)).window.document;
global.document = document;

describe(require('path').basename(__filename), () => {

const fakeGrapher = {
  initBgraph: () => {},
  getClientWidth: (s) => { return s.cw; },
  getClientHeight: (s) => { return s.ch; },
  setClientSize: (s,w,h) => { s.cw = w; s.ch = h; },
};

describe('initBgraph data', () => {
  describe('onlyDots', () => {
    const inputData = testOnlyDots(2,2);
    const expectedIDs = [0,1,2,3];

    let bgraphers = {
      'object': new Bgrapher(),
      'string': new Bgrapher(),
    };

    bgraphers['object']._grapherImpl = fakeGrapher;
    bgraphers['object'].initBgraph(inputData);

    bgraphers['string']._grapherImpl = fakeGrapher;
    bgraphers['string'].initBgraph(JSON.stringify(inputData));

    Object.entries(bgraphers).forEach(([description,bgrapher]) => {
      it(`Generates the right block data from ${description}`, () => {
        expect(bgrapher.blocksData).to.have.all.keys(expectedIDs);
        expectedIDs.forEach((id, i) => {
          expect(bgrapher.blocksData[id]['label']).to.have.string('This is block');
          expect(bgrapher.blocksData[id]['label']).to.have.string(expectedIDs[i]);
          expect(bgrapher.blocksData[id]['edgeEnds']).to.eql([]);
        });
      });

      it(`Generates the right edgeEnd data ${description}`, () => {
        expect(bgrapher.edgeEndsData).to.eql({});
      });

      it(`Can lookup cur block ${description}`, () => {
        bgrapher.bgraphState = new BgraphState();
        expect(bgrapher.curBlock({x:0,y:0}).id).to.be.equal(0);
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
      [ 0,0,[14],false],[ 1,0,[15],false],[ 2,0,[ 4],true],[ 3,0,[ 5],true],
      [ 4,1,[ 2],false],[ 5,1,[ 3],false],[ 6,1,[ 8],true],[ 7,1,[ 9],true],
      [ 8,2,[ 6],false],[ 9,2,[ 7],false],[10,2,[12],true],[11,2,[13],true],
      [12,3,[10],false],[13,3,[11],false],[14,3,[ 0],true],[15,3,[ 1],true],
    ];

    let bgrapher = new Bgrapher();
    bgrapher._grapherImpl = fakeGrapher;
    bgrapher.initBgraph(inputData);

    it(`Generates the right block edgeEnds data`, () => {
      expectedBlocksData.forEach(([id, edgeEnds]) => {
        expect(bgrapher.blocksData[id]['edgeEnds']).to.eql(edgeEnds);
      });
    });

    it(`Generates the right edgeEnds data`, () => {
      expectedEdgeEndsData.forEach(([id, block, edgeEnds, isSource]) => {
        expect(bgrapher.edgeEndsData[id].block).to.eql(block);
        expect(bgrapher.edgeEndsData[id].edgeEnds).to.eql(edgeEnds);
        expect(bgrapher.edgeEndsData[id].isSource).to.eql(isSource);
        expect(bgrapher.edgeEndsData[id].label).to.have.string('This is edge end');
        expect(bgrapher.edgeEndsData[id].label).to.have.string(id);
      });
    });

    it(`Can lookup cur edgeEnd`, () => {
      bgrapher.bgraphState = new BgraphState();
      expect(bgrapher.curEdgeEnd({x:0,y:0}).id).to.be.equal(0);
    });
  });

  describe('sample graphs', () => {
    let bgrapher;
    beforeEach(function() {
      bgrapher = new Bgrapher();
      bgrapher._grapherImpl = fakeGrapher;
    });

    it('Generates empty bgraph', () => {
      bgrapher.initBgraph(emptyBgraph);
  
      expect(bgrapher.blocksData)  .to.eql({});
      expect(bgrapher.edgeEndsData).to.eql({});
    });
  
    it('Generates the right edgeEnd data', () => {
      bgrapher.initBgraph(basicEdgesBgraph);
  
      expect(bgrapher.blocksData).to.be.empty;
      expect(bgrapher.edgeEndsData).to.have.all.keys(0,100);
      expect(bgrapher.edgeEndsData[100].id)       .to.eql(100);
      expect(bgrapher.edgeEndsData[100].x)        .to.eql(1);
      expect(bgrapher.edgeEndsData[100].y)        .to.eql(1);
      expect(bgrapher.edgeEndsData[100].direction).to.eql(1);
      expect(bgrapher.edgeEndsData[100].isSource) .to.eql(false);
      expect(bgrapher.edgeEndsData[100].block)    .to.be.null;
      expect(bgrapher.edgeEndsData[100].edgeEnds) .to.eql([0]);
    });
  
    it('Generates the right block edgeEnd data', () => {
      bgrapher.initBgraph(oneEdgeBgraph);
  
      expect(bgrapher.blocksData[0].edgeEnds).to.eql([0,100]);
    });
  
    it('Generates the right color data', () => {
      bgrapher.initBgraph(colorBgraph);
  
      expect(bgrapher.bgColor).to.equal(1);
      expect(bgrapher.highlightBgColor).to.equal(2);
      expect(bgrapher.highlightFgColor).to.equal(3);
    });
  });
});

describe('initBgraph lookups', () => {
  describe('testOnlyDots', () => {
    let bgrapher = new Bgrapher();
    bgrapher._grapherImpl = fakeGrapher;
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
    let bgrapher = new Bgrapher();
    bgrapher._grapherImpl = fakeGrapher;
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

  describe('sample graphs', () => {
    let bgrapher;
    beforeEach(function() {
      bgrapher = new Bgrapher();
      bgrapher._grapherImpl = fakeGrapher;
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

describe('bgrapher interfaces', () => {
  describe('new Bgrapher', () => {
    let element;
    beforeEach(function() {
      element = document.createElement('div');
    });

    it('new Bgrapher init with external state', () => {
      let bgraphState = new BgraphState();
      let bgrapher = new Bgrapher(oneEdgeBgraph, element, bgraphState);

      // Called initBgraph
      expect(Object.keys(bgrapher.blocksData).length).to.equal(1);
      expect(Object.keys(bgrapher.edgeEndsData).length).to.equal(2);

      // Called populateElement
      expect(bgrapher.bgraphState.bgraphers.length).to.equal(1);
      expect(bgrapher.bgraphState).to.equal(bgraphState);
    });

    it('new Bgrapher basic init', () => {
      let bgrapher = new Bgrapher(oneEdgeBgraph, element);

      // Called initBgraph
      expect(Object.keys(bgrapher.blocksData).length).to.equal(1);
      expect(Object.keys(bgrapher.edgeEndsData).length).to.equal(2);

      // Called populateElement
      expect(bgrapher.bgraphState.bgraphers.length).to.equal(1);
    });

    it('new Bgrapher init only bgraph', () => {
      let bgrapher = new Bgrapher(oneEdgeBgraph);

      // Called initBgraph
      expect(Object.keys(bgrapher.blocksData).length).to.equal(1);
      expect(Object.keys(bgrapher.edgeEndsData).length).to.equal(2);

      // Didn't call populateElement
      expect(bgrapher.bgraphState).to.be.undefined;
    });

    it('new Bgrapher init without inputs', () => {
      let bgrapher = new Bgrapher();

      // Didn't call initBgraph
      expect(bgrapher.blocksData).to.be.undefined;
      expect(bgrapher.edgeEndsData).to.be.undefined;

      // Didn't call populateElement
      expect(bgrapher.bgraphState).to.be.undefined;
    });
  });

  describe('populateElement', () => {
    let bgrapher, bgraphState, populateGrapher, populateEvents, element;
    let calledPopulate, calledSetSize, calledEvents, calledDraw;

    beforeEach(function() {
      bgraphState = new BgraphState();
      expect(bgraphState.bgraphers.length).to.equal(0);

      populateGrapher = {
        populateElement: (u,element) => { calledPopulate = element; },
        setClientSize: (u,w,h) => { calledSetSize = [w,h]; },
        drawBgraph: () => {},
      };

      populateEvents = {
        initEvents: (u,v,element) => { calledEvents = element; },
      };

      element = {
        clientWidth:  10,
        clientHeight: 20,
      };

      bgrapher = new Bgrapher();
      bgrapher._grapherImpl = populateGrapher;
      bgrapher._eventsImpl  = populateEvents;
      bgrapher.draw = () => { calledDraw = true; };
    });

    it('populateElement both inputs', () => {
      bgrapher.populateElement(element, bgraphState);

      expect(bgraphState.bgraphers.length).to.equal(1);
      expect(bgrapher.bgraphState).to.equal(bgraphState);
      expect(bgrapher.bgraphState.bgraphers.length).to.equal(1);

      expect(calledPopulate).to.equal(element);
      expect(calledSetSize).to.eql([10,20]);
      expect(calledEvents).to.equal(element);
      expect(calledDraw).to.be.true;
    });

    it('populateElement only element creates local bgraphState', () => {
      bgrapher.populateElement(element);

      expect(bgraphState.bgraphers.length).to.equal(0);
      expect(bgrapher.bgraphState).to.not.equal(bgraphState);
      expect(bgrapher.bgraphState.bgraphers.length).to.equal(1);

      expect(calledPopulate).to.equal(element);
      expect(calledSetSize).to.eql([10,20]);
      expect(calledEvents).to.equal(element);
      expect(calledDraw).to.be.true;
    });
  });

  describe('draw', () => {
    let bgrapher, bgraphState, drawGrapher, drawBezier, drawEvents;
    let calledDraw, calledInfo, calledCoord, calledBlock, calledEdgeEnd, calledEdge;

    beforeEach(function() {
      bgraphState = new BgraphState();
      drawGrapher = {
        drawBgraph: () => { calledDraw = true; },
        drawHoverInfo: () => { calledInfo = true; },
        printCoords: () => { calledCoord = true; },
        drawBlock: (u,v,block) => { calledBlock.push(block); },
        drawEdgeEnd: (u,v,edgeEnd) => { calledEdgeEnd.push(edgeEnd); },
        drawBezierEdge: (u,v,edge) => { calledEdge.push(edge); },
      };
      drawBezier = {
        generatePoints: (s,e) => { return [s,e]; }
      };
      drawEvents = {
        cur: () => { return {x:1,y:2}; }
      };

      calledDraw = false;
      calledInfo = false;
      calledCoord = false;
      calledBlock = [];
      calledEdgeEnd = [];
      calledEdge = [];

      bgrapher = new Bgrapher();
      bgrapher.bgraphState  = bgraphState;
      bgrapher._grapherImpl = drawGrapher;
      bgrapher._edgesImpl   = drawBezier;
      bgrapher._eventsImpl  = drawEvents;
    });

    it('when empty', () => {
      bgrapher.activeBlocks = () => [];
      bgrapher.activeEdgeEnds = () => [];
      bgrapher.activeEdges = () => [];
      bgrapher.hoveredBlock = () => null;
      bgrapher.hoveredEdgeEnd = () => null;

      bgrapher.draw();

      expect(calledDraw).to.be.true;
      expect(calledInfo).to.be.false;
      expect(calledCoord).to.be.true;
      expect(calledBlock).to.eql([]);
      expect(calledEdgeEnd).to.eql([]);
      expect(calledEdge).to.eql([]);
    });

    it('when non-empty', () => {
      bgrapher.activeBlocks = () => [{id:1}, {id:2}];
      bgrapher.activeEdgeEnds = () => [{id:3}, {id:4}];
      bgrapher.activeEdges = () => [[{id:5},{id:6}], [{id:7},{id:8}]];
      bgrapher.hoveredBlock = () => { return {id:1}; };
      bgrapher.hoveredEdgeEnd = () => { return {id:3}; };

      bgrapher.draw();

      expect(calledDraw).to.be.true;
      expect(calledInfo).to.be.true;
      expect(calledCoord).to.be.true;
      expect(calledBlock).to.eql([{id:1}, {id:2}]);
      expect(calledEdgeEnd).to.eql([{id:3}, {id:4}]);
      expect(calledEdge).to.eql([[{id:5},{id:6}], [{id:7},{id:8}]]);
    });
  });

  describe('size functions', () => {
    it('gets client dimensions', () => {
      let bgrapher = new Bgrapher();
      bgrapher._grapherImpl = fakeGrapher;

      bgrapher._grapherState = { cw: 12 , ch: 34 };

      expect(bgrapher.clientWidth()).to.equal(12);
      expect(bgrapher.clientHeight()).to.equal(34);
    });

    it('change client dimensions', () => {
      let bgrapher = new Bgrapher();
      bgrapher._grapherImpl = fakeGrapher;

      bgrapher._grapherState = { cw: 12 , ch: 34 };
      bgrapher._bgraphElement = {
        clientWidth: 56,
        clientHeight: 78,
      };
      expect(bgrapher.clientWidth()).to.equal(12);
      expect(bgrapher.clientHeight()).to.equal(34);
      bgrapher.updateClientSize();
      expect(bgrapher.clientWidth()).to.equal(56);
      expect(bgrapher.clientHeight()).to.equal(78);
    });
  });
});

describe('interaction', () => {
  let bgrapher;
  beforeEach(function() {
    bgrapher = new Bgrapher();
    bgrapher._grapherImpl = fakeGrapher;
    bgrapher.initBgraph(edgesBgraph);
  });

  function activeBlockIDs(bgrapher) {
    return [...bgrapher.activeBlocks()]
      .map(b=>b.id);
  }

  function activeEdgeEndIDs(bgrapher) {
    return [...bgrapher.activeEdgeEnds()]
      .map(ee=>ee.id);
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

  function testInteractions(interactions, checkOrder=true) {
    interactions.forEach(interaction => {
      const description = 
        `${interaction.actns.length === 1 ? 'only ' : ''}` 
        + interaction.actns
          .map(([a,c,id]) => [a,c,id === null ? 'null' : id])
          .map(a => `${a.join(' ')}`)
          .join(', ');

      it (`${description}`, () => {
        interaction.actns.forEach(([action, component, id]) => {
          bgrapher[functionMap[action][component]](id);
        });

        if (checkOrder) {
          expect(activeEdgeIDs(bgrapher)).to.eql(interaction.edges);
          expect(activeBlockIDs(bgrapher)).to.eql(interaction.blcks);
          expect(activeEdgeEndIDs(bgrapher)).to.eql(interaction.eends);
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

          expect(new Set(
            activeEdgeEndIDs(bgrapher).map(ee => ee.toString())
          )).to.eql(new Set(
            interaction.eends.map(ee => ee.toString())
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
        eends: [],
        blcks: [],
      },
      {
        actns: [['hover','block',12345]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['hover','block',0]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0],
      },
      {
        actns: [['hover','block',1]],
        edges: [[0,2],[1,2],[0,3],[1,3]],
        eends: [2,0,1,3],
        blcks: [1],
      },
      {
        actns: [['hover','block',2]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [2],
      },
      {
        actns: [['hover','block',3]],
        edges: [],
        eends: [],
        blcks: [3],
      },
      {
        actns: [['hover','block',2],
                ['hover','block',2]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [2],
      },
      {
        actns: [['hover','block',0], 
                ['hover','block',null]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['hover','block',1], 
                ['hover','block',null]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['hover','block',2], 
                ['hover','block',null]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['hover','block',12345], 
                ['hover','block',null]],
        edges: [],
        eends: [],
        blcks: [],
      },
    ]);
  });

  describe('toggle block', () => {
    testInteractions([
      {
        actns: [['toggle','block',null]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','block',12345]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','block',0]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0],
      },
      {
        actns: [['toggle','block',1]],
        edges: [[0,2],[1,2],[0,3],[1,3]],
        eends: [2,0,1,3],
        blcks: [1],
      },
      {
        actns: [['toggle','block',2]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [2],
      },
      {
        actns: [['toggle','block',3]],
        edges: [],
        eends: [],
        blcks: [3],
      },
      {
        actns: [['toggle','block',2],
                ['toggle','block',null]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [2],
      },
      {
        actns: [['toggle','block',2],
                ['toggle','block',12345]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [2],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',0]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','block',1]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','block',2],
                ['toggle','block',2]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','block',3],
                ['toggle','block',3]],
        edges: [],
        eends: [],
        blcks: [],
      },
    ]);
  });

  describe('hover edge end', () => {
    testInteractions([
      {
        actns: [['hover','edgeEnd',null]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',12345]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',0]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [0,2,3,4],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',1]],
        edges: [[1,2],[1,3]],
        eends: [1,2,3],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',2]],
        edges: [[0,2],[1,2]],
        eends: [2,0,1],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',3]],
        edges: [[0,3],[1,3]],
        eends: [3,0,1],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',4]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',5]],
        edges: [],
        eends: [5],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',4],
                ['hover','edgeEnd',4]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',0],
                ['hover','edgeEnd',null]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',4],
                ['hover','edgeEnd',null]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['hover','edgeEnd',12345],
                ['hover','edgeEnd',null]],
        edges: [],
        eends: [],
        blcks: [],
      },
    ]);
  });

  describe('toggle edge end', () => {
    testInteractions([
      {
        actns: [['toggle','edgeEnd',null]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',12345]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [0,2,3,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',1]],
        edges: [[1,2],[1,3]],
        eends: [1,2,3],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',2]],
        edges: [[0,2],[1,2]],
        eends: [2,0,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',3]],
        edges: [[0,3],[1,3]],
        eends: [3,0,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',5]],
        edges: [],
        eends: [5],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','edgeEnd',null]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','edgeEnd',12345]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',0]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','edgeEnd',4]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',5],
                ['toggle','edgeEnd',5]],
        edges: [],
        eends: [],
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
        eends: [4,0],
        blcks: [3],
      },
      {
        actns: [['toggle','edgeEnd',5],
                ['hover','block',3]],
        edges: [],
        eends: [5],
        blcks: [3],
      },
      {
        actns: [['toggle','edgeEnd',5],
                ['hover','block',2]],
        edges: [[0,4]],
        eends: [5,4,0],
        blcks: [2],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['hover','block',0]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['hover','block',0]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['hover','block',1]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [1],
      },
      {
        actns: [['toggle','edgeEnd',2],
                ['hover','block',0]],
        edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
        eends: [2,0,1,3,4],
        blcks: [0],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['hover','block',2]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [0,2,3,4],
        blcks: [2],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['hover','block',2]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [2],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['hover','block',12345]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['hover','block',1]],
        edges: [[0,4],[0,2],[1,2],[0,3],[1,3]],
        eends: [4,0,2,1,3],
        blcks: [1],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['hover','block',0],
                ['hover','block',null]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [0,2,3,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['hover','block',0],
                ['hover','block',null]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['hover','block',1],
                ['hover','block',null]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',2],
                ['hover','block',0],
                ['hover','block',null]],
        edges: [[0,2],[1,2]],
        eends: [2,0,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['hover','block',2],
                ['hover','block',null]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [0,2,3,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['hover','block',2],
                ['hover','block',null]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['hover','block',1],
                ['hover','block',null]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','block',3],
                ['hover','block',2]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [3,2],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','block',2],
                ['hover','block',0]],
        edges: [[0,2],[1,2],[0,3],[1,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [1,2,0],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',2],
                ['hover','block',1]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0,2,1],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',1],
                ['hover','block',2]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0,1,2],
      },
      {
        actns: [['toggle','block',2],
                ['hover','block',0]],
        edges: [[0,4],[0,2],[0,3],[1,2],[1,3]],
        eends: [4,0,2,3,1],
        blcks: [2,0],
      },
      {
        actns: [['toggle','block',2],
                ['hover','block',12345]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [2],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','block',2],
                ['hover','block',0],
                ['hover','block',null]],
        edges: [[0,2],[1,2],[0,3],[1,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [1,2],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',2],
                ['hover','block',1],
                ['hover','block',null]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0,2],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',1],
                ['hover','block',2],
                ['hover','block',null]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0,1],
      },
      {
        actns: [['toggle','block',2],
                ['hover','block',0],
                ['hover','block',null]],
        edges: [[0,4]],
        eends: [4,0],
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
        eends: [4,0],
        blcks: [3],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','block',0]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','block',2]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [2],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['toggle','block',0]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['toggle','block',1]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [1],
      },
      {
        actns: [['toggle','edgeEnd',2],
                ['toggle','block',0]],
        edges: [[0,2],[1,2],[0,3],[0,4],[1,3]],
        eends: [2,0,1,3,4],
        blcks: [0],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','block',2]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [0,2,3,4],
        blcks: [2],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','block',2]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [2],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','block',1]],
        edges: [[0,4],[0,2],[1,2],[0,3],[1,3]],
        eends: [4,0,2,1,3],
        blcks: [1],
      },
      {
        actns: [['toggle','block',3],
                ['toggle','block',2]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [3,2],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','block',2],
                ['toggle','block',0]],
        edges: [[0,2],[1,2],[0,3],[1,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [1,2,0],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',2],
                ['toggle','block',1]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0,2,1],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',1],
                ['toggle','block',2]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0,1,2],
      },
      {
        actns: [['toggle','block',2],
                ['toggle','block',0]],
        edges: [[0,4],[0,2],[0,3],[1,2],[1,3]],
        eends: [4,0,2,3,1],
        blcks: [2,0],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','block',0],
                ['toggle','block',0]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['toggle','block',0],
                ['toggle','block',0]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['toggle','block',1],
                ['toggle','block',1]],
        edges: [[0,4]],
        eends: [0,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','block',2],
                ['toggle','block',2]],
        edges: [[0,2],[0,3]],
        eends: [0,2,3],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','block',12345]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','block',2],
                ['toggle','block',2]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','block',1],
                ['toggle','block',1]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','block',2],
                ['toggle','block',0],
                ['toggle','block',0]],
        edges: [],
        eends: [],
        blcks: [2],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','block',2],
                ['toggle','block',0],
                ['toggle','block',0]],
        edges: [],
        eends: [],
        blcks: [1,2],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',1],
                ['toggle','block',1]],
        edges: [[0,4]],
        eends: [0,4],
        blcks: [0],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',2],
                ['toggle','block',1],
                ['toggle','block',1]],
        edges: [[0,4]],
        eends: [0,4],
        blcks: [0,2],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',1],
                ['toggle','block',2],
                ['toggle','block',2]],
        edges: [[0,2],[0,3],[1,2],[1,3]],
        eends: [0,2,3,1],
        blcks: [0,1],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',2],
                ['toggle','block',2]],
        edges: [[0,2],[0,3],[1,2],[1,3]],
        eends: [0,2,3,1],
        blcks: [0],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','block',2],
                ['toggle','block',2]],
        edges: [[0,2],[1,2],[0,3],[1,3]],
        eends: [2,0,1,3],
        blcks: [1],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','edgeEnd',4],
                ['toggle','block',0]],
        edges: [[0,2],[1,2],[0,3],[1,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [1,0],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','edgeEnd',4],
                ['toggle','block',0],
                ['toggle','block',0]],
        edges: [],
        eends: [],
        blcks: [1],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','edgeEnd',0],
                ['toggle','block',0]],
        edges: [],
        eends: [],
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
        eends: [5,4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['hover','edgeEnd',5]],
        edges: [[0,4]],
        eends: [4,0,5],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['hover','edgeEnd',0]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [0,2,3,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['hover','edgeEnd',0]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['hover','edgeEnd',1]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['hover','edgeEnd',2]],
        edges: [[0,2],[0,3],[0,4],[1,2]],
        eends: [0,2,3,4,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',2],
                ['hover','edgeEnd',0]],
        edges: [[0,2],[1,2],[0,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['hover','edgeEnd',2]],
        edges: [[0,4],[0,2],[1,2]],
        eends: [4,0,2,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['hover','edgeEnd',0]],
        edges: [[0,4],[0,2],[0,3]],
        eends: [4,0,2,3],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['hover','edgeEnd',0],
                ['hover','edgeEnd',null]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [0,2,3,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['hover','edgeEnd',0],
                ['hover','edgeEnd',null]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['hover','edgeEnd',1],
                ['hover','edgeEnd',null]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['hover','edgeEnd',2],
                ['hover','edgeEnd',null]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [0,2,3,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',2],
                ['hover','edgeEnd',0],
                ['hover','edgeEnd',null]],
        edges: [[0,2],[1,2]],
        eends: [2,0,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['hover','edgeEnd',2],
                ['hover','edgeEnd',null]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['hover','edgeEnd',0],
                ['hover','edgeEnd',null]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','block',3],
                ['hover','edgeEnd',4]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [3],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','block',2],
                ['hover','edgeEnd',0]],
        edges: [[0,2],[1,2],[0,3],[1,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [1,2],
      },
      {
        actns: [['toggle','block',1],
                ['hover','edgeEnd',4]],
        edges: [[0,2],[1,2],[0,3],[1,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [1],
      },
      {
        actns: [['toggle','block',1],
                ['hover','edgeEnd',0]],
        edges: [[0,2],[1,2],[0,3],[1,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [1],
      },
      {
        actns: [['toggle','block',0],
                ['hover','edgeEnd',2]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',1],
                ['hover','edgeEnd',4]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0,1],
      },
      {
        actns: [['toggle','block',2],
                ['hover','edgeEnd',0]],
        edges: [[0,4],[0,2],[0,3]],
        eends: [4,0,2,3],
        blcks: [2],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','block',2],
                ['hover','edgeEnd',0],
                ['hover','edgeEnd',null]],
        edges: [[0,2],[1,2],[0,3],[1,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [1,2],
      },
      {
        actns: [['toggle','block',1],
                ['hover','edgeEnd',4],
                ['hover','edgeEnd',null]],
        edges: [[0,2],[1,2],[0,3],[1,3]],
        eends: [2,0,1,3],
        blcks: [1],
      },
      {
        actns: [['toggle','block',1],
                ['hover','edgeEnd',0],
                ['hover','edgeEnd',null]],
        edges: [[0,2],[1,2],[0,3],[1,3]],
        eends: [2,0,1,3],
        blcks: [1],
      },
      {
        actns: [['toggle','block',0],
                ['hover','edgeEnd',2],
                ['hover','edgeEnd',null]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',1],
                ['hover','edgeEnd',4],
                ['hover','edgeEnd',null]],
        edges: [[0,2],[0,3],[0,4],[1,2],[1,3]],
        eends: [0,2,3,4,1],
        blcks: [0,1],
      },
      {
        actns: [['toggle','block',2],
                ['hover','edgeEnd',0],
                ['hover','edgeEnd',null]],
        edges: [[0,4]],
        eends: [4,0],
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
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',5],
                ['toggle','edgeEnd',4],
                ['toggle','edgeEnd',4]],
        edges: [],
        eends: [5],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','edgeEnd',3],
                ['toggle','edgeEnd',3]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['toggle','edgeEnd',0]],
        edges: [[1,2],[1,3]],
        eends: [2,3,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',1],
                ['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [2,3,0,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',2],
                ['toggle','edgeEnd',0]],
        edges: [[0,2],[1,2],[0,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',2]],
        edges: [[0,2],[0,3],[0,4],[1,2]],
        eends: [0,2,3,4,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','edgeEnd',2]],
        edges: [[0,4],[0,2],[1,2]],
        eends: [4,0,2,1],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','edgeEnd',0]],
        edges: [[0,4],[0,2],[0,3]],
        eends: [4,0,2,3],
        blcks: [],
      },
      {
        actns: [['toggle','block',3],
                ['toggle','edgeEnd',4]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [3],
      },
      {
        actns: [['toggle','block',2],
                ['toggle','edgeEnd',5]],
        edges: [[0,4]],
        eends: [4,0,5],
        blcks: [2],
      },
      {
        actns: [['toggle','block',2],
                ['toggle','edgeEnd',12345]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [2],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','block',2],
                ['toggle','edgeEnd',0]],
        edges: [[1,2],[1,3]],
        eends: [2,1,3],
        blcks: [1,2],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','edgeEnd',0]],
        edges: [[1,2],[1,3]],
        eends: [2,3,1],
        blcks: [0],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','edgeEnd',2]],
        edges: [[0,3],[0,4],[1,3]],
        eends: [0,3,4,1],
        blcks: [0],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','block',1],
                ['toggle','edgeEnd',4]],
        edges: [[0,2],[0,3],[1,2],[1,3]],
        eends: [0,2,3,1],
        blcks: [0,1],
      },
      {
        actns: [['toggle','block',2],
                ['toggle','edgeEnd',0]],
        edges: [[0,4],[0,2],[0,3]],
        eends: [4,0,2,3],
        blcks: [2],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','edgeEnd',4]],
        edges: [[0,2],[1,2],[0,3],[1,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [1],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','edgeEnd',0]],
        edges: [[0,2],[1,2],[0,3],[1,3],[0,4]],
        eends: [2,0,1,3,4],
        blcks: [1],
      },
      {
        actns: [['toggle','edgeEnd',1],
                ['toggle','edgeEnd',0],
                ['toggle','edgeEnd',0]],
        edges: [[1,2],[1,3]],
        eends: [1,2,3],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',1],
                ['toggle','edgeEnd',1]],
        edges: [[0,2],[0,3],[0,4]],
        eends: [0,2,3,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',0],
                ['toggle','edgeEnd',2],
                ['toggle','edgeEnd',2]],
        edges: [[0,3],[0,4]],
        eends: [0,3,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','edgeEnd',2],
                ['toggle','edgeEnd',2]],
        edges: [[0,4]],
        eends: [4,0],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',2],
                ['toggle','edgeEnd',4],
                ['toggle','edgeEnd',3],
                ['toggle','edgeEnd',3]],
        edges: [[0,2],[1,2],[0,4]],
        eends: [2,0,1,4],
        blcks: [],
      },
      {
        actns: [['toggle','edgeEnd',4],
                ['toggle','edgeEnd',0],
                ['toggle','edgeEnd',0]],
        edges: [],
        eends: [],
        blcks: [],
      },
      {
        actns: [['toggle','block',2],
                ['toggle','edgeEnd',0],
                ['toggle','edgeEnd',0]],
        edges: [],
        eends: [],
        blcks: [2],
      },
      {
        actns: [['toggle','block',0],
                ['toggle','edgeEnd',4],
                ['toggle','edgeEnd',4]],
        edges: [[0,2],[0,3],[1,2],[1,3],[0,4]],
        eends: [0,2,3,1,4],
        blcks: [0],
      },
      {
        actns: [['toggle','block',1],
                ['toggle','edgeEnd',0],
                ['toggle','edgeEnd',0]],
        edges: [[1,2],[1,3]],
        eends: [2,1,3],
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
        eends: [0,2,3,4,1],
        blcks: [0],
      },
      {
        actns: [['hover','edgeEnd',null],
                ['hover','block',0],
                ['hover','block',null],
                ['hover','edgeEnd',1]],
        edges: [[1,2],[1,3]],
        eends: [1,2,3],
        blcks: [],
      },
    ]);
  });

  function upper(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function testReturns(first, second, func) {
    let cbVal, retVal;
    if (first !== undefined) {
      bgrapher[func](first);
    }
    bgrapher[`on${upper(func)}`](v => cbVal = v);
    retVal = bgrapher[func](second);
    return [cbVal, retVal];
  }

  describe('return values', () => {
    it('hover block exists', () => {
      const [cb, ret] = testReturns(null, 0, 'hoverBlock');
      expect(ret).to.be.true;
      expect(cb.id).to.be.equal(0);
    });

    it('hover block null', () => {
      const [cb, ret] = testReturns(0, null, 'hoverBlock');
      expect(ret).to.be.true;
      expect(cb).to.be.null;
    });

    it('hover block no change', () => {
      const [cb, ret] = testReturns(0, 0, 'hoverBlock');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('hover block no change null', () => {
      const [cb, ret] = testReturns(null, null, 'hoverBlock');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('hover block doesn\'t exist', () => {
      const [cb, ret] = testReturns(0, 12345, 'hoverBlock');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('hover edgeEnd exists', () => {
      const [cb, ret] = testReturns(null, 0, 'hoverEdgeEnd');
      expect(ret).to.be.true;
      expect(cb.id).to.be.equal(0);
    });

    it('hover edgeEnd null', () => {
      const [cb, ret] = testReturns(0, null, 'hoverEdgeEnd');
      expect(ret).to.be.true;
      expect(cb).to.be.null;
    });

    it('hover edgeEnd no change', () => {
      const [cb, ret] = testReturns(0, 0, 'hoverEdgeEnd');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('hover edgeEnd no change null', () => {
      const [cb, ret] = testReturns(null, null, 'hoverEdgeEnd');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('hover edgeEnd doesn\'t exist', () => {
      const [cb, ret] = testReturns(0, 12345, 'hoverEdgeEnd');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('toggle block exists', () => {
      const [cb, ret] = testReturns(undefined, 0, 'toggleBlock');
      expect(ret).to.be.true;
      expect(cb.id).to.be.equal(0);
    });

    it('toggle block null', () => {
      const [cb, ret] = testReturns(undefined, null, 'toggleBlock');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('toggle block doesn\'t exist', () => {
      const [cb, ret] = testReturns(undefined, 12345, 'toggleBlock');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('toggle edgeEnd exists', () => {
      const [cb, ret] = testReturns(undefined, 0, 'toggleEdgeEnd');
      expect(ret).to.be.true;
      expect(cb.id).to.be.equal(0);
    });

    it('toggle edgeEnd null', () => {
      const [cb, ret] = testReturns(undefined, null, 'toggleEdgeEnd');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('toggle edgeEnd doesn\'t exist', () => {
      const [cb, ret] = testReturns(undefined, 12345, 'toggleEdgeEnd');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('select block exists', () => {
      const [cb, ret] = testReturns(undefined, 0, 'selectBlock');
      expect(ret).to.be.true;
      expect(cb.id).to.be.equal(0);
    });

    it('select block null', () => {
      const [cb, ret] = testReturns(undefined, null, 'selectBlock');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('select block doesn\'t exist', () => {
      const [cb, ret] = testReturns(undefined, 12345, 'selectBlock');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('select edgeEnd exists', () => {
      const [cb, ret] = testReturns(undefined, 0, 'selectEdgeEnd');
      expect(ret).to.be.true;
      expect(cb.id).to.be.equal(0);
    });

    it('select edgeEnd null', () => {
      const [cb, ret] = testReturns(undefined, null, 'selectEdgeEnd');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });

    it('select edgeEnd doesn\'t exist', () => {
      const [cb, ret] = testReturns(undefined, 12345, 'selectEdgeEnd');
      expect(ret).to.be.false;
      expect(cb).to.be.undefined;
    });
  });

  it('default select callbacks', () => {
    expect(bgrapher.selectBlock(0)).to.be.true;
    expect(bgrapher.selectEdgeEnd(0)).to.be.true;
  });

  describe('ignore nulls in active returns', () => {
    it('activeBlocks ignores nulls', () => {
      bgrapher._toggledBlockIDs.add(1);
      bgrapher._toggledBlockIDs.add(null);
      expect(activeBlockIDs(bgrapher)).to.eql([1]);
    });

    it('activeEdgeEnds ignores nulls', () => {
      bgrapher._toggledEdgeEndIDs.add(2);
      bgrapher._toggledEdgeEndIDs.add(null);
      expect(activeEdgeEndIDs(bgrapher)).to.eql([2]);
    });

    it('activeEdges ignores nulls', () => {
      bgrapher._toggledEdgeIDs.add(0,2);
      bgrapher._toggledEdgeIDs.add(null);
      expect(activeEdgeIDs(bgrapher)).to.eql([[0,2]]);
    });
  });
});

});
