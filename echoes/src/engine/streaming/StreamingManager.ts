import type { IModule } from '../core/Module';
import { LODManager, LODLevel, LODThresholds } from '../modules/LODManager';
import { WorldManager } from '../world/WorldManager';
import { PlayerStateMachine } from '../modules/PlayerStateMachine';
import { Vector3D } from '../world/FloatingOrigin';

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
export class StreamingManager implements IModule {
    // @ts-ignore
    private lodManager: LODManager;
    private worldManager: WorldManager;
    private playerStateMachine: PlayerStateMachine;
    private lodScale: number = 1;

    // Streaming configuration
    private readonly preloadTime: number = 5.0; // Seconds ahead to preload

    // Streaming state
    private activeSystems: Set<string> = new Set();
    private activeSystemsLOD: Map<string, LODLevel> = new Map();
    private activePlanets: Set<string> = new Set();
    private activePlanetsLOD: Map<string, LODLevel> = new Map();
    // @ts-ignore - Reserved for future use
    private activeChunks: Set<string> = new Set();
    // @ts-ignore - Reserved for future use
    private activeChunksLOD: Map<string, LODLevel> = new Map();

    constructor(lodManager: LODManager, worldManager: WorldManager, playerStateMachine: PlayerStateMachine) {
        this.lodManager = lodManager;
        this.worldManager = worldManager;
        this.playerStateMachine = playerStateMachine;
    }

    init(): void {
        console.log('Initializing Streaming Manager...');

        // Initial streaming decisions
        this.updateStreaming();

        console.log('Streaming Manager initialized');
    }

    update(_dt: number): void {
        // Update streaming decisions every frame
        this.updateStreaming();
    }

    dispose(): void {
        // Clean up active entities
        this.activeSystems.clear();
        this.activePlanets.clear();
        this.activeChunks.clear();

        console.log('Streaming Manager disposed');
    }

    /**
     * Main streaming update logic.
     * Determines what should be loaded/unloaded based on player position and velocity.
     */
    private updateStreaming(): void {
        const playerPos = this.getPlayerPosition();
        const predictedPos = this.getPredictedPosition();

        // Update star systems (macro LOD)
        this.updateStarSystemsLOD(playerPos, predictedPos);

        // Update planets (chunk LOD)
        this.updatePlanetsLOD(playerPos, predictedPos);

        // Update chunks (placeholders)
        // Disabled for performance optimization until chunk system is fully implemented
        // this.updateChunksLOD(playerPos, predictedPos);
    }

    /**
     * Update star systems LOD based on player position.
     */
    private updateStarSystemsLOD(playerPos: Vector3D, predictedPos: Vector3D): void {
        // Get all systems from world manager
        const systems = this.worldManager.getAllSystems();

        for (const system of systems) {
            const distance = playerPos.distanceTo(system.position);
            const predictedDistance = predictedPos.distanceTo(system.position);

            // Use minimum distance for conservative loading
            const effectiveDistance = Math.min(distance, predictedDistance);
            const requiredLOD = this.calculateMacroLOD(effectiveDistance);

            if (requiredLOD !== LODLevel.CULLED) {
                // System should be active
                if (!this.activeSystems.has(system.name)) {
                    this.worldManager.activateSystem(system.name, requiredLOD);
                    this.activeSystems.add(system.name);
                    this.activeSystemsLOD.set(system.name, requiredLOD);
                } else {
                    // Update LOD if needed
                    const currentLOD = this.activeSystemsLOD.get(system.name);
                    if (currentLOD !== requiredLOD) {
                        this.worldManager.updateSystemLOD(system.name, requiredLOD);
                        this.activeSystemsLOD.set(system.name, requiredLOD);
                    }
                }
            } else {
                // System should be culled
                if (this.activeSystems.has(system.name)) {
                    this.worldManager.deactivateSystem(system.name);
                    this.activeSystems.delete(system.name);
                    this.activeSystemsLOD.delete(system.name);
                }
            }
        }
    }

