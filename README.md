# bgrapher [![npm](https://img.shields.io/npm/v/bgrapher)](https://www.npmjs.com/package/bgrapher) [![Travis (.com)](https://img.shields.io/travis/com/vasilyrud/bgrapher)](https://travis-ci.com/github/vasilyrud/bgrapher) [![Coveralls](https://img.shields.io/coveralls/github/vasilyrud/bgrapher)](https://coveralls.io/github/vasilyrud/bgrapher)

Bgrapher presents as much information about a graph as possible in a concise format, while removing all unnecessary noise. 
This lets you focus on the bigger picture, while still allowing you to focus in on the details as needed.

Bgrapher works particularly well for visualizing large, sparse, directed, hierarchical graphs. 
Anything that you might want to draw with `dot`, but which doesn't neatly fit into a single image, is a good candidate for Bgrapher.

## Getting started

Say you already have a bgraph, and would like to draw `yourBgraph` inside `yourElement = document.createElement('div')`, you can do so directly:

```
<script src="https://unpkg.com/bgrapher/dist/bgrapher.min.js"></script>
<script>
    let yourBgrapher = new bgrapher.Bgrapher(yourBgraph, yourElement);
</script>
```

Or, if installed via npm:

```
import { Bgrapher } from 'bgrapher';
let yourBgrapher = new Bgrapher(yourBgraph, yourElement);
```

If your graph is not in bgraph format yet, you can create it using the format described below.

## Bgraph format

Bgraphs are like any other graphs, except optimized for speed and flexibility on the frontend. 
This means that you may need to do a bit more prep work "offline" before rendering a graph.

### Bgraph structure

Bgraphs are formatted in JSON. 
Nodes are represented with `block`s and edges are pairs of `edgeEnd`s. 
A bgraph must contain a list of each, as well as all required properties:

| Property                                | Description                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `width` & `height`                      | The total dimensions of the bgraph. This should be sufficiently large to contain all of your `block`s/`edgeEnd`s.         |
| `bgColor`                               | Background color of the bgraph.                                                                                           |
| `highlightBgColor` & `highlightFgColor` | Highlight colors for highlighting graph interactions. Choosing 2 contrasting colors for these values improves visibility. |

For example, this is a `4` by `4` bgraph with a white background (`16777215` corresponds to `#ffffff`), black on white highlights (`0` and `16777215`), and no `block`s or `edgeEnd`s:

```
{
    "width":  4,
    "height": 4,
    "bgColor": 16777215,
    "highlightFgColor": 0,
    "highlightBgColor": 16777215,
    "blocks": [],
    "edgeEnds": []
}
```

`block`s and `edgeEnd`s are objects that can be added to the two lists in order to define a graph.

### Bgraph blocks

Each `block` consists of, crucially, an (`x`,`y`) location and an `id`, as well as other properties that define how it appears in a bgraph:

| Property                                | Description                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `width` & `height`                      | Dimensions of the rectangle representing the block in the bgraph.                                                         |
| `depth`                                 | How the `block` is ordered relative to others. Higher depth `block`s appear above lower depth `block`s.                   |
| `color`                                 | A decimal representation of the `block`'s color (e.g., `"#123456"` ==> `1193046`).                                        |

A `block` also holds an `edgeEnds` list of `edgeEnd` IDs, which helps provide contextual highlighting when interacting with a `block` using Bgrapher.
Typically, this is a list of `edgeEnd`s that correspond to edges going to and from the given `block`.

This is an example of a `2` by `1`, `#000001`-colored block, located at the top-left of the bgraph (`0`,`0`), which has two `edgeEnd`s (`0` and `100`) associated with it:

```
    ...
    "blocks": [
        {
            "id": 0,
            "x": 0, "y": 0,
            "width": 2, "height": 1,
            "depth": 0, "color": 1,
            "edgeEnds": [
                0,
                100
            ]
        }
    ],
    ...
```

### Bgraph edgeEnds

Like `block`s, each `edgeEnd` consists of an (`x`,`y`) location and an `id`, as well as some additional properties:

| Property                                | Description                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `isSource`                              | `true`/`false`. Whether the `edgeEnd` represents a start of an edge or the end of an edge.                                |
| `direction`                             | `1`/`2`/`3`/`4`, which correspond to up/right/down/left. Influences how a highlighted edge appears when drawn.            |
| `color`                                 | Same format as for `block`s.                                                                                              |

Like a `block`, an `edgeEnd` also holds an `edgeEnds` list of `edgeEnd` IDs, representing all the `edgeEnd`s that this `edgeEnd` is coming from/going to. 
An `edgeEnd` usually has at least one other `edgeEnd` in this list, in order to form a complete edge, with a source `edgeEnd` and a destination `edgeEnd`.

Additionally, an `edgeEnd` can correspond to a particular `block`, which is represented by the `block`'s ID. 
It is best to have the `block` point back to the corresponding `edgeEnd`s that refer to it.

