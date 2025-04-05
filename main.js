import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let earth;
let satelliteMesh; // InstancedMesh for satellites
const satellitesData = []; // Array to hold satellite orbital data
let threatMeshes = []; // Array to hold threat Mesh objects
const threatsData = []; // Array to hold threat orbital data
const SATELLITE_COUNT = 1000;
const EARTH_RADIUS = 5;
const BASE_ORBIT_RADIUS = 7; // Base radius for orbits (Earth radius + altitude)
const ORBIT_RADIUS_VARIATION = 2; // Max variation in orbit radius
const SATELLITE_SIZE = 0.05;

// Threat constants
const THREAT_COUNT = 3;
const THREAT_SIZE = 0.3; // Larger than satellites
const THREAT_COLOR = new THREE.Color(0xffff00); // Yellow
const THREAT_BASE_ORBIT_RADIUS = 8;
const THREAT_ORBIT_VARIATION = 1;
const THREAT_DETECTION_RADIUS = 2.5; // Distance at which satellites detect threats
const THREAT_DETECTION_RADIUS_SQ = THREAT_DETECTION_RADIUS * THREAT_DETECTION_RADIUS; // Use squared distance for efficiency

// Maneuver constants
const EVASION_RADIUS_DELTA = 0.5; // How much the orbit radius changes during evasion
const LERP_FACTOR = 0.05; // Interpolation factor for smooth radius change

// Colors
const COLOR_NOMINAL = new THREE.Color(0x00ff00); // Green
const COLOR_EVADING = new THREE.Color(0xff0000); // Red
const COLOR_NEAR = new THREE.Color(0xffff00); // Yellow

// Simulation state
let isPaused = false;
const clock = new THREE.Clock();

// Dummy object for matrix calculation
const dummy = new THREE.Object3D();

// Helper vectors for calculations to avoid allocation in loop
const satWorldPos = new THREE.Vector3();
const threatWorldPos = new THREE.Vector3();

function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20; // Moved camera back slightly to see orbits

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x606060); // Slightly brighter ambient
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Earth
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('earth_texture.jpg'); // Load the texture
    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 32, 32);
    // Apply texture to the map property
    const earthMaterial = new THREE.MeshStandardMaterial({ 
        map: earthTexture, 
        color: 0xffffff, // Set base color to white to not tint the texture
        roughness: 0.9 
    }); 
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Initialize Satellites
    initSatellites();

    // Initialize Initial Threats
    initThreats();

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 7;
    controls.maxDistance = 100; // Increased max distance

    // UI Setup
    setupUI();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
}

function initSatellites() {
    const satelliteGeometry = new THREE.SphereGeometry(SATELLITE_SIZE, 8, 8);
    // Use a basic material, color will be set per instance
    const satelliteMaterial = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.5 });

    satelliteMesh = new THREE.InstancedMesh(satelliteGeometry, satelliteMaterial, SATELLITE_COUNT);
    satelliteMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    satelliteMesh.instanceColor.setUsage(THREE.DynamicDrawUsage); // Also set color usage to dynamic

    for (let i = 0; i < SATELLITE_COUNT; i++) {
        // Orbital parameters
        const radius = BASE_ORBIT_RADIUS + Math.random() * ORBIT_RADIUS_VARIATION;
        // Faster speed for lower orbits (simplified) - adjust factor as needed
        const speed = (1 / (radius * radius)) * 5; // Arbitrary speed factor
        const angle = Math.random() * Math.PI * 2;

        // Random orbital plane (inclination and longitude of ascending node)
        const inclination = Math.random() * Math.PI; // 0 to PI
        const longitudeOfAscendingNode = Math.random() * Math.PI * 2; // 0 to 2PI

        // Create a quaternion for the orbital plane rotation
        const orbitalPlane = new THREE.Quaternion();
        const rotationAxis = new THREE.Vector3(0, 1, 0); // Rotate around Y axis for longitude
        orbitalPlane.setFromAxisAngle(rotationAxis, longitudeOfAscendingNode);
        const inclinationAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(orbitalPlane); // Get X axis rotated by longitude
        const inclinationQuat = new THREE.Quaternion().setFromAxisAngle(inclinationAxis, inclination);
        orbitalPlane.multiply(inclinationQuat); // Combine rotations

        satellitesData.push({
            id: i,
            radius: radius,
            originalRadius: radius,
            speed: speed,
            angle: angle,
            orbitalPlane: orbitalPlane,
            status: "nominal",
            evasionTargetRadius: null,
            evasionTargetInclination: null,
            worldPosition: new THREE.Vector3() // Initialize world position vector
        });

        // Set initial position and color
        updateSatelliteInstance(i);
        satelliteMesh.setColorAt(i, COLOR_NOMINAL);
    }

    satelliteMesh.instanceColor.needsUpdate = true;
    scene.add(satelliteMesh);
}

function initThreats() {
    // Create the initial set of threats
    for (let i = 0; i < THREAT_COUNT; i++) {
        spawnSingleThreat();
    }
}

