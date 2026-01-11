import { Vector3Type } from '../rendering/Renderer';
/**
 * Floating Origin system for handling large-scale worlds with double precision.
 * Prevents precision loss at large distances by shifting the coordinate system.
 */
export declare class FloatingOrigin {
    private playerPosition;
    private localOrigin;
    private readonly shiftThreshold;
    constructor();
    /**
     * Update the player's high-precision position.
     * @param delta Movement delta in high-precision coordinates.
     */
    updatePlayerPosition(delta: Vector3D): void;
    /**
     * Get the player's high-precision position.
     */
    getPlayerPosition(): Vector3D;
    /**
     * Set the player's high-precision position.
     */
    setPlayerPosition(position: Vector3D): void;
    /**
     * Get the current local origin for rendering.
     */
    getLocalOrigin(): Vector3Type;
    /**
     * Convert high-precision world coordinates to local rendering coordinates.
     * @param worldPos High-precision world position.
     * @returns Local position relative to current origin.
     */
    worldToLocal(worldPos: Vector3D): Vector3Type;
    /**
     * Convert local rendering coordinates to high-precision world coordinates.
     * @param localPos Local position relative to current origin.
     * @returns High-precision world position.
     */
    localToWorld(localPos: Vector3Type): Vector3D;
    /**
     * Shift the origin to the player's current position.
     * This should be called when all world objects need to be repositioned.
     */
    private shiftOrigin;
    /**
     * Get the offset from the previous origin (for repositioning objects).
     */
    getOriginOffset(): Vector3Type;
}
/**
 * High-precision 3D vector using JavaScript numbers (doubles).
 */
export declare class Vector3D {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    clone(): Vector3D;
    copy(v: Vector3D): void;
    set(x: number, y: number, z: number): void;
    add(v: Vector3D): void;
    distanceTo(v: Vector3D): number;
}
//# sourceMappingURL=FloatingOrigin.d.ts.map