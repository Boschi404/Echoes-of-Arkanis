class Game {
    constructor() {
        this.sceneManager = new SceneManager();
        this.input = new InputHandler();
        this.galaxy = new GalaxyManager(this.sceneManager.scene);
        this.ship = new Ship(this.sceneManager.scene);
        this.environment = new Environment(this.sceneManager.scene);
        this.ui = new UIManager();

        this.lockedTarget = null;
        this.camState = { fov: 75, mode: 'third' };
        this.mapState = { targetPivot: new THREE.Vector3(0, 0, 0), distance: 800000, phi: Math.PI / 3, theta: 0 };

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
            document.getElementById('crosshair').style.display = 'block';
            this.ship.mesh.position.set(0, 500, 40000); // Further out for grand view
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
                const isFirstPerson = (this.camState.mode === 'first');
                this.ship.interior.visible = isFirstPerson;
                this.ship.bodyGroup.visible = !isFirstPerson; // Hide fuselage in 1st person
            }
        });
    }

    update() {
        if (!this.input.isPlaying) return;

        const t = Date.now();
        this.galaxy.update(t, this.input.isMapOpen);

        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.ship.mesh.quaternion);
        const currentSpeed = this.ship.velocity.length();

        // 1. ROTATION & TARGETING
        if (this.input.isTracking && this.lockedTarget) {
            this.handleAutopilot(t, fwd);
        } else {
            // Manual Steering
            // Manual Steering: More lumbering/heavy feel
            const sens = 0.015; // Reduced sensitivity
            const targetRX = this.input.mouse.y * sens;
            const targetRY = -this.input.mouse.x * sens;
            this.ship.rotationVelocity.x += (targetRX - this.ship.rotationVelocity.x) * 0.03; // Much slower lerp
            this.ship.rotationVelocity.y += (targetRY - this.ship.rotationVelocity.y) * 0.03;
            this.ship.mesh.rotateX(this.ship.rotationVelocity.x);
            this.ship.mesh.rotateY(this.ship.rotationVelocity.y);

            // Auto-Targeting (Only if manual steering and NOT in map)
            if (!this.input.isMapOpen) {
                let bestP = null;
                let minA = 0.2;
                this.galaxy.celestialBodies.forEach((p, index) => {
                    const pWorld = new THREE.Vector3().setFromMatrixPosition(p.matrixWorld);
                    const toP = new THREE.Vector3().subVectors(pWorld, this.ship.mesh.position).normalize();
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

        // 4. PHYSICS & COLLISIONS (SOI + REALTIME PARENTING)
        this.ship.mesh.position.add(this.ship.velocity);

        let inAtmo = false;
        const shipWorldPos = new THREE.Vector3().setFromMatrixPosition(this.ship.mesh.matrixWorld);

        this.galaxy.celestialBodies.forEach(p => {
            const planetWorldPos = new THREE.Vector3().setFromMatrixPosition(p.matrixWorld);
            const d = shipWorldPos.distanceTo(planetWorldPos);
            const pData = p.userData;

            // Sphere of Influence (SOI) Gravity
            if (d < pData.soi) {
                const gravityStrength = (pData.gravity * 200) / (d * d + 100);
                const gravityDir = new THREE.Vector3().subVectors(planetWorldPos, shipWorldPos).normalize();
                this.ship.velocity.addScaledVector(gravityDir, gravityStrength);

                // Atmosphere effect if not gas giant
                if (!pData.isGasGiant && d < pData.radius * 2) {
                    inAtmo = true;
                    this.atmoStatus = p.name;
                    // Sky Color
                    const atmoDepth = Math.max(0, (pData.radius * 2 - d) / pData.radius);
                    this.sceneManager.scene.background.lerp(p.material.color, atmoDepth * 0.05);
                }
            }

            // Solid Collision & Dynamic Parenting
            if (!pData.isGasGiant && d < pData.radius + 2) {
                // Correct position to surface
                const surfaceDir = new THREE.Vector3().subVectors(shipWorldPos, planetWorldPos).normalize();
                const targetPos = planetWorldPos.clone().addScaledVector(surfaceDir, pData.radius + 2);

                // Zero out inward velocity
                const normalVel = this.ship.velocity.dot(surfaceDir);
                if (normalVel < 0) {
                    this.ship.velocity.addScaledVector(surfaceDir, -normalVel);
                }

                // Dynamic Parenting Logic: 
                // Simplify: Just push out of surface. Complex matrix parenting causes teleportation bugs.
                this.ship.mesh.position.copy(targetPos);

                // Add friction/drag if touching surface
                this.ship.velocity.multiplyScalar(0.9);
            } else if (this.currentParentPlanet === p) {
                this.currentParentPlanet = null;
                this.lastPlanetMatrix = null;
            }
        });

        if (!inAtmo) {
            this.atmoStatus = null;
            this.sceneManager.scene.background.lerp(new THREE.Color(0x000000), 0.05);
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

        this.ui.updateHUD(currentSpeed, this.ship.mesh.position.length(), this.atmoStatus, this.ship.mesh.position);
        this.ship.updateCockpit(currentSpeed, this.lockedTarget);
        this.environment.updateSpeedLines(this.ship.mesh, currentSpeed);

        // G-Force / Direction Indicator
        // We need to pass the ship position to project it correctly from the camera view
        this.ui.updateDirectionIndicator(this.ship.velocity, this.sceneManager.camera, this.ship.mesh.position);
    }

    handleAutopilot(t, fwd) {
        this.ui.updateAutopilotStatus(this.input.isTracking, this.input.isAutopilot);
        const shipPos = this.ship.mesh.position;
        const currentVel = this.ship.velocity.clone();
        const currentSpeed = currentVel.length();

        // 1. WORLD POSITION TARGETING (Fix for Hierarchy Issues)
        const pData = this.lockedTarget.userData;

        // Get absolute world position of the target
        const realTargetPos = new THREE.Vector3();
        this.lockedTarget.getWorldPosition(realTargetPos);

        // Initialize prediction with current world pos
        let predictedPos = realTargetPos.clone();

        const shipToPlanet = new THREE.Vector3().subVectors(realTargetPos, shipPos).normalize();

        // 2. ORBITAL PREDICTION (World Space)
        // We calculate the tangent velocity vector of the planet relative to its system center
        // pData is already defined above
        const planetVel = new THREE.Vector3(0, 0, 0);

        if (this.input.isAutopilot && pData.orbitSpeed) {
            // To calculate tangent, we need vector from Star to Planet
            // Parent is the System Group (Star is at 0,0,0 of system group usually, or close)
            // Let's use world positions of Parent vs Target
            const parent = this.lockedTarget.parent;
            if (parent) {
                const parentPos = new THREE.Vector3();
                parent.getWorldPosition(parentPos);

                const radiusVector = new THREE.Vector3().subVectors(realTargetPos, parentPos);
                const angle = t * pData.orbitSpeed; // Approximate current angle logic from update

                // Velocity direction is cross product of up (0,1,0) and radius, scaled by speed
                // V = Omega x R
                const up = new THREE.Vector3(0, 1, 0);
                planetVel.crossVectors(up, radiusVector).normalize();

                // Speed is roughly: angularSpeed * dist
                const speedVal = pData.orbitSpeed * pData.orbitDist;
                planetVel.multiplyScalar(speedVal * 1000); // Scale factor for prediction magnitude
            }

            // Check for Head-on collision risk
            const isHeadOn = planetVel.dot(shipToPlanet) < -50;

            if (isHeadOn && shipPos.distanceTo(realTargetPos) < pData.radius * 8) {
                // Shadow/Tail-gating: Aim behind
                const tailOffset = planetVel.clone().normalize().multiplyScalar(-pData.radius * 4);
                predictedPos.add(tailOffset);
            } else {
                // Lead the target
                const dist = shipPos.distanceTo(realTargetPos);
                const cruiseSpeed = 500; // Est average speed
                const timeToTarget = dist / cruiseSpeed;
                // Add displacement: V * t
                const leadVec = planetVel.clone().multiplyScalar(timeToTarget * 0.01); // Minimal prediction to prevent jitter
                predictedPos.add(leadVec);
            }
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
            this.ship.velocity.addScaledVector(lateralVel, -0.01); // Smoother drift correction
        }

        // BANK INTO TURN
        const currentRotMat = new THREE.Matrix4().makeRotationFromQuaternion(this.ship.mesh.quaternion);
        const relTarget = toT.clone().applyMatrix4(new THREE.Matrix4().copy(currentRotMat).invert());
        const yawError = -Math.atan2(relTarget.x, -relTarget.z);
        const targetRoll = Math.max(-0.5, Math.min(0.5, yawError * 2));
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), targetRoll);
        qTarget.multiply(rollQuat);

        // Ship orientation lerp - Slower for a heavier feel
        this.ship.mesh.quaternion.slerp(qTarget, 0.025);

        // 3. AP THROTTLE & PARKING LOGIC (REWORKED)
        if (this.input.isAutopilot) {
            const shipPos = this.ship.mesh.position;
            // IMPORTANT: Use ACTUAL current world position for collision distance
            const realTargetPos = new THREE.Vector3();
            this.lockedTarget.getWorldPosition(realTargetPos);
            const distToCenterReal = shipPos.distanceTo(realTargetPos);
            const planetRadius = this.lockedTarget.userData.radius;
            const distToSurface = distToCenterReal - planetRadius;

            // Parking target: 30% of planet radius from surface
            const targetParkDist = planetRadius * 0.3;

            const dot = fwd.dot(toT);

            // Relative speed along the REAL target vector (current pos)
            // Fix: Account for Planet's own velocity to handle head-on closing speed correctly
            // Closing Speed = (ShipVel - PlanetVel) dot (DirectionToTarget)
            const closingVelocity = this.ship.velocity.clone().sub(planetVel);
            const relativeSpeed = closingVelocity.dot(toRealT);

            // CONSTANTS - EARLY & STRONG BRAKES
            const maxCruiseSpeed = 300; // Slower cruise for control
            const brakeAcc = 0.6; // Strong physical brakes
            const safetyBuffer = 4000; // Huge buffer to start checking early

            // Calculate braking distance needed to reach speed 0 at targetParkDist
            // We multiply by 1.5 to pretend we need MORE space, triggering brakes earlier
            const brakingDistanceNeeded = ((relativeSpeed * relativeSpeed) / (2 * brakeAcc)) * 1.5;
            const brakingThreshold = targetParkDist + brakingDistanceNeeded + safetyBuffer;

            if (dot > 0.95) {
                const distToPark = distToSurface - targetParkDist;

                if (distToSurface > brakingThreshold) {
                    // CRUISE PHASE: Gradually reach max cruise speed
                    if (relativeSpeed < maxCruiseSpeed) {
                        const accelFactor = Math.min(1, (maxCruiseSpeed - relativeSpeed) / 50);
                        this.ship.velocity.addScaledVector(fwd, 0.05 * accelFactor);
                        this.ship.updateThruster(accelFactor, t);
                    } else {
                        this.ship.updateThruster(0, t);
                    }
                } else if (distToPark > 10) {
                    // SMOOTH BRAKING PHASE
                    // Calculate desired speed based on distance remaining to park
                    const speedRatio = Math.max(0, distToPark / brakingThreshold);
                    const targetSpeed = maxCruiseSpeed * speedRatio;

                    if (relativeSpeed > targetSpeed) {
                        const brakeVec = this.ship.velocity.clone().normalize().negate();
                        this.ship.velocity.addScaledVector(brakeVec, brakeAcc);
                        this.ship.updateThruster(0.3 + (relativeSpeed / maxCruiseSpeed) * 0.7, t);
                    } else {
                        this.ship.updateThruster(0, t);
                    }
                } else {
                    // PARKING STABILIZATION (Match Orbital Velocity)
                    // Instead of stopping completely, we match the planet's speed to stay in sync
                    this.ship.velocity.lerp(planetVel, 0.05);
                    this.ship.updateThruster(0, t);

                    // Gentle corrective drift
                    const correctionPower = Math.min(0.02, Math.abs(distToPark) * 0.0001);
                    const correctionDir = distToPark > 0 ? toRealT : toRealT.clone().negate();
                    this.ship.velocity.addScaledVector(correctionDir, correctionPower);
                }
            } else {
                this.ship.updateThruster(0, t);
                if (distToSurface < brakingThreshold && relativeSpeed > 50) {
                    const brakeVec = this.ship.velocity.clone().normalize().negate();
                    this.ship.velocity.addScaledVector(brakeVec, brakeAcc * 1.5);
                }
            }
        }
    }

    handleMapMode() {
        // ALWAYS Center on Ship
        this.mapState.targetPivot.copy(this.ship.mesh.position);

        // 1. INPUT FOR MAP NAVIGATION
        const scrollSens = 0.15;
        const dragSens = 0.005;

        // Zoom (Distance)
        if (this.input.keys['Equal'] || this.input.keys['NumpadAdd']) this.mapState.distance *= (1 - scrollSens);
        if (this.input.keys['Minus'] || this.input.keys['NumpadSubtract']) this.mapState.distance *= (1 + scrollSens);
        this.mapState.distance = Math.max(50000, Math.min(2000000, this.mapState.distance));

        // Pan/Rotate logic
        // Pan/Rotate logic
        if (!this.lastMouse) this.lastMouse = { x: 0, y: 0 };
        if (typeof this.isDraggingMap === 'undefined') this.isDraggingMap = false;

        // Pan/Rotate logic with Mouse Drag
        if (this.input.mouse.clicked) {
            const dx = this.input.mouse.x - this.lastMouse.x;
            const dy = this.input.mouse.y - this.lastMouse.y;

            // Threshold to consider it a drag
            if (this.isDraggingMap || Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) {
                this.isDraggingMap = true;
                this.mapState.theta -= dx * 1.5;
                this.mapState.phi += dy * 1.5;
                this.mapState.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.mapState.phi));
            }
        } else {
            this.isDraggingMap = false;
        }
        this.lastMouse.x = this.input.mouse.x;
        this.lastMouse.y = this.input.mouse.y;

        // Keys fallback
        if (this.input.keys['ArrowLeft']) this.mapState.theta -= 0.05;
        if (this.input.keys['ArrowRight']) this.mapState.theta += 0.05;

        // 2. CAMERA POSITIONING (Spherical Coordinates)
        const x = this.mapState.distance * Math.sin(this.mapState.phi) * Math.cos(this.mapState.theta);
        const y = this.mapState.distance * Math.cos(this.mapState.phi);
        const z = this.mapState.distance * Math.sin(this.mapState.phi) * Math.sin(this.mapState.theta);

        const targetPos = new THREE.Vector3(x, y, z).add(this.mapState.targetPivot);
        this.sceneManager.camera.position.lerp(targetPos, 0.1);
        this.sceneManager.camera.lookAt(this.mapState.targetPivot);

        // 3. SELECTION LOGIC
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(this.input.mouse.x, this.input.mouse.y), this.sceneManager.camera);

        // Intersect markers first
        const markers = this.galaxy.celestialBodies.map(p => p.userData.marker).filter(m => m);
        const markerHits = ray.intersectObjects(markers);

        const planetsToTarget = this.galaxy.celestialBodies;
        const planetHits = ray.intersectObjects(planetsToTarget);

        if (markerHits.length > 0 || planetHits.length > 0) {
            const hit = markerHits.length > 0 ? markerHits[0] : planetHits[0];
            // Marker is child of Planet Mesh, so hit.object.parent is the Planet
            const planet = markerHits.length > 0 ? hit.object.parent : hit.object;

            this.ui.showPlanetTooltip(planet, this.input.mouse);

            if (this.input.mouse.clicked && !this.isDraggingMap) {
                this.lockedTarget = planet;
                this.input.isTracking = true;
                this.input.isMapOpen = false;
                this.input.mouse.clicked = false;
            }
        } else {
            this.ui.showPlanetTooltip(null);
        }

        this.ui.updateMapPointer(this.ship.mesh.position, this.sceneManager.camera, this.mapState.targetPivot);
        document.getElementById('map-label').style.display = 'block';
        document.getElementById('hud-container').style.display = 'grid';
        document.getElementById('crosshair').style.display = 'none';
    }

    handleStandardMode(t, currentSpeed) {
        document.getElementById('map-label').style.display = 'none';
        this.ui.hidePlanetTooltip();

        // Fix: Hide map pointer when not in map mode
        const mapPointer = document.getElementById('map-pointer');
        if (mapPointer) mapPointer.style.display = 'none';

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
            // First Person: Positioned in the pilot seat, eyes slightly up
            const camOffset = new THREE.Vector3(0, 0.2, -1.3).applyQuaternion(this.ship.mesh.quaternion);
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
