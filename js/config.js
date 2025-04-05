// Configuration parameters for the Orbital Autonomy Simulator
const CONFIG = {
    // Scene settings
    scene: {
        backgroundColor: 0x000000,
        earthRadius: 10,
        cameraDistance: 100,
        starfieldCount: 2000,
        starfieldRadius: 500
    },
    
    // Satellite settings
    satellites: {
        count: 1500,
        minOrbitRadius: 15,
        maxOrbitRadius: 30,
        size: 0.1,
        nominalColor: 0x00ff00,
        evadingColor: 0xff0000,
        monitoringColor: 0xffff00,
        minSpeed: 0.005,
        maxSpeed: 0.015,
        evasionDistance: 2.5,
        returnDelay: 120 // frames before returning to original orbit
    },
    
    // Threat settings
    threats: {
        initialCount: 3,
        maxCount: 5,
        size: 0.3,
        color: 0xff0000,
        minSpeed: 0.002,
        maxSpeed: 0.008,
        minOrbitRadius: 15,
        maxOrbitRadius: 30
    },
    
    // Performance settings
    performance: {
        useInstancedMesh: true,
        maxFPS: 60
    },
    
    // Debug settings
    debug: {
        showFPS: true,
        showCounts: true,
        showOrbits: false
    }
};
