import { expect } from 'chai';

import emptyBgraph from 'bgraphs/empty.json';
import nonZeroSizeBgraph from 'bgraphs/nonzerosize.json';
import basicBgraph from 'bgraphs/basic.json';
import overlapBgraph from 'bgraphs/overlap.json';
import sameDepthBgraph from 'bgraphs/samedepth.json';

import { Direction } from 'common/lookup.js';
import testOnlyDots from 'bgraphs/testonlydots.js';
import imageRewire, { ImageImpl } from 'grapherimpl/image.js';
const getArrowPoints = imageRewire.__get__('getArrowPoints');
const getLineWidths = imageRewire.__get__('getLineWidths');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var document = (new JSDOM(`...`)).window.document;
global.document = document;

describe(require('path').basename(__filename), () => {

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
        const bgraph = ImageImpl.initTestBgraphLarge(2,2);

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
        const bgraph = ImageImpl.initBgraph(testOnlyDots(2,2));

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
            const bgraph = ImageImpl.initBgraph(emptyBgraph);

            expect(bgraph.imageWidth).to.equal(0);
            expect(bgraph.imageHeight).to.equal(0);
            expect(bgraph.buffer).to.be.undefined;
            expect(bgraph.canvas).not.to.be.undefined;
        });

        it('Generates the right non-zero size', () => {
            const bgraph = ImageImpl.initBgraph(nonZeroSizeBgraph);

            expect(bgraph.imageWidth).to.equal(4);
            expect(bgraph.imageHeight).to.equal(4);
            expect(bgraph.buffer).not.to.be.undefined;
            expect(bgraph.canvas).not.to.be.undefined;
            expect(bgraph.buffer.width).to.equal(4);
            expect(bgraph.buffer.height).to.equal(4);
        });

        it('Generates the right image', () => {
            const bgraph = ImageImpl.initBgraph(basicBgraph);

            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, white));
        });

        it('Generates the right overlapping image', () => {
            const bgraph = ImageImpl.initBgraph(overlapBgraph);

            [0,1,4].forEach(i => testColor(bgraph, i, test1));
            [5,6,9,10].forEach(i => testColor(bgraph, i, test2));
            [11,14,15].forEach(i => testColor(bgraph, i, test3));
            [2,3,7,8,12,13].forEach(i => testColor(bgraph, i, white));
        });

        it('Generates the right overlapping same depth image', () => {
            const bgraph = ImageImpl.initBgraph(sameDepthBgraph);

            [0,1,4].forEach(i => testColor(bgraph, i, test1));
            [5,6,9,10].forEach(i => testColor(bgraph, i, test2));
        });
    });
});

});
