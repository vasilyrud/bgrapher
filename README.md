# bgrapher

Bgrapher presents as much information about a graph as possible in a concise format, while removing all unecessary noise. This lets you focus on the bigger picture, while still allowing you focus in on the details as needed.

Bgrapher works particularly well for visualizing large, sparce, directed, hierarchichal graphs. This may seem too specific to be useful, but chances are that your graph meets these constraints. Anything that you might want to draw with `dot`, but which doesn't neatly fit into a single image, is a good candidate for Bgrapher.

## Getting started

Say you already have a Bgraph, and would like to draw `yourBgraph` inside `yourElement = document.createElement('div')`, you can do so directly:

```
<script src="https://unpkg.com/bgrapher/dist/bgrapher.min.js"></script>

<script>
    let yourBgraphState = new bgrapher.BgraphState();
    let yourBgrapher    = new bgrapher.Bgrapher();
    yourBgrapher.initBgraph(yourBgraph);
    yourBgrapher.populateElement(yourBgraphState, yourElement);
</script>
```

Or, if installed via npm:

```
import { BgraphState, BGrapher } from 'bgrapher';

let yourBgraphState = new BgraphState();
let yourBgrapher    = new Bgrapher();
yourBgrapher.initBgraph(yourBgraph);
yourBgrapher.populateElement(yourBgraphState, yourElement);
```

But, say, you don't have a Bgraph yet. If so, you can create one using the format descriped below.

## Bgraph format

Bgraphs are like any other graphs, except optimized for efficient drawing and greatest flexibility. Mainly, this means that you may need to do a bit more prep work "offline" before diving in.

### Bgraph structure

Bgraphs are formatted in JSON. Nodes are represented with `block`s and edges are pairs of `edgeEnd`s. A Bgraph contains a list of each:

```
{
    "blocks": [...],
    "edgeEnds": [...]
}
```

As well as all additional propoerties:

`width` & `height`: The total dimensions of the bgraph. This should be made sufficiently large to conain all of your `block`s/`edgeEnd`s.

`bgColor`: Background color that is behind all `block`s and `edgeEnd`s.

`highlightBgColor` & `highlightFgColor`: Highlight colors for highlighting graph interactions. Choosing 2 contrasting colors for these values improves visibility.

### Block

Each `block` consists of, crucially, an _(`x`,`y`)_ location and an `id`, as well as other properties that define how it appears in Bgrapher:

`width` & `height`: Dimensions of the rectangle representing the block in the Bgraph.

`depth`: How the `block` is ordered relative to others in the same place. Higher depth `block`s appear above lower depth `block`s.

`color`: A decimal representation of the color (e.g., `"#123456"` ==> `1193046`).

A `block` also holds a list of `edgeEnd` `id`s, which helps provide contextual highlighting when interacting with a `block` in Bgrapher; however, these can also point to any other `edgeEnd`s in the graph.

### EdgeEnd

Like `block`s, each `edgeEnd` consists of an _(`x`,`y`)_ location and an `id`, as well as some additional properties:

`isSource`: `true`/`false`. Whether the `edgeEnd` represents a start of an edge or the end of an edge.

`color`: Same format as `block`s.

`direction`: `"up"`/`"down"`/`"left"`/`"right"`. Influences how a highlited edge appears when drawn.

Like a `block`, an `edgeEnd` also holds a list of `edgeEnd` `id`s, representing all the `edgeEnd`s that this `edgeEnd` is coming from/going to. It is best to have each `edgeEnd` point back in its corresponding list.

Additionally, an `edgeEnd` can correspond to a particular `block`, which is represented by the `block`'s `id`. It is best to have the `block` point back to the corresponding `edgeEnd`s that refer to it.

### Sample Bgraphs

[A simple example](test/bgraphs/oneedge.json) with a single `block` and a single edge to itself.

[A more complicated example](test/bgraphs/default.json) with more `block`s and `edgeEnd`s.

## Advanced usage

### Shared state

#### BgraphState versus React state

Don't let React manage your BgraphState! Bgrapher regenerates only the relevant parts of the graph, while React won't know any better than to refresh the entire HTML element.

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
