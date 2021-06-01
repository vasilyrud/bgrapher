import { expect } from 'chai';

import emptyBgraph from 'bgraphs/empty.json';
import nonZeroSizeBgraph from 'bgraphs/nonzerosize.json';
import basicBgraph from 'bgraphs/basic.json';
import oneEdgeBgraph from 'bgraphs/oneedge.json';
import colorBgraph from 'bgraphs/color.json';
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
const drawInnerStrokeBox = imageRewire.__get__('drawInnerStrokeBox');
const drawBlockHighlight = imageRewire.__get__('drawBlockHighlight');
const drawSingleLine = imageRewire.__get__('drawSingleLine');
const drawEdgeEndHighlight = imageRewire.__get__('drawEdgeEndHighlight');
const drawBezierSingleCurve = imageRewire.__get__('drawBezierSingleCurve');
const drawBezierLine = imageRewire.__get__('drawBezierLine');

const BLACK = 0;
const WHITE = 16777215;

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
            .getImageData(0,0,bgraph.buffer.width,bgraph.buffer.height)
            .data;
        let p = i * 4;

        expect(img[p+0]).to.equal(color[0]);
        expect(img[p+1]).to.equal(color[1]);
        expect(img[p+2]).to.equal(color[2]);
        expect(img[p+3]).to.equal(color[3]);
    }

    let transparent = [0,0,0,0];
    let black = [0,0,0,255];
    let test1 = [0,0,1,255];
    let test2 = [0,0,2,255];
    let test3 = [0,0,3,255];
    let test4 = [0,0,4,255];

    let testBlackDotLocations = [0,2,8,10];
    let testWhiteDotLocations = [1,3,4,5,6,7,9,11];

    describe('initTestBgraphLarge', () => {
        const bgraph = imageImpl.initTestBgraphLarge(2,2);

        it('Generates the right image size', () => {
            expect(bgraph.buffer.width).to.equal(4);
            expect(bgraph.buffer.height).to.equal(4);
        });

        it('Generates the right image', () => {
            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, transparent));
        });
    });

    describe('initBgraph only dots', () => {
        const bgraph = imageImpl.initBgraph(testOnlyDots(2,2));

        it('Generates the right image size', () => {
            expect(bgraph.buffer.width).to.equal(4);
            expect(bgraph.buffer.height).to.equal(4);
        });

        it('Generates the right image', () => {
            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, transparent));
        });
    });

    describe('initBgraph image', () => {
        it('Generates empty bgraph', () => {
            const bgraph = imageImpl.initBgraph(emptyBgraph);

            expect(bgraph.buffer.width).to.equal(0);
            expect(bgraph.buffer.height).to.equal(0);
            expect(bgraph.buffer).not.to.be.undefined;
            expect(bgraph.canvas).not.to.be.undefined;
        });

        it('Generates the right non-zero size', () => {
            const bgraph = imageImpl.initBgraph(nonZeroSizeBgraph);

            expect(bgraph.buffer.width).to.equal(4);
            expect(bgraph.buffer.height).to.equal(4);
            expect(bgraph.buffer).not.to.be.undefined;
            expect(bgraph.canvas).not.to.be.undefined;
            expect(bgraph.buffer.width).to.equal(4);
            expect(bgraph.buffer.height).to.equal(4);
        });

        it('Generates the right image', () => {
            const bgraph = imageImpl.initBgraph(basicBgraph);

            testBlackDotLocations.forEach(i => testColor(bgraph, i, black));
            testWhiteDotLocations.forEach(i => testColor(bgraph, i, transparent));
        });

        it('Generates the right overlapping image', () => {
            const bgraph = imageImpl.initBgraph(overlapBgraph);

            [0,1,4].forEach(i => testColor(bgraph, i, test1));
            [5,6,9,10].forEach(i => testColor(bgraph, i, test2));
            [11,14,15].forEach(i => testColor(bgraph, i, test3));
            [2,3,7,8,12,13].forEach(i => testColor(bgraph, i, transparent));
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
            [2,3,6,7,8,9,10,11].forEach(i => testColor(bgraph, i, transparent));
        });

        it('Generates the right color image', () => {
            const bgraph = imageImpl.initBgraph(colorBgraph);

            [0,1].forEach(i => testColor(bgraph, i, test4));
            [4,5].forEach(i => testColor(bgraph, i, black));
            [2,3,6,7,8,9,10,11].forEach(i => testColor(bgraph, i, transparent));
        });

        it('Generates the right overlapping edge image', () => {
            const bgraph = imageImpl.initBgraph(overlapEdgeEndBlockBgraph);

            [0].forEach(i => testColor(bgraph, i, test1));
            [1].forEach(i => testColor(bgraph, i, black));
        });
    });
});

