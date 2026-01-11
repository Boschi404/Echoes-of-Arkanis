import * as THREE from 'three';
import { IModule } from '../core/Module';
import { LODManager, LODLevel, LODThresholds } from '../../src/modules/LODManager';
import { WorldManager } from '../world/WorldManager';
import { PlayerStateMachine } from '../../src/modules/PlayerStateMachine';
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
    private lodManager: LODManager;
    private worldManager: WorldManager;
    private playerStateMachine: PlayerStateMachine;

    // Streaming configuration
    private readonly preloadTime: number = 5.0; // Seconds ahead to preload
    private readonly preloadDistanceMultiplier: number = 1.5; // Multiplier for preload distance

    // Streaming state
    private activeSystems: Set<string> = new Set();
    private activePlanets: Set<string> = new Set();
    private activeChunks: Set<string> = new Set();

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

    update(dt: number): void {
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
        this.updateChunksLOD(playerPos, predictedPos);
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
                } else {
                    // Update LOD if needed
                    this.worldManager.updateSystemLOD(system.name, requiredLOD);
                }
            } else {
                // System should be culled
                if (this.activeSystems.has(system.name)) {
                    this.worldManager.deactivateSystem(system.name);
                    this.activeSystems.delete(system.name);
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
            const distance = playerPos.distanceTo(planet.position);
            const predictedDistance = predictedPos.distanceTo(planet.position);

            // Use minimum distance for conservative loading
            const effectiveDistance = Math.min(distance, predictedDistance);
            const requiredLOD = this.calculateChunkLOD(effectiveDistance);

            if (requiredLOD !== LODLevel.CULLED) {
                // Planet should be active
                if (!this.activePlanets.has(planet.name)) {
                    this.worldManager.activatePlanet(planet.name, requiredLOD);
                    this.activePlanets.add(planet.name);
                } else {
                    // Update LOD if needed
                    this.worldManager.updatePlanetLOD(planet.name, requiredLOD);
                }
            } else {
                // Planet should be culled
                if (this.activePlanets.has(planet.name)) {
                    this.worldManager.deactivatePlanet(planet.name);
                    this.activePlanets.delete(planet.name);
                }
            }
        }
    }

    /**
     * Update chunks LOD (placeholders) based on player position.
     */
    private updateChunksLOD(playerPos: Vector3D, predictedPos: Vector3D): void {
        // For now, chunks are tied to planets
        // In future, this will handle terrain chunks
        const planets = this.worldManager.getAllPlanets();

        for (const planet of planets) {
            if (!this.activePlanets.has(planet.name)) continue;

            // Generate chunk keys around planet
            const chunkKeys = this.generateChunkKeys(planet, playerPos, predictedPos);

            for (const chunkKey of chunkKeys) {
                const distance = this.getChunkDistance(chunkKey, playerPos);
                const predictedDistance = this.getChunkDistance(chunkKey, predictedPos);
                const effectiveDistance = Math.min(distance, predictedDistance);
                const requiredLOD = this.calculateChunkLOD(effectiveDistance);

                if (requiredLOD !== LODLevel.CULLED) {
                    if (!this.activeChunks.has(chunkKey)) {
                        this.worldManager.activateChunk(chunkKey, requiredLOD);
                        this.activeChunks.add(chunkKey);
                    } else {
                        this.worldManager.updateChunkLOD(chunkKey, requiredLOD);
                    }
                } else {
                    if (this.activeChunks.has(chunkKey)) {
                        this.worldManager.deactivateChunk(chunkKey);
                        this.activeChunks.delete(chunkKey);
                    }
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
        if (distance <= LODThresholds.MACRO_HIGH) return LODLevel.HIGH_DETAIL;
        if (distance <= LODThresholds.MACRO_MEDIUM) return LODLevel.MEDIUM_DETAIL;
        if (distance <= LODThresholds.MACRO_LOW) return LODLevel.LOW_DETAIL;
        return LODLevel.CULLED;
    }

    /**
     * Calculate chunk LOD based on distance (for planets and chunks).
     */
    private calculateChunkLOD(distance: number): LODLevel {
        if (distance <= LODThresholds.CHUNK_HIGH) return LODLevel.HIGH_DETAIL;
        if (distance <= LODThresholds.CHUNK_MEDIUM) return LODLevel.MEDIUM_DETAIL;
        if (distance <= LODThresholds.CHUNK_LOW) return LODLevel.LOW_DETAIL;
        return LODLevel.CULLED;
    }

    /**
     * Generate chunk keys around a planet based on player position.
     * For now, simple grid around planet center.
     */
    private generateChunkKeys(planet: any, playerPos: Vector3D, predictedPos: Vector3D): string[] {
        const chunkKeys: string[] = [];
        const chunkSize = 1000; // Placeholder chunk size
        const preloadRadius = LODThresholds.CHUNK_LOW * this.preloadDistanceMultiplier;

        // Generate chunks in a grid around planet
        const gridSize = Math.ceil(preloadRadius / chunkSize);
        for (let x = -gridSize; x <= gridSize; x++) {
            for (let y = -gridSize; y <= gridSize; y++) {
                for (let z = -gridSize; z <= gridSize; z++) {
                    const chunkKey = `${planet.name}_chunk_${x}_${y}_${z}`;
                    chunkKeys.push(chunkKey);
                }
            }
        }

        return chunkKeys;
    }

    /**
     * Get distance from chunk to position.
     * For now, approximate based on chunk key.
     */
    private getChunkDistance(chunkKey: string, position: Vector3D): number {
        // Parse chunk coordinates from key
        const parts = chunkKey.split('_');
        if (parts.length < 5) return Infinity;

        const x = parseInt(parts[2]) * 1000; // chunkSize
        const y = parseInt(parts[3]) * 1000;
        const z = parseInt(parts[4]) * 1000;

        const chunkPos = new Vector3D(x, y, z);
        return position.distanceTo(chunkPos);
    }
}
