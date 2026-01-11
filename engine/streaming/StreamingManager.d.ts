import { IModule } from '../core/Module';
import { LODManager } from '../../src/modules/LODManager';
import { WorldManager } from '../world/WorldManager';
import { PlayerStateMachine } from '../../src/modules/PlayerStateMachine';
/**
 * Streaming Manager handles world streaming decisions for infinite worlds.
 * Acts as a pure decision layer: queries player state, determines LOD needs,
 * and requests WorldManager to activate/deactivate entities.
 *
 * Implements:
 * - Star systems LOD (macro LOD)
 * - Planet LOD (chunk LOD with placeholders)
 * - Velocity-based preload
 * - Chunk placeholders (no real terrain yet)
 */
export declare class StreamingManager implements IModule {
    private lodManager;
    private worldManager;
    private playerStateMachine;
    private readonly preloadTime;
    private readonly preloadDistanceMultiplier;
    private activeSystems;
    private activePlanets;
    private activeChunks;
    constructor(lodManager: LODManager, worldManager: WorldManager, playerStateMachine: PlayerStateMachine);
    init(): void;
    update(dt: number): void;
    dispose(): void;
    /**
     * Main streaming update logic.
     * Determines what should be loaded/unloaded based on player position and velocity.
     */
    private updateStreaming;
    /**
     * Update star systems LOD based on player position.
     */
    private updateStarSystemsLOD;
    /**
     * Update planets LOD based on player position.
     */
    private updatePlanetsLOD;
    /**
     * Update chunks LOD (placeholders) based on player position.
     */
    private updateChunksLOD;
    /**
     * Get current player position from PlayerStateMachine.
     */
    private getPlayerPosition;
    /**
     * Calculate predicted position based on velocity and preload time.
     */
    private getPredictedPosition;
    /**
     * Calculate macro LOD based on distance (for star systems).
     */
    private calculateMacroLOD;
    /**
     * Calculate chunk LOD based on distance (for planets and chunks).
     */
    private calculateChunkLOD;
    /**
     * Generate chunk keys around a planet based on player position.
     * For now, simple grid around planet center.
     */
    private generateChunkKeys;
    /**
     * Get distance from chunk to position.
     * For now, approximate based on chunk key.
     */
    private getChunkDistance;
}
//# sourceMappingURL=StreamingManager.d.ts.map