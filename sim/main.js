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
const THREAT_COUNT = 3; // Initial count, can increase via UI
const THREAT_SIZE = 0.3;
const THREAT_COLOR = new THREE.Color(0xffff00);
const THREAT_BASE_ORBIT_RADIUS = 8;
const THREAT_ORBIT_VARIATION = 1;

// Thresholds (will be updated by UI)
let THREAT_DETECTION_RADIUS = 2.5; // Inner radius for evasion (Red)
let THREAT_NEAR_RADIUS = 4.0;      // Outer radius for monitoring (Yellow)
let THREAT_DETECTION_RADIUS_SQ = THREAT_DETECTION_RADIUS * THREAT_DETECTION_RADIUS;
let THREAT_NEAR_RADIUS_SQ = THREAT_NEAR_RADIUS * THREAT_NEAR_RADIUS;

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
    // Optional: Add faint fog for depth
    // scene.fog = new THREE.Fog(0x000000, 20, 150);

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

    // Starfield
    createStarfield();

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

function createStarfield() {
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(200); // Adjust spread as needed
        const y = THREE.MathUtils.randFloatSpread(200);
        const z = THREE.MathUtils.randFloatSpread(200);
        // Ensure stars are somewhat distant
        if (x*x + y*y + z*z < 40*40) continue; // Skip stars too close to center
        starVertices.push(x, y, z);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const starMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 0.1, 
        sizeAttenuation: true // Stars smaller further away
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function initSatellites() {
    const satelliteGeometry = new THREE.SphereGeometry(SATELLITE_SIZE, 8, 8);
    const satelliteMaterial = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.5 });

    satelliteMesh = new THREE.InstancedMesh(satelliteGeometry, satelliteMaterial, SATELLITE_COUNT);
    // Set matrix usage - this is usually safe here
    satelliteMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Defer setting instanceColor usage until after colors are set
    // satelliteMesh.instanceColor.setUsage(THREE.DynamicDrawUsage); // <--- Removed from here (line 141)

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
            status: "nominal", // Can be "nominal", "monitoring", "evading"
            evasionTargetRadius: null,
            evasionTargetInclination: null,
            worldPosition: new THREE.Vector3() // Initialize world position vector
        });

        // Set initial position and color
        updateSatelliteInstance(i);
        // This call should initialize instanceColor if needed
        satelliteMesh.setColorAt(i, COLOR_NOMINAL);
    }

    // Now that setColorAt has been called, instanceColor should exist
    if (satelliteMesh.instanceColor) {
        satelliteMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
        satelliteMesh.instanceColor.needsUpdate = true;
    } else {
        console.error("InstancedMesh instanceColor attribute is unexpectedly null after setting colors.");
    }

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
    const monitorRadiusInput = document.getElementById('monitoring-radius');
    const evasionRadiusInput = document.getElementById('evasion-radius');

    // Set initial input values
    monitorRadiusInput.value = THREAT_NEAR_RADIUS.toFixed(1);
    evasionRadiusInput.value = THREAT_DETECTION_RADIUS.toFixed(1);

    // Pause/Resume listener
    pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? "Resume" : "Pause";
        if (!isPaused) {
            clock.getDelta(); 
            animate();
        }
    });

    // Spawn Threat listener
    spawnButton.addEventListener('click', () => {
        if (!isPaused) {
             spawnSingleThreat();
        }
    });

    // Monitor Radius listener
    monitorRadiusInput.addEventListener('input', (event) => {
        const newValue = parseFloat(event.target.value);
        if (!isNaN(newValue) && newValue >= 0) {
            THREAT_NEAR_RADIUS = newValue;
            // Ensure Monitor radius is always >= Evasion radius
            if (THREAT_NEAR_RADIUS < THREAT_DETECTION_RADIUS) {
                THREAT_DETECTION_RADIUS = THREAT_NEAR_RADIUS;
                evasionRadiusInput.value = THREAT_DETECTION_RADIUS.toFixed(1); // Update other input
                THREAT_DETECTION_RADIUS_SQ = THREAT_DETECTION_RADIUS * THREAT_DETECTION_RADIUS;
            }
            THREAT_NEAR_RADIUS_SQ = THREAT_NEAR_RADIUS * THREAT_NEAR_RADIUS;
            console.log(`Monitor Radius set to: ${THREAT_NEAR_RADIUS}`);
        }
    });

    // Evasion Radius listener
    evasionRadiusInput.addEventListener('input', (event) => {
        const newValue = parseFloat(event.target.value);
        if (!isNaN(newValue) && newValue >= 0) {
            THREAT_DETECTION_RADIUS = newValue;
            // Ensure Evasion radius is always <= Monitor radius
            if (THREAT_DETECTION_RADIUS > THREAT_NEAR_RADIUS) {
                THREAT_NEAR_RADIUS = THREAT_DETECTION_RADIUS;
                monitorRadiusInput.value = THREAT_NEAR_RADIUS.toFixed(1); // Update other input
                THREAT_NEAR_RADIUS_SQ = THREAT_NEAR_RADIUS * THREAT_NEAR_RADIUS;
            }
            THREAT_DETECTION_RADIUS_SQ = THREAT_DETECTION_RADIUS * THREAT_DETECTION_RADIUS;
            console.log(`Evasion Radius set to: ${THREAT_DETECTION_RADIUS}`);
        }
    });
}