    /**
     * Update planets LOD based on player position.
     */
    private updatePlanetsLOD(playerPos: Vector3D, predictedPos: Vector3D): void {
        // Get all planets from world manager
        const planets = this.worldManager.getAllPlanets();

        for (const planet of planets) {
            // Convert planet position (THREE.Vector3) to Vector3D for distance calculation
            const planetPos = new Vector3D(planet.position.x, planet.position.y, planet.position.z);
            
            const distance = playerPos.distanceTo(planetPos);
            const predictedDistance = predictedPos.distanceTo(planetPos);

            // Use minimum distance for conservative loading
            const effectiveDistance = Math.min(distance, predictedDistance);
            const requiredLOD = this.calculateChunkLOD(effectiveDistance);

            if (requiredLOD !== LODLevel.CULLED) {
                // Planet should be active
                if (!this.activePlanets.has(planet.name)) {
                    this.worldManager.activatePlanet(planet.name, requiredLOD);
                    this.activePlanets.add(planet.name);
                    this.activePlanetsLOD.set(planet.name, requiredLOD);
                } else {
                    // Update LOD if needed
                    const currentLOD = this.activePlanetsLOD.get(planet.name);
                    if (currentLOD !== requiredLOD) {
                        this.worldManager.updatePlanetLOD(planet.name, requiredLOD);
                        this.activePlanetsLOD.set(planet.name, requiredLOD);
                    }
                }
            } else {
                // Planet should be culled
                if (this.activePlanets.has(planet.name)) {
                    this.worldManager.deactivatePlanet(planet.name);
                    this.activePlanets.delete(planet.name);
                    this.activePlanetsLOD.delete(planet.name);
                }
            }
        }
    }


    /**
     * Get current player position from PlayerStateMachine.
     */
    private getPlayerPosition(): Vector3D {
        const playerData = this.playerStateMachine.playerData;
        return new Vector3D(playerData.position.x, playerData.position.y, playerData.position.z);
    }

    /**
     * Calculate predicted position based on velocity and preload time.
     */
    private getPredictedPosition(): Vector3D {
        const playerData = this.playerStateMachine.playerData;
        const velocity = new Vector3D(playerData.velocity.x, playerData.velocity.y, playerData.velocity.z);
        const playerPos = this.getPlayerPosition();

        // predictedPosition = position + velocity * preloadTime
        const predictedPos = playerPos.clone();
        predictedPos.x += velocity.x * this.preloadTime;
        predictedPos.y += velocity.y * this.preloadTime;
        predictedPos.z += velocity.z * this.preloadTime;

        return predictedPos;
    }

    /**
     * Calculate macro LOD based on distance (for star systems).
     */
    private calculateMacroLOD(distance: number): LODLevel {
        if (distance <= LODThresholds.MACRO_HIGH * this.lodScale) return LODLevel.HIGH_DETAIL;
        if (distance <= LODThresholds.MACRO_MEDIUM * this.lodScale) return LODLevel.MEDIUM_DETAIL;
        if (distance <= LODThresholds.MACRO_LOW * this.lodScale) return LODLevel.LOW_DETAIL;
        return LODLevel.CULLED;
    }

    /**
     * Calculate chunk LOD based on distance (for planets and chunks).
     */
    private calculateChunkLOD(distance: number): LODLevel {
        if (distance <= LODThresholds.CHUNK_HIGH * this.lodScale) return LODLevel.HIGH_DETAIL;
        if (distance <= LODThresholds.CHUNK_MEDIUM * this.lodScale) return LODLevel.MEDIUM_DETAIL;
        if (distance <= LODThresholds.CHUNK_LOW * this.lodScale) return LODLevel.LOW_DETAIL;
        return LODLevel.CULLED;
    }

    setQualityScale(scale: number): void {
        this.lodScale = scale;
    }

}
