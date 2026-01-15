import type { SceneType, Vector3Type } from '../rendering/Renderer';
// import { FloatingOrigin, Vector3D } from '../rendering/FloatingOrigin';
import { SphereGeometry, MeshBasicMaterial, Mesh, Vector3, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, MeshStandardMaterial, CanvasTexture, RepeatWrapping, Color } from 'three';
import type { IModule } from '../core/Module';
import { LODLevel } from '../modules/LODManager';
import { Galaxy } from './Galaxy';
import { StarSystem } from './StarSystem';
import type { Star } from './StarSystem';
import { Planet } from './Planet';
import type { Moon } from './Planet';
import { Vector3D } from './FloatingOrigin';

/**
 * World Manager handles hierarchical coordinates: galaxy → system → planet → chunks.
 * Supports floating origin and hierarchical coordinate conversion.
 * Includes scaffolding for a star system with placeholder meshes.
 */
export class WorldManager implements IModule {
    public scene: SceneType;
    private _time: number = 0;

    // Hierarchical coordinate system
    // @ts-ignore
    private _galaxyOrigin: Vector3Type = new Vector3();
    // @ts-ignore
    private _currentSystemOrigin: Vector3Type = new Vector3();
    // @ts-ignore
    private _currentPlanetOrigin: Vector3Type = new Vector3();

    // World data structures
    private galaxies: Galaxy[] = [];
    private currentGalaxy: Galaxy | null = null;
    private currentSystem: StarSystem | null = null;
    // @ts-ignore
    private currentPlanet: Planet | null = null;

    // Placeholder meshes for scaffolding
    // private starMesh: MeshType | null = null;
    // private planetMesh: MeshType | null = null;

    constructor(scene: SceneType) {
        this.scene = scene;
    }

    init(): void {
        console.log('Initializing World Manager...');

        // Create example galaxy and system for scaffolding
        this.createExampleWorld();

        // TODO: Implement world streaming
        // - Load/unload systems based on player position
        // - Hierarchical coordinate conversion
        // - Floating origin adjustments
    }

    update(dt: number): void {
        // Update orbital mechanics for all celestial bodies
        this.updateOrbitalMechanics(dt);

        // TODO: Implement floating origin adjustments
        // - Adjust world positions when player moves far from origin
        // - Update coordinate systems accordingly
    }

    dispose(): void {
        // Clean up all world objects
        this.galaxies.forEach(galaxy => {
            galaxy.systems.forEach(system => {
                system.planets.forEach(planet => {
                    const mesh = planet.getMesh();
                    if (mesh) this.scene.remove(mesh);
                    planet.moons.forEach((moon: Moon) => {
                        if (moon.mesh) this.scene.remove(moon.mesh);
                    });
                });
                if (system.star.mesh) this.scene.remove(system.star.mesh);
            });
        });

        this.galaxies = [];
        console.log('World Manager disposed');
    }

    // --- Accessor Methods ---

    getAllSystems(): StarSystem[] {
        if (!this.currentGalaxy) return [];
        return this.currentGalaxy.systems;
    }

    getAllPlanets(): Planet[] {
        if (!this.currentSystem) return [];
        return this.currentSystem.planets;
    }

    // --- System Management ---

    activateSystem(systemName: string, lod: LODLevel): void {
        const system = this.getAllSystems().find(s => s.name === systemName);
        if (!system) return;

        console.log(`Activating system: ${systemName} at LOD ${lod}`);
        // TODO: Load system resources, meshes, etc.
        if (system.star.mesh) {
            this.scene.add(system.star.mesh);
            console.log(`Added star mesh for ${system.name} to scene`);
        } else {
            console.warn(`System ${system.name} has no star mesh!`);
        }
    }

    updateSystemLOD(systemName: string, lod: LODLevel): void {
        console.log(`Updating system LOD: ${systemName} to ${lod}`);
        // TODO: Adjust system detail based on LOD
    }

    deactivateSystem(systemName: string): void {
        const system = this.getAllSystems().find(s => s.name === systemName);
        if (!system) return;

        console.log(`Deactivating system: ${systemName}`);
        if (system.star.mesh) this.scene.remove(system.star.mesh);
    }

    // --- Planet Management ---

    activatePlanet(planetName: string, lod: LODLevel): void {
        const planet = this.getAllPlanets().find(p => p.name === planetName);
        if (!planet) return;

        console.log(`Activating planet: ${planetName} at LOD ${lod}`);
        const mesh = planet.getMesh();
        if (mesh) {
            this.scene.add(mesh);
            console.log(`Added planet mesh for ${planet.name} to scene`);
        } else {
            console.warn(`Planet ${planet.name} has no mesh!`);
        }
    }

    updatePlanetLOD(planetName: string, lod: LODLevel): void {
        console.log(`Updating planet LOD: ${planetName} to ${lod}`);
        // TODO: Switch planet mesh/textures based on LOD
    }

    deactivatePlanet(planetName: string): void {
        const planet = this.getAllPlanets().find(p => p.name === planetName);
        if (!planet) return;

        console.log(`Deactivating planet: ${planetName}`);
        const mesh = planet.getMesh();
        if (mesh) this.scene.remove(mesh);
    }

