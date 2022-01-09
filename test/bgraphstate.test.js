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
  let toggledCenter1 = [];
  const fakeBgrapher1 = {
    draw: () => toggledDraws1.push(true),
    centerView: () => toggledCenter1.push(true),
  };

  let toggledDraws2 = [];
  let toggledCenter2 = [];
  const fakeBgrapher2 = {
    draw: () => toggledDraws2.push(true),
    centerView: () => toggledCenter2.push(true),
  };

  const state = new BgraphState();
  state.attach(fakeBgrapher1);
  state.attach(fakeBgrapher2);

  state.update();
  expect(toggledDraws1.length).to.equal(1);
  expect(toggledDraws2.length).to.equal(1);

  state.zoom = 5;

  state.update();
  expect(toggledDraws1.length).to.equal(2);
  expect(toggledDraws2.length).to.equal(2);

  state.offset.x = 5;
  state.offset.y = 5;

  state.center();
  expect(toggledCenter1.length).to.equal(1);
  expect(toggledCenter2.length).to.equal(1);
});

});
