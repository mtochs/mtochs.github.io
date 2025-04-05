import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

// --- Configuration ---
const NUM_SATELLITES = 1500; // Target: 1000-2000
const EARTH_RADIUS = 5; // Simulation units
const LEO_ALTITUDE_MIN = 1.0; // Min altitude above Earth radius
const LEO_ALTITUDE_MAX = 2.5; // Max altitude above Earth radius
const SATELLITE_SIZE = 0.03;
const THREAT_SIZE = 0.15;
const THREAT_SPEED_FACTOR = 0.5; // Relative speed to average satellite

const THREAT_DETECTION_RADIUS = 2.0; // Distance at which satellites react
const EVASION_MANEUVER_DISTANCE = 0.3; // How much radius changes during evasion
const ORBITAL_RETURN_LERP_FACTOR = 0.02; // Speed of returning to original orbit

// --- Colors ---
const COLOR_NOMINAL = new THREE.Color(0x00ff00); // Green
const COLOR_EVADING = new THREE.Color(0xff0000); // Red
const COLOR_THREAT = new THREE.Color(0xffff00);  // Yellow

// --- Global Variables ---
let scene, camera, renderer, controls, clock;
let earthMesh;
let satelliteInstancedMesh;
let satellitesData = []; // Array holding individual satellite state
let threats = [];       // Array holding threat objects { id, mesh, orbit }
let isPaused = false;
let nextThreatId = 0;

// --- Temporary objects for performance ---
const _tempMatrix = new THREE.Matrix4();
const _tempObject = new THREE.Object3D();
const _tempVec3 = new THREE.Vector3();
const _tempQuaternion = new THREE.Quaternion();
const _upVector = new THREE.Vector3(0, 1, 0); // Or use Z-up if preferred

// --- Initialization ---
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Clock
    clock = new THREE.Clock();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);

    // Renderer
    const container = document.getElementById('simulation-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 32, 32);
    // Optional Texture:
    // const textureLoader = new THREE.TextureLoader();
    // const earthTexture = textureLoader.load('assets/earth_texture.jpg'); // Make sure path is correct
    // const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
    const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x2266aa, roughness: 0.8 }); // Simple blue
    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = EARTH_RADIUS + LEO_ALTITUDE_MIN + 1;
    controls.maxDistance = 50;

    // Satellites
    createSatellites();

    // Initial Threat(s)
    spawnThreat();
    // spawnThreat(); // Spawn more initial threats if desired

    // UI Setup
    setupUI();

    // Handle Window Resize
    window.addEventListener('resize', onWindowResize, false);

    // Start Animation Loop
    animate();
}

// --- Satellite Creation ---
function createSatellites() {
    const satelliteGeometry = new THREE.SphereGeometry(SATELLITE_SIZE, 8, 8);
    const satelliteMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true, // Use per-instance color
        roughness: 0.7
    });

    satelliteInstancedMesh = new THREE.InstancedMesh(satelliteGeometry, satelliteMaterial, NUM_SATELLITES);
    scene.add(satelliteInstancedMesh);

    for (let i = 0; i < NUM_SATELLITES; i++) {
        // Orbital parameters
        const radius = EARTH_RADIUS + LEO_ALTITUDE_MIN + Math.random() * (LEO_ALTITUDE_MAX - LEO_ALTITUDE_MIN);
        const angle = Math.random() * Math.PI * 2;
        // Approximate orbital speed (faster closer to Earth) - Kepler's 3rd law simplified
        const speed = (0.3 / Math.sqrt(radius / EARTH_RADIUS)) * (0.8 + Math.random() * 0.4); // Base speed + variance

        // Randomize orbit plane using a random normal vector
        const orbitNormal = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        ).normalize();

        satellitesData.push({
            id: `SAT-${i}`,
            orbit: {
                radius: radius,
                targetRadius: radius, // Initially same as radius
                originalRadius: radius,
                speed: speed,
                angle: angle,
                normal: orbitNormal,
                currentPosition: new THREE.Vector3() // Store current position for checks
            },
            status: "nominal", // "nominal" or "evading"
            evasionTarget: null // Which threat caused evasion
        });

        // Set initial position and color
        updateSatelliteInstance(i, satellitesData[i]);
        satelliteInstancedMesh.setColorAt(i, COLOR_NOMINAL);
    }
    satelliteInstancedMesh.instanceMatrix.needsUpdate = true;
    if (satelliteInstancedMesh.instanceColor) {
        satelliteInstancedMesh.instanceColor.needsUpdate = true;
    } else {
        console.warn("InstancedMesh does not have instanceColor buffer attribute. Colors might not work.");
    }
}

