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

import '../styles/blockInfo.css';

import React from 'react';

function CloseButton(props) {
    return (<div 
        onClick={props.onClose} 
        className="closeButton"
    >&#215;</div>);
}

function InfoTopBar(props) {
    return (<div className="infoTopBar">
            <CloseButton onClose={props.onClose} />
    </div>);
}

function IDTitle(props) {
    return (<>
        <span className="idBrackets">[</span>
            {props.id}
        <span className="idBrackets">]</span>
    </>);
}

function BlockTitle(props) {
    return (<h2 className="blockTitle">
        <IDTitle id={props.id} /> {props.title}
    </h2>);
}

function BlockLocation(props) {
    return (<>
        ({props.x}, {props.y})
    </>);
}

function BlockDimensions(props) {
    return (<>
        {props.width}x{props.height}
    </>);
}

function InfoContent(props) {
    const blockData = props.blockData;

    return (
        <div className="infoContent">
            <BlockTitle id={blockData.id} title={blockData.text} />
            <p>
                <BlockLocation x={blockData.x} y={blockData.y} />
                <br />
                <BlockDimensions width={blockData.width} height={blockData.height} />
            </p>
        </div>
    );
}

function BlockInfo(props) {
    if (!props.blockData) return null;

    return (
        <div className="blockInfoHolder">
            <div className="blockInfo">
                <InfoTopBar onClose={props.onClose} />
                <InfoContent blockData={props.blockData} />
            </div>
        </div>
    );
}

export { BlockInfo }
