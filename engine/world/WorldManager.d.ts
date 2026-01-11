import { IModule } from '../core/Module';
import { SceneType } from '../rendering/Renderer';
import { Vector3D } from './FloatingOrigin';
import { StarSystem } from './StarSystem';
import { Planet } from './Planet';
import { LODLevel } from '../../src/modules/LODManager';
/**
 * World Manager handles hierarchical coordinates: galaxy → system → planet → chunks.
 * Supports floating origin and hierarchical coordinate conversion.
 * Includes scaffolding for a star system with placeholder meshes.
 */
export declare class WorldManager implements IModule {
    scene: SceneType;
    private floatingOrigin;
    private galaxyOrigin;
    private currentSystemOrigin;
    private currentPlanetOrigin;
    private galaxies;
    private currentGalaxy;
    private currentSystem;
    private currentPlanet;
    private starMesh;
    private planetMesh;
    constructor(scene: SceneType);
    init(): void;
    update(dt: number): void;
    dispose(): void;
    /**
     * Convert world coordinates to hierarchical coordinates.
     * @param worldPos World position vector.
     * @returns Hierarchical coordinates.
     */
    worldToHierarchical(worldPos: Vector3D): HierarchicalCoords;
    /**
     * Convert hierarchical coordinates to world coordinates.
     * @param coords Hierarchical coordinates.
     * @returns World position vector.
     */
    hierarchicalToWorld(coords: HierarchicalCoords): Vector3D;
    /**
     * Get the current player position in high precision.
     */
    getPlayerPosition(): Vector3D;
    /**
     * Update player position and handle floating origin shifts.
     * @param delta Movement delta.
     */
    updatePlayerPosition(delta: Vector3D): void;
    /**
     * Set the floating origin to a new position.
     * @param newOrigin New origin position.
     */
    setFloatingOrigin(newOrigin: Vector3D): void;
    private createExampleWorld;
    private updateOrbitalMechanics;
    private repositionWorldObjects;
    /**
     * Get all star systems in the world.
     */
    getAllSystems(): StarSystem[];
    /**
     * Get all planets in the world.
     */
    getAllPlanets(): Planet[];
    /**
     * Activate a star system at the specified LOD level.
     */
    activateSystem(systemName: string, lod: LODLevel): void;
    /**
     * Update LOD for a star system.
     */
    updateSystemLOD(systemName: string, lod: LODLevel): void;
    /**
     * Deactivate a star system.
     */
    deactivateSystem(systemName: string): void;
    /**
     * Activate a planet at the specified LOD level.
     */
    activatePlanet(planetName: string, lod: LODLevel): void;
    /**
     * Update LOD for a planet.
     */
    updatePlanetLOD(planetName: string, lod: LODLevel): void;
    /**
     * Deactivate a planet.
     */
    deactivatePlanet(planetName: string): void;
    /**
     * Activate a chunk (placeholder) at the specified LOD level.
     */
    activateChunk(chunkKey: string, lod: LODLevel): void;
    /**
     * Update LOD for a chunk.
     */
    updateChunkLOD(chunkKey: string, lod: LODLevel): void;
    /**
     * Deactivate a chunk.
     */
    deactivateChunk(chunkKey: string): void;
    private findSystemByName;
    private findPlanetByName;
}
export interface HierarchicalCoords {
    galaxy: Vector3D;
    system: Vector3D;
    planet: Vector3D;
    chunk: Vector3D;
}
//# sourceMappingURL=WorldManager.d.ts.map