// --- Threat Creation ---
function spawnThreat() {
    const threatId = `THREAT-${nextThreatId++}`;
    const threatGeometry = new THREE.SphereGeometry(THREAT_SIZE, 16, 16);
    const threatMaterial = new THREE.MeshBasicMaterial({ color: COLOR_THREAT }); // Basic material, always visible
    const threatMesh = new THREE.Mesh(threatGeometry, threatMaterial);

    // Give threat its own orbit - make it potentially cross satellite paths
    const radius = EARTH_RADIUS + LEO_ALTITUDE_MIN + Math.random() * (LEO_ALTITUDE_MAX - LEO_ALTITUDE_MIN);
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.3 / Math.sqrt(radius / EARTH_RADIUS)) * THREAT_SPEED_FACTOR * (0.9 + Math.random() * 0.2); // Slightly different speed profile

    // Make orbit slightly more eccentric or inclined than average satellite
    const orbitNormal = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
    ).normalize();
     // Add slight inclination bias if needed: orbitNormal.y += (Math.random() - 0.5) * 0.5; orbitNormal.normalize();

    const threatData = {
        id: threatId,
        mesh: threatMesh,
        orbit: {
            radius: radius,
            speed: speed,
            angle: angle,
            normal: orbitNormal,
        }
    };

    // Initial position calculation (same logic as satellites)
    const initialPosition = calculateOrbitalPosition(
        threatData.orbit.radius,
        threatData.orbit.angle,
        threatData.orbit.normal
    );
    threatMesh.position.copy(initialPosition);

    threats.push(threatData);
    scene.add(threatMesh);
    updateInfoPanel(); // Update UI count
}


// --- Calculate Position on Orbit ---
function calculateOrbitalPosition(radius, angle, normal) {
    // Calculate position on the XY plane for the given radius and angle
    _tempVec3.set(
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        0
    );

    // Create a quaternion to rotate from Z-axis (0,0,1) to the orbit normal
    _tempQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    // Apply the rotation
    _tempVec3.applyQuaternion(_tempQuaternion);

    return _tempVec3;
}


// --- Update Satellite Instance Matrix ---
function updateSatelliteInstance(index, satData) {
    // Smoothly adjust current radius towards target radius
    if (Math.abs(satData.orbit.radius - satData.orbit.targetRadius) > 0.001) {
         satData.orbit.radius = THREE.MathUtils.lerp(satData.orbit.radius, satData.orbit.targetRadius, ORBITAL_RETURN_LERP_FACTOR);
    } else {
         satData.orbit.radius = satData.orbit.targetRadius; // Snap to target when close
    }

    const position = calculateOrbitalPosition(
        satData.orbit.radius,
        satData.orbit.angle,
        satData.orbit.normal
    );
    satData.orbit.currentPosition.copy(position); // Store calculated position

    _tempObject.position.copy(position);
    // Optional: Make satellites face direction of travel (more complex)
    // _tempObject.lookAt(earthMesh.position); // Simple lookAt center

    _tempObject.updateMatrix();
    satelliteInstancedMesh.setMatrixAt(index, _tempObject.matrix);
}

