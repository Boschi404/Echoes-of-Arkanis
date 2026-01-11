import * as THREE from 'three';
import { InputManager } from './InputManager';
/**
 * Flight Controls for spaceship, orbit, and warp movement.
 * Handles thrust, rotation, and flight mechanics.
 */
export declare class FlightControls {
    private inputManager;
    private camera;
    private thrustSpeed;
    private rotationSpeed;
    private velocity;
    private euler;
    constructor(inputManager: InputManager, camera: THREE.PerspectiveCamera);
    update(dt: number): void;
    setThrustSpeed(speed: number): void;
    setRotationSpeed(speed: number): void;
    getVelocity(): THREE.Vector3;
}
//# sourceMappingURL=FlightControls.d.ts.map