Below is an example of the `edgeEnd`s from the `block` above. 
The first is at the bottom-left of the block (`0`,`1`), while the other is at the bottom-right (`1`,`1`). Both are colored black (`#000000`).
Both are edge ends to one another (as evident from each `edgeEnds` array), and both correspond to block `0`.
One is the source (`"isSource": true`) and is pointing downward (`"direction": 3`) while the other is a destination (`"isSource": false`) and is pointing up (`"direction": 1`).

```
    ...
    "edgeEnds": [
        {
            "id": 0,
            "x": 0, "y": 1,
            "color": 0,
            "direction": 3,
            "isSource": true,
            "block": 0,
            "edgeEnds": [
                100
            ]
        },
        {
            "id": 100,
            "x": 1, "y": 1,
            "color": 0,
            "direction": 1,
            "isSource": false,
            "block": 0,
            "edgeEnds": [
                0
            ]
        }
    ]
    ...
```

In total, this example bgraph represents a single node with a loop.
Note that this is only one of the many ways in which this graph could be represented in bgraph format.

---------------------------------------

The rest of the info is about the `Bgrapher` JS object and its various interfaces.

## Member variables

A Bgrapher object contains all of the data that you provide to it in the `Bgrapher.blocksData` and `Bgrapher.edgeEndsData` member variables, keyed by each `block`'s or `edgeEnd`'s corresponding ID.
All of the metadata is also held in the Bgrapher object itself.

For example:

```
let yourBgrapher = new Bgrapher({
    width:  4,
    height: 4,
    ...
    blocks: [
        ...
        {
            id: 12,
            edgeEnds: [0, 100],
            ...
        },
        ...
    ],
    ...
}, yourElement);

let bgraphWidth  = yourBgrapher.width;  // 4
let bgraphHeight = yourBgrapher.height; // 4
let edgeEndsOf12 = yourBgrapher.blocksData[12].edgeEnds; // [0, 100]
```

Treat these as read-only to avoid undefined behavior.
Instead use `Bgrapher` methods to make changes to the bgraph data.

## Methods

### `Bgrapher` constructor

```
Bgrapher([yourBgraph [, yourElement [, yourBgraphState]]])
```

The most convenient form is:

```
let yourBgrapher = new Bgrapher(yourBgraph, yourElement);
```

Where you simply specify the input bgraph and where you want the bgraph to be displayed.

#### Parameters

`yourBgraph`: Either a javascript object or a JSON string containing the bgraph to be displayed.

`yourElement`: An HTML element within which the Bgrapher will draw the bgraph.

`yourBgraphState`: Externally-managed state of the user's interaction with the bgraph, such as the user's zoom and offset.

### `Bgrapher.activeBlocks` & `Bgrapher.activeEdgeEnds`

```
activeBlocks()
activeEdgeEnds()
```

#### Return value

Returns either the objects of the active `block`s or active `edgeEnd`s in the bgraph.
"Active" `block`s/`edgeEnd`s include any which the user selected or hovered over, and which are thus highlighted in the bgraph.

### `Bgrapher.activeEdges`

```
activeEdges()
```

#### Return value

Returns a pair of active `edgeEnd` objects.
Since edges aren't highlighted directly, these are the result of user interaction with `block`s and `edgeEnd`s.

### `Bgrapher.toggleBlock` & `Bgrapher.toggleEdgeEnd`

```
toggleBlock(blockID)
toggleEdgeEnd(edgeEndID)
```

Toggling a `block` or `edgeEnd` using these functions is equivalent to a user clicking on them.

#### Parameters

`blockID`/`edgeEndID`: ID of either the `block` or `edgeEnd` which you are toggling.

### `Bgrapher.selectBlock` & `Bgrapher.selectEdgeEnd`

```
selectBlock(blockID)
selectEdgeEnd(edgeEndID)
```

Selecting a `block` or `edgeEnd` using these functions is equivalent to a user right-clicking on them.

#### Parameters

`blockID`/`edgeEndID`: ID of either the `block` or `edgeEnd` which you are toggling.

### `Bgrapher.hoverBlock` & `Bgrapher.hoverEdgeEnd`

```
hoverBlock(blockID)
hoverEdgeEnd(edgeEndID)
```

Hovering a `block` or `edgeEnd` using these functions is equivalent to a user hovering over them.

#### Parameters

`blockID`/`edgeEndID`: ID of either the `block` or `edgeEnd` which you are toggling.

## Callbacks

### `Bgrapher.onHoverBlock` & `Bgrapher.onHoverEdgeEnd`

```
onHoverBlock(yourCallback)
onHoverEdgeEnd(yourCallback)
```

#### Parameters

`yourCallback`: The callback to be called when the user hovers over an element in the graph.
`block` or `edgeEnd` object is passed in to the callback.

### `Bgrapher.onToggleBlock` & `Bgrapher.onToggleEdgeEnd`