describe('dimensions', () => {
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

describe('canvas drawing', () => {
    let fakeCanvas, fakeContext, imageState, bgraphState;
    let calledFill, calledRect, calledLine, calledText, calledDrawImage, calledColor;

    beforeEach(function() {
        bgraphState = new BgraphState();
        fakeContext = {
            imageSmoothingEnabled: true,
            set fillStyle(c)   { calledColor.push(c); }, 
            set strokeStyle(c) { calledColor.push(c); }, 
            fillRect :   (x,y,w,h) => { calledFill      = [x,y,w,h]; },
            drawImage: (b,x,y,w,h) => { calledDrawImage = [x,y,w,h]; },
            beginPath: () => {},
            stroke: () => {},
            rect: (x,y,w,h) => { calledRect = [x,y,w,h]; },
            moveTo: (x,y) => { calledLine.push(x); calledLine.push(y); },
            lineTo: (x,y) => { calledLine.push(x); calledLine.push(y); },
            bezierCurveTo: (x,y,a,b,c,d) => { 
                calledLine.push(x); calledLine.push(y);
                calledLine.push(a); calledLine.push(b);
                calledLine.push(c); calledLine.push(d);
            },
            fillText: (text) => { calledText.push(text); },
            measureText: (text) => { return {width: text.length}; },
        };
        fakeCanvas = {
            width : 16,
            height: 17,
            getContext: () => fakeContext
        };
        imageState = { canvas: fakeCanvas };

        calledFill = [];
        calledRect = [];
        calledLine = [];
        calledText = [];
        calledColor = [];
        calledDrawImage = [];

        expect(bgraphState.offset.x).to.equal(0);
        expect(bgraphState.offset.y).to.equal(0);
        expect(bgraphState.zoom).to.equal(1);
    });

    describe('drawBgraph', () => {
        it('resets bg on draw', () => {
            let imageState = imageImpl.initBgraph(basicBgraph);
            imageState.canvas = fakeCanvas;

            imageImpl.drawBgraph(bgraphState, imageState, 
                basicBgraph.width, basicBgraph.height, WHITE);

            expect(calledFill).to.eql([0,0,16,17]);
        });

        it('doesn\'t pixelate image on small zoom', () => {
            let imageState = imageImpl.initBgraph(basicBgraph);
            imageState.canvas = fakeCanvas;

            imageImpl.drawBgraph(bgraphState, imageState, 
                basicBgraph.width, basicBgraph.height, WHITE);

            expect(fakeContext.imageSmoothingEnabled).to.be.true;
        });

        it('pixelates image on large zoom', () => {
            let imageState = imageImpl.initBgraph(basicBgraph);
            imageState.canvas = fakeCanvas;

            bgraphState.zoom = 100;
            imageImpl.drawBgraph(bgraphState, imageState, 
                basicBgraph.width, basicBgraph.height, WHITE);

            expect(fakeContext.imageSmoothingEnabled).to.be.false;
        });


        it('calls drawImage with correct size', () => {
            let imageState = imageImpl.initBgraph(basicBgraph);
            imageState.canvas = fakeCanvas;

            imageImpl.drawBgraph(bgraphState, imageState, 
                basicBgraph.width, basicBgraph.height, WHITE);

            expect(calledDrawImage).to.eql([0,0,4,4]);
        });

        it('calls drawImage with correct size with zoom and offset', () => {
            let imageState = imageImpl.initBgraph(basicBgraph);
            imageState.canvas = fakeCanvas;

            bgraphState.zoom = 10;
            bgraphState.offset.x = 2;
            bgraphState.offset.y = 3;
            imageImpl.drawBgraph(bgraphState, imageState, 
                basicBgraph.width, basicBgraph.height, WHITE);

            expect(calledDrawImage).to.eql([20,30,40,40]);
        });

        it('doesn\'t draw image for zero-sized bgraph', () => {
            let imageState = imageImpl.initBgraph(emptyBgraph);
            imageState.canvas = fakeCanvas;

            imageImpl.drawBgraph(bgraphState, imageState, 
                emptyBgraph.width, emptyBgraph.height, WHITE);

            expect(calledDrawImage).to.eql([]);
        });

        it('uses correct bg color', () => {
            let imageState = imageImpl.initBgraph(colorBgraph);
            imageState.canvas = fakeCanvas;

            imageImpl.drawBgraph(bgraphState, imageState, 
                emptyBgraph.width, emptyBgraph.height, colorBgraph.bgColor);

            expect(calledColor).to.eql(['#000001']);
        });
    });

    describe('drawInnerStrokeBox', () => {
        [
            [ 1, 0,0, 0, 0,11,12,  0, [  0,  0, 11, 12]],
            [10, 0,0, 0, 0,11,12,  0, [  0,  0,110,120]],
            [10,-2,4, 0, 0,11,12,  0, [-20, 40,110,120]],
            [10,-2,4, 4,-5,11,12,  0, [ 20,-10,110,120]],
            [10,-2,4, 4,-5,11,12,  2, [ 21, -9,108,118]],

            [10,-2,4, 4,-5, 2, 4,  0, [ 20,-10, 20, 40]],
            [10,-2,4, 4,-5, 2, 4, 60, [ 25, -5, 10, 30]],
            [10,-2,4, 4,-5, 4, 2, 60, [ 25, -5, 30, 10]],

        ].forEach(([zoom,ox,oy,x,y,w,h,lineWidth,expected]) => {
            it(`zoom ${zoom}, offset (${ox},${oy}), [${x},${y},${w},${h}], line ${lineWidth}`, () => {
                bgraphState.zoom = zoom;
                bgraphState.offset.x = ox;
                bgraphState.offset.y = oy;
                drawInnerStrokeBox(bgraphState, fakeContext, [x,y,w,h], lineWidth, BLACK);
                expect(calledRect).to.eql(expected);
            });
        });
    });

    describe('drawBlockHighlight', () => {
        const testBlock = {x: 2, y: 3, width: 20, height: 30};

        it('doesn\'t draw when no zoom', () => {
            drawBlockHighlight(bgraphState, fakeContext, testBlock, BLACK, WHITE);
            expect(calledRect).to.eql([]);
        });

        it('doesn\'t draw reverse zoom', () => {
            bgraphState.zoom = 0.5;
            drawBlockHighlight(bgraphState, fakeContext, testBlock, BLACK, WHITE);
            expect(calledRect).to.eql([]);
        });

        it('draws with non-zero stroke when zoom', () => {
            bgraphState.zoom = 100;
            drawBlockHighlight(bgraphState, fakeContext, testBlock, BLACK, WHITE);
            expect(calledRect).to.not.eql([]);
            expect(fakeContext.lineWidth).to.almost.equal(2.4);
        });

        it('draws with color', () => {
            bgraphState.zoom = 10;
            drawBlockHighlight(bgraphState, fakeContext, testBlock, 1, 2);
            expect(calledColor).to.eql(['#000002', '#000001']);
        });

        it('gets called by drawBlock', () => {
            bgraphState.zoom = 10;
            imageImpl.drawBlock(bgraphState, imageState, testBlock, BLACK, WHITE);
            expect(calledRect).to.not.eql([]);
        });
    });

    describe('drawSingleLine', () => {
        [
            [ 1, 0,0, [0, 0,11,12],  0, [  0,  0, 11, 12]],
            [10, 0,0, [0, 0,11,12],  0, [  0,  0,110,120]],
            [10,-2,4, [0, 0,11,12],  0, [-20, 40, 90,160]],
            [10,-2,4, [4,-5,11,12],  0, [ 20,-10, 90,160]],
            [10,-2,4, [4,-5,11,12],  2, [ 20,-10, 90,160]],

        ].forEach(([zoom,ox,oy,points,lineWidth,expected]) => {
            it(`zoom ${zoom}, offset (${ox},${oy}), [${points}], line ${lineWidth}`, () => {
                bgraphState.zoom = zoom;
                bgraphState.offset.x = ox;
                bgraphState.offset.y = oy;
                drawSingleLine(bgraphState, fakeContext, points, lineWidth, BLACK);
                expect(calledLine).to.eql(expected);
            });
        });
    });

    describe('drawEdgeEndHighlight', () => {
        const testEdgeEnd = {x: 2, y: 3, direction: Direction.up};

        it('doesn\'t draw when no zoom', () => {
            drawEdgeEndHighlight(bgraphState, fakeContext, testEdgeEnd, BLACK, WHITE);
            expect(calledLine).to.eql([]);
        });

        it('doesn\'t draw reverse zoom', () => {
            bgraphState.zoom = 0.5;
            drawEdgeEndHighlight(bgraphState, fakeContext, testEdgeEnd, BLACK, WHITE);
            expect(calledLine).to.eql([]);
        });

        it('draws with non-zero stroke when zoom', () => {
            bgraphState.zoom = 100;
            drawEdgeEndHighlight(bgraphState, fakeContext, testEdgeEnd, BLACK, WHITE);
            expect(calledLine.length).to.equal(8);
            expect(fakeContext.lineWidth).to.almost.equal(2.4);
        });

        it('draws with color', () => {
            bgraphState.zoom = 10;
            drawEdgeEndHighlight(bgraphState, fakeContext, testEdgeEnd, 1, 2);
            expect(calledColor).to.eql(['#000001', '#000001']);
        });

        it('gets called by drawEdgeEnd', () => {
            bgraphState.zoom = 10;
            imageImpl.drawEdgeEnd(bgraphState, imageState, testEdgeEnd, BLACK, WHITE);
            expect(calledLine).to.not.eql([]);
        });
    });

    describe('drawBezierSingleCurve', () => {
        [
            [1,0,0, [
                1,2
            ], 0, [
            ]],

            [1,0,0, [
                1,2, 3,4,5,6,7,8
            ], 0, [
                1,2, 3,4,5,6,7,8
            ]],

            [1,0,0, [
                1,2, 3,4,5,6,7,8, 9,10,11,12,13,14
            ], 0, [
                1,2, 3,4,5,6,7,8, 
                7,8, 9,10,11,12,13,14
            ]],

            [1,0,0, [
                1,2, 3,4,5,6,7,8, 9,10,11,12,13,14, 15,16,17,18,19,20
            ], 0, [
                1,2, 3,4,5,6,7,8, 
                7,8, 9,10,11,12,13,14,
                13,14, 15,16,17,18,19,20
            ]],

            [ 1, 0,0, [1,2, 3,4,5,6,7,8], 2, [  1, 2,  3, 4, 5,  6, 7,  8]],
            [10,-2,4, [1,2, 3,4,5,6,7,8], 0, [-10,60, 10,80,30,100,50,120]],

        ].forEach(([zoom,ox,oy,points,lineWidth,expected]) => {
            it(`zoom ${zoom}, offset (${ox},${oy}), [1:${points.length}], line ${lineWidth}`, () => {
                bgraphState.zoom = zoom;
                bgraphState.offset.x = ox;
                bgraphState.offset.y = oy;
                drawBezierSingleCurve(bgraphState, fakeContext, points, lineWidth, BLACK);
                expect(calledLine).to.eql(expected);
            });
        });
    });

    describe('drawBezierLine', () => {
        const testPoints = [1,2, 3,4,5,6,7,8];

        it('draws when no zoom', () => {
            drawBezierLine(bgraphState, fakeContext, testPoints, BLACK, WHITE);
            expect(calledLine.length).to.equal(testPoints.length * 2);
            expect(fakeContext.lineWidth).to.almost.equal(1);
        });

        it('draws reverse zoom', () => {
            bgraphState.zoom = 0.5;
            drawBezierLine(bgraphState, fakeContext, testPoints, BLACK, WHITE);
            expect(calledLine.length).to.equal(testPoints.length * 2);
            expect(fakeContext.lineWidth).to.almost.equal(0.5);
        });

        it('draws with zoom', () => {
            bgraphState.zoom = 100;
            drawBezierLine(bgraphState, fakeContext, testPoints, BLACK, WHITE);
            expect(calledLine.length).to.equal(testPoints.length * 2);
            expect(fakeContext.lineWidth).to.almost.equal(3.2);
        });

        it('draws with color', () => {
            bgraphState.zoom = 10;
            drawBezierLine(bgraphState, fakeContext, testPoints, 1, 2);
            expect(calledColor).to.eql(['#000001', '#000002']);
        });

        it('gets called by drawBezierEdge', () => {
            bgraphState.zoom = 10;
            imageImpl.drawBezierEdge(bgraphState, imageState, testPoints, BLACK, WHITE);
            expect(calledLine).to.not.eql([]);
        });
    });

    describe('debug info', () => {
        it('draws coords', () => {
            imageImpl.printCoords(imageState, 1, 2);
            expect(calledFill).to.eql([-112,8,120,18]);
            expect(calledText).to.eql(['x','y','1','2']);
        });

        it('draws info with text', () => {
            imageImpl.drawHoverInfo(imageState, {id:123, text:'my text'}, 'prefix');
            expect(calledFill).to.eql([8,8,200,35]);
            expect(calledText).to.eql(['Right click to show more info.','my text']);
        });

        it('draws info without text', () => {
            imageImpl.drawHoverInfo(imageState, {id:123}, 'prefix');
            expect(calledFill).to.eql([8,8,200,35]);
            expect(calledText).to.eql(['Right click to show more info.','prefix[123]']);
        });
    });
});

});
