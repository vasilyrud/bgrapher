import { expect } from 'chai';

import { BgraphState } from 'bgraphstate.js'
import lookupRewire, { colorToRGB, colorToHex, curBgraphPixel } from 'common/lookup.js';

describe(require('path').basename(__filename), () => {

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
    [   0  ,   0  ,   0,   0],
    [   0.5,   0.5,   0,   0],
    [   2.5,   2.5,   2,   2],
    [   1  ,   1  ,   1,   1],
    [  -0.1,  -0.1,  -1,  -1],
    [ 100  , 100  , 100, 100],
    [-100  , 100  ,-100, 100],
    [ 100  ,-100  , 100,-100],
    [-100  ,-100  ,-100,-100],
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
      [ 1, 50, 100],
      [10,  0,   0],
      [10, 50, 100],
      [ 1,-50,-100],
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

describe('colorToRGB', () => {
  [
    [       0,[  0,  0,  0]],
    [       1,[  0,  0,  1]],
    [     256,[  0,  1,  0]],
    [   65536,[  1,  0,  0]],
    [ 1193046,[ 18, 52, 86]],
    [16777215,[255,255,255]],
  ].forEach(([color, expectedRGB]) => {
    it(`Correctly converts color ${color}`, () => {
      expect(colorToRGB(color)).to.eql(expectedRGB);
    });
  });
});

describe('colorToHex', () => {
  [
    [       0,'#000000'],
    [       1,'#000001'],
    [     256,'#000100'],
    [   65536,'#010000'],
    [ 1193046,'#123456'],
    [16777215,'#ffffff'],
  ].forEach(([color, expectedHex]) => {
    it(`Correctly converts color ${color}`, () => {
      expect(colorToHex(color)).to.equal(expectedHex);
    });
  });
});

});
