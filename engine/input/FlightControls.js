import * as THREE from 'three';
/**
 * Flight Controls for spaceship, orbit, and warp movement.
 * Handles thrust, rotation, and flight mechanics.
 */
export class FlightControls {
    constructor(inputManager, camera) {
        this.thrustSpeed = 10;
        this.rotationSpeed = 0.01;
        this.velocity = new THREE.Vector3();
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.inputManager = inputManager;
        this.camera = camera;
    }
    update(dt) {
        // Mouse look for rotation
        const mouseState = this.inputManager.getMouseState();
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= mouseState.deltaX * this.rotationSpeed;
        this.euler.x -= mouseState.deltaY * this.rotationSpeed;
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
        // Thrust controls (WASD for forward/back/left/right, Shift/Ctrl for up/down)
        const thrust = new THREE.Vector3();
        if (this.inputManager.isKeyPressed('KeyW'))
            thrust.z -= 1;
        if (this.inputManager.isKeyPressed('KeyS'))
            thrust.z += 1;
        if (this.inputManager.isKeyPressed('KeyA'))
            thrust.x -= 1;
        if (this.inputManager.isKeyPressed('KeyD'))
            thrust.x += 1;
        if (this.inputManager.isKeyPressed('ShiftLeft'))
            thrust.y += 1;
        if (this.inputManager.isKeyPressed('ControlLeft'))
            thrust.y -= 1;
        if (thrust.length() > 0) {
            thrust.normalize().multiplyScalar(this.thrustSpeed * dt);
            this.velocity.add(thrust.applyQuaternion(this.camera.quaternion));
        }
        // Apply velocity to camera position
        this.camera.position.add(this.velocity.clone().multiplyScalar(dt));
        // Apply some damping to velocity
        this.velocity.multiplyScalar(0.98);
    }
    setThrustSpeed(speed) {
        this.thrustSpeed = speed;
    }
    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }
    getVelocity() {
        return this.velocity.clone();
    }
}
//# sourceMappingURL=FlightControls.js.map