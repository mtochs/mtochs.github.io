# Lattice for Space: Orbital Autonomy Simulator

![Simulation Screenshot](placeholder.png)
*Add a screenshot or GIF of your simulation here! Replace `placeholder.png` with the path to your image file after uploading it to the repository.*

## Overview

Lattice for Space is a real-time, 3D web-based simulation demonstrating the concept of autonomous satellite constellation behavior in Low Earth Orbit (LEO). Built using Three.js, this simulation visualizes thousands of satellites detecting and reacting to orbital threats (like space debris) through simple, decentralized agent logic.

This project serves as a visual prototype intended to support a US Air Force / Space Force SBIR (Small Business Innovation Research) grant proposal, showcasing the potential for scalable, autonomous orbital management systems.

**[Live Demo Link - Optional]** *(Replace this line with the actual GitHub Pages URL once deployed, e.g., `[Live Demo](https://your-username.github.io/lattice-for-space/)`)*

## Features

*   **Real-time 3D Visualization:** Renders a 3D scene using Three.js with an Earth model, satellites, and threats.
*   **Scalable Agent Rendering:** Displays 1000-2000+ satellite agents efficiently using `THREE.InstancedMesh`.
*   **Autonomous Evasion Logic:** Satellites monitor nearby threats and perform simple evasive maneuvers (adjusting orbital radius) when a threat comes within a defined proximity.
*   **Clear Status Indication:** Satellites change color based on their status (Green: Nominal, Red: Evading). Threats are colored Yellow.
*   **Simple Orbital Mechanics:** Satellites follow circular orbits with randomized inclinations and altitudes within a simulated LEO band. Focus is on visualization and behavior, not high-fidelity physics.
*   **Interactive Controls:**
    *   Camera manipulation via OrbitControls (zoom, pan, rotate).
    *   Pause/Resume the simulation.
    *   Spawn new threats dynamically.
*   **Basic UI Panel:** Displays satellite/threat counts and agent status breakdown.
*   **Static Site:** Fully exportable as a static website, deployable on services like GitHub Pages or Vercel.

## Technology Stack

*   HTML5
*   CSS3
*   JavaScript (ES6 Modules)
*   [Three.js](https://threejs.org/) (r150+ or compatible with module imports)
*   [Three.js OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)

## Setup and Local Development

Because this project uses ES6 Modules (`import`/`export`), you cannot run `index.html` directly from your filesystem (`file:///...`) due to browser security restrictions (CORS policy). You **must** serve the files using a local web server.

**Prerequisites:**
*   A modern web browser (Chrome, Firefox, Safari, Edge)
*   Optional: Node.js/npm or Python for running a local server.

**Steps:**

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/<your-username>/lattice-for-space.git
    cd lattice-for-space
    ```

2.  **Start a Local Web Server:** Choose one of the following methods:

    *   **Using VS Code + Live Server Extension (Recommended):**
        *   Install the "Live Server" extension from the VS Code Marketplace.
        *   Right-click on `index.html` in the VS Code Explorer.
        *   Select "Open with Live Server".

    *   **Using Python:**
        *   Make sure you are in the project's root directory (`lattice-for-space`).
        *   If you have Python 3: `python -m http.server`
        *   If you have Python 2: `python -m SimpleHTTPServer`
        *   Open your browser to `http://localhost:8000`.

    *   **Using Node.js + `http-server`:**
        *   Install `http-server` globally (if you haven't already): `npm install -g http-server`
        *   Make sure you are in the project's root directory.
        *   Run: `http-server`
        *   Open your browser to the local address provided (e.g., `http://localhost:8080`).

3.  **Access the Simulation:** Open the localhost URL provided by your chosen server method in your web browser.

## Deployment (GitHub Pages)

This project is ready for deployment as a static site on GitHub Pages:

1.  **Push to GitHub:** Ensure all your code (`index.html`, `style.css`, `main.js`, `js/` folder, `assets/` folder) is pushed to your GitHub repository.
2.  **Enable GitHub Pages:**
    *   Go to your repository settings on GitHub.com.
    *   Navigate to the "Pages" section in the left sidebar.
    *   Under "Build and deployment", select "Deploy from a branch" as the source.
    *   Choose the branch containing your code (e.g., `main` or `master`).
    *   Select `/ (root)` as the folder.
    *   Click "Save".
3.  **Wait & View:** GitHub Actions will build and deploy your site. This may take a minute or two. Once complete, the Pages settings page will display the URL for your live simulation (e.g., `https://<your-username>.github.io/<repository-name>/`).

## Configuration

Key simulation parameters can be adjusted directly in the `main.js` file:

*   `NUM_SATELLITES`: Number of satellite agents to simulate.
*   `EARTH_RADIUS`: Base radius of the Earth sphere in simulation units.
*   `LEO_ALTITUDE_MIN`/`MAX`: Range above Earth's radius for satellite orbits.
*   `THREAT_DETECTION_RADIUS`: Distance at which satellites start evading.
*   `EVASION_MANEUVER_DISTANCE`: How much the orbital radius changes during evasion.
*   `ORBITAL_RETURN_LERP_FACTOR`: Smoothness factor for returning to nominal orbit.
*   Colors (`COLOR_NOMINAL`, `COLOR_EVADING`, `COLOR_THREAT`).

## Potential Future Enhancements

*   **Clickable Agents:** Select individual satellites to display their ID and status.
*   **dat.GUI Controls:** Add interactive controls for tuning parameters like speed, threat radius, etc.
*   **More Realistic Orbits:** Implement Keplerian elements for elliptical orbits instead of simple circles.
*   **Advanced Evasion:** Base maneuvers on relative velocity vectors, not just distance/radius.
*   **Orbit Trails:** Render visual trails behind satellites.
*   **Performance Optimizations:** Further spatial partitioning or Web Workers for collision detection if scaling beyond ~5k agents.
*   **Alternative Views:** Add buttons for preset camera angles (top-down, side-on).

## License

*(Consider the implications for your SBIR proposal. MIT is common for open prototypes, but you may need something more restrictive or specific depending on funding agency rules. Consult SBIR guidelines.)*

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

*   Built with the amazing [Three.js](https://threejs.org/) library.