# Lattice for Space: Orbital Autonomy Simulator

## Objective

A real-time 3D web-based simulation using Three.js that visualizes thousands of autonomous LEO satellites reacting to orbital threats. This simulation serves as a prototype demonstration of autonomous swarm behavior.

## Goal

To visually demonstrate how satellites in low Earth orbit autonomously detect threats (e.g., space debris or hostile objects) and perform evasive maneuvers using simple agent logic and smooth orbital animation.

## Features

*   **3D Visualization:** Renders Earth and numerous satellites in distinct orbits using Three.js.
*   **Satellite Agents:** Simulates 1000+ satellites, each with unique orbital parameters.
*   **Threat Objects:** Includes dynamic threat objects moving through the orbital environment.
*   **Autonomous Behavior:** Satellites detect nearby threats based on proximity.
*   **Status Indication:** Satellites change color based on their status:
    *   **Green:** Nominal (no threat nearby)
    *   **Yellow:** Monitoring (threat detected nearby)
    *   **Red:** Evading (threat dangerously close, performing maneuver)
*   **Evasive Maneuvers:** Satellites temporarily adjust their orbital radius when evading.
*   **Performance:** Utilizes `InstancedMesh` for efficient rendering of many agents.
*   **Basic UI:** Buttons to Pause/Resume the simulation and Spawn new threats.
*   **Static Deployment:** Runs entirely in the browser, deployable as a static website.

## Running the Simulation

1.  **Prerequisites:** A modern web browser (Chrome, Firefox, Safari, Edge) with WebGL support.
2.  **Files Needed:** Ensure you have the following files in the same directory:
    *   `index.html`
    *   `style.css`
    *   `main.js`
    *   `earth_texture.jpg` (or update the path in `main.js`)
    *   A `js` folder containing:
        *   `three.module.js`
        *   `OrbitControls.js`
3.  **Option 1: Local Server (Recommended)**
    *   If you have Node.js/npm installed, you can use a simple local server:
        ```bash
        npx serve .
        ```
        Then open your browser to the provided local address (e.g., `http://localhost:3000`).
    *   Alternatively, use Python's built-in server (Python 3):
        ```bash
        python -m http.server
        ```
        Then open `http://localhost:8000`.
    *   Using a local server ensures correct handling of module imports and texture loading.
4.  **Option 2: Direct File Access (May have issues)**
    *   You can try opening the `index.html` file directly in your browser (`file:///...`). However, due to browser security restrictions (CORS), loading the Three.js module or the Earth texture might fail.

## Controls

*   **Mouse Drag:** Rotate the view around the Earth.
*   **Mouse Wheel / Pinch:** Zoom in and out.
*   **Pause/Resume Button:** Toggle the simulation updates.
*   **Spawn Threat Button:** Add a new threat object to the simulation.

## Code Structure

*   **`index.html`:** Main HTML file, sets up the canvas, import map for Three.js, and includes the script.
*   **`style.css`:** Basic CSS for styling the page and UI elements.
*   **`main.js`:** Core simulation logic using Three.js. Handles scene setup, object creation (Earth, satellites, threats, starfield), animation loop, agent logic (detection, status change, evasion), and UI interactions.
*   **`js/`:** Contains the required Three.js library files (`three.module.js`, `OrbitControls.js`).
*   **`earth_texture.jpg`:** Texture file for the Earth sphere. 