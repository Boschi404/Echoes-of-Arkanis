# 🌌 Echoes of Arkanis

**Echoes of Arkanis** is an ambitious open-universe space exploration game for the web, built on a **custom Three.js engine**.  
Embark on an epic journey through massive galaxies, fully explorable planets, and seamless space combat.  

---

### 🚀 Game Vision

The goal is to build a huge persistent universe where players can:

- Explore unknown star systems
- Discover planets and ancient ruins
- Seamlessly switch between spaceflight, orbital navigation, and planetary exploration
- Enjoy a realistic and immersive experience 🌟

---

### 🛠 Gameplay Pillars

#### ✨ Interstellar Travel
- Pilot your ship across galaxies and star systems
- Warp and hyperdrive for incredible distances
- Dynamic streaming of star systems based on position and velocity

#### 🌍 Planetary Exploration
- Huge planets (hundreds of km in diameter)
- Procedurally generated terrain with chunk streaming
- Full first-person exploration 🏞
- Walk, climb, and interact with the world

#### 🔄 Seamless Transitions
- Seamless switching between FPS, spaceship, orbit, and warp
- No visible loading
- Advanced LOD: hysteresis, dual-LOD blending, geomorphing, dithered transitions

#### ⚙️ Realistic Physics
- Inertial movement without drag
- Unlimited acceleration
- Independent rotations
- Realistic space simulation 🚀

#### 🌌 Galaxy-Scale World
- Hierarchical coordinates: Galaxy → Star System → Celestial Body → Planetary Chunks
- Floating origin and precision rebasing
- Distant objects rendered as points or triangles

#### 🎯 Missions & Factions
- Planetary and space missions
- Transport, combat, and exploration
- Reputation, access control, and influence over star systems

---

### 🪐 Planet System

- Habitable, hostile, economic, or uninhabited planets
- Imperceptible curvature during gameplay
- Terrain chunks loaded only around the player
- Points of interest: cities, outposts, ruins, space stations 🏙️
- Full exploration takes 100+ hours

---

### 🎨 Rendering & Visuals

- Realistic and grounded, never cartoonish
- Advanced space rendering:
  - Stars and nebulae ✨
  - Planetary glow
  - Atmospheric scattering
- Scalable fidelity for stable performance
- LOD and streaming optimized for galaxy-scale

---

### 💻 Tech Stack

- **Language:** JavaScript ES6+
- **Rendering:** Three.js / WebGL
- **UI / HUD:** CSS3 and HTML5
- **Engine:** Custom, modular, editor-independent

---

### 🛠 Development Status

Currently in early development:

1. Spaceship physics
2. Procedural planet rendering
3. Autopilot and docking
4. Immersive cockpit with HUD & radar
5. Atmosphere, flight & planetary reentry
6. Landing & FPS exploration
7. Combat & missions
8. Streaming & multi-star systems
9. Warp & hyperdrive

---

### 📦 How to Run

```bash
git clone https://github.com/Boschi404/Echoes-of-Arkanis.git
