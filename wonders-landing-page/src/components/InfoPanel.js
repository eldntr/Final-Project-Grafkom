import React from 'react';
import '../InfoPanel.css';

function InfoPanel({ info, onClose }) {
    return (
        <div className="info-panel">
            <div className="info-content">
                <p>{info}</p>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export default InfoPanel;