    // --- Chunk Management ---

    activateChunk(chunkKey: string, lod: LODLevel): void {
        console.log(`Activating chunk: ${chunkKey} at LOD ${lod}`);
        // TODO: Create/Load chunk mesh
    }

    updateChunkLOD(_chunkKey: string, _lod: LODLevel): void {
        // console.log(`Updating chunk LOD: ${chunkKey} to ${lod}`);
        // TODO: Update chunk detail
    }

    deactivateChunk(chunkKey: string): void {
        console.log(`Deactivating chunk: ${chunkKey}`);
        // TODO: Remove chunk mesh
    }

    /**
     * Convert world coordinates to hierarchical coordinates.
     * @param worldPos World position vector.
     * @returns Hierarchical coordinates.
     */
    worldToHierarchical(worldPos: Vector3Type): HierarchicalCoords {
        // TODO: Implement proper hierarchical coordinate conversion
        // For now, return simplified coordinates
        return {
            galaxy: worldPos.clone().divideScalar(1000000), // Scale down for galaxy level
            system: worldPos.clone().divideScalar(10000),   // Scale down for system level
            planet: worldPos.clone(),                        // Planet level coordinates
            chunk: worldPos.clone().divideScalar(100)       // Chunk level coordinates
        };
    }

    /**
     * Convert hierarchical coordinates to world coordinates.
     * @param coords Hierarchical coordinates.
     * @returns World position vector.
     */
    hierarchicalToWorld(coords: HierarchicalCoords): Vector3Type {
        // TODO: Implement proper hierarchical coordinate conversion
        // For now, return simplified world position
        return coords.planet.clone();
    }

    /**
     * Set the floating origin to a new position.
     * @param newOrigin New origin position.
     */
    setFloatingOrigin(newOrigin: Vector3Type): void {
        // TODO: Implement floating origin
        // - Move all world objects relative to new origin
        // - Update coordinate systems
        // - Prevent precision issues at large distances

        console.log('Setting floating origin to:', newOrigin);
    }

    private createExampleWorld(): void {
        const galaxy = new Galaxy('Milky Way', new Vector3D(0, 0, 0));

        // Create Star
        const star: Star = {
            name: 'Sun',
            radius: 1000,
            color: 0xffff00,
            mesh: null
        };

        // Create System
        const starSystem = new StarSystem(
            'Solar System',
            new Vector3(0, 0, 0),
            star
        );

        const starGeometry = new SphereGeometry(star.radius, 64, 64);
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = 1024;
        colorCanvas.height = 512;
        const colorCtx = colorCanvas.getContext('2d')!;
        const colorImg = colorCtx.createImageData(colorCanvas.width, colorCanvas.height);
        for (let y = 0; y < colorCanvas.height; y++) {
            for (let x = 0; x < colorCanvas.width; x++) {
                const i = (y * colorCanvas.width + x) * 4;
                colorImg.data[i] = 255;
                colorImg.data[i + 1] = 170;
                colorImg.data[i + 2] = 0;
                colorImg.data[i + 3] = 255;
            }
        }
        colorCtx.putImageData(colorImg, 0, 0);
        const starColorTex = new CanvasTexture(colorCanvas);
        starColorTex.wrapS = RepeatWrapping;
        starColorTex.wrapT = RepeatWrapping;
        const heightCanvas = document.createElement('canvas');
        heightCanvas.width = 1024;
        heightCanvas.height = 512;
        const heightCtx = heightCanvas.getContext('2d')!;
        const heightImg = heightCtx.createImageData(heightCanvas.width, heightCanvas.height);
        for (let y = 0; y < heightCanvas.height; y++) {
            for (let x = 0; x < heightCanvas.width; x++) {
                const i = (y * heightCanvas.width + x) * 4;
                const v = Math.floor(200 + 55 * Math.sin((x + y) * 0.02));
                heightImg.data[i] = v;
                heightImg.data[i + 1] = v;
                heightImg.data[i + 2] = v;
                heightImg.data[i + 3] = 255;
            }
        }
        heightCtx.putImageData(heightImg, 0, 0);
        const starHeightTex = new CanvasTexture(heightCanvas);
        starHeightTex.wrapS = RepeatWrapping;
        starHeightTex.wrapT = RepeatWrapping;
        const starMaterial = new MeshStandardMaterial({
            color: new Color(star.color),
            emissive: new Color(0xffa000),
            emissiveIntensity: 1.5,
            map: starColorTex,
            emissiveMap: starColorTex,
            displacementMap: starHeightTex,
            displacementScale: star.radius * 0.15,
            roughness: 0.6,
            metalness: 0.0
        });
        star.mesh = new Mesh(starGeometry, starMaterial);
        star.mesh.position.copy(starSystem.position);
        star.mesh.userData = { colorTex: starColorTex, heightTex: starHeightTex };

        // Create Planet
        const planet = new Planet(
            'Earth',
            100,
            5000,
            'terrestrial',
            0.001
        );
        planet.createMesh();
        const mesh = planet.getMesh();
        if (mesh) {
            // this.planetMesh = mesh;
            // NOTE: We don't add to scene here, StreamingManager will handle it
            // but we ensure the mesh is created
            // Debug: force add for visibility check
            // this.scene.add(mesh); 
            mesh.userData.orbitCenter = starSystem.position.clone();
            const ang = Math.atan2(mesh.position.z - starSystem.position.z, mesh.position.x - starSystem.position.x);
            mesh.userData.orbitAngle = ang;
            mesh.userData.system = starSystem.name;
        }

        starSystem.planets.push(planet);

        // Generate 10 random planets
        const planetCount = 10;
        const planetTypes = ['terrestrial', 'gas giant', 'ice giant', 'dwarf'];
        
        for (let i = 0; i < planetCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 3000 + Math.random() * 47000; // 3000 to 50000
            const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];
            
            // Radius depends on type
            let radius = 50 + Math.random() * 100;
            if (type === 'gas giant') radius = 300 + Math.random() * 500;
            if (type === 'ice giant') radius = 200 + Math.random() * 200;
            if (type === 'dwarf') radius = 30 + Math.random() * 50;

            const speed = 0.0001 + Math.random() * 0.005;
            const name = `Planet-${Math.floor(Math.random() * 1000)}-${String.fromCharCode(65 + i)}`;
            const color = Math.floor(Math.random() * 0xffffff);

            const p = new Planet(name, radius, dist, type, speed);
            
            // Random position on orbit
            p.position.set(
                Math.cos(angle) * dist,
                (Math.random() - 0.5) * 500, // Slight vertical variation
                Math.sin(angle) * dist
            );

            p.createMesh();
            const pMesh = p.getMesh();
            if (pMesh && pMesh instanceof Mesh) {
                (pMesh.material as MeshBasicMaterial).color.setHex(color);
                pMesh.userData.orbitCenter = starSystem.position.clone();
                const pang = Math.atan2(pMesh.position.z - starSystem.position.z, pMesh.position.x - starSystem.position.x);
                pMesh.userData.orbitAngle = pang;
                pMesh.userData.system = starSystem.name;
            }
            starSystem.planets.push(p);
        }

