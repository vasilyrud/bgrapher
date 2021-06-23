# bgrapher

Bgrapher presents as much information about a graph as possible in a concise format, while removing all unnecessary noise. 
This lets you focus on the bigger picture, while still allowing you to focus in on the details as needed.

Bgrapher works particularly well for visualizing large, sparse, directed, hierarchical graphs. 
This may seem too specific to be useful, but chances are that your graph meets these constraints. 
Anything that you might want to draw with `dot`, but which doesn't neatly fit into a single image, is a good candidate for Bgrapher.

## Getting started

Say you already have a Bgraph, and would like to draw `yourBgraph` inside `yourElement = document.createElement('div')`, you can do so directly:

```
<script src="https://unpkg.com/bgrapher/dist/bgrapher.min.js"></script>
<script>
    let yourBgrapher = new bgrapher.Bgrapher(yourBgraph, yourElement);
</script>
```

Or, if installed via npm:

```
import { BGrapher } from 'bgrapher';
let yourBgrapher = new Bgrapher(yourBgraph, yourElement);
```

If your graph is not in Bgraph format yet, you can create it using the format described below.

---------------------------------------

## Bgraph format

Bgraphs are like any other graphs, except optimized for speed and flexibility on the frontend. 
This means that you may need to do a bit more prep work "offline" before rendering a graph.

### Bgraph structure

Bgraphs are formatted in JSON. Nodes are represented with `block`s and edges are pairs of `edgeEnd`s. 
A Bgraph contains a list of each:

```
{
    "blocks": [...],
    "edgeEnds": [...]
}
```

As well as all additional properties:

| Property                                | Description                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `width` & `height`                      | The total dimensions of the Bgraph. This should be made sufficiently large to contain all of your `block`s/`edgeEnd`s.    |
| `bgColor`                               | Background color that is behind all `block`s and `edgeEnd`s.                                                              |
| `highlightBgColor` & `highlightFgColor` | Highlight colors for highlighting graph interactions. Choosing 2 contrasting colors for these values improves visibility. |

### Block

Each `block` consists of, crucially, an (`x`,`y`) location and an `id`, as well as other properties that define how it appears in Bgrapher:

| Property                                | Description                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `width` & `height`                      | Dimensions of the rectangle representing the block in the Bgraph.                                                         |
| `depth`                                 | How the `block` is ordered relative to others in the same place. Higher depth `block`s appear above lower depth `block`s. |
| `color`                                 | A decimal representation of the color (e.g., `"#123456"` ==> `1193046`).                                                  |

A `block` also holds a list of `edgeEnd` `id`s, which helps provide contextual highlighting when interacting with a `block` in Bgrapher; however, these can also point to any other `edgeEnd`s in the graph.

### EdgeEnd

Like `block`s, each `edgeEnd` consists of an (`x`,`y`) location and an `id`, as well as some additional properties:

| Property                                | Description                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `isSource`                              | `true`/`false`. Whether the `edgeEnd` represents a start of an edge or the end of an edge.                                |
| `color`                                 | Same format as `block`s.                                                                                                  |
| `direction`                             | `1`/`2`/`3`/`4`, which correspond to up/right/down/left. Influences how a highlighted edge appears when drawn.            |

Like a `block`, an `edgeEnd` also holds a list of `edgeEnd` `id`s, representing all the `edgeEnd`s that this `edgeEnd` is coming from/going to. 
It is best to have each `edgeEnd` point back in its corresponding list.

Additionally, an `edgeEnd` can correspond to a particular `block`, which is represented by the `block`'s `id`. 
It is best to have the `block` point back to the corresponding `edgeEnd`s that refer to it.

### Sample Bgraphs

[A simple example](test/bgraphs/oneedge.json) with a single `block` and a single edge to itself.

[A more complicated example](test/bgraphs/default.json) with more `block`s and `edgeEnd`s.

---------------------------------------

## `Bgrapher` data

A Bgrapher object contains all of the data provided by the user in the `Bgrapher.blocksData` and `Bgrapher.edgeEndsData` member variables, keyed by each `block`'s or `edgeEnd`'s corresponding ID.
All of the metadata is also held at the Bgrapher object level.

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

## `Bgrapher` methods

### `Bgrapher`

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

Return either the objects of the active `block`s or active `edgeEnd`s in the bgraph.
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

## `Bgrapher` Callbacks

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

`yourCallback`: The callback to be called when the user toggles an element in the graph, meaning that they click to highlight the node and edges.
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
import { BGrapher, BgraphState } from 'bgrapher';
let yourBgraphState = new BgraphState();

let yourBgrapher1 = new Bgrapher(yourBgraph1, yourElement1, yourBgraphState);
let yourBgrapher2 = new Bgrapher(yourBgraph2, yourElement2, yourBgraphState);
```

When working with a shared state, it makes the most sense for both bgraphs to have the same dimensions.

### `BgraphState`

```
new BgraphState()
```

The BgraphState object contains the user's location/zoom level within the bgraph, as well as a list of Bgraphers subscribed to be notified of state changes.

### `BgraphState.update`

```
update()
```

This is the preferred method to use if you need to force-update the current user interaction state (e.g., if modifying `BgraphState` manually).
Any `Bgrapher`s that are subscribed to be notified of state changes are notified when `yourBgraphState`'s `update` method is called.

To ensure that `Bgrapher`s are subscribed, pass in `yourBgraphState` to the `new Bgrapher()` constructor, or to the `populateElement` call.

### `BgraphState` versus React state

Don't let React manage your BgraphState!
Bgrapher regenerates only the relevant parts of the graph, while React won't know any better than to refresh the entire HTML element.

In other words, instead of this:

```
this.state = {myBgraphState: new BgraphState()};
```

Do this:

```
this.myBgraphState = new BgraphState();
```

## Other `Bgrapher` interfaces

### `Bgrapher.hoveredBlock` & `Bgrapher.hoveredEdgeEnd`

```
hoveredBlock()
hoveredEdgeEnd()
```

#### Return value

Return only the current hovered `block` or `edgeEnd` in the bgraph.
Return `null` if no `block` or `edgeEnd` currently hovered.

Prefer to use `onHoverBlock` & `onHoverEdgeEnd` instead.

### `Bgrapher.initBgraph`

```
initBgraph(bgraph)
```

Prefer to call `new Bgrapher()` when possible instead.

#### Parameters

`yourBgraph`: Either a javascript object or a JSON string containing the bgraph to be displayed.

### `Bgrapher.populateElement`

```
populateElement(yourElement [, yourBgraphState])
```

Populates element and optionally registers `Bgrapher` with an external `BgraphState`. 

Prefer to call `new Bgrapher()` when possible instead.

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

Return the width or height of the Bgrapher element within `yourElement`, based on the underlying Bgrapher implementation used.

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
