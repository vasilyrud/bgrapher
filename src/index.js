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

import defaultBgraph from './bgraphs/default.json';

function BGraph(props) {
    const bgrapher = new BGrapher();
    const bgraphElement = React.createRef();

    // bgrapher.initTestBgraph(props.bgraphState, 1000, 10000);
    // bgrapher.initTestBgraphLarge(props.bgraphState, 5000, 10000);
    bgrapher.initBgraph(props.bgraphState, props.bgraph);

    React.useEffect(() => {
        bgrapher.populateElement(props.bgraphState, bgraphElement.current);
    }, []); // Only run on mount

    return (
        <div id={props.id} ref={bgraphElement}>
        </div>
    );
}

function BGraphGroup(props) {
    const [bgraphState, setBGraphState] = React.useState(new BgraphState());

    const bgraphs = Object
        .entries(props.bgraphers)
        .map(([key, bgraph]) => 
            <BGraph id="bgraphDiv" key={key} bgraph={bgraph} bgraphState={bgraphState} />
        );

    return (
        <div id={props.id}>
            {bgraphs}
        </div>
    );
}

function BGraphForm(props) {
    const [formValue, setFormValue] = React.useState(JSON.stringify(defaultBgraph, null, 2));

    function handleSubmit(event) {
        event.preventDefault();
        props.onSubmit(event);
    }

    return (
        <form id={props.id} onSubmit={handleSubmit}>
            <textarea 
                name="bgraphJSON" 
                value={formValue} 
                onChange={e => setFormValue(e.target.value)}
            />
            <input type="submit" value="Draw graph" />
        </form>
    );
}

function RootHolder(props) {
    const [atForm, setAtForm] = React.useState(true);
    const [bgraphers, setBgraphers] = React.useState({});

    function onFormSubmit(event) {
        let bgraphStr = event.target.elements.bgraphJSON.value;
        setBgraphers(bgraphers => ({ ...bgraphers, main: bgraphStr }));
        setAtForm(false);
    }

    return (atForm 
        ? <BGraphForm  id="bgraphJSONForm" onSubmit={onFormSubmit} /> 
        : <BGraphGroup id="bgraphGroupDiv" bgraphers={bgraphers} />
    );
}

function main() {
    ReactDOM.render(<RootHolder />, document.getElementById('root'));
}

main();
