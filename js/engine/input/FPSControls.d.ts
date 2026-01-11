import * as THREE from 'three';
import { InputManager } from './InputManager';
/**
 * FPS Controls for first-person movement on planets.
 * Handles WASD movement and mouse look.
 */
export declare class FPSControls {
    private inputManager;
    private camera;
    private moveSpeed;
    private lookSpeed;
    private euler;
    private velocity;
    constructor(inputManager: InputManager, camera: THREE.PerspectiveCamera);
    update(dt: number): void;
    setMoveSpeed(speed: number): void;
    setLookSpeed(speed: number): void;
}
//# sourceMappingURL=FPSControls.d.ts.map