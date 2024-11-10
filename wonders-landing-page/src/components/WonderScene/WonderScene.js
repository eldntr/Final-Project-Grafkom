// src/components/WonderScene/WonderScene.js
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import WonderModel from './WonderModel';
import Lighting from './Lighting';

// src/components/WonderScene/WonderScene.js
function WonderScene({ modelPath }) {
    return (
        <Canvas camera={{ position: [0, 20, 100] }}>
            <Lighting />
            <Suspense fallback={null}>
                <WonderModel key={modelPath} modelPath={modelPath} />
            </Suspense>
            <OrbitControls enableZoom={false} />
        </Canvas>
    );
    // Inside WonderScene.js
    function Lighting() {
        return (
            <>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} color="#FFD700" />
                <spotLight position={[-5, 5, 5]} intensity={0.3} color="#FF6347" />
            </>
        );
    }

}

export default WonderScene;
