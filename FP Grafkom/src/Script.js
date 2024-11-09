import * as THREE from 'three';
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Input from "./Input";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


let cubeTexture = [
    'map/px (2).png',
    'map/nx (2).png',
    'map/py (2).png',
    'map/ny (2).png',
    'map/pz (2).png',
    'map/nz (2).png'
];

export default class Scene {
    constructor({ canvas }) {
        this.canvas = canvas;
        this.init();
        this.render();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

        Input.init();

        const environmentTexture = new THREE.CubeTextureLoader().load(cubeTexture, (texture) => {
            this.scene.background = texture;

            this.OrbitControls.enabled = true;
            this.OrbitControls.enableZoom = true;
            this.OrbitControls.maxPolarAngle = Math.PI; // Allow looking up
            this.OrbitControls.minPolarAngle = 0; // Allow looking down

            let size = 3000;
            this.setupGround(size);
            this.setupPedestrianPath();
            this.loadBuildingModel();
            this.loadBushModel();

            const fbxLoader = new FBXLoader();
            fbxLoader.load("asset/Sad Idle.fbx", (model) => {
                console.log('Model loaded');
                this.player = model;
                model.position.set(80, 5, 40);

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
        gltfLoader.load('asset/pisa_tower.glb', (gltf) => {
            const building = gltf.scene;
    
            building.position.set(0, 0, 0);
            building.scale.set(7, 7, 7);
    
            building.traverse((node) => {
                if (node.isMesh) {
                    node.material = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        metalness: 0.3,
                        roughness: 0.7,
                    });
    
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
    
            this.scene.add(building);
            console.log('Bangunan Pisa Tower ditambahkan ke scene');
    
            // Menambahkan alas persegi di posisi (0, 0, 0)
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
        const groundSize = 3000;
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
        const groundSize = 3000;
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