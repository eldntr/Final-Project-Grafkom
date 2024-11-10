import * as THREE from 'three';
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Input from "./Input";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { modelScale } from 'three/webgpu';


let cubeTexture = [
    'map/cubemap_px.png',
    'map/cubemap_nx.png',
    'map/cubemap_py.png',
    'map/cubemap_ny.png',
    'map/cubemap_pz.png',
    'map/cubemap_nz.png'
];

export default class Scene {
    constructor({ canvas }) {
        this.canvas = canvas;
        this.init();
        this.render();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100000);
        this.camera.position.set(0, 20, 50);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.resize();
        this.setUpEvents();
        this.setupLight();
        this.setupControl();

        this.ambientLight.intensity = 3.0;
        this.clock = new THREE.Clock();
        this.mixer = null;
        this.animations = {};

        this.npcs = [];
        this.npcMixers = [];

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        Input.init();

        const environmentTexture = new THREE.CubeTextureLoader().load(cubeTexture, (texture) => {
            this.scene.background = texture;

            this.OrbitControls.enabled = true;
            this.OrbitControls.enableZoom = true;
            this.OrbitControls.maxPolarAngle = Math.PI; // Allow looking up
            this.OrbitControls.minPolarAngle = 0; // Allow looking down

            let size = 7000;
            this.setupGround(size);
            this.setupPedestrianPath();
            this.loadBuildingModel();
            this.loadBushModel();
            this.loadTreeModel();
            this.createNPCPath();
            this.loadNPCModels();


            const fbxLoader = new FBXLoader();
            fbxLoader.load("asset/Sad Idle.fbx", (model) => {
                console.log('Model loaded');
                this.player = model;
                model.position.set(0, 5, 400);

                let scale = 0.1;
                model.scale.set(scale, scale, scale);

                model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });

                this.scene.add(model);

                this.camera.position.set(model.position.x, model.position.y + 10, model.position.z + 30);
                this.camera.lookAt(model.position);

                this.mixer = new THREE.AnimationMixer(model);

                const animationsToLoad = {
                    idle: "asset/Sad Idle.fbx",
                    jump: "asset/Jumping (1).fbx",
                    run: "asset/Fast Run (1).fbx",
                    walk: "asset/Walking (1).fbx"
                };

                Object.entries(animationsToLoad).forEach(([name, path]) => {
                    fbxLoader.load(path, (anim) => {
                        const clip = anim.animations[0];
                        if (clip) {
                            this.animations[name] = this.mixer.clipAction(clip);
                            console.log(`${name} animation loaded`);
                            if (name === "idle") this.animations.idle.play(); // Play idle by default
                        }
                    }, undefined, (error) => {
                        console.error(`Error loading ${name} animation:`, error);
                    });
                });
            }, undefined, (error) => {
                console.error('Error loading model:', error);
            });
        });
    }

    setupGround(size) {
        const groundTexture = new THREE.TextureLoader().load("/texture/OIP (20).jpeg");
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        let tSize = size * 0.09;
        groundTexture.repeat.set(tSize, tSize);
        this.groundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(size, size),
            new THREE.MeshStandardMaterial({
                map: groundTexture
            })
        );
        this.groundMesh.rotateX(-Math.PI * 0.5);
        this.groundMesh.receiveShadow = true;
        this.scene.add(this.groundMesh);
    }

    loadBuildingModel() {
        const gltfLoader = new GLTFLoader();
        const path = window.location.pathname;
        let modelPath;
        let modelScale;
    
        if (path === "/pisa") {
            modelPath = 'asset/pisa_tower.glb';
            modelScale = 6;
        } else if (path === "/eiffel") {
            modelPath = 'asset/eiffel_tower.glb';
            modelScale = 8;
        } else if (path === "/collosseum") {
            modelPath = 'asset/colloseum.glb';
            modelScale = 6;
        } else if (path === "/aztec") {
            modelPath = 'asset/aztec.glb';
            modelScale = 3;
        } else if (path === "/greatwall") {
            modelPath = 'asset/greatwall.glb';
            modelScale = 10;
        } else if (path === "/crist") {
            modelPath = 'asset/kristus.glb';
            modelScale = 6;
        } else if (path === "/tajmahal") {
            modelPath = 'asset/tajmahal.glb';
            modelScale = 4;
        } else {
            console.warn('Path tidak dikenal, memuat model default');
            modelPath = 'asset/pisa_tower.glb';
            modelScale = 10;
        }
    
        gltfLoader.load(modelPath, (gltf) => {
            const building = gltf.scene;
    
            building.position.set(0, 0, 0);
            building.scale.set(modelScale, modelScale, modelScale);
    
            // Traverse through each node to assign fallback color if no texture
            building.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
    
                    if (node.material) {
                        if (!node.material.map) {
                            console.warn('Tekstur tidak ditemukan untuk mesh:', node);
                            // Apply fallback color (cream or wheat color)
                            node.material.color.set(0xF5DEB3);  // Set wheat color (warna krem)
                            node.material.needsUpdate = true;
                        } else {
                            console.log('Tekstur ditemukan untuk mesh:', node);
                        }
                    }
                }
            });
    
            this.scene.add(building);
            this.addSquareBase();
        }, undefined, (error) => {
            console.error('Gagal memuat model bangunan:', error);
        });
    }
    

    addSquareBase() {
        const baseSize = 750;
        const baseThickness = 0.1;

        const baseTexture = new THREE.TextureLoader().load("/texture/OIP.jpeg");
        baseTexture.wrapS = THREE.RepeatWrapping;
        baseTexture.wrapT = THREE.RepeatWrapping;

        // Mengatur repeat yang lebih tinggi agar tekstur lebih kecil
        baseTexture.repeat.set(75, 75);

        const baseMaterial = new THREE.MeshStandardMaterial({
            map: baseTexture,
            roughness: 0.6,
            metalness: 0.2,
            side: THREE.FrontSide,
        });

        const squareBase = new THREE.Mesh(
            new THREE.BoxGeometry(baseSize, baseThickness, baseSize),
            baseMaterial
        );

        squareBase.position.set(0, baseThickness / 2 + 1, 0);
        squareBase.receiveShadow = true;
        squareBase.castShadow = true;

        this.scene.add(squareBase);
        console.log('Alas persegi ditambahkan dengan pengaturan tekstur yang diperbaiki');
    }

    setupPedestrianPath() {
        const groundSize = 7000;
        const pathWidth = 100;
        const pathThickness = 0.5;
        const tileLength = 100;

        const pathTexture = new THREE.TextureLoader().load("/texture/OIP.jpeg");
        pathTexture.wrapS = THREE.RepeatWrapping;
        pathTexture.wrapT = THREE.RepeatWrapping;

        // Mengatur repeat yang lebih tinggi untuk memperkecil tampilan tekstur
        pathTexture.repeat.set(10, 10);

        this.pathMaterial = new THREE.MeshStandardMaterial({
            map: pathTexture,
            roughness: 0.6,
            metalness: 0.2,
            side: THREE.FrontSide,
        });

        const numSegments = groundSize / tileLength;
        for (let i = 0; i < numSegments; i++) {
            const pedestrianTile = new THREE.Mesh(
                new THREE.BoxGeometry(pathWidth, pathThickness, tileLength),
                this.pathMaterial
            );

            const zPosition = -groundSize / 2 + i * tileLength + tileLength / 2;
            pedestrianTile.position.set(0, pathThickness / 2, zPosition);
            pedestrianTile.receiveShadow = false;
            pedestrianTile.castShadow = false;

            this.scene.add(pedestrianTile);
        }

        console.log('Jalan pejalan kaki dibuat dengan segmen kecil dan pengaturan tekstur yang diperbaiki');
    }

    loadBushModel() {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('asset/bush.glb', (gltf) => {
            this.bushModel = gltf.scene;
            this.bushModel.scale.set(3, 3, 3); // Atur skala semak sesuai kebutuhan
            this.bushModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            // Panggil fungsi untuk menambahkan semak setelah model selesai dimuat
            this.addBushes();
            console.log('Model semak berhasil dimuat dan ditambahkan');
        }, undefined, (error) => {
            console.error('Gagal memuat model semak:', error);
        });
    }

    addBushes() {
        const groundSize = 7000;
        const pathWidth = 160;
        const baseSize = 750;
        const bushSpacing = 10;
        const bushOffset = 20; // Jarak aman dari tepi
        const bushScale = 0.2;

        // Fungsi untuk mengecek apakah posisi berada dalam zona eksklusi
        const isExcludedZone = (x, z) => {
            const isNearPath = Math.abs(x) < pathWidth / 2 + bushOffset;
            const isNearSquareBaseX = Math.abs(x) < baseSize / 2 + bushOffset;
            const isNearSquareBaseZ = Math.abs(z) < baseSize / 2 + bushOffset;
            const isAvoidPoint = x > -75 && x < 75; // Hindari titik di antara x = -75 hingga x = 75
            return isNearPath || (isNearSquareBaseX && isNearSquareBaseZ) || isAvoidPoint;
        };

        // Tambahkan semak di sepanjang tepi kiri jalan
        for (let z = -groundSize / 2; z <= groundSize / 2; z += bushSpacing) {
            const xLeft = -pathWidth / 2 - bushOffset;
            if (!isExcludedZone(xLeft, z)) {
                const bushLeft = this.bushModel.clone();
                bushLeft.scale.set(bushScale, bushScale, bushScale);
                bushLeft.position.set(xLeft, 1, z);
                bushLeft.rotation.y = Math.PI / 2;
                this.scene.add(bushLeft);
            }
        }

        // Tambahkan semak di sepanjang tepi kanan jalan
        for (let z = -groundSize / 2; z <= groundSize / 2; z += bushSpacing) {
            const xRight = pathWidth / 2 + bushOffset;
            if (!isExcludedZone(xRight, z)) {
                const bushRight = this.bushModel.clone();
                bushRight.scale.set(bushScale, bushScale, bushScale);
                bushRight.position.set(xRight, 1, z);
                bushRight.rotation.y = Math.PI / 2;
                this.scene.add(bushRight);
            }
        }

        // Tambahkan semak di sekitar tepi squareBase
        for (let x = -baseSize / 2; x <= baseSize / 2; x += bushSpacing) {
            // Hindari area antara x = -75 hingga x = 75
            if (x <= -80 || x >= 75) {
                // Tepi depan squareBase
                const bushFront = this.bushModel.clone();
                bushFront.scale.set(bushScale, bushScale, bushScale);
                bushFront.position.set(x, 1, baseSize / 2 + bushOffset);
                bushFront.rotation.y = 0;
                this.scene.add(bushFront);

                // Tepi belakang squareBase
                const bushBack = this.bushModel.clone();
                bushBack.scale.set(bushScale, bushScale, bushScale);
                bushBack.position.set(x, 1, -baseSize / 2 - bushOffset);
                bushBack.rotation.y = 0;
                this.scene.add(bushBack);
            }
        }

        for (let z = -baseSize / 2; z <= baseSize / 2; z += bushSpacing) {
            // Tepi kiri squareBase
            const bushLeft = this.bushModel.clone();
            bushLeft.scale.set(bushScale, bushScale, bushScale);
            bushLeft.position.set(-baseSize / 2 - bushOffset, 1, z);
            bushLeft.rotation.y = Math.PI / 2;
            this.scene.add(bushLeft);

            // Tepi kanan squareBase
            const bushRight = this.bushModel.clone();
            bushRight.scale.set(bushScale, bushScale, bushScale);
            bushRight.position.set(baseSize / 2 + bushOffset, 1, z);
            bushRight.rotation.y = Math.PI / 2;
            this.scene.add(bushRight);
        }

        console.log('Semak-semak berhasil ditambahkan di tepi jalan dan tepi squareBase dengan pengecualian area x antara -75 hingga 75.');
    }

    loadTreeModel() {
        const objLoader = new GLTFLoader();

        objLoader.load('asset/tree.glb', (gltf) => {
            this.treeModel = gltf.scene;
            this.treeModel.scale.set(10, 10, 10); // Atur skala pohon
            this.treeModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            // Panggil fungsi untuk menambahkan pohon secara acak
            this.addTrees();
            console.log('Model pohon berhasil dimuat dan ditambahkan secara acak.');
        }, undefined, (error) => {
            console.error('Gagal memuat model pohon:', error);
        });
    }

    addTrees() {
        const groundSize = 7000;
        const treeSpacing = 200; // Jarak antar pohon
        const numTrees = 100; // Jumlah pohon yang akan ditambahkan
        const treeScale = 35;

        // Fungsi untuk mengecek apakah posisi berada dalam zona eksklusi
        const isExcludedZone = (x, z) => {
            const pathWidth = 200;
            const baseSize = 750;
            const bushOffset = 100;

            const isNearPath = Math.abs(x) < pathWidth / 2 + bushOffset;
            const isNearSquareBaseX = Math.abs(x) < baseSize / 2 + bushOffset;
            const isNearSquareBaseZ = Math.abs(z) < baseSize / 2 + bushOffset;
            const isAvoidPoint = x > -75 && x < 75;
            return isNearPath || (isNearSquareBaseX && isNearSquareBaseZ) || isAvoidPoint;
        };

        // Tambahkan pohon secara acak di area yang tidak termasuk zona eksklusi
        for (let i = 0; i < numTrees; i++) {
            let x, z;

            // Cari posisi yang tidak berada di zona eksklusi
            do {
                x = Math.random() * groundSize - groundSize / 2;
                z = Math.random() * groundSize - groundSize / 2;
            } while (isExcludedZone(x, z));

            const tree = this.treeModel.clone();
            tree.scale.set(treeScale, treeScale, treeScale);
            tree.position.set(x, 1, z);
            tree.rotation.y = Math.random() * Math.PI * 2; // Rotasi acak
            this.scene.add(tree);
            console.log(`Pohon ditambahkan di posisi (${x.toFixed(2)}, ${z.toFixed(2)})`);
        }

        console.log('Pohon-pohon berhasil ditambahkan secara acak.');
    }

    loadNPCModels() {
        const fbxLoader = new FBXLoader();

        // Memuat model animasi berjalan
        fbxLoader.load("asset/Walking (1).fbx", (anim) => {
            const walkClip = anim.animations[0];

            // Membuat 50 NPC
            for (let i = 0; i < 10; i++) {
                fbxLoader.load("asset/Sad Idle.fbx", (model) => {
                    console.log(`NPC ${i + 1} loaded`);

                    // Mengatur skala NPC
                    model.scale.set(0.1, 0.1, 0.1);

                    // Mencari posisi acak yang valid
                    let position;
                    do {
                        position = this.getRandomSpawnPosition();
                    } while (this.isExcludedZone(position.x, position.z));

                    // Mengatur posisi dan rotasi NPC
                    model.position.set(position.x, 1, position.z);
                    model.rotation.y = Math.random() * Math.PI * 2;

                    model.traverse((node) => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });

                    // Buat mixer dan animasi berjalan untuk NPC
                    const npcMixer = new THREE.AnimationMixer(model);
                    const npcWalkAction = npcMixer.clipAction(walkClip);
                    npcWalkAction.play();

                    // Tambahkan NPC ke scene dan array
                    this.scene.add(model);
                    this.npcs.push(model);
                    this.npcMixers.push(npcMixer);

                    // Set target awal untuk setiap NPC
                    model.npcTarget = this.chooseRandomTarget();
                }, undefined, (error) => {
                    console.error('Error loading NPC model:', error);
                });
            }
        }, undefined, (error) => {
            console.error('Error loading walk animation:', error);
        });
    }

    getRandomSpawnPosition() {
        const minX = -350;
        const maxX = 350;
        const minZ = -700;
        const maxZ = 700;

        const randomX = Math.random() * (maxX - minX) + minX;
        const randomZ = Math.random() * (maxZ - minZ) + minZ;

        return { x: randomX, z: randomZ };
    }

    isExcludedZone(x, z) {
        const pathWidth = 200;
        const baseSize = 750;
        const bushOffset = 100;

        const isNearPath = Math.abs(x) < pathWidth / 2 + bushOffset;
        const isNearSquareBaseX = Math.abs(x) < baseSize / 2 + bushOffset;
        const isNearSquareBaseZ = Math.abs(z) < baseSize / 2 + bushOffset;
        const isAvoidPoint = x > -75 && x < 75;

        return isNearPath || (isNearSquareBaseX && isNearSquareBaseZ) || isAvoidPoint;
    }

    createNPCPath() {
        this.npcPath = [
            { x: 0, z: -350 },
            { x: 0, z: 350 },
            { x: -200, z: 350 },
            { x: -200, z: -350 }
        ];
    }

    updateNPCs(delta) {
        this.npcs.forEach((npc, index) => {
            const mixer = this.npcMixers[index];

            // Update animasi NPC
            mixer.update(delta);

            const speed = 30 * delta;
            const currentPos = npc.position;
            const targetPos = npc.npcTarget;

            // Hitung vektor arah menuju target
            const direction = new THREE.Vector3(targetPos.x - currentPos.x, 0, targetPos.z - currentPos.z);
            const distance = direction.length();

            // Normalisasi vektor arah dan kalikan dengan kecepatan
            direction.normalize().multiplyScalar(speed);

            // Jika jarak ke target lebih kecil dari kecepatan, pilih target baru
            if (distance < speed) {
                npc.npcTarget = this.chooseRandomTarget();
            } else {
                // Gerakkan NPC menuju target
                npc.position.add(direction);
                npc.lookAt(targetPos.x, currentPos.y, targetPos.z);
            }
        });
    }

    chooseRandomTarget() {
        const minX = -200;
        const maxX = 200;
        const minZ = -350;
        const maxZ = 350;

        const randomX = Math.random() * (maxX - minX) + minX;
        const randomZ = Math.random() * (maxZ - minZ) + minZ;

        return new THREE.Vector3(randomX, 1, randomZ);
    }

    render() {
        this.OrbitControls.update();
        this.renderer.render(this.scene, this.camera);
        this.update();
        Input.clear();

        requestAnimationFrame(() => {
            this.render();
        });
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setUpEvents() {
        window.addEventListener('resize', () => {
            this.resize();
        });
    }

    setupControl() {
        this.OrbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    }

    setupLight() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(this.ambientLight);

        this.pointLight = new THREE.PointLight(0xffffff, 5000.0);
        this.pointLight.position.set(20, 80, 30);
        this.scene.add(this.pointLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-30, 100, 40); // Sesuaikan posisi
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    update() {
        if (this.mixer) {
            let delta = this.clock.getDelta();
            this.updateNPCs(delta);
            this.mixer.update(delta);
            this.OrbitControls.target = this.player.position.clone().add(new THREE.Vector3(0, 40, 0));
            this.player.rotation.set(0, this.OrbitControls.getAzimuthalAngle() + Math.PI, 0);
        }

        let isWalking = false;
        let isSprinting = false;
        let isJumping = false;
        let isMovingLeft = false;
        let isMovingRight = false;
        let isMovingBackward = false;

        /* W Key */
        if (Input.keyDown[87]) {
            if (Input.keyDown[16]) { // Shift key
                isSprinting = true;
            } else {
                isWalking = true;
            }
        }

        /* S Key */
        if (Input.keyDown[83]) {
            isMovingBackward = true;
        }

        /* A Key */
        if (Input.keyDown[65]) {
            isMovingLeft = true;
        }

        /* D Key */
        if (Input.keyDown[68]) {
            isMovingRight = true;
        }

        /* Space Key */
        if (Input.keyDown[32]) {
            isJumping = true;
        }

        if (isJumping) {
            if (this.animations.jump && !this.animations.jump.isRunning()) {
                this.playAnimation("jump");
                console.log('Jump animation played');
            }
        } else if (isSprinting) {
            if (this.animations.run && !this.animations.run.isRunning()) {
                this.playAnimation("run");
                console.log('Run animation played');
            }
            this.player.translateZ(2.0);
            this.camera.translateZ(-2.0);
        } else if (isWalking) {
            if (this.animations.walk && !this.animations.walk.isRunning()) {
                this.playAnimation("walk");
                console.log('Walk animation played');
            }
            this.player.translateZ(0.3);
            this.camera.translateZ(-0.3);
        } else if (isMovingBackward) {
            if (this.animations.walk && !this.animations.walk.isRunning()) {
                this.playAnimation("walk");
                console.log('Walk animation played');
            }
            this.player.translateZ(-0.3);
            this.camera.translateZ(0.3);
        } else if (isMovingLeft) {
            if (this.animations.walk && !this.animations.walk.isRunning()) {
                this.playAnimation("walk");
                console.log('Walk animation played');
            }
            this.player.translateX(-0.3);
            this.camera.translateX(0.3);
        } else if (isMovingRight) {
            if (this.animations.walk && !this.animations.walk.isRunning()) {
                this.playAnimation("walk");
                console.log('Walk animation played');
            }
            this.player.translateX(0.3);
            this.camera.translateX(-0.3);
        } else {
            if (this.animations.idle && !this.animations.idle.isRunning()) {
                this.playAnimation("idle");
                console.log('Idle animation played');
            }
        }
    }

    playAnimation(name) {
        Object.keys(this.animations).forEach((key) => {
            if (this.animations[key] && key !== name) this.animations[key].stop();
        });
        if (this.animations[name]) {
            this.animations[name].reset().play();
        }
    }
}