        galaxy.systems.push(starSystem);
        this.galaxies.push(galaxy);

        this.currentGalaxy = galaxy;
        this.currentSystem = starSystem;
        this.currentPlanet = planet;

        const starCount = 6000;
        const positions = new Float32Array(starCount * 3);
        const radius = 200000;
        for (let i = 0; i < starCount; i++) {
            const r = radius * Math.pow(Math.random(), 0.5);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        const starGeom = new BufferGeometry();
        starGeom.setAttribute('position', new Float32BufferAttribute(positions, 3));
        const starMat = new PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: false });
        const stars = new Points(starGeom, starMat);
        this.scene.add(stars);

        console.log('Example world created with star system scaffolding');
    }

    private updateOrbitalMechanics(dt: number): void {
        this._time += dt;
        this.galaxies.forEach(galaxy => {
            galaxy.systems.forEach(system => {
                const starMesh = system.star.mesh;
                if (starMesh && starMesh.material && (starMesh.material as MeshStandardMaterial).emissive) {
                    const mat = starMesh.material as MeshStandardMaterial;
                    mat.emissiveIntensity = 1.2 + 0.6 * Math.sin(this._time * 0.1);
                    const user = starMesh.userData;
                    if (user && user.colorTex && user.heightTex) {
                        user.colorTex.offset.x = (user.colorTex.offset.x + 0.0005) % 1;
                        user.heightTex.offset.x = (user.heightTex.offset.x + 0.0007) % 1;
                        user.colorTex.needsUpdate = true;
                        user.heightTex.needsUpdate = true;
                    }
                }
                system.planets.forEach(planet => {
                    const mesh = planet.getMesh();
                    if (mesh) {
                        const center = mesh.userData.orbitCenter || system.position;
                        const base = planet.distance;
                        const sizeFactor = Math.max(1, planet.radius / 100);
                        const omega = planet.speed * (1 / Math.sqrt(base)) * (1 / sizeFactor) * 500;
                        const ang = (mesh.userData.orbitAngle || 0) + omega * dt;
                        mesh.userData.orbitAngle = ang;
                        mesh.position.set(
                            center.x + Math.cos(ang) * base,
                            (mesh.position.y > center.y ? 1 : -1) * Math.abs(mesh.position.y - center.y),
                            center.z + Math.sin(ang) * base
                        );
                        planet.position.copy(mesh.position);
                    }
                });
            });
        });
    }

    // TODO: Implement chunk-based planet terrain
    // - Load/unload terrain chunks based on player position
    // - LOD for terrain detail
    // - Procedural terrain generation

    // TODO: Implement galaxy-scale navigation
    // - System transitions with loading screens
    // - Inter-system warp mechanics
    // - Galaxy map navigation
}

// Data structures for hierarchical world
export interface HierarchicalCoords {
    galaxy: Vector3Type;
    system: Vector3Type;
    planet: Vector3Type;
    chunk: Vector3Type;
}
