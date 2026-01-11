import * as THREE from 'three';
import { IModule } from '../interfaces/IModule';
import { WorldManager } from './WorldManager';
/**
 * LOD Manager provides scaffolding for Level of Detail systems.
 * Handles macro LOD for systems/galaxies and chunk LOD for planets.
 * Supports smooth transitions between detail levels.
 */
export declare enum LODLevel {
    HIGH_DETAIL = "high",
    MEDIUM_DETAIL = "medium",
    LOW_DETAIL = "low",
    CULLED = "culled"
}
/**
 * LOD thresholds for different scales.
 */
export declare class LODThresholds {
    static readonly MACRO_HIGH = 100000;
    static readonly MACRO_MEDIUM = 500000;
    static readonly MACRO_LOW = 2000000;
    static readonly CHUNK_HIGH = 1000;
    static readonly CHUNK_MEDIUM = 5000;
    static readonly CHUNK_LOW = 20000;
}
export declare class LODManager implements IModule {
    private camera;
    private worldManager;
    private macroObjects;
    private chunkObjects;
    constructor(camera: THREE.Camera, worldManager: WorldManager);
    init(): void;
    update(dt: number): void;
    dispose(): void;
    /**
     * Register an object for macro LOD management.
     */
    registerMacroObject(object: THREE.Object3D): void;
    /**
     * Register an object for chunk LOD management.
     */
    registerChunkObject(object: THREE.Object3D): void;
    /**
     * Unregister an object from LOD management.
     */
    unregisterObject(object: THREE.Object3D): void;
    private updateMacroLOD;
    private updateChunkLOD;
    private calculateMacroLOD;
    private calculateChunkLOD;
    private transitionMacroLOD;
    private transitionChunkLOD;
}
//# sourceMappingURL=LODManager.d.ts.map