function spawnSingleThreat() {
    const threatGeometry = new THREE.SphereGeometry(THREAT_SIZE, 16, 16);
    const threatMaterial = new THREE.MeshStandardMaterial({ color: THREAT_COLOR, roughness: 0.5 });
    const threat = new THREE.Mesh(threatGeometry, threatMaterial);

    // Orbital parameters
    const radius = THREAT_BASE_ORBIT_RADIUS + Math.random() * THREAT_ORBIT_VARIATION;
    const speed = (1 / (radius * radius)) * 4;
    const angle = Math.random() * Math.PI * 2;
    const inclination = Math.random() * Math.PI * 0.2; // Keep them relatively low inclination
    const longitudeOfAscendingNode = Math.random() * Math.PI * 2;
    const orbitalPlane = new THREE.Quaternion();
    const rotationAxis = new THREE.Vector3(0, 1, 0);
    orbitalPlane.setFromAxisAngle(rotationAxis, longitudeOfAscendingNode);
    const inclinationAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(orbitalPlane);
    const inclinationQuat = new THREE.Quaternion().setFromAxisAngle(inclinationAxis, inclination);
    orbitalPlane.multiply(inclinationQuat);

    const newThreatData = {
        id: `threat_${threatsData.length}`,
        radius: radius,
        speed: speed,
        angle: angle,
        orbitalPlane: orbitalPlane,
        mesh: threat
    };

    // Calculate initial position
    updateThreatPosition(threatsData.length, newThreatData); // Pass data directly

    threatsData.push(newThreatData);
    threatMeshes.push(threat);
    scene.add(threat);

    console.log("Spawned threat:", newThreatData.id);
}

function updateSatelliteInstance(index) {
    const data = satellitesData[index];

    // Calculate position in the orbital plane (X-Z plane before rotation)
    const x = data.radius * Math.cos(data.angle);
    const z = data.radius * Math.sin(data.angle);
    const y = 0;

    dummy.position.set(x, y, z);

    // Apply the orbital plane rotation
    dummy.position.applyQuaternion(data.orbitalPlane);

    // Store the calculated world position
    data.worldPosition.copy(dummy.position);

    // Update the matrix
    dummy.updateMatrix();
    satelliteMesh.setMatrixAt(index, dummy.matrix);
}

function updateThreatPosition(indexOrData) {
    const data = typeof indexOrData === 'number' ? threatsData[indexOrData] : indexOrData;
    if (!data) return; // Safety check
    const mesh = data.mesh;

    // Calculate position in the orbital plane
    const x = data.radius * Math.cos(data.angle);
    const z = data.radius * Math.sin(data.angle);
    const y = 0;

    mesh.position.set(x, y, z);
    mesh.position.applyQuaternion(data.orbitalPlane);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupUI() {
    const pauseButton = document.getElementById('pause-resume-button');
    const spawnButton = document.getElementById('spawn-threat-button');

    pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? "Resume" : "Pause";
        if (!isPaused) {
            clock.getDelta(); // Reset delta on resume to avoid large jump
            animate(); // Restart animation loop if paused
        }
    });

    spawnButton.addEventListener('click', () => {
        if (!isPaused) { // Prevent spawning while paused if desired
             spawnSingleThreat();
        }
    });
}

function animate() {
    // Stop requesting new frames if paused
    if (isPaused) {
        return;
    }
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Use clock for accurate delta time
    let colorNeedsUpdate = false;

    // Update threat positions first
    if (threatMeshes.length > 0) {
        for (let i = 0; i < threatsData.length; i++) { // Use threatsData.length as it can change
            threatsData[i].angle += threatsData[i].speed * delta;
            updateThreatPosition(i);
        }
    }

    // Update satellite positions, check for threats, and perform maneuvers
    if (satelliteMesh) {
        for (let i = 0; i < SATELLITE_COUNT; i++) {
            const satData = satellitesData[i];

            // 1. Check proximity to threats
            let isNearThreat = false;
            if (threatMeshes.length > 0) {
                 satWorldPos.copy(satData.worldPosition);
                 for (let j = 0; j < threatsData.length; j++) { // Use threatsData.length
                    threatWorldPos.copy(threatsData[j].mesh.position);
                    const distSq = satWorldPos.distanceToSquared(threatWorldPos);
                    if (distSq < THREAT_DETECTION_RADIUS_SQ) {
                        isNearThreat = true;
                        break;
                    }
                }
            }

            // 2. Update status, color, target radius
            if (isNearThreat && satData.status === "nominal") {
                satData.status = "evading";
                satData.evasionTargetRadius = satData.originalRadius + EVASION_RADIUS_DELTA;
                satelliteMesh.setColorAt(i, COLOR_EVADING);
                colorNeedsUpdate = true;
            } else if (!isNearThreat && satData.status === "evading") {
                satData.status = "nominal";
                satData.evasionTargetRadius = satData.originalRadius; // Target the original radius
                satelliteMesh.setColorAt(i, COLOR_NOMINAL);
                colorNeedsUpdate = true;
            }

            // 3. Smoothly adjust radius towards target
            if (satData.evasionTargetRadius !== null) {
                satData.radius = THREE.MathUtils.lerp(satData.radius, satData.evasionTargetRadius, LERP_FACTOR);
                if (Math.abs(satData.radius - satData.evasionTargetRadius) < 0.01) {
                    satData.radius = satData.evasionTargetRadius;
                    if (satData.status === "nominal") {
                         satData.evasionTargetRadius = null;
                    }
                }
            }

            // 4. Update angle
            satData.angle += satData.speed * delta;

            // 5. Update matrix and world position
            updateSatelliteInstance(i);

        } // End satellite loop

        // 6. Signal updates to GPU
        satelliteMesh.instanceMatrix.needsUpdate = true;
        if (colorNeedsUpdate) {
            satelliteMesh.instanceColor.needsUpdate = true;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

init(); 