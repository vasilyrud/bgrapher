import { expect } from 'chai';

import bgrapheventsRewire, {BgraphEventsImpl} from 'eventsimpl/bgraphevents.js'
const BgraphEventState = bgrapheventsRewire.__get__('BgraphEventState');

describe(require('path').basename(__filename), () => {

describe('BgraphEventState', () => {
    it('withinClickRange detects click by default', () => {
        const eventState = new BgraphEventState();
        expect(eventState.withinClickRange()).to.be.true;
    });

    const areClicks = [
        [0,0,0,0],
        [0,0,1,1],
        [0,0,-1,-1],
        [1,-1,0,0],
        [-1,0,0,1],
    ];

    const areNotClicks = [
        [0,0,2,2],
        [-1,-1,1,1],
        [0,-1,0,1],
        [-1,0,1,0],
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

});
