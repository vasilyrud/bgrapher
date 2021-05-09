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

import '../styles/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import { BgraphState } from './bgraphstate.js'
import { BGrapher } from './bgrapher.js'

import { BlockInfo } from './BlockInfo.jsx'

import defaultBgraph from './bgraphs/default.json';
import outedgesBgraph from './bgraphs/outedges.json';
import edgesBgraph from './bgraphs/edges.json';
import testOnlyDots from './bgraphs/testonlydots.js';
import testDotsEdges from './bgraphs/testdotsedges.js';

function BGraph(props) {
    const [bgrapher,] = React.useState(() => {
        const bgrapher = new BGrapher();

        if (props.bgraphType == 'graph') {
            bgrapher.initBgraph(props.bgraphStr);
        } else if (props.bgraphType == 'testBlocks') {
            bgrapher.initBgraph(testOnlyDots(1000, 10000));
        } else if (props.bgraphType == 'testEdges') {
            bgrapher.initBgraph(testDotsEdges(1000, 1000));
        } else if (props.bgraphType == 'testLarge') {
            bgrapher._initTestBgraphLarge(5000, 10000);
        }

        return bgrapher
    });
    const [blockData, setBlockData] = React.useState(null);
    const bgraphElement = React.createRef();

    function hideBlockInfo() {
        setBlockData(null)
    }

    function showBlockInfo(data) {
        setBlockData(data);
    }

    React.useEffect(() => {
        bgrapher.populateElement(props.bgraphState, bgraphElement.current);
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

function BGraphGroup(props) {
    // Don't use React state since this state is managed by BGrapher
    let bgraphState = new BgraphState();

    const bgraphs = Object.entries(props.bgraphers)
        .map(([key, bgraph]) => 
            <BGraph
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

function BGraphForm(props) {
    const bgraphChoices = {
        default: defaultBgraph,
        outedges: outedgesBgraph,
        edges: edgesBgraph,
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
            <button className="bgraphFormSubmit" onClick={handleSubmit("testLarge")}>
                Large test image
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
        ? <BGraphForm  onSubmit={onFormSubmit} /> 
        : <BGraphGroup bgraphers={bgraphers} />
    );
}

function main() {
    ReactDOM.render(<RootHolder />, document.getElementById('root'));
}

main();
