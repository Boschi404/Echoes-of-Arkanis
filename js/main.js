class Game {
    constructor() {
        this.sceneManager = new SceneManager();
        this.input = new InputHandler();
        this.solarSystem = new SolarSystem(this.sceneManager.scene);
        this.ship = new Ship(this.sceneManager.scene);
        this.environment = new Environment(this.sceneManager.scene);
        this.ui = new UIManager();

        this.lockedTarget = null;
        this.camState = { fov: 75, mode: 'third' };

        this.init();
        this.animate();
    }

    init() {
        const toggleSettings = () => {
            const modal = document.getElementById('settings-modal');
            const isVisible = modal.style.display === 'block';
            modal.style.display = isVisible ? 'none' : 'block';
            if (!this.input.isPlaying) {
                document.getElementById('ui-layer').style.display = isVisible ? 'flex' : 'none';
            }
        };

        const startGame = () => {
            this.input.isPlaying = true;
            document.getElementById('ui-layer').style.display = 'none';
            document.getElementById('hud-container').style.display = 'grid';
            document.getElementById('crosshair').style.display = 'block';
            this.ship.mesh.position.set(0, 2000, 100000);
        };

        document.getElementById('start-btn').addEventListener('click', startGame);
        document.getElementById('settings-toggle-btn').addEventListener('click', toggleSettings);
        document.getElementById('settings-close-btn').addEventListener('click', toggleSettings);

        window.addEventListener('keydown', (e) => {
            if (!this.input.isPlaying || !this.lockedTarget) return;
            if (e.code === 'KeyL') {
                this.input.isTracking = !this.input.isTracking;
                if (!this.input.isTracking) this.input.isAutopilot = false;
            }
            if (e.code === 'KeyO') {
                if (this.input.isTracking) {
                    this.input.isAutopilot = !this.input.isAutopilot;
                }
            }
            if (e.code === 'KeyV') {
                this.camState.mode = (this.camState.mode === 'third') ? 'first' : 'third';
                this.ship.interior.visible = (this.camState.mode === 'first');
            }
        });
    }

    update() {
        if (!this.input.isPlaying) return;

        const t = Date.now();
        this.solarSystem.update(t);

        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.ship.mesh.quaternion);
        const currentSpeed = this.ship.velocity.length();

        // 1. ROTATION & TARGETING
        if (this.input.isTracking && this.lockedTarget) {
            this.handleAutopilot(t, fwd);
        } else {
            // Manual Steering
            const sens = 0.025;
            const targetRX = this.input.mouse.y * sens;
            const targetRY = -this.input.mouse.x * sens;
            this.ship.rotationVelocity.x += (targetRX - this.ship.rotationVelocity.x) * 0.1;
            this.ship.rotationVelocity.y += (targetRY - this.ship.rotationVelocity.y) * 0.1;
            this.ship.mesh.rotateX(this.ship.rotationVelocity.x);
            this.ship.mesh.rotateY(this.ship.rotationVelocity.y);

            // Auto-Targeting (Only if manual steering and NOT in map)
            if (!this.input.isMapOpen) {
                let bestP = null;
                let minA = 0.2;
                this.solarSystem.planets.forEach((p, index) => {
                    const toP = new THREE.Vector3().subVectors(p.position, this.ship.mesh.position).normalize();
                    const angle = fwd.angleTo(toP);
                    const threshold = (index === 0) ? 0.05 : minA;
                    if (angle < threshold) {
                        bestP = p;
                        if (index !== 0) minA = angle;
                    }
                });
                this.lockedTarget = bestP;
            }
        }

        // 2. ROLL
        if (this.input.keys['KeyA']) this.ship.rollVelocity += (0.04 - this.ship.rollVelocity) * 0.1;
        else if (this.input.keys['KeyD']) this.ship.rollVelocity += (-0.04 - this.ship.rollVelocity) * 0.1;
        else this.ship.rollVelocity *= 0.9;
        this.ship.mesh.rotateZ(this.ship.rollVelocity);

        // 3. THRUST & BRAKING
        let thrusterIntensity = 0;
        if (!this.input.isAutopilot) {
            const accelPower = 0.035;
            const brakePower = 0.35;
            const velAlignment = this.ship.velocity.dot(fwd);

            if (this.input.keys['ShiftLeft']) {
                this.ship.velocity.addScaledVector(fwd, accelPower);
                thrusterIntensity = 1.0;
            }
            if (this.input.keys['ControlLeft']) {
                if (velAlignment > 0.01) {
                    const brakeVec = this.ship.velocity.clone().normalize().negate();
                    this.ship.velocity.addScaledVector(brakeVec, brakePower);
                } else {
                    this.ship.velocity.addScaledVector(fwd, -accelPower);
                }
                thrusterIntensity = 0.5;
            }
            this.ship.updateThruster(thrusterIntensity, t);
        }

        // 4. PHYSICS & COLLISIONS
        this.ship.mesh.position.add(this.ship.velocity);
        this.solarSystem.planets.forEach(p => {
            const d = this.ship.mesh.position.distanceTo(p.position);
            const minSafeDist = p.userData.radius + 2; // Radius + ship size buffer

            // Solid Planet Collision
            if (d < minSafeDist) {
                const bounceVec = new THREE.Vector3().subVectors(this.ship.mesh.position, p.position).normalize();
                this.ship.mesh.position.copy(p.position).addScaledVector(bounceVec, minSafeDist);
                // Zero velocity on impact, with a tiny bounce
                this.ship.velocity.set(0, 0, 0).addScaledVector(bounceVec, 0.1);
            }

            // Gravity
            if (d < p.userData.radius * 12) {
                const force = Math.pow(p.userData.radius, 3) * 0.00000001 / Math.pow(d, 2);
                this.ship.velocity.addScaledVector(new THREE.Vector3().subVectors(p.position, this.ship.mesh.position).normalize(), force);
            }

            // Atmosphere Logic
            if (p.userData.hasAtmosphere) {
                const atmoRadius = p.userData.radius * 1.5;
                if (d < atmoRadius) {
                    const atmoDepth = (atmoRadius - d) / (atmoRadius - p.userData.radius);
                    const dragFactor = 1 - (atmoDepth * 0.05); // Reduce velocity by up to 5% per frame
                    this.ship.velocity.multiplyScalar(dragFactor);

                    // Re-entry Heat
                    if (currentSpeed > 50) {
                        const heatIntensity = Math.min(1, (currentSpeed - 50) / 300 * atmoDepth);
                        this.ship.updateHeatEffect(heatIntensity);
                    } else {
                        this.ship.updateHeatEffect(0);
                    }

                    this.atmoStatus = p.name;
                }
            }
        });
        if (!this.solarSystem.planets.some(p => this.ship.mesh.position.distanceTo(p.position) < p.userData.radius * 1.5)) {
            this.ship.updateHeatEffect(0);
            this.atmoStatus = null;
        }

        // 5. HUD & CAMERA
        if (this.lockedTarget) {
            this.ui.updateTargetOverlay(this.lockedTarget, this.ship.mesh.position);
        } else {
            this.ui.updateTargetOverlay(null);
        }

        if (this.input.isMapOpen) {
            this.handleMapMode();
        } else {
            this.handleStandardMode(t, currentSpeed);
        }

        this.ui.updateHUD(currentSpeed, this.ship.mesh.position.length(), this.atmoStatus);
        this.environment.updateSpeedLines(this.ship.mesh, currentSpeed);
    }

    handleAutopilot(t, fwd) {
        this.ui.updateAutopilotStatus(this.input.isTracking, this.input.isAutopilot);
        const shipPos = this.ship.mesh.position;
        let predictedPos = this.lockedTarget.position.clone();
        const currentVel = this.ship.velocity.clone();
        const currentSpeed = currentVel.length();

        // 1. ADVANCED TARGET CALCULATION (Shadowing System)
        const pData = this.lockedTarget.userData;
        const realTargetPos = this.lockedTarget.position;

        // Calculate Planet Velocity Vector
        let planetVel = new THREE.Vector3(0, 0, 0);
        if (pData.orbitRadius > 0) {
            const angle = t * pData.orbitSpeed;
            // Tangent vector to the orbit: v = (-sin(a), 0, cos(a)) * speedMagnitude
            planetVel.set(-Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(pData.orbitRadius * pData.orbitSpeed * 1000);
        }

        const shipToPlanet = new THREE.Vector3().subVectors(realTargetPos, shipPos).normalize();

        // Check if Planet is moving towards ship (Head-on risk)
        // Dot(PlanetVelocity, shipToPlanet) < -threshold means it's coming at us
        const isHeadOn = planetVel.dot(shipToPlanet) < -10;

        if (this.input.isAutopilot) {
            if (isHeadOn && shipPos.distanceTo(realTargetPos) < pData.radius * 5) {
                // TAIL-GATING MANEUVER: Aim for a point BEHIND the planet's path
                const tailOffset = planetVel.clone().normalize().multiplyScalar(-pData.radius * 2);
                predictedPos.copy(realTargetPos).add(tailOffset);
            } else {
                // STANDARD PREDICTION (Interception)
                const cruiseSpeedSec = Math.max(currentSpeed * 60, 2500);
                for (let i = 0; i < 5; i++) {
                    const dist = shipPos.distanceTo(predictedPos);
                    const timeToArrivalSeconds = dist / cruiseSpeedSec;
                    const futureTime = t + timeToArrivalSeconds * 1000;
                    if (pData.orbitRadius > 0) {
                        const angle = futureTime * pData.orbitSpeed;
                        predictedPos.set(Math.cos(angle) * pData.orbitRadius, 0, Math.sin(angle) * pData.orbitRadius);
                    } else break;
                }
            }
        } else {
            predictedPos.copy(realTargetPos);
        }

        const toTFull = new THREE.Vector3().subVectors(predictedPos, shipPos).normalize();

        // Jitter Filter: Higher smoothing for interception shifts
        if (!this.smoothedToT) this.smoothedToT = toTFull.clone();
        this.smoothedToT.lerp(toTFull, 0.05);
        const toT = this.smoothedToT.clone().normalize();

        // 2. DIRECTIONAL STEERING (Align -Z to target)
        // setFromUnitVectors handles the shortest path between vectors stably
        const qTarget = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), toT);

        // Lateral Damping (Kill drift)
        if (currentSpeed > 2) {
            const lateralVel = currentVel.clone().addScaledVector(toT, -currentVel.dot(toT));
            this.ship.velocity.addScaledVector(lateralVel, -0.04);
        }

        // BANK INTO TURN
        const currentRotMat = new THREE.Matrix4().makeRotationFromQuaternion(this.ship.mesh.quaternion);
        const relTarget = toT.clone().applyMatrix4(new THREE.Matrix4().copy(currentRotMat).invert());
        const yawError = -Math.atan2(relTarget.x, -relTarget.z);
        const targetRoll = Math.max(-0.5, Math.min(0.5, yawError * 2));
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), targetRoll);
        qTarget.multiply(rollQuat);

        // Ship orientation lerp
        this.ship.mesh.quaternion.slerp(qTarget, 0.06);

        // 3. AP THROTTLE & PARKING LOGIC (REWORKED)
        if (this.input.isAutopilot) {
            const shipPos = this.ship.mesh.position;
            // IMPORTANT: Use ACTUAL current position for collision distance, 
            // but keep using predictedPos for the target vector (toT).
            const realTargetPos = this.lockedTarget.position;
            const distToCenterReal = shipPos.distanceTo(realTargetPos);
            const planetRadius = this.lockedTarget.userData.radius;
            const distToSurface = distToCenterReal - planetRadius;

            // Parking target: 30% of planet radius from surface
            const targetParkDist = planetRadius * 0.3;

            const dot = fwd.dot(toT);

            // Relative speed along the REAL target vector (current pos)
            const toRealT = new THREE.Vector3().subVectors(realTargetPos, shipPos).normalize();
            const relativeSpeed = this.ship.velocity.dot(toRealT);

            // CONSTANTS
            const maxCruiseSpeed = 400;
            const brakeAcc = 0.22; // Reduced by another 30% for ultra-smooth braking
            const safetyBuffer = 800; // Increased buffer to start braking even earlier

            // Calculate braking distance needed to reach speed 0 at targetParkDist
            const brakingDistanceNeeded = (relativeSpeed * relativeSpeed) / (2 * brakeAcc);
            const brakingThreshold = targetParkDist + brakingDistanceNeeded + safetyBuffer;

            if (dot > 0.95) { // Slightly more lenient alignment for the throttle
                if (distToSurface > brakingThreshold) {
                    // CRUISE/ACCELERATION PHASE
                    if (relativeSpeed < maxCruiseSpeed) {
                        this.ship.velocity.addScaledVector(fwd, 0.05);
                        this.ship.updateThruster(1.0, t);
                    } else {
                        this.ship.updateThruster(0, t);
                    }
                } else if (distToSurface > targetParkDist) {
                    // BRAKING PHASE (Mandatory)
                    const brakeVec = this.ship.velocity.clone().normalize().negate();
                    this.ship.velocity.addScaledVector(brakeVec, brakeAcc);
                    this.ship.updateThruster(0.6, t);
                } else {
                    // PARKING ZONE
                    this.ship.velocity.multiplyScalar(0.75); // Slightly stronger stabilization
                    if (this.ship.velocity.length() < 0.1) this.ship.velocity.set(0, 0, 0);
                    this.ship.updateThruster(0, t);

                    // Corrective drift
                    const distError = distToSurface - targetParkDist;
                    if (Math.abs(distError) > 10) {
                        const correctionDir = distError > 0 ? toRealT : toRealT.clone().negate();
                        this.ship.velocity.addScaledVector(correctionDir, 0.01);
                    }
                }
            } else {
                this.ship.updateThruster(0, t);
                // Emergency brake if very close but not aligned
                if (distToSurface < brakingThreshold && relativeSpeed > 50) {
                    const brakeVec = this.ship.velocity.clone().normalize().negate();
                    this.ship.velocity.addScaledVector(brakeVec, brakeAcc);
                }
            }
        }
    }

    handleMapMode() {
        const camPos = new THREE.Vector3(0, 1000000, 0);
        this.sceneManager.camera.position.lerp(camPos, 0.05);
        this.sceneManager.camera.lookAt(0, 0, 0);
        this.ui.updateMapPointer(this.ship.mesh.position);

        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(this.input.mouse.x, this.input.mouse.y), this.sceneManager.camera);
        const hits = ray.intersectObjects(this.solarSystem.planets);

        if (hits.length > 0) {
            const planet = hits[0].object;
            this.ui.showPlanetTooltip(planet, this.input.mouse);
            if (planet.material.emissive) planet.material.emissiveIntensity = 8;
            if (this.input.mouse.clicked) {
                this.lockedTarget = planet;
                this.input.isTracking = true;
                this.input.isMapOpen = false;
                this.input.mouse.clicked = false;
            }
        } else {
            this.ui.showPlanetTooltip(null);
            this.solarSystem.planets.forEach(p => {
                if (p.userData.light) p.material.emissiveIntensity = 5;
                else if (p.material.emissive) p.material.emissiveIntensity = 0;
            });
        }
        document.getElementById('map-label').style.display = 'block';
        document.getElementById('hud-container').style.display = 'grid';
        document.getElementById('crosshair').style.display = 'none';
    }

    handleStandardMode(t, currentSpeed) {
        document.getElementById('map-label').style.display = 'none';
        document.getElementById('hud-container').style.display = 'grid';
        document.getElementById('crosshair').style.display = 'block';

        const targetFOV = 75 + Math.min(55, currentSpeed * 2);
        this.camState.fov += (targetFOV - this.camState.fov) * 0.05;
        this.sceneManager.camera.fov = this.camState.fov;
        this.sceneManager.camera.updateProjectionMatrix();

        if (this.camState.mode === 'third') {
            const fixedDist = 14;
            const camOffset = new THREE.Vector3(0, 3.5, fixedDist).applyQuaternion(this.ship.mesh.quaternion);
            this.sceneManager.camera.position.copy(this.ship.mesh.position.clone().add(camOffset));
            this.sceneManager.camera.quaternion.slerp(this.ship.mesh.quaternion, 0.25);
        } else {
            // First Person: Camera at cockpit position, slightly forward
            const camOffset = new THREE.Vector3(0, 0.45, -1.25).applyQuaternion(this.ship.mesh.quaternion);
            this.sceneManager.camera.position.copy(this.ship.mesh.position.clone().add(camOffset));
            this.sceneManager.camera.quaternion.copy(this.ship.mesh.quaternion);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.sceneManager.render();
    }
}

window.onload = () => { new Game(); };
