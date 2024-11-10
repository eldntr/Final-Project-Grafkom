import React, {useEffect, useRef} from 'react';
import { useGLTF } from '@react-three/drei';
import {useFrame} from "@react-three/fiber";

function WonderModel({ modelPath }) {
    const { scene } = useGLTF(modelPath);
    const modelRef = useRef();

    // Assign scene to the ref
    modelRef.current = scene;

    // Clear the cache whenever the model changes
    useEffect(() => {
        return () => {
            useGLTF.clear(modelPath);
        };
    }, [modelPath]);

    useFrame(() => {
        if (modelRef.current) {
            modelRef.current.rotation.y += 0.03; // Rotate model on the Y-axis
        }
    });

    return <primitive ref={modelRef} object={scene} scale={0.5} />;
}

export default WonderModel;
