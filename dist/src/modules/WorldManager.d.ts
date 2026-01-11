import * as THREE from 'three';
import { IModule } from '../interfaces/IModule';
/**
 * World Manager handles hierarchical coordinates: galaxy → system → planet → chunks.
 * Supports floating origin and hierarchical coordinate conversion.
 * Includes scaffolding for a star system with placeholder meshes.
 */
export declare class WorldManager implements IModule {
    scene: THREE.Scene;
    private galaxyOrigin;
    private currentSystemOrigin;
    private currentPlanetOrigin;
    private galaxies;
    private currentGalaxy;
    private currentSystem;
    private currentPlanet;
    private starMesh;
    private planetMesh;
    constructor(scene: THREE.Scene);
    init(): void;
    update(dt: number): void;
    dispose(): void;
    /**
     * Convert world coordinates to hierarchical coordinates.
     * @param worldPos World position vector.
     * @returns Hierarchical coordinates.
     */
    worldToHierarchical(worldPos: THREE.Vector3): HierarchicalCoords;
    /**
     * Convert hierarchical coordinates to world coordinates.
     * @param coords Hierarchical coordinates.
     * @returns World position vector.
     */
    hierarchicalToWorld(coords: HierarchicalCoords): THREE.Vector3;
    /**
     * Set the floating origin to a new position.
     * @param newOrigin New origin position.
     */
    setFloatingOrigin(newOrigin: THREE.Vector3): void;
    private createExampleWorld;
    private updateOrbitalMechanics;
}
export interface HierarchicalCoords {
    galaxy: THREE.Vector3;
    system: THREE.Vector3;
    planet: THREE.Vector3;
    chunk: THREE.Vector3;
}
export interface Galaxy {
    name: string;
    position: THREE.Vector3;
    systems: StarSystem[];
}
export interface StarSystem {
    name: string;
    position: THREE.Vector3;
    star: Star;
    planets: Planet[];
}
export interface Star {
    name: string;
    radius: number;
    color: number;
    mesh: THREE.Mesh | null;
}
export interface Planet {
    name: string;
    radius: number;
    distance: number;
    type: string;
    speed: number;
    mesh: THREE.Mesh | null;
    moons: Moon[];
}
export interface Moon {
    name: string;
    radius: number;
    distance: number;
    speed: number;
    mesh: THREE.Mesh | null;
}
//# sourceMappingURL=WorldManager.d.ts.map