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

// Colors
const COLOR_NOMINAL = new THREE.Color(0x00ff00); // Green
const COLOR_EVADING = new THREE.Color(0xff0000); // Red
const COLOR_NEAR = new THREE.Color(0xffff00); // Yellow

// Dummy object for matrix calculation
const dummy = new THREE.Object3D();

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
    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 32, 32);
    const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x4682B4 });
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Initialize Satellites
    initSatellites();

    // Initialize Threats
    initThreats();

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 7;
    controls.maxDistance = 100; // Increased max distance

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function initSatellites() {
    const satelliteGeometry = new THREE.SphereGeometry(SATELLITE_SIZE, 8, 8);
    // Use a basic material, color will be set per instance
    const satelliteMaterial = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.5 });

    satelliteMesh = new THREE.InstancedMesh(satelliteGeometry, satelliteMaterial, SATELLITE_COUNT);
    satelliteMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Important for performance

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
            originalRadius: radius, // Store original for return
            speed: speed,
            angle: angle,
            orbitalPlane: orbitalPlane,
            status: "nominal",
            evasionTargetRadius: null, // For smooth evasion maneuvers later
            evasionTargetInclination: null
        });

        // Set initial position and color
        updateSatelliteInstance(i);
        satelliteMesh.setColorAt(i, COLOR_NOMINAL);
    }

    satelliteMesh.instanceColor.needsUpdate = true;
    scene.add(satelliteMesh);
}

function initThreats() {
    const threatGeometry = new THREE.SphereGeometry(THREAT_SIZE, 16, 16);
    const threatMaterial = new THREE.MeshStandardMaterial({ color: THREAT_COLOR, roughness: 0.5 });

    for (let i = 0; i < THREAT_COUNT; i++) {
        const threat = new THREE.Mesh(threatGeometry, threatMaterial);

        // Orbital parameters (similar to satellites for now)
        const radius = THREAT_BASE_ORBIT_RADIUS + Math.random() * THREAT_ORBIT_VARIATION;
        const speed = (1 / (radius * radius)) * 4; // Slightly different speed factor
        const angle = Math.random() * Math.PI * 2;

        // Random orbital plane
        const inclination = Math.random() * Math.PI * 0.2; // Lower inclination threats for now
        const longitudeOfAscendingNode = Math.random() * Math.PI * 2;
        const orbitalPlane = new THREE.Quaternion();
        const rotationAxis = new THREE.Vector3(0, 1, 0);
        orbitalPlane.setFromAxisAngle(rotationAxis, longitudeOfAscendingNode);
        const inclinationAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(orbitalPlane);
        const inclinationQuat = new THREE.Quaternion().setFromAxisAngle(inclinationAxis, inclination);
        orbitalPlane.multiply(inclinationQuat);

        threatsData.push({
            id: `threat_${i}`,
            radius: radius,
            speed: speed,
            angle: angle,
            orbitalPlane: orbitalPlane,
            mesh: threat // Store reference to the mesh
        });

        // Calculate initial position
        updateThreatPosition(i);

        scene.add(threat);
        threatMeshes.push(threat); // Keep track of mesh objects
    }
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

    // Update the matrix
    dummy.updateMatrix();
    satelliteMesh.setMatrixAt(index, dummy.matrix);
}

function updateThreatPosition(index) {
    const data = threatsData[index];
    const mesh = data.mesh;

    // Calculate position in the orbital plane
    const x = data.radius * Math.cos(data.angle);
    const z = data.radius * Math.sin(data.angle);
    const y = 0;

    mesh.position.set(x, y, z);
    // Apply the orbital plane rotation
    mesh.position.applyQuaternion(data.orbitalPlane);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = 0.016; // Use THREE.Clock for better accuracy later

    // Update satellite positions
    if (satelliteMesh) {
        for (let i = 0; i < SATELLITE_COUNT; i++) {
            satellitesData[i].angle += satellitesData[i].speed * delta;
            updateSatelliteInstance(i);
        }
        satelliteMesh.instanceMatrix.needsUpdate = true; // Must be set after loop
    }

    // Update threat positions
    if (threatMeshes.length > 0) {
        for (let i = 0; i < THREAT_COUNT; i++) {
            threatsData[i].angle += threatsData[i].speed * delta;
            updateThreatPosition(i);
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

init(); 