function animate() {
    if (isPaused) return;
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    let colorNeedsUpdate = false;

    // Update threat positions
    if (threatMeshes.length > 0) {
        for (let i = 0; i < threatsData.length; i++) {
            threatsData[i].angle += threatsData[i].speed * delta;
            updateThreatPosition(i);
        }
    }

    // Update satellites
    if (satelliteMesh) {
        for (let i = 0; i < SATELLITE_COUNT; i++) {
            const satData = satellitesData[i];
            const previousStatus = satData.status;

            // 1. Find minimum distance to any threat
            let minDistSq = Infinity;
            if (threatMeshes.length > 0) {
                satWorldPos.copy(satData.worldPosition);
                for (let j = 0; j < threatsData.length; j++) {
                    threatWorldPos.copy(threatsData[j].mesh.position);
                    minDistSq = Math.min(minDistSq, satWorldPos.distanceToSquared(threatWorldPos));
                }
            }

            // 2. Determine new status based on distance
            let newStatus = "nominal";
            let newColor = COLOR_NOMINAL;
            if (minDistSq < THREAT_DETECTION_RADIUS_SQ) {
                newStatus = "evading";
                newColor = COLOR_EVADING;
            } else if (minDistSq < THREAT_NEAR_RADIUS_SQ) {
                newStatus = "monitoring";
                newColor = COLOR_NEAR; // Use yellow for monitoring
            }

            // 3. Update status, color, and target radius if changed
            if (newStatus !== previousStatus) {
                satData.status = newStatus;
                satelliteMesh.setColorAt(i, newColor);
                colorNeedsUpdate = true;

                // Set target radius only when entering/leaving evasion
                if (newStatus === "evading") {
                    satData.evasionTargetRadius = satData.originalRadius + EVASION_RADIUS_DELTA;
                } else if (previousStatus === "evading") { // Was evading, now nominal or monitoring
                    satData.evasionTargetRadius = satData.originalRadius;
                }
            }

            // 4. Smoothly adjust radius towards target (if set)
            if (satData.evasionTargetRadius !== null) {
                satData.radius = THREE.MathUtils.lerp(satData.radius, satData.evasionTargetRadius, LERP_FACTOR);
                if (Math.abs(satData.radius - satData.evasionTargetRadius) < 0.01) {
                    satData.radius = satData.evasionTargetRadius;
                    // Clear target only when returning to original radius and not evading
                    if (satData.status !== "evading" && satData.radius === satData.originalRadius) {
                        satData.evasionTargetRadius = null;
                    }
                }
            }

            // 5. Update angle
            satData.angle += satData.speed * delta;

            // 6. Update matrix and world position
            updateSatelliteInstance(i);

        } // End satellite loop

        // 7. Signal updates to GPU
        satelliteMesh.instanceMatrix.needsUpdate = true;
        if (colorNeedsUpdate) {
            satelliteMesh.instanceColor.needsUpdate = true;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

init(); 