// --- Agent Logic ---
function runAgentLogic(deltaTime) {
    let nominalCount = 0;
    let evadingCount = 0;
    let needsColorUpdate = false;

    // 1. Update threat positions
    threats.forEach(threat => {
        threat.orbit.angle += threat.orbit.speed * deltaTime;
        const newPos = calculateOrbitalPosition(threat.orbit.radius, threat.orbit.angle, threat.orbit.normal);
        threat.mesh.position.copy(newPos);
    });

    // 2. Check for satellite evasions
    for (let i = 0; i < NUM_SATELLITES; i++) {
        const satData = satellitesData[i];
        let isThreatNearby = false;
        let closestThreatDistance = Infinity;
        let triggeringThreat = null;

        // Check distance to all threats
        threats.forEach(threat => {
            const distance = satData.orbit.currentPosition.distanceTo(threat.mesh.position);
            if (distance < closestThreatDistance) {
                closestThreatDistance = distance;
            }
            if (distance < THREAT_DETECTION_RADIUS) {
                isThreatNearby = true;
                triggeringThreat = threat;
                // Could break here if only reacting to the first detected threat
            }
        });

        // Decision making based on threat proximity
        if (isThreatNearby) {
            if (satData.status === "nominal") {
                // Start evading
                satData.status = "evading";
                satData.evasionTarget = triggeringThreat.id; // Track which threat caused evasion
                // Decide evasion direction (simple: move outwards if threat is lower/closer, inwards if higher/further - basic radius check)
                // A more robust method would check relative velocity vectors.
                // Simple radius adjustment:
                satData.targetRadius = satData.orbit.originalRadius + EVASION_MANEUVER_DISTANCE * Math.sign(satData.orbit.radius - triggeringThreat.orbit.radius + 0.01); // Add small offset to avoid zero

                // Clamp target radius to reasonable bounds
                 satData.targetRadius = Math.max(EARTH_RADIUS + LEO_ALTITUDE_MIN * 0.8, satData.targetRadius);
                 satData.targetRadius = Math.min(EARTH_RADIUS + LEO_ALTITUDE_MAX * 1.2, satData.targetRadius);

                satelliteInstancedMesh.setColorAt(i, COLOR_EVADING);
                needsColorUpdate = true;
                // console.log(`${satData.id} EVADING from ${triggeringThreat.id}. Target Radius: ${satData.targetRadius.toFixed(2)}`);
            }
            evadingCount++;
        } else {
            // No threat nearby
            if (satData.status === "evading") {
                // If was evading, start returning to nominal orbit
                satData.status = "nominal";
                satData.targetRadius = satData.orbit.originalRadius; // Set target back to original
                satData.evasionTarget = null;
                satelliteInstancedMesh.setColorAt(i, COLOR_NOMINAL);
                needsColorUpdate = true;
                // console.log(`${satData.id} Returning to nominal orbit.`);
            }
            nominalCount++;
        }

         // Ensure target radius is set correctly if already nominal
        if (satData.status === "nominal" && satData.targetRadius !== satData.orbit.originalRadius) {
             satData.targetRadius = satData.orbit.originalRadius;
        }

        // Update satellite angle for orbital movement
        satData.orbit.angle += satData.orbit.speed * deltaTime;
        satData.orbit.angle %= (Math.PI * 2); // Keep angle within 0-2PI

        // Update the instance matrix based on potentially new radius/angle
        updateSatelliteInstance(i, satData);
    }

    // Apply updates to the InstancedMesh
    satelliteInstancedMesh.instanceMatrix.needsUpdate = true;
    if (needsColorUpdate && satelliteInstancedMesh.instanceColor) {
        satelliteInstancedMesh.instanceColor.needsUpdate = true;
    }

    // Update UI status counts
    updateStatusInfo(nominalCount, evadingCount);
}


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    if (isPaused) {
        controls.update(); // Still allow camera movement when paused
        return;
    }

    // Run the core logic
    runAgentLogic(deltaTime);

    // Update controls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

// --- UI Interaction ---
function setupUI() {
    document.getElementById('pause-button').addEventListener('click', togglePause);
    document.getElementById('spawn-threat-button').addEventListener('click', spawnThreat);

    // Initial UI update
    document.getElementById('satellite-count').textContent = NUM_SATELLITES;
    updateInfoPanel();
    updateStatusInfo(NUM_SATELLITES, 0); // Start with all nominal
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-button').textContent = isPaused ? 'Resume' : 'Pause';
    document.getElementById('paused-status').textContent = isPaused;
    if (!isPaused) {
        clock.getDelta(); // Reset delta time after pause to avoid jump
    }
}

function updateInfoPanel() {
    document.getElementById('threat-count').textContent = threats.length;
}

function updateStatusInfo(nominal, evading) {
     document.getElementById('status-info').textContent = `Nominal: ${nominal} | Evading: ${evading}`;
}

// --- Window Resize Handler ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Start Simulation ---
init();