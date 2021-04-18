import { expect } from 'chai';

import structRewire, { ArrayXY, EdgeSet } from 'common/struct.js';

describe(require('path').basename(__filename), () => {

describe('ArrayXY', () => {
    function countDefaults(arr) {
        return arr.data.filter(e => e == -1).length;
    }

    it('has the right length', () => {
        const arr = new ArrayXY(10, 20);
        expect(arr.data.length).to.equal(200);
    });

    it('initialized to -1', () => {
        const arr = new ArrayXY(10, 20);
        expect(countDefaults(arr)).to.equal(200);
    });

    it('can set first', () => {
        let arr = new ArrayXY(10, 20);
        arr.set(0, 0, 5);
        expect(arr.data[0]).to.equal(5);
        expect(countDefaults(arr)).to.equal(199);
    });

    it('can set', () => {
        const arr = new ArrayXY(10, 20);
        arr.set(1, 2, 5);
        expect(arr.data[21]).to.equal(5);
        expect(countDefaults(arr)).to.equal(199);
    });

    it('can set last', () => {
        const arr = new ArrayXY(10, 20);
        arr.set(9, 19, 5);
        expect(arr.data[199]).to.equal(5);
        expect(countDefaults(arr)).to.equal(199);
    });

    it('can get', () => {
        const arr = new ArrayXY(10, 20);
        arr.set(4, 2, 5);
        expect(arr.get(4, 2)).to.equal(5);
    });

    const emptyDimensions = [
        [0,0],
        [10,0],
        [0,10],
    ];

    emptyDimensions.forEach(([w, h]) => {
        it('has the right empty length', () => {
            const arr = new ArrayXY(w, h);
            expect(arr.data.length).to.equal(0);
        });
    });
});

describe('EdgeSet', () => {
    it('Default empty can query', () => {
        let seen = new EdgeSet();
        expect(seen.has(0,0)).to.be.false;
        expect(seen.has(1,2)).to.be.false;
        expect(seen.has(2,1)).to.be.false;
    });

    it('Simple add', () => {
        let seen = new EdgeSet();
        seen.add(1,2);
        expect(seen.has(1,2)).to.be.true;
        expect(seen.has(1,1)).to.be.false;
        expect(seen.has(2,2)).to.be.false;
    });
    
    it('Reverse add', () => {
        let seen = new EdgeSet();
        seen.add(2,1);
        expect(seen.has(2,1)).to.be.true;
        expect(seen.has(1,1)).to.be.false;
        expect(seen.has(2,2)).to.be.false;
    });
    
    it('Equal add', () => {
        let seen = new EdgeSet();
        seen.add(0,0);
        expect(seen.has(0,0)).to.be.true;
        expect(seen.has(0,1)).to.be.false;
        expect(seen.has(1,0)).to.be.false;
    });

    it('Add the same', () => {
        let seen = new EdgeSet();
        seen.add(1,2);
        seen.add(1,2);
        expect(seen.has(1,2)).to.be.true;
        expect(Object.keys(seen.seen).length).to.be.equal(1);
        expect(seen.seen[1].size).to.be.equal(1);
    });

    it('Add and has in reverse', () => {
        let seen = new EdgeSet();
        seen.add(0,0);
        seen.add(1,2);
        seen.add(4,3);
        expect(seen.has(0,0)).to.be.true;
        expect(seen.has(2,1)).to.be.true;
        expect(seen.has(3,4)).to.be.true;
    });

    it('Add the same in reverse', () => {
        let seen = new EdgeSet();
        seen.add(1,2);
        seen.add(2,1);
        expect(seen.has(1,2)).to.be.true;
        expect(Object.keys(seen.seen).length).to.be.equal(1);
        expect(seen.seen[1].size).to.be.equal(1);
    });
});

});
