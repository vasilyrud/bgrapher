/*
Copyright 2021 Vasily Rudchenko - bgraph

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

function ArrayXY(width, height) {
    /*
        (x,y)-indexed array of 32-bit (4-byte) numbers.
    */
    this.width  = width;
    this.height = height;
    this.buffer = new ArrayBuffer(4 * this.height * this.width);
    this.data   = new Int32Array(this.buffer).fill(-1);

    this.get = function(x, y) {
        return this.data[y * this.width + x];
    };
    this.set = function(x, y, val) {
        this.data[y * this.width + x] = val;
    };
}

function EdgeSet() {
    this.set = new Set();

    // Implementation of Szudzik pairing function from:
    // https://codepen.io/sachmata/post/elegant-pairing
    this._pair = function(x, y) {
        return (x >= y) 
            ? (x * x + x + y) 
            : (y * y + x);
    }
    this._unpair = function(pair) {
        const sqrtz = Math.floor(Math.sqrt(pair));
        const sqz = sqrtz * sqrtz;
        return ((pair - sqz) >= sqrtz) 
            ? [sqrtz, pair - sqz - sqrtz] 
            : [pair - sqz, sqrtz];
    }

    this.add = function(from, to) {
        const pair = this._pair(from, to);
        this.set.add(pair);
        return this;
    };

    this.has = function(from, to) {
        return this.set.has(this._pair(from, to));
    };

    this.delete = function(from, to) {
        const pair = this._pair(from, to);
        if (!this.set.has(pair)) return false;
        this.set.delete(pair);
        return true;
    };
}

EdgeSet.prototype[Symbol.iterator] = function*() {
    for (const pair of this.set) {
        yield this._unpair(pair);
    }
};

export { ArrayXY, EdgeSet }
