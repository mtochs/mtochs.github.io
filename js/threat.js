// Threat.js - Threat object implementation for the Orbital Autonomy Simulator

class Threat {
    constructor(id) {
        this.id = id;
        
        // Generate random orbit parameters
        this.orbitRadius = CONFIG.threats.minOrbitRadius + 
            Math.random() * (CONFIG.threats.maxOrbitRadius - CONFIG.threats.minOrbitRadius);
        
        // Random orbit inclination and phase
        this.inclination = Math.random() * Math.PI;
        this.phase = Math.random() * Math.PI * 2;
        
        // Random orbit speed
        this.speed = CONFIG.threats.minSpeed + 
            Math.random() * (CONFIG.threats.maxSpeed - CONFIG.threats.minSpeed);
        
        // Direction change parameters
        this.directionChangeTimer = 0;
        this.directionChangeInterval = Math.random() * 500 + 300; // Random interval between 300-800 frames
        this.movingBetweenPlanes = false;
        this.targetInclination = this.inclination;
        this.inclinationChangeSpeed = 0.005;
        
        // Create position vector for collision detection
        this.position = new THREE.Vector3();
        
        // Create visual representation
        this.mesh = this.createMesh();
        
        // Set initial position
        this.updatePosition();
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(CONFIG.threats.size, 12, 12);
        const material = new THREE.MeshBasicMaterial({ color: CONFIG.threats.color });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        return mesh;
    }
    
    updatePosition() {
        try {
            // Calculate position based on orbital parameters
            const x = this.orbitRadius * Math.sin(this.phase) * Math.cos(this.inclination);
            const y = this.orbitRadius * Math.sin(this.phase) * Math.sin(this.inclination);
            const z = this.orbitRadius * Math.cos(this.phase);
            
            // Update position vector for collision detection
            this.position.set(x, y, z);
            
            // Update mesh position
            if (this.mesh && this.mesh.position) {
                this.mesh.position.set(x, y, z);
            }
        } catch (e) {
            console.error("Error updating threat position:", e);
        }
    }
    
    update() {
        try {
            // Update orbital position
            this.phase += this.speed;
            if (this.phase > Math.PI * 2) {
                this.phase -= Math.PI * 2;
            }
            
            // Handle direction changes
            this.directionChangeTimer++;
            
            if (this.movingBetweenPlanes) {
                // Gradually change inclination toward target
                const diff = this.targetInclination - this.inclination;
                if (Math.abs(diff) < this.inclinationChangeSpeed) {
                    this.inclination = this.targetInclination;
                    this.movingBetweenPlanes = false;
                } else {
                    this.inclination += Math.sign(diff) * this.inclinationChangeSpeed;
                }
            } else if (this.directionChangeTimer > this.directionChangeInterval) {
                this.changeDirection();
            }
            
            // Update visual position
            this.updatePosition();
        } catch (e) {
            console.error("Error updating threat:", e);
        }
    }
    
    changeDirection() {
        this.directionChangeTimer = 0;
        this.directionChangeInterval = Math.random() * 500 + 300;
        
        // Randomly decide whether to change orbit plane or radius
        const changeType = Math.random();
        
        if (changeType < 0.4) {
            // Change orbit plane
            this.movingBetweenPlanes = true;
            this.targetInclination = Math.random() * Math.PI;
        } else if (changeType < 0.8) {
            // Change orbit radius
            this.orbitRadius = CONFIG.threats.minOrbitRadius + 
                Math.random() * (CONFIG.threats.maxOrbitRadius - CONFIG.threats.minOrbitRadius);
        } else {
            // Change speed
            this.speed = CONFIG.threats.minSpeed + 
                Math.random() * (CONFIG.threats.maxSpeed - CONFIG.threats.minSpeed);
        }
    }
    
    // Clean up resources when removing threat
    dispose() {
        if (this.mesh) {
            scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
        }
    }
}

// Function to create a new threat
function createThreat() {
    try {
        const id = threats.length;
        const threat = new Threat(id);
        threats.push(threat);
        
        // Update threat count in UI
        updateDebugInfo();
        
        return threat;
    } catch (e) {
        console.error("Error creating threat:", e);
        return null;
    }
}

// Function to update all threats
function updateThreats() {
    for (const threat of threats) {
        try {
            threat.update();
        } catch (e) {
            console.error("Error updating threat:", e);
        }
    }
}

// Function to remove a threat
function removeThreat(index) {
    try {
        if (index >= 0 && index < threats.length) {
            threats[index].dispose();
            threats.splice(index, 1);
            
            // Update threat count in UI
            updateDebugInfo();
        }
    } catch (e) {
        console.error("Error removing threat:", e);
    }
}
