import { THREE, Vector3Type } from '../rendering/Renderer';

/**
 * Floating Origin system for handling large-scale worlds with double precision.
 * Prevents precision loss at large distances by shifting the coordinate system.
 */
export class FloatingOrigin {
    // High-precision player position (using doubles)
    private playerPosition: Vector3D = new Vector3D(0, 0, 0);

    // Current local origin (Three.js Vector3 for rendering)
    private localOrigin: Vector3Type = new THREE.Vector3(0, 0, 0);

    // Threshold for origin shift (when player moves this far from origin)
    private readonly shiftThreshold: number = 10000; // Adjust as needed

    constructor() {
        // THREE is imported from Renderer
    }

    /**
     * Update the player's high-precision position.
     * @param delta Movement delta in high-precision coordinates.
     */
    updatePlayerPosition(delta: Vector3D): void {
        this.playerPosition.add(delta);

        // Check if we need to shift the origin
        const distanceFromOrigin = this.playerPosition.distanceTo(new Vector3D(this.localOrigin.x, this.localOrigin.y, this.localOrigin.z));
        if (distanceFromOrigin > this.shiftThreshold) {
            this.shiftOrigin();
        }
    }

    /**
     * Get the player's high-precision position.
     */
    getPlayerPosition(): Vector3D {
        return this.playerPosition.clone();
    }

    /**
     * Set the player's high-precision position.
     */
    setPlayerPosition(position: Vector3D): void {
        this.playerPosition.copy(position);
    }

    /**
     * Get the current local origin for rendering.
     */
    getLocalOrigin(): Vector3Type {
        return this.localOrigin.clone();
    }

    /**
     * Convert high-precision world coordinates to local rendering coordinates.
     * @param worldPos High-precision world position.
     * @returns Local position relative to current origin.
     */
    worldToLocal(worldPos: Vector3D): Vector3Type {
        const localPos = new THREE.Vector3(
            worldPos.x - this.localOrigin.x,
            worldPos.y - this.localOrigin.y,
            worldPos.z - this.localOrigin.z
        );
        return localPos;
    }

    /**
     * Convert local rendering coordinates to high-precision world coordinates.
     * @param localPos Local position relative to current origin.
     * @returns High-precision world position.
     */
    localToWorld(localPos: Vector3Type): Vector3D {
        const worldPos = new Vector3D(
            localPos.x + this.localOrigin.x,
            localPos.y + this.localOrigin.y,
            localPos.z + this.localOrigin.z
        );
        return worldPos;
    }

    /**
     * Shift the origin to the player's current position.
     * This should be called when all world objects need to be repositioned.
     */
    private shiftOrigin(): void {
        // Move origin to player's position
        this.localOrigin.set(this.playerPosition.x, this.playerPosition.y, this.playerPosition.z);

        // Reset player position to origin in local space
        this.playerPosition.set(0, 0, 0);

        // Note: World objects need to be repositioned relative to new origin
        // This is handled by the WorldManager
    }

    /**
     * Get the offset from the previous origin (for repositioning objects).
     */
    getOriginOffset(): Vector3Type {
        return this.localOrigin.clone();
    }
}

/**
 * High-precision 3D vector using JavaScript numbers (doubles).
 */
export class Vector3D {
    public x: number;
    public y: number;
    public z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clone(): Vector3D {
        return new Vector3D(this.x, this.y, this.z);
    }

    copy(v: Vector3D): void {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
    }

    set(x: number, y: number, z: number): void {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(v: Vector3D): void {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
    }

    distanceTo(v: Vector3D): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}
