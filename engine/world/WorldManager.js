import { SphereGeometry, MeshBasicMaterial, Mesh, BoxGeometry, Vector3 } from '../rendering/Renderer.js';
import { FloatingOrigin, Vector3D } from './FloatingOrigin.js';
import { Galaxy } from './Galaxy.js';
import { StarSystem } from './StarSystem.js';
import { Planet } from './Planet.js';
/**
 * World Manager handles hierarchical coordinates: galaxy → system → planet → chunks.
 * Supports floating origin and hierarchical coordinate conversion.
 * Includes scaffolding for a star system with placeholder meshes.
 */
export class WorldManager {
    constructor(scene) {
        // Hierarchical coordinate system
        this.galaxyOrigin = new Vector3D();
        this.currentSystemOrigin = new Vector3D();
        this.currentPlanetOrigin = new Vector3D();
        // World data structures
        this.galaxies = [];
        this.currentGalaxy = null;
        this.currentSystem = null;
        this.currentPlanet = null;
        // Placeholder meshes for scaffolding
        this.starMesh = null;
        this.planetMesh = null;
        this.scene = scene;
        this.floatingOrigin = new FloatingOrigin();
    }
    init() {
        console.log('Initializing World Manager...');
        // Create example galaxy and system for scaffolding
        this.createExampleWorld();
        // TODO: Implement world streaming
        // - Load/unload systems based on player position
        // - Hierarchical coordinate conversion
        // - Floating origin adjustments
    }
    update(dt) {
        // Update orbital mechanics for all celestial bodies
        this.updateOrbitalMechanics(dt);
        // Update floating origin if necessary
        // This would typically be called based on player movement
        // For now, we'll simulate some movement
        const delta = new Vector3D(0.1, 0, 0); // Example movement
        this.floatingOrigin.updatePlayerPosition(delta);
        // Reposition world objects if origin shifted
        if (this.floatingOrigin.getOriginOffset().length() > 0) {
            this.repositionWorldObjects();
        }
    }
    dispose() {
        // Clean up all world objects
        this.galaxies.forEach(galaxy => {
            galaxy.systems.forEach(system => {
                system.planets.forEach(planet => {
                    const mesh = planet.getMesh();
                    if (mesh)
                        this.scene.remove(mesh);
                    planet.moons.forEach(moon => {
                        if (moon.mesh)
                            this.scene.remove(moon.mesh);
                    });
                });
                if (system.star.mesh)
                    this.scene.remove(system.star.mesh);
            });
        });
        this.galaxies = [];
        console.log('World Manager disposed');
    }
    /**
     * Convert world coordinates to hierarchical coordinates.
     * @param worldPos World position vector.
     * @returns Hierarchical coordinates.
     */
    worldToHierarchical(worldPos) {
        // TODO: Implement proper hierarchical coordinate conversion
        // For now, return simplified coordinates
        return {
            galaxy: new Vector3D(worldPos.x / 1000000, worldPos.y / 1000000, worldPos.z / 1000000), // Scale down for galaxy level
            system: new Vector3D(worldPos.x / 10000, worldPos.y / 10000, worldPos.z / 10000), // Scale down for system level
            planet: worldPos.clone(), // Planet level coordinates
            chunk: new Vector3D(worldPos.x / 100, worldPos.y / 100, worldPos.z / 100) // Chunk level coordinates
        };
    }
    /**
     * Convert hierarchical coordinates to world coordinates.
     * @param coords Hierarchical coordinates.
     * @returns World position vector.
     */
    hierarchicalToWorld(coords) {
        // TODO: Implement proper hierarchical coordinate conversion
        // For now, return simplified world position
        return coords.planet.clone();
    }
    /**
     * Get the current player position in high precision.
     */
    getPlayerPosition() {
        return this.floatingOrigin.getPlayerPosition();
    }
    /**
     * Update player position and handle floating origin shifts.
     * @param delta Movement delta.
     */
    updatePlayerPosition(delta) {
        this.floatingOrigin.updatePlayerPosition(delta);
    }
    /**
     * Set the floating origin to a new position.
     * @param newOrigin New origin position.
     */
    setFloatingOrigin(newOrigin) {
        this.floatingOrigin.setPlayerPosition(newOrigin);
        this.repositionWorldObjects();
        console.log('Setting floating origin to:', newOrigin);
    }
    createExampleWorld() {
        // Create example planet
        const planet = new Planet('Earth', 100, 5000, 'terrestrial', 0.001);
        // Create example star system
        const starSystem = new StarSystem('Solar System', new Vector3(0, 0, 0), {
            name: 'Sun',
            radius: 1000,
            color: 0xffff00,
            mesh: null
        }, [planet]);
        // Create example galaxy
        const galaxy = new Galaxy('Milky Way', new Vector3D(0, 0, 0), [starSystem]);
        // Get meshes and add to scene
        const meshes = galaxy.getMeshes();
        meshes.forEach(mesh => {
            const localPos = this.floatingOrigin.worldToLocal(new Vector3D(mesh.position.x, mesh.position.y, mesh.position.z));
            mesh.position.copy(localPos);
            this.scene.add(mesh);
        });
        this.galaxies.push(galaxy);
        this.currentGalaxy = galaxy;
        this.currentSystem = starSystem;
        this.currentPlanet = planet;
        console.log('Example world created with star system scaffolding');
    }
    updateOrbitalMechanics(dt) {
        // Update all celestial bodies
        this.galaxies.forEach(galaxy => galaxy.update(dt));
    }
    repositionWorldObjects() {
        // Reposition all world objects relative to new origin
        this.galaxies.forEach(galaxy => {
            galaxy.systems.forEach(system => {
                if (system.star.mesh) {
                    const localPos = this.floatingOrigin.worldToLocal(new Vector3D(system.position.x, system.position.y, system.position.z));
                    system.star.mesh.position.copy(localPos);
                }
                system.planets.forEach(planet => {
                    const mesh = planet.getMesh();
                    if (mesh) {
                        const planetWorldPos = new Vector3D(planet.distance, 0, 0); // Simplified
                        const localPos = this.floatingOrigin.worldToLocal(planetWorldPos);
                        mesh.position.copy(localPos);
                    }
                });
            });
        });
    }
    /**
     * Get all star systems in the world.
     */
    getAllSystems() {
        const systems = [];
        this.galaxies.forEach(galaxy => {
            systems.push(...galaxy.systems);
        });
        return systems;
    }
    /**
     * Get all planets in the world.
     */
    getAllPlanets() {
        const planets = [];
        this.galaxies.forEach(galaxy => {
            galaxy.systems.forEach(system => {
                planets.push(...system.planets);
            });
        });
        return planets;
    }
    /**
     * Activate a star system at the specified LOD level.
     */
    activateSystem(systemName, lod) {
        const system = this.findSystemByName(systemName);
        if (!system)
            return;
        // Create star mesh if needed
        if (!system.star.mesh) {
            const geometry = new SphereGeometry(system.star.radius, 32, 32);
            const material = new MeshBasicMaterial({ color: system.star.color });
            system.star.mesh = new Mesh(geometry, material);
            system.star.mesh.position.set(system.position.x, system.position.y, system.position.z);
            this.scene.add(system.star.mesh);
        }
        // Create planet meshes for this system
        system.planets.forEach(planet => {
            if (!planet.getMesh()) {
                planet.createMesh();
                const mesh = planet.getMesh();
                if (mesh) {
                    const localPos = this.floatingOrigin.worldToLocal(new Vector3D(planet.distance, 0, 0));
                    mesh.position.copy(localPos);
                    this.scene.add(mesh);
                }
            }
        });
        console.log(`Activated system: ${systemName} at LOD ${lod}`);
    }
    /**
     * Update LOD for a star system.
     */
    updateSystemLOD(systemName, lod) {
        // For now, just log - LOD changes would require mesh recreation
        console.log(`Updated system LOD: ${systemName} to ${lod}`);
    }
    /**
     * Deactivate a star system.
     */
    deactivateSystem(systemName) {
        const system = this.findSystemByName(systemName);
        if (!system)
            return;
        // Remove star mesh
        if (system.star.mesh) {
            this.scene.remove(system.star.mesh);
            system.star.mesh = null;
        }
        // Remove planet meshes
        system.planets.forEach(planet => {
            const mesh = planet.getMesh();
            if (mesh) {
                this.scene.remove(mesh);
                planet.setMesh(null);
            }
        });
        console.log(`Deactivated system: ${systemName}`);
    }
    /**
     * Activate a planet at the specified LOD level.
     */
    activatePlanet(planetName, lod) {
        const planet = this.findPlanetByName(planetName);
        if (!planet)
            return;
        if (!planet.getMesh()) {
            planet.createMesh();
            const mesh = planet.getMesh();
            if (mesh) {
                const localPos = this.floatingOrigin.worldToLocal(new Vector3D(planet.distance, 0, 0));
                mesh.position.copy(localPos);
                this.scene.add(mesh);
            }
        }
        console.log(`Activated planet: ${planetName} at LOD ${lod}`);
    }
    /**
     * Update LOD for a planet.
     */
    updatePlanetLOD(planetName, lod) {
        const planet = this.findPlanetByName(planetName);
        if (!planet)
            return;
        // Recreate mesh at new LOD
        const mesh = planet.getMesh();
        if (mesh) {
            this.scene.remove(mesh);
        }
        planet.createMesh();
        const newMesh = planet.getMesh();
        if (newMesh) {
            const localPos = this.floatingOrigin.worldToLocal(new Vector3D(planet.distance, 0, 0));
            newMesh.position.copy(localPos);
            this.scene.add(newMesh);
        }
        console.log(`Updated planet LOD: ${planetName} to ${lod}`);
    }
    /**
     * Deactivate a planet.
     */
    deactivatePlanet(planetName) {
        const planet = this.findPlanetByName(planetName);
        if (!planet)
            return;
        const mesh = planet.getMesh();
        if (mesh) {
            this.scene.remove(mesh);
            planet.setMesh(null);
        }
        console.log(`Deactivated planet: ${planetName}`);
    }
    /**
     * Activate a chunk (placeholder) at the specified LOD level.
     */
    activateChunk(chunkKey, lod) {
        // For now, create a simple cube placeholder
        const geometry = new BoxGeometry(100, 100, 100);
        const material = new MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        const mesh = new Mesh(geometry, material);
        // Parse chunk position from key (simplified)
        const parts = chunkKey.split('_');
        if (parts.length >= 5) {
            const x = parseInt(parts[2]) * 1000;
            const y = parseInt(parts[3]) * 1000;
            const z = parseInt(parts[4]) * 1000;
            const localPos = this.floatingOrigin.worldToLocal(new Vector3D(x, y, z));
            mesh.position.set(localPos.x, localPos.y, localPos.z);
        }
        this.scene.add(mesh);
        console.log(`Activated chunk: ${chunkKey} at LOD ${lod}`);
    }
    /**
     * Update LOD for a chunk.
     */
    updateChunkLOD(chunkKey, lod) {
        // For now, just log - would need to track chunks to update them
        console.log(`Updated chunk LOD: ${chunkKey} to ${lod}`);
    }
    /**
     * Deactivate a chunk.
     */
    deactivateChunk(chunkKey) {
        // For now, just log - would need to track chunks to remove them
        console.log(`Deactivated chunk: ${chunkKey}`);
    }
    findSystemByName(name) {
        for (const galaxy of this.galaxies) {
            const system = galaxy.systems.find(s => s.name === name);
            if (system)
                return system;
        }
        return null;
    }
    findPlanetByName(name) {
        for (const galaxy of this.galaxies) {
            for (const system of galaxy.systems) {
                const planet = system.planets.find(p => p.name === name);
                if (planet)
                    return planet;
            }
        }
        return null;
    }
}
//# sourceMappingURL=WorldManager.js.map