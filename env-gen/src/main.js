import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;

function init() {
    // Create scene
    scene = new THREE.Scene();

    // Set up camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 30);
    camera.lookAt(0, 0, 0);

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Create green field (a box)
    const greenBoxGeometry = new THREE.BoxGeometry(50, 0.2, 20);
    const greenMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const greenBox = new THREE.Mesh(greenBoxGeometry, greenMaterial);
    greenBox.position.set(0, 0, 0);
    scene.add(greenBox);

    // Create a smaller pedestrian path (gray walkway)
    const walkwayGeometry = new THREE.BoxGeometry(0.5, 0.01, 20);
    const walkwayMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
    const walkway = new THREE.Mesh(walkwayGeometry, walkwayMaterial);
    walkway.position.set(0, 0.1, 0);
    scene.add(walkway);

    // Add random buildings around the field
    addRandomBuildings();

    // Add OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.enablePan = true;

    // Animation loop
    animate();
}

function addRandomBuildings() {
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const fieldSize = 20; // Ukuran alas hijau

    for (let i = 0; i < 20; i++) {
        // Randomize height and size
        const width = Math.random() * 1.5 + 0.5;
        const height = Math.random() * 10 + 2;
        const depth = Math.random() * 1.5 + 0.5;

        // Create building geometry
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);

        // Randomize position around the green field (di luar area alas hijau)
        let x, z;
        if (Math.random() < 0.5) {
            // Gedung berada di sisi kiri atau kanan alas
            x = Math.random() < 0.5 ? -(fieldSize / 2 + 2) : (fieldSize / 2 + 2);
            z = (Math.random() - 0.5) * fieldSize * 1.5;
        } else {
            // Gedung berada di sisi atas atau bawah alas
            x = (Math.random() - 0.5) * fieldSize * 1.5;
            z = Math.random() < 0.5 ? -(fieldSize / 2 + 2) : (fieldSize / 2 + 2);
        }

        building.position.set(x, height / 2, z);
        scene.add(building);
    }
}


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
