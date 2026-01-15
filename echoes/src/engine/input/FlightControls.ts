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
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private accelForward: number = 10;
    private accelBackward: number = 10;
    // Rotation keys replace strafe/up/down in this mode
    private lastAcceleration: THREE.Vector3 = new THREE.Vector3();
    private rotationMode: 'steer' | 'look' = 'steer';
    private lookSensitivity: number = 0.002;
    private controlsEnabled: boolean = true;
    private autopilotActive: boolean = false;
    private autopilotAccel: THREE.Vector3 = new THREE.Vector3();
    private parkingBrake: boolean = false;
    private maxPitchRate: number = 0.5;
    private maxRollRate: number = 0.8;
    private pitchAccel: number = 1.2;
    private rollAccel: number = 1.5;
    private currentPitchVel: number = 0;
    private currentRollVel: number = 0;
    private lastPitchInput: number = 0;
    private lastRollInput: number = 0;

    constructor(inputManager: InputManager, camera: THREE.PerspectiveCamera) {
        this.inputManager = inputManager;
        this.camera = camera;
    }

    update(dt: number): void {
        if (!this.controlsEnabled) {
            this.lastAcceleration.set(0, 0, 0);
            return;
        }
        if (this.autopilotActive) {
            this.euler.setFromQuaternion(this.camera.quaternion);
        } else {
        if (this.rotationMode === 'steer') {
            const mouseState = this.inputManager.getMouseState();
            const centerX = window.innerWidth / 2;
            const normX = (mouseState.x - centerX) / centerX;
            const centerY = window.innerHeight / 2;
            const normY = (mouseState.y - centerY) / centerY;
            const deadzone = 0.05;
            let rotY = 0;
            if (Math.abs(normX) > deadzone) {
                rotY = (normX - (Math.sign(normX) * deadzone)) / (1 - deadzone);
            }
            const turnRate = 2.0; 
            this.euler.setFromQuaternion(this.camera.quaternion);
            this.euler.y -= rotY * turnRate * dt;
            let pitchMouse = 0;
            if (Math.abs(normY) > deadzone) {
                pitchMouse = (normY - (Math.sign(normY) * deadzone)) / (1 - deadzone);
            }
            const pitchInput = (this.inputManager.isCommandPressed('pitchUp') ? 1 : 0) + (this.inputManager.isCommandPressed('pitchDown') ? -1 : 0);
            const rollInputRaw = (this.inputManager.isCommandPressed('rollLeft') ? -1 : 0) + (this.inputManager.isCommandPressed('rollRight') ? 1 : 0);
            const rollInput = -rollInputRaw;
            this.lastPitchInput = pitchInput;
            this.lastRollInput = rollInput;
            const speed = this.velocity.length();
            const strengthScale = 1 + Math.max(0, (500 - Math.min(500, speed)) / 500) * 0.5;
            const targetPitch = (pitchMouse + pitchInput) * this.maxPitchRate * strengthScale;
            const targetRoll = (rollInput) * this.maxRollRate * strengthScale;
            this.currentPitchVel += (targetPitch - this.currentPitchVel) * Math.min(1, this.pitchAccel * dt);
            this.currentRollVel += (targetRoll - this.currentRollVel) * Math.min(1, this.rollAccel * dt);
            this.euler.x -= this.currentPitchVel * dt;
            this.euler.z += this.currentRollVel * dt;
            this.camera.quaternion.setFromEuler(this.euler);
        } else {
            this.euler.setFromQuaternion(this.camera.quaternion);
            this.euler.y -= this.inputManager.getAxis('lookX') * this.lookSensitivity;
            this.euler.x -= this.inputManager.getAxis('lookY') * this.lookSensitivity;
            this.camera.quaternion.setFromEuler(this.euler);
        }
        }

        const thrust = new THREE.Vector3();
        if (this.parkingBrake) {
            if (this.inputManager.isKeyPressed('ShiftLeft') || this.inputManager.isKeyPressed('ControlLeft')) {
                this.parkingBrake = false;
            }
        }
        if (!this.autopilotActive && this.inputManager.isCommandPressed('thrust')) {
            thrust.z -= this.accelForward * this.thrustSpeed;
        }
        if (!this.autopilotActive && this.inputManager.isCommandPressed('reverse')) {
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const movingForward = this.velocity.dot(forward) > 0;
            const backwardScale = movingForward ? 5 : 1;
            thrust.z += this.accelBackward * this.thrustSpeed * backwardScale;
        }
        if (this.inputManager.isCommandPressed('brake')) {
            if (this.velocity.length() > 0.001) {
                const brakeAccelMag = this.accelBackward * this.thrustSpeed * 3;
                const brakeAccel = this.velocity.clone().normalize().multiplyScalar(-brakeAccelMag);
                thrust.add(brakeAccel.applyQuaternion(this.camera.quaternion.clone().invert()));
                if (this.velocity.length() < 0.5) {
                    this.velocity.set(0, 0, 0);
                    this.parkingBrake = true;
                }
            } else {
                this.parkingBrake = true;
            }
        }
        if (this.autopilotActive) {
            thrust.add(this.autopilotAccel);
        }

        if (thrust.length() > 0) {
            const worldAccel = thrust.applyQuaternion(this.camera.quaternion);
            this.lastAcceleration.copy(worldAccel);
            this.velocity.add(worldAccel.multiplyScalar(dt));
        } else {
            this.lastAcceleration.set(0, 0, 0);
        }

        this.camera.position.add(this.velocity.clone().multiplyScalar(dt));

    }

    setThrustSpeed(speed: number): void {
        this.thrustSpeed = speed;
    }

    getVelocity(): THREE.Vector3 {
        return this.velocity.clone();
    }
    getAcceleration(): THREE.Vector3 {
        return this.lastAcceleration.clone();
    }

    setAccelForward(accel: number): void {
        this.accelForward = accel;
    }
    setAccelBackward(accel: number): void {
        this.accelBackward = accel;
    }
    setRotationMode(mode: 'steer' | 'look'): void {
        this.rotationMode = mode;
    }
    setLookSensitivity(s: number): void {
        this.lookSensitivity = s;
    }
    setControlsEnabled(enabled: boolean): void {
        this.controlsEnabled = enabled;
    }

    setVelocity(v: THREE.Vector3): void {
        this.velocity.copy(v);
    }
    startAutopilot(): void {
        this.autopilotActive = true;
    }
    stopAutopilot(): void {
        this.autopilotActive = false;
        this.autopilotAccel.set(0, 0, 0);
    }
    setAutopilotAccel(accel: THREE.Vector3): void {
        this.autopilotAccel.copy(accel);
    }
    getPitchInput(): number {
        return this.lastPitchInput;
    }
    getRollInput(): number {
        return this.lastRollInput;
    }
    isParkingBrake(): boolean {
        return this.parkingBrake;
    }
    getThrustingForward(): boolean {
        return this.inputManager.isCommandPressed('thrust');
    }
    getManualAccelForward(): number {
        return this.accelForward * this.thrustSpeed;
    }
    getManualAccelReverseBoost(): number {
        return this.accelBackward * this.thrustSpeed * 5;
    }
}
