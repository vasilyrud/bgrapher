import { expect } from 'chai';

import { BgraphState } from 'bgraphstate.js'

describe(require('path').basename(__filename), () => {

it('Correct default data', () => {
	const state = new BgraphState();
	expect(state.zoom).to.equal(1);
    expect(state.offset.x).to.equal(0);
    expect(state.offset.y).to.equal(0);
});

it('Subscription works', () => {
	let toggledDraws1 = [];
	const fakeBGrapher1 = {
		draw: (s) => toggledDraws1.push(s)
	};

	let toggledDraws2 = [];
	const fakeBGrapher2 = {
		draw: (s) => toggledDraws2.push(s)
	};

	const state = new BgraphState();
	state.attach(fakeBGrapher1);
	state.attach(fakeBGrapher2);

	state.update();
	expect(toggledDraws1.length).to.equal(1);
	expect(toggledDraws1[0].zoom).to.equal(1);
	expect(toggledDraws2.length).to.equal(1);
	expect(toggledDraws2[0].zoom).to.equal(1);

	state.zoom = 5;
	state.update();
	expect(toggledDraws1.length).to.equal(2);
	expect(toggledDraws1[1].zoom).to.equal(5);
	expect(toggledDraws2.length).to.equal(2);
	expect(toggledDraws2[1].zoom).to.equal(5);
});

});
