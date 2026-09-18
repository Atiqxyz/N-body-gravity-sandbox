
N-Body Astrophysical Workstation (SYS-ID: 884-OMEGA v4.0)
A high-performance, interactive 2D N-Body gravitational sandbox built with HTML5 Canvas and Vanilla JavaScript. Simulate complex orbital mechanics, cosmic collisions, relativistic phenomena, and spacetime distortions right in your browser.
Key Features:
 * Advanced Gravitational Physics: Real-time N-body interactions featuring gravitational softening to prevent singularity blowups and wrapped screen boundaries.
 * Dynamic Celestial Classification: Celestial bodies dynamically evolve and classify based on their total mass:
   * Planets & Gas Giants: Rocky worlds, gas giants, and brown dwarfs.
   * Stars: Red dwarfs, yellow stars, and massive blue giants complete with luminous radiation glows and cometary dust tails.
   * Exotic Objects: Neutron stars equipped with sweeping pulsar radiation beams and Black Holes that naturally decay via Hawking radiation.
 * Spacetime Grid & Relativistic Lensing: A dynamic background grid that warps around high-mass bodies, coupled with visual gravitational lensing that bends background starlight around black holes.
 * Accretion Disks & Roche Limits: Smaller bodies passing too close to massive bodies undergo tidal disruption (Roche limit) to form planetary rings or feed black hole accretion disks.
 * Interactive Vector Launch: Click and drag anywhere on the canvas to launch custom-mass bodies with velocity vectors. The trajectory line intelligently turns green when your launch speed matches optimal stable circular orbit parameters relative to nearby celestial anchors.
 * Cosmic Events: Dynamic supernova visual flashes triggered when celestial bodies cross mass thresholds into black holes.
Project Structure:
Modular setup with separated concerns:
 * index.html: UI controls, canvas overlay, and telemetry layout
 * style.css: Sci-fi inspired artistic theme with teal/caramel contrasts & glassmorphism
 * script.js: Core physics engine, rendering loops, and particle systems
Controls & Usage:
 * Inject Custom Body: Adjust the mass slider/input field, click INJECT BODY, then click and drag on the canvas to aim and set your launch velocity. (Watch for the trajectory indicator to turn green for stable orbits!)
 * Dark Matter: Click DARK MATTER to spawn invisible gravitational anchors that warp spacetime and pull normal bodies without direct collisions.
 * Binary System: Click BINARY to instantly wipe the board and setup a balanced dual-star orbit.
 * Simulation Control: Use PAUSE to freeze time and analyze mechanics, or RESET to restart the default single-star system.

