import { expect } from 'chai';

import imageRewire from 'bgrapherimpl/image.js';
const makeForwardCurve = imageRewire.__get__('makeForwardCurve');

describe('makeCurve', () => {
    it('returns correct forward curve', () => {
        expect(makeForwardCurve(5,8)).to.eql([
            0, 0, 0, 8, 5, 0, 
            5, 8
        ]);
    });
});
