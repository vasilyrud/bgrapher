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

## Bgraph format

Bgraphs are like any other graphs, except optimized for speed and flexibility. 
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

Each `block` consists of, crucially, an _(`x`,`y`)_ location and an `id`, as well as other properties that define how it appears in Bgrapher:

| Property                                | Description                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `width` & `height`                      | Dimensions of the rectangle representing the block in the Bgraph.                                                         |
| `depth`                                 | How the `block` is ordered relative to others in the same place. Higher depth `block`s appear above lower depth `block`s. |
| `color`                                 | A decimal representation of the color (e.g., `"#123456"` ==> `1193046`).                                                  |

A `block` also holds a list of `edgeEnd` `id`s, which helps provide contextual highlighting when interacting with a `block` in Bgrapher; however, these can also point to any other `edgeEnd`s in the graph.

### EdgeEnd

Like `block`s, each `edgeEnd` consists of an _(`x`,`y`)_ location and an `id`, as well as some additional properties:

| Property                                | Description                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `isSource`                              | `true`/`false`. Whether the `edgeEnd` represents a start of an edge or the end of an edge.                                |
| `color`                                 | Same format as `block`s.                                                                                                  |
| `direction`                             | `"up"`/`"down"`/`"left"`/`"right"`. Influences how a highlighted edge appears when drawn.                                 |

Like a `block`, an `edgeEnd` also holds a list of `edgeEnd` `id`s, representing all the `edgeEnd`s that this `edgeEnd` is coming from/going to. 
It is best to have each `edgeEnd` point back in its corresponding list.

Additionally, an `edgeEnd` can correspond to a particular `block`, which is represented by the `block`'s `id`. 
It is best to have the `block` point back to the corresponding `edgeEnd`s that refer to it.

### Sample Bgraphs

[A simple example](test/bgraphs/oneedge.json) with a single `block` and a single edge to itself.

[A more complicated example](test/bgraphs/default.json) with more `block`s and `edgeEnd`s.

## API

A Bgrapher object contains all of the data provided by the user in the `blocksData` and `edgeEndsData` member variables, keyed by each `block`'s or `edgeEnd`'s corresponding ID.

### Methods

new Bgrapher()

initBgraph(bgraph)

populateElement(bgraphElement, \[bgraphState\])

draw()

clientWidth()
clientHeight()

activeBlocks()
activeEdgeEnds()
activeEdges()

hoveredBlock()
hoveredEdgeEnd()

### Callbacks

Several callback function allow you to be notified of various user interactions with the Bgraph.

| Callback                            | Description                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `onHoverBlock` & `onHoverEdgeEnd`   | Register callback to be called when the user hovers over an element in the graph.                                                          |
| `onToggleBlock` & `onToggleEdgeEnd` | Register callback to be called when the user toggles an element in the graph, meaning that they click to highlight the node and edges.     |
| `onSelectBlock` & `onSelectEdgeEnd` | Register callback to be called when the user selects an element, seeking to extract more information about it, by default via right-click. |

For all callbacks, the relevant activated `block` or `edgeEnd` data is passed in to each provided callback as-is from the input Bgraph provided by the user.

### Advanced methods

toggleBlock(blockID)
toggleEdgeEnd(edgeEndID)

selectBlock(blockID)
selectEdgeEnd(edgeEndID)

hoverBlock(blockID)
hoverEdgeEnd(edgeEndID)

curBlock(cur)
curEdgeEnd(cur)

updateClientSize()

### External state

new BgraphState()
update()

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

#### BgraphState versus React state

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
