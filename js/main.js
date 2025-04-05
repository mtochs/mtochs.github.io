// Modified main.js with improved error handling and WebGL detection

// Global variables
let scene, camera, renderer, controls;
let earth, satellites = [], threats = [];
let simulationActive = true;
let lastTime = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let webGLSupported = true;

// Check for WebGL support
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

// Display error message when WebGL is not supported
function displayWebGLError() {
    const container = document.getElementById('container');
    container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: white;">
            <h2>WebGL Not Available</h2>
            <p>Your browser or device doesn't seem to support WebGL, which is required for this simulation.</p>
            <p>Please try:</p>
            <ul style="list-style-type: none; padding: 0;">
                <li>Using a modern browser (Chrome, Firefox, Safari, Edge)</li>
                <li>Updating your graphics drivers</li>
                <li>Enabling hardware acceleration in your browser settings</li>
                <li>Disabling any browser extensions that might interfere with WebGL</li>
            </ul>
        </div>
    `;
    
    // Hide UI controls since simulation won't run
    document.getElementById('ui-controls').style.display = 'none';
    
    webGLSupported = false;
}

// Initialize the scene
function init() {
    // Check WebGL support first
    if (!checkWebGLSupport()) {
        displayWebGLError();
        return;
    }
    
    try {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(CONFIG.scene.backgroundColor);
        
        // Create camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = CONFIG.scene.cameraDistance;
        
        // Create renderer with error handling
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.getElementById('container').appendChild(renderer.domElement);
        } catch (e) {
            console.error("Error creating WebGL renderer:", e);
            displayWebGLError();
            return;
        }
        
        // Add orbit controls
        try {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
        } catch (e) {
            console.error("Error initializing OrbitControls:", e);
            // Continue without orbit controls
        }
        
        // Create Earth
        createEarth();
        
        // Create starfield
        createStarfield();
        
        // Create satellites
        createSatellites();
        
        // Apply performance optimizations
        try {
            optimizePerformance();
            throttleUpdates();
        } catch (e) {
            console.error("Error applying performance optimizations:", e);
            // Continue without optimizations
        }
        
        // Create initial threats
        for (let i = 0; i < CONFIG.threats.initialCount; i++) {
            createThreat();
        }
        
        // Initialize UI
        initUI();
        
        // Add event listener for window resize
        window.addEventListener('resize', onWindowResize, false);
        
        // Start animation loop
        animate();
        
        // Log successful initialization
        console.log("Simulation initialized successfully");
    } catch (e) {
        console.error("Error initializing simulation:", e);
        displayWebGLError();
    }
}

// Create Earth sphere
function createEarth() {
    try {
        const geometry = new THREE.SphereGeometry(CONFIG.scene.earthRadius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x2233ff,
            wireframe: false
        });
        
        earth = new THREE.Mesh(geometry, material);
        scene.add(earth);
        
        // Optional: Add simple atmosphere glow
        const atmosphereGeometry = new THREE.SphereGeometry(CONFIG.scene.earthRadius * 1.05, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x4466ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        scene.add(atmosphere);
        
        console.log("Earth created successfully");
    } catch (e) {
        console.error("Error creating Earth:", e);
    }
}

// Create starfield background
function createStarfield() {
    try {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        const starVertices = [];
        
        for (let i = 0; i < CONFIG.scene.starfieldCount; i++) {
            const radius = CONFIG.scene.starfieldRadius;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            starVertices.push(x, y, z);
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starfield = new THREE.Points(starGeometry, starMaterial);
        scene.add(starfield);
        
        console.log("Starfield created successfully");
    } catch (e) {
        console.error("Error creating starfield:", e);
    }
}

// Handle window resize
function onWindowResize() {
    if (!webGLSupported || !camera || !renderer) return;
    
    try {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    } catch (e) {
        console.error("Error handling window resize:", e);
    }
}

// Animation loop
function animate(time) {
    if (!webGLSupported) return;
    
    requestAnimationFrame(animate);
    
    if (!simulationActive) return;
    
    try {
        // Calculate FPS
        if (!lastTime) {
            lastTime = time;
            return;
        }
        
        const delta = time - lastTime;
        lastTime = time;
        
        frameCount++;
        
        if (time - lastFpsUpdate > 1000) {
            const fps = Math.round(frameCount * 1000 / (time - lastFpsUpdate));
            document.getElementById('fps').textContent = fps;
            frameCount = 0;
            lastFpsUpdate = time;
            
            // Update other debug info
            updateDebugInfo();
        }
        
        // Update satellite positions and behaviors
        updateSatellites();
        
        // Update threat positions
        updateThreats();
        
        // Update controls
        if (controls) controls.update();
        
        // Render scene
        renderer.render(scene, camera);
    } catch (e) {
        console.error("Error in animation loop:", e);
        simulationActive = false;
    }
}

// Update debug information
function updateDebugInfo() {
    try {
        document.getElementById('satellite-count').textContent = satellites.length;
        document.getElementById('threat-count').textContent = threats.length;
        
        const evadingCount = satellites.filter(sat => sat.status === 'evading').length;
        document.getElementById('evading-count').textContent = evadingCount;
    } catch (e) {
        console.error("Error updating debug info:", e);
    }
}

// Add console logging for debugging
console.log("Three.js version:", THREE.REVISION);
console.log("WebGL supported:", checkWebGLSupport());

// Initialize the simulation when the page loads
window.addEventListener('DOMContentLoaded', init);
