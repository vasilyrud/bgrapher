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
    this.seen = {};
    this.chooseOrder = function(from, to) {
        return (from < to) ? [from, to] : [to, from];
    };
    this.add = function(from, to) {
        let [usedFrom, usedTo] = this.chooseOrder(from, to);
        if (!(usedFrom in this.seen)) this.seen[usedFrom] = new Set();
        this.seen[usedFrom].add(usedTo);
    };
    this.has = function(from, to) {
        let [usedFrom, usedTo] = this.chooseOrder(from, to);
        return (
            (usedFrom in this.seen) &&
            this.seen[usedFrom].has(usedTo)
        );
    };
}

export { ArrayXY, EdgeSet }
