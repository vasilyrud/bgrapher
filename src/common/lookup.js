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

import { ArrayXY } from './struct.js'

function colorToRGB(c) {
    return [
        c >> 16 & 255,
        c >>  8 & 255,
        c >>  0 & 255,
    ];
}

function curBgraphPixel(coord, bgraphState, cur) {
    return Math.floor(
        (cur[coord] / bgraphState.zoom) - bgraphState.offset[coord]
    );
}

const Direction = Object.freeze({
    up:    1,
    right: 2,
    down:  3,
    left:  4,
});

function DataStoreField(fields) {
    for (const [fieldName, field] of Object.entries({
        offset:  0,
        numBits: 32,
        cbSet: v => v,
        cbGet: v => v,
        ...fields
    })) {
        Object.defineProperty(this, fieldName, {
            value: field,
            writable: true,
            enumerable: true,
            configurable: true,
        });
    }
}

function DataStore(numIDs, fields) {
    this.fields = fields;
    this.numFields = this.fields.length;
    this.buffer = new ArrayBuffer(4 * this.numFields * numIDs);
    this.data   = new Uint32Array(this.buffer).fill(0);

    this.slotCounter = 0;
    this.lookupSlot = {}; // ID-to-slot lookup

    this.hasID = function(id) {
        return (id in this.lookupSlot);
    };

    this.i = function(id,field) {
        return this.lookupSlot[id] * this.numFields + field.index;
    };

    this.mask = function(field) {
        return (field.numBits === 32) ? ~0 : (1 << field.numBits) - 1;
    };

    this.set = function(id, data) {
        if (!(id in this.lookupSlot)) {
            this.lookupSlot[id] = this.slotCounter;
            this.slotCounter += 1;
        }

        for (const field of this.fields) {
            if (!(field.name in data)) continue;

            // Clear bits
            this.data[this.i(id,field)] &= (~(
                this.mask(field) << field.offset
            ));
            // Set bits
            this.data[this.i(id,field)] |= ((
                field.cbSet(data[field.name]) 
                & this.mask(field)
            ) << field.offset);
        }
    };

    this.get = function(id, key) {
        if (!(id in this.lookupSlot)) return null;

        for (const field of this.fields) {
            if (field.name !== key) continue;

            return field.cbGet(
                (this.data[this.i(id,field)] >> field.offset)
                & this.mask(field)
            );
        }

        throw new Error(`Unsupported data key: ${key}.`);
    };

    this.keys = function() {
        return Object.keys(this.lookupSlot);
    };
}

const DataAccessHandler = {
    get: function(obj, prop) {
        if (prop in obj) {
            return typeof obj[prop] === "function"
                ? obj[prop].bind(obj)
                : obj[prop];
        }

        const id = prop;
        if (!obj.data.hasID(id)) return null;

        return new Proxy(obj.data, {
            get: function(dataObj, key) {
                if (key in obj.other) {
                    return obj.other[key][id];
                }

                return dataObj.get(id, key);
            }
        });
    },
    set: function(obj, id, data) {
        for (const key of Object.keys(data)) {
            if (obj.otherKeys.has(key)) {
                obj.other[key][id] = data[key];
            }
        }

        obj.data.set(id, data);
        return true;
    },
    has: function(obj, id) {
        return obj.data.hasID(id);
    },
    ownKeys: function (obj) {
        return obj.data.keys();
    },
    getOwnPropertyDescriptor(obj, prop) {
        // Needed to get ownKeys to work
        return { configurable: true, enumerable: true };
    },
};

function BlocksData(numIDs) {
    this.data = new DataStore(numIDs, [
        new DataStoreField({index: 0, name: 'id'}),
        new DataStoreField({index: 1, name: 'x'}),
        new DataStoreField({index: 2, name: 'y'}),
        new DataStoreField({index: 3, name: 'width'}),
        new DataStoreField({index: 4, name: 'height'}),
        new DataStoreField({index: 5, name: 'depth'}),
        new DataStoreField({index: 6, name: 'color'}),
    ]);
    this.other = {
        edgeEnds: {},
        text: {},
    };
    this.otherKeys = new Set(Object.keys(this.other));
}

function BlocksLookup(data) {
    this.width  = data.width;
    this.height = data.height;
    this.lookup = new ArrayXY(this.width, this.height);
    this.depths = new ArrayXY(this.width, this.height);
    
    const numBlocks = data.blocks.length;
    for (let i = 0; i < numBlocks; i++) {
        const block = data.blocks[i];
        const depth = block.depth;
        const minY = block.y;
        const minX = block.x;
        const maxY = minY + block.height;
        const maxX = minX + block.width;

        for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
                if (depth < this.depths.get(x,y)) continue;
                this.depths.set(x,y,depth);
                this.lookup.set(x,y,block.id);
            }
        }
    }

    this.get = function(x, y) {
        if (y < 0 || y >= this.lookup.height) return null;
        if (x < 0 || x >= this.lookup.width ) return null;

        const id = this.lookup.get(x, y);
        return (id === -1) ? null : id;
    };
}

function EdgeEndsData(numIDs) {
    this.data = new DataStore(numIDs, [
        new DataStoreField({index: 0, name: 'id'}),
        new DataStoreField({index: 1, name: 'x'}),
        new DataStoreField({index: 2, name: 'y'}),
        new DataStoreField({index: 3, name: 'direction', offset: 0, numBits: 2,
            cbSet: v => Direction[v],
        }),
        new DataStoreField({index: 3, name: 'isSource',  offset: 2, numBits: 1,
            cbSet: v => v ? 1 : 0,
            cbGet: v => v === 1,
        }),
    ]);
    this.other = {
        edgeEnds: {},
    };
    this.otherKeys = new Set(Object.keys(this.other));
}

function initBlocksData(numBlocks) {
    return new Proxy(
        new BlocksData(numBlocks), 
        DataAccessHandler
    );
}

function initEdgeEndsData(numEdgeEnds) {
    return new Proxy(
        new EdgeEndsData(numEdgeEnds), 
        DataAccessHandler
    );
}

export { colorToRGB, curBgraphPixel, Direction, initBlocksData, initEdgeEndsData, BlocksLookup }
