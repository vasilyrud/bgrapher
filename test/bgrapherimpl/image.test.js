import { expect } from 'chai';

import emptyBgraph from 'bgraphs/empty.json';
import nonZeroSizeBgraph from 'bgraphs/nonzerosize.json';
import basicBgraph from 'bgraphs/basic.json';
import oneEdgeBgraph from 'bgraphs/oneedge.json';
import overlapBgraph from 'bgraphs/overlap.json';
import sameDepthBgraph from 'bgraphs/samedepth.json';
import overlapEdgeEndBlockBgraph from 'bgraphs/overlapedgeendblock.json';

import { BgraphState } from 'bgraphstate.js'
import { Direction } from 'common/lookup.js';
import testOnlyDots from 'bgraphs/testonlydots.js';
import imageRewire, { imageImpl } from 'grapherimpl/image.js';
const toCanvas = imageRewire.__get__('toCanvas');
const getArrowPoints = imageRewire.__get__('getArrowPoints');
const getLineWidths = imageRewire.__get__('getLineWidths');
const concatText = imageRewire.__get__('concatText');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var document = (new JSDOM(`...`)).window.document;
global.document = document;

describe(require('path').basename(__filename), () => {

describe('toCanvas', () => {
    [
        [ 1, 0,  0,   0],
        [ 1, 0,-10, -10],
        [ 1, 0, 10,  10],

        [10, 0,  0,   0],
        [10, 0,-10,-100],
        [10, 0, 10, 100],

        [10,-5,  0, -50],
        [10,-5,-10,-150],
        [10,-5, 10,  50],

        [10, 5,  0,  50],
        [10, 5,-10, -50],
        [10, 5, 10, 150],

    ].forEach(([zoom, offset, value, result]) => {
        it(`for zoom ${zoom}, offset ${offset}, value ${value}`, () => {
            let bgraphState = new BgraphState();
            bgraphState.zoom = zoom;

            bgraphState.offset.x = offset;
            expect(toCanvas('x', bgraphState, value)).to.equal(result);
            bgraphState.offset.y = offset;
            expect(toCanvas('y', bgraphState, value)).to.equal(result);
        });
    });
});

describe('getArrowPoints', () => {
    [
        [10,20,Direction['up']   ,[10,21,10.5,20],[11,21,10.5,20]],
        [10,20,Direction['right'],[10,20,11,20.5],[10,21,11,20.5]],
        [10,20,Direction['down'] ,[10,20,10.5,21],[11,20,10.5,21]],
        [10,20,Direction['left'] ,[11,20,10,20.5],[11,21,10,20.5]],
    ].forEach(([x, y, direction, expected0, expected1]) => {
        it(`Correctly creates points for ${x}, ${y}, ${direction}`, () => {
            const [points0, points1] = getArrowPoints(x, y, direction);

            expect(points0).to.eql(expected0);
            expect(points1).to.eql(expected1);
        });
    });
});

describe('getLineWidths', () => {
    [
        [ 0.5  , 0.5   , 0    ],
        [ 1    , 1     , 0    ],
        [ 1.1  , 1.0022, 1.1  ],
        [ 2.586, 1.0344, 2.586],
        [47    , 2     , 5    ],
    ].forEach(([zoom, fgWidthsExpected, bgWidthsExpected]) => {
        it(`Correct widths for zoom ${zoom}`, () => {
            const [fgWidths, bgWidths] = getLineWidths(zoom);

            expect(fgWidths).to.be.closeTo(fgWidthsExpected, 0.0001);
            expect(bgWidths).to.be.closeTo(bgWidthsExpected, 0.0001);
        });
    });
});

describe('concatText', () => {
    const fakeContext = {
        measureText: (text) => { return {width: text.length}; },
    };

    it('when text width is smaller', () => {
        expect(concatText(fakeContext, 100, 'abcdefghi')).to.equal('abcdefghi');
        expect(concatText(fakeContext,  12, 'abcdefghi', 0)).to.equal('abcdefghi');
        expect(concatText(fakeContext,   9, 'abcdefghi', 0)).to.equal('abcdefghi');
    });

    it('when text width is larger', () => {
        expect(concatText(fakeContext, 8, 'abcdefghi', 0)).to.equal('abcde...');
        expect(concatText(fakeContext, 5, 'abcdefghi', 0)).to.equal('ab...');
        expect(concatText(fakeContext, 3, 'abcdefghi', 0)).to.equal('...');
        expect(concatText(fakeContext, 1, 'abcdefghi', 0)).to.equal('...');
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
    let white = [0,0,0,  0]; // white because of opacity
    let test1 = [0,0,1,255];
    let test2 = [0,0,2,255];
    let test3 = [0,0,3,255];

    let testBlackDotLocations = [0,2,8,10];
    let testWhiteDotLocations = [1,3,4,5,6,7,9,11];

    describe('initTestBgraphLarge', () => {
        const bgraph = imageImpl.initTestBgraphLarge(2,2);

        it('Generates the right image size', () => {
            expect(bgraph.imageWidth).to.equal(4);
            expect(bgraph.imageHeight).to.equal(4);
        });

        it('Generates the right image', () => {
            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, white));
        });
    });

    describe('initBgraph only dots', () => {
        const bgraph = imageImpl.initBgraph(testOnlyDots(2,2));

        it('Generates the right image size', () => {
            expect(bgraph.imageWidth).to.equal(4);
            expect(bgraph.imageHeight).to.equal(4);
        });

        it('Generates the right image', () => {
            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, white));
        });
    });

    describe('initBgraph image', () => {
        it('Generates empty bgraph', () => {
            const bgraph = imageImpl.initBgraph(emptyBgraph);

            expect(bgraph.imageWidth).to.equal(0);
            expect(bgraph.imageHeight).to.equal(0);
            expect(bgraph.buffer).to.be.undefined;
            expect(bgraph.canvas).not.to.be.undefined;
        });

        it('Generates the right non-zero size', () => {
            const bgraph = imageImpl.initBgraph(nonZeroSizeBgraph);

            expect(bgraph.imageWidth).to.equal(4);
            expect(bgraph.imageHeight).to.equal(4);
            expect(bgraph.buffer).not.to.be.undefined;
            expect(bgraph.canvas).not.to.be.undefined;
            expect(bgraph.buffer.width).to.equal(4);
            expect(bgraph.buffer.height).to.equal(4);
        });

        it('Generates the right image', () => {
            const bgraph = imageImpl.initBgraph(basicBgraph);

            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, white));
        });

        it('Generates the right overlapping image', () => {
            const bgraph = imageImpl.initBgraph(overlapBgraph);

            [0,1,4].forEach(i => testColor(bgraph, i, test1));
            [5,6,9,10].forEach(i => testColor(bgraph, i, test2));
            [11,14,15].forEach(i => testColor(bgraph, i, test3));
            [2,3,7,8,12,13].forEach(i => testColor(bgraph, i, white));
        });

        it('Generates the right overlapping same depth image', () => {
            const bgraph = imageImpl.initBgraph(sameDepthBgraph);

            [0,1,4].forEach(i => testColor(bgraph, i, test1));
            [5,6,9,10].forEach(i => testColor(bgraph, i, test2));
        });

        it('Generates the right edge image', () => {
            const bgraph = imageImpl.initBgraph(oneEdgeBgraph);

            [0,1].forEach(i => testColor(bgraph, i, test1));
            [4,5].forEach(i => testColor(bgraph, i, black));
            [2,3,6,7,8,9,10,11].forEach(i => testColor(bgraph, i, white));
        });

        it('Generates the right overlapping edge image', () => {
            const bgraph = imageImpl.initBgraph(overlapEdgeEndBlockBgraph);

            [0].forEach(i => testColor(bgraph, i, test1));
            [1].forEach(i => testColor(bgraph, i, black));
        });
    });
});

