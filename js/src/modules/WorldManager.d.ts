import { SceneType, Vector3Type, MeshType } from '../../engine/rendering/Renderer';
import { IModule } from '../interfaces/IModule';
/**
 * World Manager handles hierarchical coordinates: galaxy → system → planet → chunks.
 * Supports floating origin and hierarchical coordinate conversion.
 * Includes scaffolding for a star system with placeholder meshes.
 */
export declare class WorldManager implements IModule {
    scene: SceneType;
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
    worldToHierarchical(worldPos: Vector3Type): HierarchicalCoords;
    /**
     * Convert hierarchical coordinates to world coordinates.
     * @param coords Hierarchical coordinates.
     * @returns World position vector.
     */
    hierarchicalToWorld(coords: HierarchicalCoords): Vector3Type;
    /**
     * Set the floating origin to a new position.
     * @param newOrigin New origin position.
     */
    setFloatingOrigin(newOrigin: Vector3Type): void;
    private createExampleWorld;
    private updateOrbitalMechanics;
}
export interface HierarchicalCoords {
    galaxy: Vector3Type;
    system: Vector3Type;
    planet: Vector3Type;
    chunk: Vector3Type;
}
export interface Galaxy {
    name: string;
    position: Vector3Type;
    systems: StarSystem[];
}
export interface StarSystem {
    name: string;
    position: Vector3Type;
    star: Star;
    planets: Planet[];
}
export interface Star {
    name: string;
    radius: number;
    color: number;
    mesh: MeshType | null;
}
export interface Planet {
    name: string;
    radius: number;
    distance: number;
    type: string;
    speed: number;
    mesh: MeshType | null;
    moons: Moon[];
}
export interface Moon {
    name: string;
    radius: number;
    distance: number;
    speed: number;
    mesh: MeshType | null;
}
//# sourceMappingURL=WorldManager.d.ts.map