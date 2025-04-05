// Performance optimizations for the Orbital Autonomy Simulator

// Modify the main.js file to use InstancedMesh for better performance
function optimizePerformance() {
    // Replace individual satellite meshes with InstancedMesh if enabled in config
    if (CONFIG.performance.useInstancedMesh) {
        implementInstancedMeshForSatellites();
    }
}

// Implementation of InstancedMesh for satellites
function implementInstancedMeshForSatellites() {
    // First, remove all existing satellite meshes from the scene
    for (const satellite of satellites) {
        scene.remove(satellite.mesh);
        satellite.mesh.geometry.dispose();
        satellite.mesh.material.dispose();
    }
    
    // Create geometry and material for instanced mesh
    const geometry = new THREE.SphereGeometry(CONFIG.satellites.size, 8, 8);
    const material = new THREE.MeshBasicMaterial();
    
    // Create instanced mesh with one instance per satellite
    const instancedMesh = new THREE.InstancedMesh(
        geometry, 
        material, 
        CONFIG.satellites.count
    );
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);
    
    // Create dummy object for matrix calculations
    const dummy = new THREE.Object3D();
    
    // Create color array for instances
    const colors = [];
    for (let i = 0; i < satellites.length; i++) {
        colors.push(new THREE.Color(CONFIG.satellites.nominalColor));
    }
    
    // Update satellite class to work with instanced mesh
    for (let i = 0; i < satellites.length; i++) {
        const satellite = satellites[i];
        
        // Store index in instanced mesh
        satellite.instanceIndex = i;
        
        // Override updatePosition method
        satellite.updatePosition = function() {
            // Calculate position based on orbital parameters
            const x = this.orbitRadius * Math.sin(this.phase) * Math.cos(this.inclination);
            const y = this.orbitRadius * Math.sin(this.phase) * Math.sin(this.inclination);
            const z = this.orbitRadius * Math.cos(this.phase);
            
            // Update dummy position
            dummy.position.set(x, y, z);
            dummy.updateMatrix();
            
            // Update instance matrix
            instancedMesh.setMatrixAt(this.instanceIndex, dummy.matrix);
            instancedMesh.instanceMatrix.needsUpdate = true;
            
            // Store position for collision detection
            if (!this.position) this.position = new THREE.Vector3();
            this.position.set(x, y, z);
        };
        
        // Override color setting
        satellite.setColor = function(colorHex) {
            colors[this.instanceIndex].setHex(colorHex);
            instancedMesh.setColorAt(this.instanceIndex, colors[this.instanceIndex]);
            instancedMesh.instanceColor.needsUpdate = true;
        };
        
        // Update mesh material color methods
        Object.defineProperty(satellite, 'mesh', {
            get: function() {
                return {
                    position: this.position,
                    material: {
                        color: {
                            setHex: (hex) => this.setColor(hex)
                        }
                    }
                };
            }
        });
        
        // Initialize color
        satellite.setColor(CONFIG.satellites.nominalColor);
    }
    
    // Set up instanced mesh color attribute
    instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(CONFIG.satellites.count * 3), 3
    );
    
    for (let i = 0; i < satellites.length; i++) {
        instancedMesh.setColorAt(i, colors[i]);
    }
    instancedMesh.instanceColor.needsUpdate = true;
    
    // Store reference to instanced mesh
    window.satelliteInstancedMesh = instancedMesh;
    
    // Update raycasting for instanced mesh
    updateRaycastingForInstancedMesh(instancedMesh);
    
    console.log("Switched to InstancedMesh for better performance");
}

// Update raycasting to work with instanced mesh
function updateRaycastingForInstancedMesh(instancedMesh) {
    // Override setupSatelliteClickDetection function
    window.setupSatelliteClickDetection = function() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        renderer.domElement.addEventListener('click', (event) => {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Update the raycaster
            raycaster.setFromCamera(mouse, camera);
            
            // Check for intersections with instanced mesh
            const intersects = raycaster.intersectObject(instancedMesh);
            
            if (intersects.length > 0) {
                // Get instance index from intersection
                const instanceId = intersects[0].instanceId;
                
                // Find the satellite with this instance index
                const clickedSatellite = satellites.find(sat => sat.instanceIndex === instanceId);
                
                if (clickedSatellite) {
                    showSatelliteInfo(clickedSatellite);
                }
            }
        });
    };
    
    // Call the updated function
    setupSatelliteClickDetection();
}

// Add throttling for non-critical updates
function throttleUpdates() {
    // Store original update functions
    const originalUpdateDebugInfo = window.updateDebugInfo;
    
    // Override with throttled versions
    window.updateDebugInfo = function() {
        // Only update every 30 frames
        if (frameCount % 30 === 0) {
            originalUpdateDebugInfo();
        }
    };
}

// Add this to the init function in main.js
// Call optimizePerformance() after creating satellites
