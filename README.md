# Lattice for Space: Orbital Autonomy Simulator

A real-time 3D web-based simulation that visualizes thousands of autonomous LEO satellites reacting to orbital threats. This simulation serves as a prototype for a US Air Force/Space Force SBIR grant proposal.

## Overview

This simulator demonstrates how satellites in low Earth orbit autonomously detect threats (e.g., space debris) and perform evasive maneuvers, using lightweight agent logic and smooth orbital animation. The simulation is performant and scalable to thousands of agents, and exportable as a standalone static website.

## Features

- **3D Space Environment**: Realistic space scene with Earth and starfield
- **Autonomous Satellites**: 1000-2000 satellites with individual decision-making capabilities
- **Threat Objects**: Dynamic threats that satellites must detect and avoid
- **Real-time Simulation**: Smooth 60 FPS animation with thousands of objects
- **Interactive Controls**: Pause/resume, spawn threats, and view satellite details
- **Performance Optimized**: Uses Three.js InstancedMesh for efficient rendering

## How to Run

1. Clone or download this repository
2. Open `index.html` in a modern web browser (Chrome or Safari recommended)
3. No server required - runs entirely in the browser

## Deployment

This project is designed to be easily deployable to:
- GitHub Pages
- Vercel
- Any static web hosting service

Simply upload all files maintaining the directory structure.

## Controls

- **Orbit Controls**: Click and drag to rotate the view, scroll to zoom
- **Pause/Resume**: Toggle simulation running state
- **Spawn Threat**: Add a new threat object to the simulation
- **Toggle Debug**: Show/hide performance metrics and object counts
- **Click on Satellite**: View detailed information about a specific satellite

## Color Legend

- **Green**: Nominal satellite operation
- **Red**: Satellite performing evasive maneuver
- **Yellow**: Satellite monitoring nearby threat
- **Red (larger)**: Threat object

## Technical Details

- Built with Three.js for 3D rendering
- Uses InstancedMesh for efficient rendering of thousands of objects
- Implements simple autonomous agent logic for satellite decision-making
- Optimized for performance in modern browsers

## Requirements

- Modern web browser with WebGL support
- No additional dependencies or installation required

## License

This project is provided as a prototype demonstration.

## Credits

Created as a prototype for a US Air Force/Space Force SBIR grant proposal.
