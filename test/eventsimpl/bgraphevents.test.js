import { expect, use } from 'chai';
import chaiAlmost from 'chai-almost';
use(chaiAlmost(0.1));

import bgrapheventsRewire, {bgraphEventsImpl} from 'eventsimpl/bgraphevents.js'
const BgraphEventState = bgrapheventsRewire.__get__('BgraphEventState');
const getLocal = bgrapheventsRewire.__get__('getLocal');
const getZoom = bgrapheventsRewire.__get__('getZoom');
const coordValues = bgrapheventsRewire.__get__('coordValues');
const getMargin = bgrapheventsRewire.__get__('getMargin');
const constrainOffset = bgrapheventsRewire.__get__('constrainOffset');
const getInitOffset = bgrapheventsRewire.__get__('getInitOffset');
const getPanOffset = bgrapheventsRewire.__get__('getPanOffset');
const getZoomOffset = bgrapheventsRewire.__get__('getZoomOffset');
const hoverBgraph = bgrapheventsRewire.__get__('hoverBgraph');

import { BgraphState } from 'bgraphstate.js'
import { equal } from 'assert';

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var window = (new JSDOM(`...`)).window;
var document = window.document;
global.window = window;
global.document = document;

describe(require('path').basename(__filename), () => {

describe('BgraphEventState', () => {
    it('withinClickRange detects click by default', () => {
        const eventState = new BgraphEventState();
        expect(eventState.withinClickRange()).to.be.true;
    });

    const areClicks = [
        [ 0, 0, 0, 0],
        [ 0, 0, 1, 1],
        [ 0, 0,-1,-1],
        [ 1,-1, 0, 0],
        [-1, 0, 0, 1],
    ];

    const areNotClicks = [
        [ 0, 0, 2, 2],
        [-1,-1, 1, 1],
        [ 0,-1, 0, 1],
        [-1, 0, 1, 0],
    ];

    function makeClickState(sx,sy,ex,ey) {
        let eventState = new BgraphEventState();
        eventState.clickStart.x = sx;
        eventState.clickStart.y = sy;
        eventState.cur.x = ex;
        eventState.cur.y = ey;
        return eventState;
    }

    it('withinClickRange detects click for small movements', () => {
        areClicks.forEach(([sx,sy,ex,ey]) => {
            const eventState = makeClickState(sx,sy,ex,ey);
            expect(eventState.withinClickRange()).to.be.true;
        });
    });

    it('withinClickRange doesn\'t detect click for large movements', () => {
        areNotClicks.forEach(([sx,sy,ex,ey]) => {
            const eventState = makeClickState(sx,sy,ex,ey);
            expect(eventState.withinClickRange()).to.be.false;
        });
    });
});

describe('event helpers', () => {
    describe('getLocal', () => {
        let event = {
            clientX: 5, 
            clientY: 7,
        };

        it('is client when zero', () => {
            event.target = {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }};
            expect(getLocal('x', event)).to.equal(5);
            expect(getLocal('y', event)).to.equal(7);
        });

        it('is subtracted when non-zero', () => {
            event.target = {getBoundingClientRect: () => {
                return {left: 2, top: 3};
            }};
            expect(getLocal('x', event)).to.equal(3);
            expect(getLocal('y', event)).to.equal(4);
        });
    });

    describe('getZoom', () => {
        function testNewZoom([old, delta, expected]) {
            let bgraphState = new BgraphState();
            bgraphState.zoom = old;
            let event = { deltaY: delta };

            it(`old zoom ${old} and delta ${delta}`, () => {
                expect(getZoom(bgraphState, event)).to.almost.eql(expected);
            });
        }

        describe('zoom no change', () => {
            [
                [ 1, 0, [ 1, 0]],
                [10, 0, [10, 0]],
            ].forEach(testNewZoom);
        });

        describe('zoom beyond limits', () => {
            [
                [ 1,        100, [  1,      0]],
                [ 1,  -10000000, [100, -54450]],
                [ 1, -100000000, [100, -54450]],
                [10,   10000000, [  1,    495]],
                [10,  -10000000, [100,  -4950]],
            ].forEach(testNewZoom);
        });

        describe('zoom within limits', () => {
            [
                [  1, -100, [ 1.2, -100]],
                [ 10, -100, [11.8, -100]],
                [ 10,  100, [ 8.2,  100]],
                [100,  100, [81.8,  100]],
            ].forEach(testNewZoom);
        });
    });

    describe('coordValues', () => {
        it('returns for coord', () => {
            const fakeBgrapher = {
                bgraphWidth: () => 1, bgraphHeight: () => 2,
                clientWidth: () => 3, clientHeight: () => 4,
            };
            expect(coordValues('x', fakeBgrapher)).to.eql([1,3]);
            expect(coordValues('y', fakeBgrapher)).to.eql([2,4]);
        });
    });

    describe('getMargin', () => {
        it('returns margin without zoom', () => {
            let bgraphState = new BgraphState();
            expect(getMargin(bgraphState, 500, 50)).to.eql(100);
            expect(getMargin(bgraphState, 10, 500)).to.eql(245);
        });

        it('returns margin with zoom', () => {
            let bgraphState = new BgraphState();
            bgraphState.zoom = 10;
            expect(getMargin(bgraphState, 500, 50)).to.eql(10);
            expect(getMargin(bgraphState, 10, 500)).to.eql(20);
        });
    });

    describe('constrainOffset', () => {
        function testNewOffset([zoom, offset, bsize, csize, expected]) {
            let bgraphState = new BgraphState();
            bgraphState.zoom = zoom;

            it(`zoom ${zoom}, bgraph ${bsize}, client ${csize}, desired offset ${offset}`, () => {
                expect(constrainOffset(offset, bgraphState, bsize, csize)).to.almost.eql(expected);
            });
        }

        describe('without zoom', () => {
            [
                [1,  500, 500,  50, 100],
                [1, -500, 500,  50,-500],
                [1,-1000, 500,  50,-550],
                [1,  500,  10, 500, 245],
                [1, -500,  10, 500, 245],
            ].forEach(testNewOffset);
        });

        describe('with zoom', () => {
            [
                [10,  500, 500,  50,  10],
                [10, -500, 500,  50,-500],
                [10,-1000, 500,  50,-505],
                [10,  500,  10, 500,  20],
                [10, -500,  10, 500,  20],
            ].forEach(testNewOffset);
        });
    });

    describe('get offset', () => {
        const fakeBgrapher = {
            bgraphWidth: () => 500, bgraphHeight: () => 500,
            clientWidth: () =>  50, clientHeight: () =>  50,
        };

        let bgraphState = new BgraphState();
        bgraphState.zoom = 10;
        bgraphState.offset.x = 5;
        bgraphState.offset.y = 6;

        it('getInitOffset returns as-is', () => {
            expect(getInitOffset('x', bgraphState, fakeBgrapher)).to.equal(bgraphState.offset.x);
            expect(getInitOffset('y', bgraphState, fakeBgrapher)).to.equal(bgraphState.offset.y);
        });

        it('getPanOffset returns moved', () => {
            let eventState = new BgraphEventState();
            eventState.panningPrev.x = 3;
            eventState.panningPrev.y = 4;
            eventState.cur.x = 7;
            eventState.cur.y = 9;

            expect(getPanOffset('x', bgraphState, eventState, fakeBgrapher)).to.almost.equal(5.4);
            expect(getPanOffset('y', bgraphState, eventState, fakeBgrapher)).to.almost.equal(6.5);
        });

        it('getZoomOffset returns zoomed', () => {
            let eventState = new BgraphEventState();
            eventState.cur.x = 7;
            eventState.cur.y = 9;

            expect(getZoomOffset('x', bgraphState, eventState, fakeBgrapher,  50)).to.almost.equal(5.1);
            expect(getZoomOffset('y', bgraphState, eventState, fakeBgrapher, 150)).to.almost.equal(6.3);
        });
    });

    describe('hoverBgraph', () => {
        function testHover(curBlock, curEdgeEnd, nextBlock, nextEdgeEnd) {
            let hoveredBlock;
            let hoveredEdgeEnd;

            const bgraphState = new BgraphState();
            const fakeEventState = { cur: {} };
            const fakeBgrapher = {
                curBlock  : () => curBlock,
                curEdgeEnd: () => curEdgeEnd,
                hoverBlock  : (b) => { hoveredBlock   = b; },
                hoverEdgeEnd: (e) => { hoveredEdgeEnd = e; },
            };

            hoverBgraph(bgraphState, fakeEventState, fakeBgrapher);
            expect(hoveredBlock).to.equal(nextBlock);
            expect(hoveredEdgeEnd).to.equal(nextEdgeEnd);
        }

        it('hovers only block', () => {
            testHover({ id: 5 }, null, 5, null);
        });

        it('hovers only edge end', () => {
            testHover(null     , { id: 6 }, null, 6);
            testHover({ id: 5 }, { id: 6 }, null, 6);
        });

        it('hovers neither', () => {
            testHover(null, null, null, null);
        });
    });
});

describe('events', () => {
    let bgraphState;
    let eventState;
    let fakeBgrapher;
    let element;
    let calledUpdate;
    let preventedDefault;
    let printedCoords;

    let hoveredBlock;
    let hoveredEdgeEnd;
    let toggledBlock;
    let toggledEdgeEnd;
    let selectedBlock;
    let selectedEdgeEnd;

    beforeEach(function() {
        bgraphState = new BgraphState();
        bgraphState.update = () => { calledUpdate = true; };

        fakeBgrapher = {
            bgraphWidth: () => 500, bgraphHeight: () => 500,
            clientWidth: () =>  50, clientHeight: () =>  50,
            updateClientSize: () => {},
            _printCoords: () => { printedCoords = true; },
            curBlock  : () => {},
            curEdgeEnd: () => {},
            hoveredBlock  : () => { return {id: 1}; },
            hoveredEdgeEnd: () => { return {id: 2}; },

            hoverBlock   : (b) => { hoveredBlock    = b; },
            hoverEdgeEnd : (e) => { hoveredEdgeEnd  = e; },
            toggleBlock  : (b) => { toggledBlock    = b; },
            toggleEdgeEnd: (e) => { toggledEdgeEnd  = e; },
            selectBlock  : (b) => { selectedBlock   = b; },
            selectEdgeEnd: (e) => { selectedEdgeEnd = e; },
        };

        element = document.createElement('div');
        eventState = bgraphEventsImpl.initEvents(bgraphState, fakeBgrapher, element);

        calledUpdate = false;
        preventedDefault = false;
        printedCoords = false;

        const INVALID_VAL = -2;
        hoveredBlock    = INVALID_VAL;
        hoveredEdgeEnd  = INVALID_VAL;
        toggledBlock    = INVALID_VAL;
        toggledEdgeEnd  = INVALID_VAL;
        selectedBlock   = INVALID_VAL;
        selectedEdgeEnd = INVALID_VAL;

        expect(bgraphState.offset.x).to.equal(0);
        expect(bgraphState.offset.y).to.equal(0);
        expect(bgraphState.zoom).to.equal(1);
    });

    afterEach(function() {
        element.remove();
    });

    it('init', () => {
        fakeBgrapher.bgraphWidth  = () =>  10;
        fakeBgrapher.bgraphHeight = () =>  10;
        fakeBgrapher.clientWidth  = () => 500;
        fakeBgrapher.clientHeight = () => 500;

        eventState = bgraphEventsImpl.initEvents(bgraphState, fakeBgrapher, element);

        // non-zero due to constrainOffset
        expect(bgraphState.offset.x).to.equal(245);
        expect(bgraphState.offset.y).to.equal(245);
        expect(calledUpdate).to.be.false;
    });

    it('resize', () => {
        fakeBgrapher.bgraphWidth  = () =>  10;
        fakeBgrapher.bgraphHeight = () =>  10;
        fakeBgrapher.clientWidth  = () => 500;
        fakeBgrapher.clientHeight = () => 500;

        window.dispatchEvent(new window.UIEvent('resize'));

        // non-zero due to constrainOffset
        expect(bgraphState.offset.x).to.equal(245);
        expect(bgraphState.offset.y).to.equal(245);
        expect(calledUpdate).to.be.true;
    });

    it('mouse wheel', () => {
        element.dispatchEvent(new window.WheelEvent('wheel', {
            clientX: 5, clientY: 7,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
            deltaY: -100,
        }));

        expect(bgraphState.offset.x).to.not.equal(0);
        expect(bgraphState.offset.y).to.not.equal(0);
        expect(bgraphState.zoom).to.not.equal(1);

        expect(eventState.cur.x).to.equal(5);
        expect(eventState.cur.y).to.equal(7);
        expect(eventState.hover).to.be.true;

        expect(calledUpdate).to.be.true;
    });

    it('mouse hover', () => {
        element.dispatchEvent(new window.MouseEvent('mousemove', {
            clientX: 5, clientY: 7,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        expect(bgraphState.offset.x).to.equal(0);
        expect(bgraphState.offset.y).to.equal(0);
        expect(eventState.cur.x).to.not.equal(0);
        expect(eventState.cur.y).to.not.equal(0);
        expect(eventState.hover).to.be.true;

        expect(calledUpdate).to.be.true;
        calledUpdate = false;

        const [prevX, prevY] = [eventState.cur.x, eventState.cur.y];

        element.dispatchEvent(new window.MouseEvent('mousemove', {
            clientX: 6, clientY: 8,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        expect(eventState.cur.x).to.not.equal(prevX);
        expect(eventState.cur.y).to.not.equal(prevY);

        expect(calledUpdate).to.be.true;
        expect(printedCoords).to.be.true;
    });

    it('mouse out hover', () => {
        element.dispatchEvent(new window.MouseEvent('mousemove', {
            clientX: 5, clientY: 7,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        expect(hoveredBlock).to.be.null;
        expect(hoveredEdgeEnd).to.be.null;

        hoveredBlock   = -2;
        hoveredEdgeEnd = -2;

        element.dispatchEvent(new window.MouseEvent('mouseout', {}));

        expect(hoveredBlock).to.be.null;
        expect(hoveredEdgeEnd).to.be.null;
    });

    it('mouse pan', () => {
        element.dispatchEvent(new window.MouseEvent('mousedown', {
            button: 0,
            clientX: 15, clientY: 17,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        expect(eventState.panning).to.be.true;

        element.dispatchEvent(new window.MouseEvent('mousemove', {
            clientX: 5, clientY: 7,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        expect(bgraphState.offset.x).to.not.equal(0);
        expect(bgraphState.offset.y).to.not.equal(0);
        expect(bgraphState.zoom).to.equal(1);
        expect(eventState.isClick).to.be.false;

        expect(calledUpdate).to.be.true;
        expect(printedCoords).to.be.true;
        calledUpdate = false;

        const [prevX, prevY] = [bgraphState.offset.x, bgraphState.offset.y];

        element.dispatchEvent(new window.MouseEvent('mousemove', {
            clientX: 6, clientY: 8,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        expect(bgraphState.offset.x).to.not.equal(prevX);
        expect(bgraphState.offset.y).to.not.equal(prevY);

        expect(calledUpdate).to.be.true;
        calledUpdate = false;

        element.dispatchEvent(new window.MouseEvent('mouseup', {
            button: 0,
            clientX: 6, clientY: 8,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        expect(eventState.panning).to.be.false;
        expect(calledUpdate).to.be.false;
    });

    it('mouse out pan', () => {
        element.dispatchEvent(new window.MouseEvent('mousedown', {
            button: 0,
            clientX: 15, clientY: 17,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        element.dispatchEvent(new window.MouseEvent('mousemove', {
            clientX: 5, clientY: 7,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        element.dispatchEvent(new window.MouseEvent('mouseout', {}));

        expect(eventState.panning).to.be.false;
        expect(eventState.hover).to.be.false;
        expect(eventState.isClick).to.be.false;

        expect(calledUpdate).to.be.true;
    });

    it('mouse left click', () => {
        element.dispatchEvent(new window.MouseEvent('mousedown', {
            button: 0,
            clientX: 15, clientY: 17,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        expect(toggledBlock).to.equal(-2);
        expect(toggledEdgeEnd).to.equal(-2);

        expect(calledUpdate).to.be.false;

        element.dispatchEvent(new window.MouseEvent('mouseup', {
            button: 0,
            clientX: 15, clientY: 17,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        expect(bgraphState.offset.x).to.equal(0);
        expect(bgraphState.offset.y).to.equal(0);
        expect(bgraphState.zoom).to.equal(1);
        expect(eventState.isClick).to.be.false;

        expect(toggledBlock).to.equal(1);
        expect(toggledEdgeEnd).to.equal(2);

        expect(calledUpdate).to.be.true;
    });

    it('mouse right click', () => {
        element.dispatchEvent(new window.MouseEvent('mousedown', {
            button: 2,
            clientX: 15, clientY: 17,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        expect(selectedBlock).to.equal(-2);
        expect(selectedEdgeEnd).to.equal(-2);

        expect(calledUpdate).to.be.false;
        expect(preventedDefault).to.be.false;

        element.dispatchEvent(new window.MouseEvent('mouseup', {
            button: 2,
            clientX: 15, clientY: 17,
            target: {getBoundingClientRect: () => {
                return {left: 0, top: 0};
            }},
        }));

        let contextmenuEvent = new window.MouseEvent('contextmenu', {});
        contextmenuEvent.preventDefault = () => { preventedDefault = true; };
        element.dispatchEvent(contextmenuEvent);

        expect(bgraphState.offset.x).to.equal(0);
        expect(bgraphState.offset.y).to.equal(0);
        expect(bgraphState.zoom).to.equal(1);
        expect(eventState.isClick).to.be.false;

        expect(selectedBlock).to.equal(1);
        expect(selectedEdgeEnd).to.equal(2);

        expect(calledUpdate).to.be.false;
        expect(preventedDefault).to.be.true;
    });
});

describe('other event functions', () => {
    describe('cur', () => {
        const testCur = { x: 5, y: 6 };

        it('cur returns value on hover', () => {
            expect(bgraphEventsImpl.cur({ hover: true, cur: testCur })).to.eql(testCur);
        });

        it('cur returns null when not hovered', () => {
            expect(bgraphEventsImpl.cur({ hover: false, cur: testCur })).to.eql({ x: null, y: null });
        });
    });
});

});
