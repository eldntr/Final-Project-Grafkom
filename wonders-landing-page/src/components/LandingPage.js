// src/LandingPage.js
import React, { useState } from 'react';
import {WonderScene} from './WonderScene';
import InfoPanel from './InfoPanel'

const wonders = [
    { name: 'Eiffel Tower - Paris (France)', path: '/models/eiffel_tower.glb', info: 'The Eiffel Tower, completed in 1889, was originally built as the entrance arch for the 1889 World\'s Fair held in Paris.\n' +
            'Standing 1,083 feet tall (330 meters), it was the tallest man-made structure in the world for over 40 years until the Chrysler Building was built in New York.\n' +
            'It takes 20,000 light bulbs to make the Eiffel Tower sparkle every evening, a spectacle admired by millions each year.', url:"/eiffel"},
    { name: 'Leaning Tower of Pisa - Pisa (Italy)', path: '/models/pisa_tower.glb', info:'The leaning tower of Pisa was supposed to be 60 meters tall (196.85 feet). After the lean, however, the highest side of the tower reaches a mere 56.67 meters (about 186 feet), while the lowest side is 55.86m, or 183 feet.\n' +
            '\n' +
            'By 1990 the tower had reached a tilt of 5.5 degrees, nearly 15 feet from its base, and enough to topple it over, by most calculations!', url:"/pisa"},
    {name: 'Christ the Redeemer - Rio de Janeiro (Brazil)', path: '/models/kristus.glb', info:'Christ the Redeemer in Rio de Janeiro stands 98 feet tall (30 meters), with an arm span stretching 92 feet, making it one of the largest Art Deco statues in the world.\n' +
            'Completed in 1931, the statue took nine years to build, with materials transported from France and construction financed by donations from Brazilian citizens.\n' +
            'Its iconic pose, with open arms, symbolizes peace and embrace, welcoming all to the vibrant city of Rio.\n' +
            'In 2007, Christ the Redeemer was named one of the New Seven Wonders of the World, solidifying its status as a global icon of faith and culture.', url:"/crist"},
    {name: 'Aztec Pyramids - Teotihuacan (Mexico)', path: '/models/aztec.glb', info: 'The largest Aztec pyramid was called the Pyramid of the Sun, rising over 200 feet into the air. Aztecs believed the sun and the moon were made in their major city and worshiped both with giant pyramids. As many as 200,000 people might have lived in the city built around these pyramids.', url:"/aztec"},
    {name: 'Taj Mahal - Agra (India)', path: '/models/tajmahal.glb', info: 'The Taj changes its colour three times a day. The Taj Mahal seems pink in the morning and milky white in the evening and golden in the moonlight. In the centre of the Taj Mahal are the tombs of both Shah Jahan and Mumtaz Mahal.', url:"/tajmahal"},
    {name: 'Colloseum - Rome (Italy)', path: '/models/colloseum.glb', info: 'At its tallest point, the Colosseum stands 157 feet high. That\'s around the same height as the Washington Monument. There are four levels to the Colosseum and in ancient Rome, over 50,000 spectators could enter through the 80 entrances. When you\'re there, look for the diagonal break down the side of the amphitheater.', url:"/collosseum"},
    {name: 'Great Wall of China - Beijing (China)',path: '/models/greatwall.glb',info:'The most extensive and best-preserved version of the wall dates from the Ming dynasty (1368–1644) and runs for some 5,500 miles (8,850 km) east to west from Mount Hu near Dandong, southeastern Liaoning province, to Jiayu Pass west of Jiuquan, northwestern Gansu province', url:"/greatwall"}
];

function LandingPage() {
    const [currentWonderIndex, setCurrentWonderIndex] = useState(0);
    const [showInfo, setShowInfo] = useState(false);

    const handleNext = () => {
        setCurrentWonderIndex((prevIndex) => (prevIndex + 1) % wonders.length);
    };

    const handlePrevious = () => {
        setCurrentWonderIndex(
            (prevIndex) => (prevIndex - 1 + wonders.length) % wonders.length
        );
    };
    const toggleInfo = () => setShowInfo(!showInfo);

    return (
        <div style={{ textAlign: 'center' }}>
            <h1>{wonders[currentWonderIndex].name}</h1>
            <div style={{ width: '100vw', height: '80vh' }}>
                <WonderScene modelPath={wonders[currentWonderIndex].path} />
            </div>
            <div className="button-container">
                <button onClick={handlePrevious}>Previous</button>
                <button onClick={toggleInfo}>Infographics</button>
                <button onClick={() => window.open(`http://${window.location.hostname}:5173${wonders[currentWonderIndex].url}`, '_blank')}>Tour</button>
                <button onClick={handleNext}>Next</button>
            </div>
            {showInfo && (
                <InfoPanel info={wonders[currentWonderIndex].info} onClose={toggleInfo} />
            )}
        </div>
    );
}

export default LandingPage;
