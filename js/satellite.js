// Satellite.js - Satellite agent implementation for the Orbital Autonomy Simulator

class Satellite {
    constructor(id) {
        this.id = id;
        this.status = 'nominal';
        
        // Generate random orbit parameters
        this.orbitRadius = CONFIG.satellites.minOrbitRadius + 
            Math.random() * (CONFIG.satellites.maxOrbitRadius - CONFIG.satellites.minOrbitRadius);
        
        this.originalOrbitRadius = this.orbitRadius;
        
        // Random orbit inclination and phase
        this.inclination = Math.random() * Math.PI;
        this.phase = Math.random() * Math.PI * 2;
        this.originalInclination = this.inclination;
        
        // Random orbit speed
        this.speed = CONFIG.satellites.minSpeed + 
            Math.random() * (CONFIG.satellites.maxSpeed - CONFIG.satellites.minSpeed);
        
        // Create visual representation
        this.mesh = this.createMesh();
        
        // Create position vector for collision detection
        this.position = new THREE.Vector3();
        
        // Set initial position
        this.updatePosition();
        
        // Evasion properties
        this.evasionTimer = 0;
        this.evasionTarget = null;
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(CONFIG.satellites.size, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: CONFIG.satellites.nominalColor });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        return mesh;
    }
    
    updatePosition() {
        // Calculate position based on orbital parameters
        const x = this.orbitRadius * Math.sin(this.phase) * Math.cos(this.inclination);
        const y = this.orbitRadius * Math.sin(this.phase) * Math.sin(this.inclination);
        const z = this.orbitRadius * Math.cos(this.phase);
        
        // Update position vector for collision detection
        this.position.set(x, y, z);
        
        // Update mesh position if it exists and has a position property
        if (this.mesh && this.mesh.position) {
            this.mesh.position.set(x, y, z);
        }
    }
    
    update() {
        // Update orbital position
        this.phase += this.speed;
        if (this.phase > Math.PI * 2) {
            this.phase -= Math.PI * 2;
        }
        
        // Check for threats and update status
        this.checkThreats();
        
        // Handle evasion behavior
        if (this.status === 'evading') {
            this.evasionTimer++;
            
            // Return to original orbit after delay
            if (this.evasionTimer > CONFIG.satellites.returnDelay) {
                this.returnToNominal();
            }
        }
        
        // Update visual position
        this.updatePosition();
    }
    
    checkThreats() {
        try {
            let closestThreatDistance = Infinity;
            let closestThreat = null;
            
            // Check distance to all threats
            for (const threat of threats) {
                // Use position vectors directly for distance calculation
                // This works with both regular meshes and instanced meshes
                const distance = this.position.distanceTo(
                    threat.position || (threat.mesh && threat.mesh.position)
                );
                
                if (distance < closestThreatDistance) {
                    closestThreatDistance = distance;
                    closestThreat = threat;
                }
            }
            
            // If a threat is within evasion distance, initiate evasion
            if (closestThreatDistance < CONFIG.satellites.evasionDistance) {
                if (this.status !== 'evading') {
                    this.initiateEvasion(closestThreat);
                }
            } 
            // If threat is nearby but not in evasion range, set to monitoring
            else if (closestThreatDistance < CONFIG.satellites.evasionDistance * 1.5) {
                if (this.status !== 'evading') {
                    this.status = 'monitoring';
                    if (this.setColor) {
                        this.setColor(CONFIG.satellites.monitoringColor);
                    } else if (this.mesh && this.mesh.material && this.mesh.material.color) {
                        this.mesh.material.color.setHex(CONFIG.satellites.monitoringColor);
                    }
                }
            } 
            // If no threats nearby and not evading, return to nominal
            else if (this.status === 'monitoring') {
                this.returnToNominal();
            }
        } catch (e) {
            console.error("Error in checkThreats:", e);
        }
    }
    
    initiateEvasion(threat) {
        this.status = 'evading';
        this.evasionTimer = 0;
        this.evasionTarget = threat;
        
        // Change color to indicate evasion
        if (this.setColor) {
            this.setColor(CONFIG.satellites.evadingColor);
        } else if (this.mesh && this.mesh.material && this.mesh.material.color) {
            this.mesh.material.color.setHex(CONFIG.satellites.evadingColor);
        }
        
        try {
            // Determine evasion strategy based on threat position
            const threatPosition = threat.position || (threat.mesh && threat.mesh.position);
            if (threatPosition) {
                const threatDirection = new THREE.Vector3().subVectors(
                    this.position, 
                    threatPosition
                ).normalize();
                
                // Adjust orbit radius (move away from threat)
                const radiusAdjustment = (Math.random() * 2 - 1) > 0 ? 1.5 : -1.5;
                this.orbitRadius = this.originalOrbitRadius + radiusAdjustment;
                
                // Ensure orbit radius stays within bounds
                this.orbitRadius = Math.max(
                    CONFIG.satellites.minOrbitRadius,
                    Math.min(this.orbitRadius, CONFIG.satellites.maxOrbitRadius)
                );
                
                // Adjust inclination slightly
                this.inclination += (Math.random() * 0.2 - 0.1);
            }
        } catch (e) {
            console.error("Error in initiateEvasion:", e);
            // Fallback evasion strategy
            this.orbitRadius = this.originalOrbitRadius + 1.5;
            this.inclination += 0.1;
        }
    }
    
    returnToNominal() {
        this.status = 'nominal';
        this.evasionTimer = 0;
        this.evasionTarget = null;
        
        // Gradually return to original orbit
        this.orbitRadius = this.originalOrbitRadius;
        this.inclination = this.originalInclination;
        
        // Reset color
        if (this.setColor) {
            this.setColor(CONFIG.satellites.nominalColor);
        } else if (this.mesh && this.mesh.material && this.mesh.material.color) {
            this.mesh.material.color.setHex(CONFIG.satellites.nominalColor);
        }
    }
    
    // Clean up resources when removing satellite
    dispose() {
        if (this.mesh) {
            scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
        }
    }
}

// Function to create all satellites
function createSatellites() {
    for (let i = 0; i < CONFIG.satellites.count; i++) {
        const satellite = new Satellite(i);
        satellites.push(satellite);
    }
}

// Function to update all satellites
function updateSatellites() {
    for (const satellite of satellites) {
        try {
            satellite.update();
        } catch (e) {
            console.error("Error updating satellite:", e);
        }
    }
}
