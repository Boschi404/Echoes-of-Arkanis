// Solution 1: Use type-only import for THREE types, regular import for values
import * as THREE from 'three';
import type { IModule } from '../core/Module';
import { WorldManager } from '../world/WorldManager.js';

/**
 * LOD Manager provides scaffolding for Level of Detail systems.
 * Handles macro LOD for systems/galaxies and chunk LOD for planets.
 * Supports smooth transitions between detail levels.
 */
export const LODLevel = {
    HIGH_DETAIL: 'high',
    MEDIUM_DETAIL: 'medium',
    LOW_DETAIL: 'low',
    CULLED: 'culled'
} as const;

export type LODLevel = typeof LODLevel[keyof typeof LODLevel];

/**
 * LOD thresholds for different scales.
 */
export class LODThresholds {
    // Macro LOD (galaxies, star systems)
    static readonly MACRO_HIGH = 100000;    // Within 100k units: full detail
    static readonly MACRO_MEDIUM = 500000;  // 100k-500k: medium detail
    static readonly MACRO_LOW = 2000000;    // 500k-2M: low detail
    // Beyond 2M: culled

    // Chunk LOD (planets, terrain)
    static readonly CHUNK_HIGH = 1000;      // Within 1k units: full geometry
    static readonly CHUNK_MEDIUM = 5000;    // 1k-5k: medium detail
    static readonly CHUNK_LOW = 20000;      // 5k-20k: low detail
    // Beyond 20k: culled
}

export class LODManager implements IModule {
    private camera: THREE.Camera;
    // @ts-ignore
    private worldManager: WorldManager;

    // LOD tracking
    private macroObjects: Map<THREE.Object3D, LODLevel> = new Map();
    private chunkObjects: Map<THREE.Object3D, LODLevel> = new Map();

    constructor(camera: THREE.Camera, worldManager: WorldManager) {
        this.camera = camera;
        this.worldManager = worldManager;
    }

    init(): void {
        console.log('Initializing LOD Manager...');
        console.log('LOD Manager initialized');
    }

    update(_dt: number): void {
        this.updateMacroLOD();
        this.updateChunkLOD();
    }

    dispose(): void {
        this.macroObjects.clear();
        this.chunkObjects.clear();
        console.log('LOD Manager disposed');
    }

    registerMacroObject(object: THREE.Object3D): void {
        this.macroObjects.set(object, LODLevel.HIGH_DETAIL);
    }

    registerChunkObject(object: THREE.Object3D): void {
        this.chunkObjects.set(object, LODLevel.HIGH_DETAIL);
    }

    unregisterObject(object: THREE.Object3D): void {
        this.macroObjects.delete(object);
        this.chunkObjects.delete(object);
    }

    private updateMacroLOD(): void {
        const cameraPos = this.camera.position;

        this.macroObjects.forEach((currentLevel, object) => {
            // Use squared distance to avoid square root calculations
            const distanceSq = cameraPos.distanceToSquared(object.position);
            
            // Map squared distances to levels
            let newLevel: LODLevel = LODLevel.CULLED;
            if (distanceSq < LODThresholds.MACRO_HIGH * LODThresholds.MACRO_HIGH) {
                newLevel = LODLevel.HIGH_DETAIL;
            } else if (distanceSq < LODThresholds.MACRO_MEDIUM * LODThresholds.MACRO_MEDIUM) {
                newLevel = LODLevel.MEDIUM_DETAIL;
            } else if (distanceSq < LODThresholds.MACRO_LOW * LODThresholds.MACRO_LOW) {
                newLevel = LODLevel.LOW_DETAIL;
            }

            if (newLevel !== currentLevel) {
                this.transitionMacroLOD(object, currentLevel, newLevel);
                this.macroObjects.set(object, newLevel);
            }
        });
    }

    private updateChunkLOD(): void {
        const cameraPos = this.camera.position;

        this.chunkObjects.forEach((currentLevel, object) => {
            const distanceSq = cameraPos.distanceToSquared(object.position);
            
            let newLevel: LODLevel = LODLevel.CULLED;
            if (distanceSq < LODThresholds.CHUNK_HIGH * LODThresholds.CHUNK_HIGH) {
                newLevel = LODLevel.HIGH_DETAIL;
            } else if (distanceSq < LODThresholds.CHUNK_MEDIUM * LODThresholds.CHUNK_MEDIUM) {
                newLevel = LODLevel.MEDIUM_DETAIL;
            } else if (distanceSq < LODThresholds.CHUNK_LOW * LODThresholds.CHUNK_LOW) {
                newLevel = LODLevel.LOW_DETAIL;
            }

            if (newLevel !== currentLevel) {
                this.transitionChunkLOD(object, currentLevel, newLevel);
                this.chunkObjects.set(object, newLevel);
            }
        });
    }

    /*
    private calculateMacroLOD(distance: number): LODLevel {
        if (distance < LODThresholds.MACRO_HIGH) return LODLevel.HIGH_DETAIL;
        if (distance < LODThresholds.MACRO_MEDIUM) return LODLevel.MEDIUM_DETAIL;
        if (distance < LODThresholds.MACRO_LOW) return LODLevel.LOW_DETAIL;
        return LODLevel.CULLED;
    }

    private calculateChunkLOD(distance: number): LODLevel {
        if (distance < LODThresholds.CHUNK_HIGH) return LODLevel.HIGH_DETAIL;
        if (distance < LODThresholds.CHUNK_MEDIUM) return LODLevel.MEDIUM_DETAIL;
        if (distance < LODThresholds.CHUNK_LOW) return LODLevel.LOW_DETAIL;
        return LODLevel.CULLED;
    }
    */

    private transitionMacroLOD(object: THREE.Object3D, _from: LODLevel, to: LODLevel): void {
        console.log(`Transitioning macro LOD for ${object.uuid} to ${to}`);
        // TODO: Implement visual transition (fade, cross-dissolve)
    }

    private transitionChunkLOD(object: THREE.Object3D, _from: LODLevel, to: LODLevel): void {
        console.log(`Transitioning chunk LOD for ${object.uuid} to ${to}`);
        // TODO: Implement visual transition
    }
}
