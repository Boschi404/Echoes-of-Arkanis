import * as THREE from 'three';
import { InputManager } from './InputManager';

/**
 * FPS Controls for first-person movement on planets.
 * Handles WASD movement and mouse look.
 */
export class FPSControls {
    private inputManager: InputManager;
    private camera: THREE.PerspectiveCamera;
    private moveSpeed: number = 5;
    private lookSpeed: number = 0.002;
    private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private velocity: THREE.Vector3 = new THREE.Vector3();

    constructor(inputManager: InputManager, camera: THREE.PerspectiveCamera) {
        this.inputManager = inputManager;
        this.camera = camera;
    }

    update(dt: number): void {
        // Mouse look using action-based axis
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= this.inputManager.getAxis('lookX') * this.lookSpeed;
        this.euler.x -= this.inputManager.getAxis('lookY') * this.lookSpeed;
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);

        // WASD movement using action-based inputs
        this.velocity.set(0, 0, 0);
        if (this.inputManager.isActionPressed('moveForward')) this.velocity.z -= 1;
        if (this.inputManager.isActionPressed('moveBackward')) this.velocity.z += 1;
        if (this.inputManager.isActionPressed('moveLeft')) this.velocity.x -= 1;
        if (this.inputManager.isActionPressed('moveRight')) this.velocity.x += 1;

        if (this.velocity.length() > 0) {
            this.velocity.normalize().multiplyScalar(this.moveSpeed * dt);
            this.camera.position.add(this.velocity.applyQuaternion(this.camera.quaternion));
        }
    }

    setMoveSpeed(speed: number): void {
        this.moveSpeed = speed;
    }

    setLookSpeed(speed: number): void {
        this.lookSpeed = speed;
    }
}