```
onHoverBlock(yourCallback)
onHoverEdgeEnd(yourCallback)
```

#### Parameters

`yourCallback`: The callback to be called when the user toggles an element in the graph, meaning that they click to highlight a node and its edges.
`block` or `edgeEnd` object is passed in to the callback.

### `Bgrapher.onSelectBlock` & `Bgrapher.onSelectEdgeEnd`

```
onHoverBlock(yourCallback)
onHoverEdgeEnd(yourCallback)
```

#### Parameters

`yourCallback`: The callback to be called when the user selects an element, seeking to extract more information about it, by default via right-click.
`block` or `edgeEnd` object is passed in to the callback.

## Shared `BgraphState` for multiple `Bgrapher`s

It can be convenient to sync user interaction across multiple bgraphers.
This can be achieved by using a shared bgraph state.

To use bgraph state that is shared across bgrapher objects:
1. Instantiate a `new BgraphState()` to be used by all of your bgraphers.
2. Instantiate `new Bgrapher()`s with `yourBgraphState` passed in.

For example:

```
import { Bgrapher, BgraphState } from 'bgrapher';
let yourBgraphState = new BgraphState();

let yourBgrapher1 = new Bgrapher(yourBgraph1, yourElement1, yourBgraphState);
let yourBgrapher2 = new Bgrapher(yourBgraph2, yourElement2, yourBgraphState);
```

When working with a shared state, ensure that both bgraphs have the same dimensions.

### `BgraphState`

```
new BgraphState()
```

The BgraphState object contains the user's location/zoom level within the bgraph, as well as a list of Bgraphers subscribed to be notified of state changes.

### `BgraphState.update`

```
update()
```

This is the preferred method to use if you need to force-update all `Bgrapher`s state (e.g., if modifying `BgraphState` manually).
Any `Bgrapher`s that are subscribed to be notified of state changes are notified when `yourBgraphState`'s `update` method is called.

To ensure that `Bgrapher`s are subscribed, pass in `yourBgraphState` to the `new Bgrapher()` constructor, or to the `populateElement` call.

### `BgraphState` versus React state

Don't let React manage your BgraphState!
Bgrapher regenerates only the relevant parts of the graph, while React won't know any better than to refresh the entire HTML element.

In other words, instead of this:

```
this.state = { myBgraphState: new BgraphState() };
```

Do this:

```
this.myBgraphState = new BgraphState();
```

## Other interfaces

### `Bgrapher.hoveredBlock` & `Bgrapher.hoveredEdgeEnd`

```
hoveredBlock()
hoveredEdgeEnd()
```

#### Return value

Returns only the current hovered `block` or `edgeEnd` in the bgraph.
Returns `null` if no `block` or `edgeEnd` is currently hovered.

Prefer to use `onHoverBlock` & `onHoverEdgeEnd` instead.

### `Bgrapher.initBgraph`

```
initBgraph(bgraph)
```

Useful for re-initializing the data used to construct the bgraph.

#### Parameters

`yourBgraph`: Either a javascript object or a JSON string containing the bgraph to be displayed.

### `Bgrapher.populateElement`

```
populateElement(yourElement [, yourBgraphState])
```

Populates `yourElement` and optionally registers `Bgrapher` with an external `BgraphState`. 
Useful for moving a bgraph to another element.
You must pass the `BgraphState` explicitly for it to be preserved.

#### Parameters

`yourElement`: An HTML element within which the Bgrapher will draw the bgraph.

`yourBgraphState`: Externally-managed state of the user's interaction with the bgraph, such as the user's zoom and offset.

### `Bgrapher.draw`

```
draw()
```

Re-draws the bgrapher using the latest `BgraphState`.

If using an external `BgraphState`, prefer to call `BgraphState.update()` instead.

### `Bgrapher.clientWidth` & `Bgrapher.clientHeight`

```
clientWidth()
clientHeight()
```

#### Return value

Returns the width or height of the Bgrapher element within `yourElement`, based on the underlying Bgrapher implementation used.

### `Bgrapher.updateClientSize`

```
updateClientSize()
```

Changes the size of the bgraph to match the size of `yourElement`, which contains the bgraph.
Useful if the dimensions of the element change.

This is called automatically whenever the window is re-sized.

### `Bgrapher.curBlock` & `Bgrapher.curEdgeEnd`

```
curBlock(cur)
curEdgeEnd(cur)
```

#### Parameters

`cur`: Object of the form `{x: yourX, y: yourY}`, where the `x,y` coordinate corresponds to a location relative to the bgraph.
For example, this can correspond to a mouse cursor location, but it would not correspond to the `x,y` coordinate of a `block` or `edgeEnd` as specified in the input bgraph object.

#### Return value

Returns the `block` or `edgeEnd` object at the specified location.

---------------------------------------

## Development

### Run build

```
npm run build
```

### Run tests

```
npm run test:cov
```

### Run example

```
npm run build:dev
```

Then access at `localhost:3000`.