describe('drawBgraph', () => {
    let bgraphState;
    let fakeCanvas;
    let fakeContext;
    let calledReset;
    let calledDrawImage;

    beforeEach(function() {
        bgraphState = new BgraphState();
        fakeCanvas = {
            width : 16,
            height: 17,
        };
        fakeContext = {
            fillRect :   (x,y,w,h) => { calledReset     = [x,y,w,h]; },
            drawImage: (b,x,y,w,h) => { calledDrawImage = [x,y,w,h]; },
            imageSmoothingEnabled: true,
        };
        fakeCanvas.getContext = () => fakeContext;

        calledReset = false;
        calledDrawImage = false;

        expect(bgraphState.offset.x).to.equal(0);
        expect(bgraphState.offset.y).to.equal(0);
        expect(bgraphState.zoom).to.equal(1);
    });

    it('resets bg on draw', () => {
        let imageState = imageImpl.initBgraph(basicBgraph);
        imageState.canvas = fakeCanvas;

        imageImpl.drawBgraph(bgraphState, imageState);

        expect(calledReset).to.eql([0,0,16,17]);
    });

    it('doesn\'t pixelate image on small zoom', () => {
        let imageState = imageImpl.initBgraph(basicBgraph);
        imageState.canvas = fakeCanvas;

        imageImpl.drawBgraph(bgraphState, imageState);

        expect(fakeContext.imageSmoothingEnabled).to.be.true;
    });

    it('pixelates image on large zoom', () => {
        let imageState = imageImpl.initBgraph(basicBgraph);
        imageState.canvas = fakeCanvas;

        bgraphState.zoom = 100;
        imageImpl.drawBgraph(bgraphState, imageState);

        expect(fakeContext.imageSmoothingEnabled).to.be.false;
    });


    it('calls drawImage with correct size', () => {
        let imageState = imageImpl.initBgraph(basicBgraph);
        imageState.canvas = fakeCanvas;

        imageImpl.drawBgraph(bgraphState, imageState);

        expect(calledDrawImage).to.eql([0,0,4,4]);
    });

    it('calls drawImage with correct size with zoom and offset', () => {
        let imageState = imageImpl.initBgraph(basicBgraph);
        imageState.canvas = fakeCanvas;

        bgraphState.zoom = 10;
        bgraphState.offset.x = 2;
        bgraphState.offset.y = 3;
        imageImpl.drawBgraph(bgraphState, imageState);

        expect(calledDrawImage).to.eql([20,30,40,40]);
    });

    it('doesn\'t draw image for zero-sized bgraph', () => {
        let imageState = imageImpl.initBgraph(emptyBgraph);
        imageState.canvas = fakeCanvas;

        imageImpl.drawBgraph(bgraphState, imageState);

        expect(calledDrawImage).to.be.false;
    });
});

describe('dimensions', () => {
    it('gets bgraph dimensions', () => {
        let imageState = imageImpl.initBgraph(basicBgraph);

        expect(imageImpl.getBgraphWidth(imageState)).to.equal(4);
        expect(imageImpl.getBgraphHeight(imageState)).to.equal(4);
    });

    it('gets client dimensions', () => {
        let imageState = imageImpl.initBgraph(basicBgraph);
        imageImpl.setClientSize(imageState, 23, 45);

        expect(imageImpl.getClientWidth(imageState)).to.equal(23);
        expect(imageImpl.getClientHeight(imageState)).to.equal(45);
    });
});

describe('populateElement', () => {
    it('adds canvas to element', () => {
        let imageState = imageImpl.initBgraph(basicBgraph);
        let element = document.createElement('div');

        expect(element.hasChildNodes()).to.be.false;
        imageImpl.populateElement(imageState, element);

        expect(element.hasChildNodes()).to.be.true;
        expect(element.firstChild).to.equal(imageState.canvas);
    });
});

});
