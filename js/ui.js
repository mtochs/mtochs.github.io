// UI.js - User interface controls for the Orbital Autonomy Simulator

// Initialize UI elements and event listeners
function initUI() {
    // Add event listeners for UI buttons
    document.getElementById('toggle-simulation').addEventListener('click', toggleSimulation);
    document.getElementById('spawn-threat').addEventListener('click', spawnNewThreat);
    document.getElementById('toggle-debug').addEventListener('click', toggleDebugInfo);
    
    // Create color legend
    createLegend();
    
    // Initialize debug info if enabled
    if (CONFIG.debug.showFPS || CONFIG.debug.showCounts) {
        document.getElementById('debug-info').classList.remove('hidden');
    }
}

// Create color legend for satellite status
function createLegend() {
    const legend = document.createElement('div');
    legend.className = 'legend';
    
    const statuses = [
        { name: 'Nominal', color: 'green' },
        { name: 'Evading', color: 'red' },
        { name: 'Monitoring', color: 'yellow' }
    ];
    
    statuses.forEach(status => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = `legend-color ${status.color}`;
        
        const label = document.createElement('span');
        label.textContent = status.name;
        
        item.appendChild(colorBox);
        item.appendChild(label);
        legend.appendChild(item);
    });
    
    document.body.appendChild(legend);
}

// Toggle simulation pause/resume
function toggleSimulation() {
    simulationActive = !simulationActive;
    
    const button = document.getElementById('toggle-simulation');
    button.textContent = simulationActive ? 'Pause' : 'Resume';
    
    if (simulationActive) {
        // Reset last time to avoid large delta on resume
        lastTime = 0;
        animate();
    }
}

// Spawn a new threat
function spawnNewThreat() {
    if (threats.length < CONFIG.threats.maxCount) {
        createThreat();
    } else {
        // If at max, replace the oldest threat
        removeThreat(0);
        createThreat();
    }
}

// Toggle debug information display
function toggleDebugInfo() {
    const debugInfo = document.getElementById('debug-info');
    debugInfo.classList.toggle('hidden');
}

// Add satellite click detection for showing details
function setupSatelliteClickDetection() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    renderer.domElement.addEventListener('click', (event) => {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the raycaster
        raycaster.setFromCamera(mouse, camera);
        
        // Get all satellite meshes
        const satelliteMeshes = satellites.map(sat => sat.mesh);
        
        // Check for intersections
        const intersects = raycaster.intersectObjects(satelliteMeshes);
        
        if (intersects.length > 0) {
            // Find the satellite that was clicked
            const clickedMesh = intersects[0].object;
            const clickedSatellite = satellites.find(sat => sat.mesh === clickedMesh);
            
            if (clickedSatellite) {
                showSatelliteInfo(clickedSatellite);
            }
        }
    });
}

// Show satellite information in a popup
function showSatelliteInfo(satellite) {
    // Remove any existing popup
    const existingPopup = document.getElementById('satellite-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup element
    const popup = document.createElement('div');
    popup.id = 'satellite-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    popup.style.color = 'white';
    popup.style.padding = '20px';
    popup.style.borderRadius = '5px';
    popup.style.zIndex = '1000';
    popup.style.maxWidth = '300px';
    
    // Add satellite information
    popup.innerHTML = `
        <h3>Satellite #${satellite.id}</h3>
        <p>Status: ${satellite.status}</p>
        <p>Orbit Radius: ${satellite.orbitRadius.toFixed(2)}</p>
        <p>Original Orbit: ${satellite.originalOrbitRadius.toFixed(2)}</p>
        <p>Inclination: ${(satellite.inclination * 180 / Math.PI).toFixed(2)}°</p>
        <p>Speed: ${satellite.speed.toFixed(5)}</p>
        <button id="close-popup">Close</button>
    `;
    
    // Add to document
    document.body.appendChild(popup);
    
    // Add close button event listener
    document.getElementById('close-popup').addEventListener('click', () => {
        popup.remove();
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        if (document.getElementById('satellite-popup')) {
            document.getElementById('satellite-popup').remove();
        }
    }, 5000);
}

// Initialize satellite click detection when UI is ready
document.addEventListener('DOMContentLoaded', () => {
    // This will be called after the main init() function
    setTimeout(setupSatelliteClickDetection, 1000);
});
