# 🌌 Echoes of Arkanis

**Echoes of Arkanis** è un ambizioso gioco di esplorazione spaziale open-universe sviluppato per il web, costruito su un **motore custom basato su Three.js**.  
Vivi un viaggio epico attraverso galassie immense, pianeti esplorabili in prima persona e combattimenti spaziali senza interruzioni.  

**Echoes of Arkanis** is an ambitious open-universe space exploration game for the web, built on a **custom Three.js engine**.  
Embark on an epic journey through massive galaxies, fully explorable planets, and seamless space combat.  

---

## 🚀 Visione del Gioco / Game Vision

L’obiettivo è creare un universo enorme e persistente in cui i giocatori possano:

- Esplorare sistemi stellari sconosciuti
- Scoprire pianeti e rovine di antiche civiltà
- Passare senza soluzione di continuità tra volo spaziale, orbitale e esplorazione planetaria
- Godere di un’esperienza realistica e immersiva 🌟

The goal is to build a huge persistent universe where players can:

- Explore unknown star systems
- Discover planets and ancient ruins
- Seamlessly switch between spaceflight, orbital navigation, and planetary exploration
- Enjoy a realistic and immersive experience 🌟

---

## 🛠 Pilastri di Gameplay / Gameplay Pillars

### ✨ Viaggio Interstellare / Interstellar Travel
- Pilota la tua nave attraverso galassie e sistemi stellari
- Warp e iperguida per distanze incredibili
- Stream dinamico dei sistemi stellari basato su posizione e velocità

- Pilot your ship across galaxies and star systems
- Warp and hyperdrive for incredible distances
- Dynamic streaming of star systems based on position and velocity

### 🌍 Esplorazione Planetaria / Planetary Exploration
- Pianeti enormi (centinaia di km di diametro)
- Terreno generato proceduralmente con chunk streaming
- Esplorazione completa in prima persona 🏞
- Possibilità di camminare, scalare e interagire con il mondo

- Huge planets (hundreds of km in diameter)
- Procedurally generated terrain with chunk streaming
- Full first-person exploration 🏞
- Walk, climb, and interact with the world

### 🔄 Transizioni Fluide / Seamless Transitions
- Passaggio seamless tra FPS, pilotaggio spaziale, orbita e warp
- Nessun caricamento visibile
- LOD avanzato con: hysteresis, dual-LOD blending, geomorphing, dithered transitions

- Seamless switching between FPS, spaceship, orbit, and warp
- No visible loading
- Advanced LOD: hysteresis, dual-LOD blending, geomorphing, dithered transitions

### ⚙️ Fisica Realistica / Realistic Physics
- Movimento inerziale senza drag
- Accelerazione illimitata
- Rotazioni indipendenti
- Simulazione spaziale realistica 🚀

- Inertial movement without drag
- Unlimited acceleration
- Independent rotations
- Realistic space simulation 🚀

### 🌌 Mondo su Scala Galattica / Galaxy-Scale World
- Coordinate gerarchiche: Galaxy → Star System → Celestial Body → Planetary Chunks
- Floating origin e precision rebasing
- Oggetti lontani renderizzati come punti o triangoli

- Hierarchical coordinates: Galaxy → Star System → Celestial Body → Planetary Chunks
- Floating origin and precision rebasing
- Distant objects rendered as points or triangles

### 🎯 Missioni e Fazioni / Missions & Factions
- Missioni planetarie e spaziali
- Trasporti, combattimenti ed esplorazione
- Reputazione, accesso e influenza politica/economica sui sistemi stellari

- Planetary and space missions
- Transport, combat, and exploration
- Reputation, access control, and influence over star systems

---

## 🪐 Sistema dei Pianeti / Planet System

- Pianeti abitabili, ostili, economici o disabitati
- Curvatura impercettibile durante il gameplay
- Chunk di terreno caricati solo attorno al giocatore
- Punti di interesse: città, outpost, rovine, stazioni spaziali 🏙️
- Esplorazione completa richiede 100+ ore

- Habitable, hostile, economic, or uninhabited planets
- Imperceptible curvature during gameplay
- Terrain chunks loaded only around the player
- Points of interest: cities, outposts, ruins, space stations 🏙️
- Full exploration takes 100+ hours

---

## 🎨 Rendering e Visuals / Rendering & Visuals

- Realistico e grounded, mai cartoonish
- Space rendering avanzato:
  - Stelle e nebulose ✨
  - Glow planetario
  - Atmospheric scattering
- Fidelity scalabile per performance stabili
- LOD e stream ottimizzati per scale galattica

- Realistic and grounded, never cartoonish
- Advanced space rendering:
  - Stars and nebulae ✨
  - Planetary glow
  - Atmospheric scattering
- Scalable fidelity for stable performance
- LOD and streaming optimized for galaxy-scale

---

## 💻 Stack Tecnologico / Tech Stack

- **Linguaggio / Language:** JavaScript ES6+
- **Rendering:** Three.js / WebGL
- **UI / HUD:** CSS3 e HTML5
- **Motore / Engine:** Custom, modulare, editor-independent

---

## 🛠 Stato dello Sviluppo / Development Status

Attualmente in fase di sviluppo iniziale / Currently in early development:

1. Fisica della nave spaziale / Spaceship physics
2. Rendering procedurale dei pianeti / Procedural planet rendering
3. Autopilota e docking / Autopilot and docking
4. Cockpit immersivo con HUD e radar / Immersive cockpit with HUD & radar
5. Atmosfera, volo e rientro planetario / Atmosphere, flight & planetary reentry
6. Atterraggio ed esplorazione in FPS / Landing & FPS exploration
7. Combattimento e missioni / Combat & missions
8. Streaming e multi-sistemi stellari / Streaming & multi-star systems
9. Warp e iperguida / Warp & hyperdrive

---

## 📦 Come Avviare / How to Run

```bash
git clone https://github.com/Boschi404/Echoes-of-Arkanis.git
