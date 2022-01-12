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

import './styles/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import { BlockInfo } from './BlockInfo.jsx'

import { Bgrapher, BgraphState } from '../src/index.js'

import defaultBgraph from '../test/bgraphs/default.json';
import outedgesBgraph from '../test/bgraphs/outedges.json';
import edgesBgraph from '../test/bgraphs/edges.json';
import emptyBgraph from '../test/bgraphs/empty.json';
import testOnlyDots from '../test/bgraphs/testonlydots.js';
import testDotsEdges from '../test/bgraphs/testdotsedges.js';

function Bgraph(props) {
  const [bgrapher, setBgrapher] = React.useState(() => {
    let bgrapher;

    if (props.bgraphType == 'graph') {
      bgrapher = new Bgrapher(props.bgraphStr);

    } else if (props.bgraphType == 'testBlocks') {
      bgrapher = new Bgrapher();
      bgrapher.initBgraph(testOnlyDots(350, 350));

    } else if (props.bgraphType == 'testEdges') {
      bgrapher = new Bgrapher();
      bgrapher.initBgraph(testDotsEdges(1000, 1000));
    }

    bgrapher.debug = true;
    return bgrapher;
  });
  const [blockData, setBlockData] = React.useState(null);
  const bgraphElement = React.createRef();

  function hideBlockInfo() {
    setBlockData(null);
  }

  function showBlockInfo(data) {
    setBlockData(data);
  }

  React.useEffect(() => {
    bgrapher.populateElement(bgraphElement.current, props.bgraphState);
    // bgrapher.populateElement(bgraphElement.current);
    // setBgrapher(new Bgrapher(props.bgraphStr, bgraphElement.current));
    // setBgrapher(new Bgrapher(props.bgraphStr, bgraphElement.current, props.bgraphState));

    // For testing
    window.bgrapher = bgrapher;
    window.bgraphState = props.bgraphState;
    window.bgraphElement = bgraphElement.current;

    bgrapher.onSelectBlock(showBlockInfo);
  }, []); // Only run on mount

  return (
    <div className="bgraphColumn">
      <BlockInfo blockData={blockData} onClose={hideBlockInfo} />
      <div className="fullWidth" ref={bgraphElement}>
      </div>
    </div>
  );
}

function BgraphGroup(props) {
  // Don't use React state since this state is managed by Bgrapher
  let bgraphState = new BgraphState();

  const bgraphs = Object.entries(props.bgraphers)
    .map(([key, bgraph]) => 
      <Bgraph
        key={key} 
        bgraphStr={bgraph.bgraphStr} 
        bgraphType={bgraph.bgraphType}
        bgraphState={bgraphState}
      />
    );

  return (
    <div className="bgraphGroup">
      {bgraphs}
    </div>
  );
}

function BgraphForm(props) {
  const bgraphChoices = {
    default: defaultBgraph,
    outedges: outedgesBgraph,
    edges: edgesBgraph,
    empty: emptyBgraph,
  };
  const defaultChoice = 'default';

  const [formValue, setFormValue] = React.useState(toJSON(bgraphChoices[defaultChoice]));
  const [selectValue, setSelectValue] = React.useState(defaultChoice);

  function toJSON(bgraphObj) {
    return JSON.stringify(bgraphObj, null, 2);
  }

  function handleSelect(event) {
    event.preventDefault();
    const newSelectValue = event.target.value;

    setSelectValue(newSelectValue);
    setFormValue(toJSON(bgraphChoices[newSelectValue]));
  }

  function handleSubmit(bgraphType) {
    return (event) => {
      event.preventDefault();
      props.onSubmit(
        event.target.form.elements.bgraphJSON.value, 
        bgraphType
      );
    }
  }

  return (
    <form className="bgraphJSONForm">
      <select 
        name="bgraphOptions"
        value={selectValue} 
        onChange={handleSelect}
      >
        {Object.keys(bgraphChoices).map((key) =>
          <option key={key} value={key}>{key}</option>
        )}
      </select>

      <textarea 
        name="bgraphJSON" 
        value={formValue} 
        onChange={e => setFormValue(e.target.value)}
      />

      <button className="bgraphFormSubmit" onClick={handleSubmit("graph")}>
        Standalone
      </button>
      <button className="bgraphFormSubmit" onClick={handleSubmit("compare")}>
        Compare
      </button>
      <button className="bgraphFormSubmit" onClick={handleSubmit("testBlocks")}>
        Test blocks
      </button>
      <button className="bgraphFormSubmit" onClick={handleSubmit("testEdges")}>
        Test edges
      </button>
    </form>
  );
}

function RootHolder(props) {
  const [atForm, setAtForm] = React.useState(true);
  const [bgraphers, setBgraphers] = React.useState({});

  function onFormSubmit(bgraphStr, bgraphType) {
    if (bgraphType === 'compare') {
      setBgraphers(bgraphers => ({ ...bgraphers, 
        main: {
          bgraphStr:  bgraphStr,
          bgraphType: 'graph',
        },
        comparedTo: {
          bgraphStr:  bgraphStr,
          bgraphType: 'graph',
        }
      }));
    } else {
      setBgraphers(bgraphers => ({ ...bgraphers, 
        main: {
          bgraphStr:  bgraphStr,
          bgraphType: bgraphType,
        }
      }));
    }
    setAtForm(false);
  }

  return (atForm 
    ? <BgraphForm  onSubmit={onFormSubmit} /> 
    : <BgraphGroup bgraphers={bgraphers} />
  );
}

function main() {
  ReactDOM.render(<RootHolder />, document.getElementById('root'));
}

main();
