import * as THREE from 'three';
import { InputManager } from './InputManager';

/**
 * Flight Controls for spaceship, orbit, and warp movement.
 * Handles thrust, rotation, and flight mechanics.
 */
export class FlightControls {
    private inputManager: InputManager;
    private camera: THREE.PerspectiveCamera;
    private thrustSpeed: number = 10;
    private rotationSpeed: number = 0.01;
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');

    constructor(inputManager: InputManager, camera: THREE.PerspectiveCamera) {
        this.inputManager = inputManager;
        this.camera = camera;
    }

    update(dt: number): void {
        // Mouse look for rotation
        const mouseState = this.inputManager.getMouseState();
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= mouseState.deltaX * this.rotationSpeed;
        this.euler.x -= mouseState.deltaY * this.rotationSpeed;
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);

        // Thrust controls (WASD for forward/back/left/right, Shift/Ctrl for up/down)
        const thrust = new THREE.Vector3();
        if (this.inputManager.isKeyPressed('KeyW')) thrust.z -= 1;
        if (this.inputManager.isKeyPressed('KeyS')) thrust.z += 1;
        if (this.inputManager.isKeyPressed('KeyA')) thrust.x -= 1;
        if (this.inputManager.isKeyPressed('KeyD')) thrust.x += 1;
        if (this.inputManager.isKeyPressed('ShiftLeft')) thrust.y += 1;
        if (this.inputManager.isKeyPressed('ControlLeft')) thrust.y -= 1;

        if (thrust.length() > 0) {
            thrust.normalize().multiplyScalar(this.thrustSpeed * dt);
            this.velocity.add(thrust.applyQuaternion(this.camera.quaternion));
        }

        // Apply velocity to camera position
        this.camera.position.add(this.velocity.clone().multiplyScalar(dt));

        // Apply some damping to velocity
        this.velocity.multiplyScalar(0.98);
    }

    setThrustSpeed(speed: number): void {
        this.thrustSpeed = speed;
    }

    setRotationSpeed(speed: number): void {
        this.rotationSpeed = speed;
    }

    getVelocity(): THREE.Vector3 {
        return this.velocity.clone();
    }
}
