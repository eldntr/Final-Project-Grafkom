// src/LandingPage.js
import React, { useState } from 'react';
import {WonderScene} from './WonderScene';

const wonders = [
    { name: 'Eiffel Tower', path: '/models/eiffel_tower.glb' },
    { name: 'Leaning Tower of Pisa', path: '/models/pisa_tower.glb' },
];

function LandingPage() {
    const [currentWonderIndex, setCurrentWonderIndex] = useState(0);

    const handleNext = () => {
        setCurrentWonderIndex((prevIndex) => (prevIndex + 1) % wonders.length);
    };

    const handlePrevious = () => {
        setCurrentWonderIndex(
            (prevIndex) => (prevIndex - 1 + wonders.length) % wonders.length
        );
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h1>{wonders[currentWonderIndex].name}</h1>
            <div style={{ width: '100vw', height: '80vh' }}>
                <WonderScene modelPath={wonders[currentWonderIndex].path} />
            </div>
            <div className="button-container">
                <button onClick={handlePrevious}>Previous</button>
                <button onClick={handleNext}>Next</button>
            </div>
        </div>
    );
}

export default LandingPage;
