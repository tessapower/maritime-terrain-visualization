# Maritime Terrain Visualization

[![Deploy to GH Pages](https://github.com/tessapower/maritime-terrain-visualization/actions/workflows/deploy.yml/badge.svg)](https://github.com/tessapower/maritime-terrain-visualization/actions/workflows/deploy.yml)

A WebGL terrain and ocean renderer with custom GLSL shaders. Procedurally generates archipelago-style islands with
flowing water and dynamic lighting.

![Terrain Demo](docs/images/slow-orbit.gif)

---

## What's Inside

- **Procedural Terrain**: Ridged multifractal noise creates realistic island formations with dramatic coastlines
- **Live Controls**: Tweak terrain and water parameters in real-time via GUI

![Controls Demo](docs/images/terrain-controls.gif)

- **Custom Water Shader**: Flowing, translucent water with dynamic lighting and soft shadows

![Water Shader](docs/images/water-flow.gif)

- **Orbital Camera**: a smooth orbital camera that peruses the terrain.

### Tech Stack

- [Three.js](https://threejs.org/): 3D rendering
- [GLSL](https://en.wikipedia.org/wiki/OpenGL_Shading_Language): Custom vertex and fragment shaders
- [React](https://react.dev/): Performant modern UI components
- [Vite](https://vite.dev/): Build tooling to enable hot reloading
- [lil-gui](https://lil-gui.georgealways.com/): GUI controls to tweak parameters in real-time

Deployed with GitHub Pages, which you can see live
here: [https://tessapower.xyz/maritime-terrain-visualization/](https://tessapower.xyz/maritime-terrain-visualization/)

---

## Project Structure

```
maritime-terrain-visualization/
├── src/
│   ├── components/
│   │   ├── Scene.tsx              # Main 3D scene component
│   │   └── gui/
│   │       └── Console.tsx        # Console for logging
│   ├── shaders/
│   │   ├── topo/
│   │   │   ├── topo.vs.glsl       # Terrain vertex shader
│   │   │   └── topo.fs.glsl       # Terrain fragment shader
│   │   └── water/
│   │       ├── water.vs.glsl      # Water vertex shader
│   │       └── water.fs.glsl      # Water fragment shader w/ fBm & domain warping
│   ├── three/
│   │   ├── SceneManager.ts        # Manages Three.js scene, renderer, lighting
│   │   ├── camera/
│   │   │   └── OrbitalCamera.ts   # Custom orbital camera implementation
│   │   ├── terrain/
│   │   │   ├── Terrain.ts         # Terrain mesh & material setup
│   │   │   └── TerrainGenerator.ts # Procedural height generation (Voronoi, Perlin, domain warping)
│   │   ├── water/
│   │   │   ├── Water.ts           # Water mesh with custom shader
│   │   │   └── ShadowPlane.ts     # Underwater shadow projection
│   │   ├── gui/
│   │   │   ├── GuiManager.ts      # lil-gui setup & management
│   │   │   ├── TerrainControls.ts # Real-time terrain parameter controls
│   │   │   └── CameraControls.ts  # Camera position/rotation controls
│   │   └── utils/
│   │       ├── Math.ts            # Easing functions, distance calculations
│   │       ├── Logger.ts          # Debug logging utility
│   │       └── Jargon.ts          # Technical terminology helpers
│   ├── App.tsx                    # Root React component
│   └── main.tsx                   # Application entry point
├── docs/images/progress/          # Development screenshots & GIFs
├── index.html                     # HTML entry point
├── vite.config.ts                 # Vite build configuration
└── package.json                   # Dependencies & scripts
```

---

## Running Locally

```sh
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

Build for production:

```sh
npm run build
```

---

## Attributions

This project was built using techniques and resources from the following:

**Terrain Generation**

- [Inigo Quilez - Cellular/Voronoi Noise](https://iquilezles.org/articles/cellularffx/) — Voronoi distance functions for
  island shapes
- [Red Blob Games - Terrain from Noise](https://www.redblobgames.com/maps/terrain-from-noise/) — Ridged noise and
  terrain generation techniques
- [Red Blob Games - Introduction to Noise](https://www.redblobgames.com/articles/noise/introduction.html) — Noise
  fundamentals
- [Inigo Quilez - Domain Warping](https://iquilezles.org/articles/warp/) — Domain warping for organic terrain features
- [The Book of Shaders - Noise](https://thebookofshaders.com/11/) — GLSL noise implementation patterns
- [Paul Bourke - Perlin Noise](https://paulbourke.net/fractals/noise/) — Perlin noise theory

**Water Shader**

- [Inigo Quilez - Fractional Brownian Motion](https://iquilezles.org/articles/fbm/) — fBm for water surface variation
- [Inigo Quilez - Domain Warping](https://iquilezles.org/articles/warp/) — Domain warping for flowing water effects
- [The Book of Shaders - Noise](https://thebookofshaders.com/11/) — Simplex noise in GLSL
- [The Book of Shaders - Fractional Brownian Motion](https://thebookofshaders.com/13/) — fBm implementation

**Animation & Easing**

- [Easings.net](https://easings.net/#easeInOutSine) — Easing functions for smooth camera transitions

---

👀 Check out <a href="docs/images/progress">docs/images/progress</a> for development snapshots!
