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

        // Ship status: 'manual', 'auto-pilot', 'coasting', 'landing'
        this.shipState = 'manual';
        this._landingActive = false;
        this._landingTarget = null;
        this._canLand = false; // flag to allow P to start landing immediately after arrival
        this._shipLanded = false; // whether ship is landed and parented to a planet
        this._landedOn = null; // reference to planet when landed

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
            this.ship.mesh.position.set(0, 500, 150000); // 150k is safe and clear
        };

        document.getElementById('start-btn').addEventListener('click', startGame);
        document.getElementById('settings-toggle-btn').addEventListener('click', toggleSettings);
        document.getElementById('settings-close-btn').addEventListener('click', toggleSettings);

        window.addEventListener('keydown', (e) => {
            if (!this.input.isPlaying) return;

            if (e.code === 'KeyL') {
                if (!this.lockedTarget) return;
                this.input.isTracking = !this.input.isTracking;
                if (!this.input.isTracking) this.input.isAutopilot = false;
                // Update AP UI immediately
                this.ui.updateAutopilotStatus(this.input.isTracking, this.input.isAutopilot);
            }
            if (e.code === 'KeyO') {
                if (this.input.isTracking) {
                    this.input.isAutopilot = !this.input.isAutopilot;
                    this.shipState = this.input.isAutopilot ? 'auto-pilot' : 'manual';
                    this.ui.showShipStatus(this.shipState);
                    // Ensure AP UI toggles immediately
                    this.ui.updateAutopilotStatus(this.input.isTracking, this.input.isAutopilot);
                }
            }
            if (e.code === 'KeyV') {
                this.camState.mode = (this.camState.mode === 'third') ? 'first' : 'third';
                const isFirstPerson = (this.camState.mode === 'first');
                this.ship.interior.visible = isFirstPerson;
                this.ship.bodyGroup.visible = !isFirstPerson; // Hide fuselage in 1st person
            }

            // Press 'P' to land when in coasting mode (or shortly after arrival)
            if (e.code === 'KeyP') {
                console.debug('KeyP pressed, shipState=', this.shipState, '_canLand=', this._canLand, 'lockedTarget=', this.lockedTarget ? this.lockedTarget.name : 'NULL');
                if ((this.shipState === 'coasting' || this._canLand) && this.lockedTarget) {
                    this.startLanding();
                }
            }
        });

        // Show initial ship state on HUD
        this.ui.showShipStatus(this.shipState);
    }

    getAimedTarget(fwd) {
        if (!fwd) fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.ship.mesh.quaternion);
        let bestP = null;
        let minA = 0.2;
        for (let i = 0; i < this.galaxy.celestialBodies.length; i++) {
            const p = this.galaxy.celestialBodies[i];
            const pWorld = new THREE.Vector3().setFromMatrixPosition(p.matrixWorld);
            const toP = new THREE.Vector3().subVectors(pWorld, this.ship.mesh.position).normalize();
            const angle = fwd.angleTo(toP);
            const threshold = (i === 0) ? 0.05 : minA;
            if (angle < threshold) {
                bestP = p;
                if (i !== 0) minA = angle;
            }
        }
        return bestP;
    }

    setLockedTarget(target) {
        if (!target) {
            this.lockedTarget = null;
            return;
        }

        // If target is a moon/satellite, prefer locking to its parent planet to avoid AP issues
        let normalized = target;
        if (target.userData && target.userData.isMoon) {
            normalized = target.userData.parentBody || target.parent || target;
            console.info(`Lock normalized: satellite ${target.name} -> ${normalized.name || 'UNKNOWN'}`);
        }

        this.lockedTarget = normalized;
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
                this.setLockedTarget(bestP);
            }
        }

        // 2. ROLL
        if (this.input.keys['KeyA']) this.ship.rollVelocity += (0.04 - this.ship.rollVelocity) * 0.1;
        else if (this.input.keys['KeyD']) this.ship.rollVelocity += (-0.04 - this.ship.rollVelocity) * 0.1;
        else this.ship.rollVelocity *= 0.9;
        this.ship.mesh.rotateZ(this.ship.rollVelocity);

        // 3. THRUST & BRAKING
        let thrusterIntensity = 0;
        // If ship is landed/parented, skip manual thrust & physics updates
        if (!this._shipLanded && !this.input.isAutopilot) {
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
        } else if (this._shipLanded) {
            // ensure thruster visuals off
            this.ship.updateThruster(0, t);
        }

        // 4. PHYSICS & COLLISIONS (SOI + REALTIME PARENTING)
        // If landed, the ship is parented and we should not apply physics-based position updates
        if (!this._shipLanded) {
            this.ship.mesh.position.add(this.ship.velocity);
        }

        let inAtmo = false;
        this.ship.mesh.updateMatrixWorld();
        const shipWorldPos = new THREE.Vector3();
        this.ship.mesh.getWorldPosition(shipWorldPos);

        this.galaxy.celestialBodies.forEach(p => {
            const planetWorldPos = new THREE.Vector3().setFromMatrixPosition(p.matrixWorld);
            const d = shipWorldPos.distanceTo(planetWorldPos);
            const pData = p.userData;

            // Sphere of Influence (SOI) Gravity
            if (d < pData.soi) {
                const gravityStrength = (pData.gravity * 20) / (d * d + 100);
                const gravityDir = new THREE.Vector3().subVectors(planetWorldPos, shipWorldPos).normalize();
                this.ship.velocity.addScaledVector(gravityDir, gravityStrength);

                // Atmosphere effect (Planets/Moons only, not Stars)
                if (pData.type !== 'star' && !pData.isGasGiant && d < pData.radius * 2) {
                    inAtmo = true;
                    this.atmoStatus = p.name;
                    // Sky Color
                    const atmoDepth = Math.max(0, (pData.radius * 2 - d) / pData.radius);
                    this.sceneManager.scene.background.lerp(p.material.color, atmoDepth * 0.05);

                    // If the planet has an atmosphere mesh, make it more transparent from inside and less outside (smooth lerp)
                    if (p.userData && p.userData.atmoMesh && p.userData.atmoMesh.material) {
                        const mat = p.userData.atmoMesh.material;
                        const targetOpacity = 0.10; // 90% transparent from inside
                        mat.opacity += (targetOpacity - mat.opacity) * 0.12; // smooth fade
                    }
                } else {
                    // If we have an atmosphere mesh and we're outside, ensure it's more visible
                    if (p.userData && p.userData.atmoMesh && p.userData.atmoMesh.material) {
                        const mat = p.userData.atmoMesh.material;
                        const targetOpacity = 0.35; // more visible from outside
                        mat.opacity += (targetOpacity - mat.opacity) * 0.06;
                    }
                }
            }

            // Solid Collision & Dynamic Parenting
            if (!pData.isGasGiant && d < pData.radius + 2) {
                // Correct position to surface
                let surfaceDir = new THREE.Vector3().subVectors(shipWorldPos, planetWorldPos);
                if (surfaceDir.lengthSq() < 0.0001) surfaceDir.set(0, 1, 0); // Safety for center overlap
                surfaceDir.normalize();

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
            this.ui.updateTargetOverlay(this.lockedTarget, this.ship.mesh.position, this.sceneManager.camera);
        } else {
            this.ui.updateTargetOverlay(null, null, this.sceneManager.camera);
        }

        // Aim label: show when a target is within angular auto-targeting criterion (no planet overlay)
        if (!this.input.isMapOpen) {
            const aimed = this.getAimedTarget(fwd);
            if (aimed && aimed.name) {
                this.ui.showAimLabel(aimed, this.sceneManager.camera);
            } else {
                this.ui.hideAimLabel();
            }
        } else {
            this.ui.hideAimLabel();
        }

        if (this.input.isMapOpen) {
            this.handleMapMode();
        } else {
            this.handleStandardMode(t, currentSpeed);
        }

        // Pass locked target so HUD can show reference distance/name instead of assuming a single star
        // Use world position for UI and proximity updates (robust when ship is parented)
        this.ship.mesh.getWorldPosition(shipWorldPos);
        this.ui.updateHUD(currentSpeed, this.lockedTarget, this.atmoStatus, shipWorldPos);
        // Update proximity shadow each frame (visual aid for distance to locked target)
        try { this.ui.updateProximity(this.lockedTarget, shipWorldPos, this.sceneManager.camera); } catch (e) {}
        this.ship.updateCockpit(currentSpeed, this.lockedTarget);
        this.environment.updateSpeedLines(this.ship.mesh, currentSpeed);

        // Landing handler (runs earlier to react to landing inputs)
        if (this._landingActive) {
            this.handleLanding(t);
        }

        // G-Force / Direction Indicator
        // We need to pass the ship position to project it correctly from the camera view
        this.ui.updateDirectionIndicator(this.ship.velocity, this.sceneManager.camera, this.ship.mesh.position);

        // Sync ship state with current inputs and autopilot/landing state
        let desiredState = this.shipState;
        if (this._landingActive) {
            desiredState = 'landing';
        } else if (this.shipState === 'coasting') {
            // Preserve coasting unless player applies input (thrust) — do not overwrite with tracking
            if (this.input.keys['ShiftLeft'] || this.input.keys['ControlLeft']) {
                desiredState = 'manual';
            } else {
                desiredState = 'coasting';
            }
        } else if (this.input.isAutopilot) {
            desiredState = 'auto-pilot';
        } else if (this.input.isTracking && !this.input.isAutopilot) {
            desiredState = 'tracking';
        } else {
            desiredState = 'manual';
        }

        if (desiredState !== this.shipState) {
            // If switching away from coasting, consume the landing opportunity
            if (this.shipState === 'coasting' && desiredState !== 'coasting') {
                this._canLand = false;
            }
            this.shipState = desiredState;
            this.ui.showShipStatus(desiredState);
        }
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

        const shipToPlanetVec = new THREE.Vector3().subVectors(realTargetPos, shipPos);
        const distPlanet = shipToPlanetVec.length();
        const shipToPlanet = distPlanet < 0.0001 ? new THREE.Vector3(0, 0, -1) : shipToPlanetVec.divideScalar(distPlanet);

        // 2. ORBITAL PREDICTION (World Space)
        // We calculate the tangent velocity vector of the planet relative to its system center
        // pData is already defined above
        // Compute planet instantaneous velocity per frame by sampling next orbital position
        const planetVel = new THREE.Vector3(0, 0, 0);

        if (this.input.isAutopilot && pData.orbitSpeed) {
            const parent = this.lockedTarget.parent;
            if (parent) {
                const parentPos = new THREE.Vector3();
                parent.getWorldPosition(parentPos);

                const orbitDist = this.lockedTarget.userData.orbitDist || pData.orbitDist || 0;
                const curAngle = this.lockedTarget.userData.angle || 0;
                const nextAngle = curAngle + (this.lockedTarget.userData.orbitSpeed || pData.orbitSpeed || 0);

                const curPos = realTargetPos.clone();
                const nextPos = new THREE.Vector3(
                    Math.cos(nextAngle) * orbitDist,
                    0,
                    Math.sin(nextAngle) * orbitDist
                ).add(parentPos);

                planetVel.copy(nextPos.sub(curPos)); // Per-frame delta position as velocity approximation
            }

            // Check for Head-on collision risk (use small threshold since planetVel is per-frame)
            const isHeadOn = planetVel.dot(shipToPlanet) < -0.5;

            if (isHeadOn && shipPos.distanceTo(realTargetPos) < pData.radius * 8) {
                // Shadow/Tail-gating: Aim behind
                const tailDir = planetVel.lengthSq() > 0 ? planetVel.clone().normalize() : new THREE.Vector3(0, 0, 1);
                const tailOffset = tailDir.multiplyScalar(-pData.radius * 4);
                predictedPos.add(tailOffset);
            } else {
                // Lead the target
                const dist = shipPos.distanceTo(realTargetPos);
                // Estimate cruise speed for lead calculation: prefer ship speed or planet speed, allow high speeds
                const estCruise = Math.max(currentSpeed, planetVel.length(), 500);
                const timeToTarget = dist / Math.max(estCruise, 1);
                // Add displacement: V * t (small factor to avoid jitter)
                const leadVec = planetVel.clone().multiplyScalar(timeToTarget * 0.02); // increased lead factor
                predictedPos.add(leadVec);
            }
        }

        const toTFullVec = new THREE.Vector3().subVectors(predictedPos, shipPos);
        const distFull = toTFullVec.length();
        const toTFull = distFull < 0.0001 ? new THREE.Vector3(0, 0, -1) : toTFullVec.divideScalar(distFull);

        // Jitter Filter: Higher smoothing for interception shifts
        if (!this.smoothedToT) this.smoothedToT = toTFull.clone();
        this.smoothedToT.lerp(toTFull, 0.05);

        const toT = this.smoothedToT.length() < 0.0001 ? new THREE.Vector3(0, 0, -1) : this.smoothedToT.clone().normalize();

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

            // Desired orbital radius: keep ship at 3x diameter (6x radius) from planet center
            const desiredOrbitRadius = planetRadius * 6;

            const dot = fwd.dot(toT);

            // Relative velocity vector (ship velocity relative to planet)
            const relativeVelocity = this.ship.velocity.clone().sub(planetVel);

            // Direction to target (for calculating approach component)
            const toRealTVec = new THREE.Vector3().subVectors(realTargetPos, shipPos);
            const distRealT = toRealTVec.length();
            const toRealT = distRealT < 0.0001 ? new THREE.Vector3(0, 0, -1) : toRealTVec.divideScalar(distRealT);

            // Decompose relative velocity into radial (toward/away from target) and tangential components
            const radialSpeed = relativeVelocity.dot(toRealT); // positive when closing
            const radialVelVec = toRealT.clone().multiplyScalar(radialSpeed);
            const tangentialVelVec = relativeVelocity.clone().sub(radialVelVec);

            // Speed along approach direction (for distance calculations)
            const closingSpeed = radialSpeed;

            // Total relative speed (magnitude of relative velocity vector)
            const relativeSpeed = relativeVelocity.length();

            // PHYSICS-BASED BRAKING CONSTANTS (Tuned for smooth, gradual approach)
            const brakeAcc = 0.35; // Gentler brake acceleration for smoother deceleration
            const safetyMargin = 1.8; // Larger margin = earlier, more gradual braking

            // Calculate EXACT braking distance needed to stop from current closing speed
            // Using kinematic equation: d = v² / (2a)
            const brakingDistanceNeeded = (closingSpeed * closingSpeed) / (2 * brakeAcc);
            const safeBrakingDistance = brakingDistanceNeeded * safetyMargin;

            // Distance from current position to parking point (relative to desired orbital radius)
            const distToPark = distToCenterReal - desiredOrbitRadius;

            if (dot > 0.95) {
                // Ship is pointing at target

                if (distToPark > safeBrakingDistance && closingSpeed > 0) {
                    // COAST/CRUISE PHASE - We're far enough that we don't need to brake yet
                    // Compute desired radial approach speed based on planet motion and ship speed
                    const planetApproach = planetVel.dot(toRealT);
                    const desiredClosingSpeed = (planetApproach > 0) ? Math.max(planetApproach * 0.5, 5) : Math.max(2, Math.min(50, currentSpeed * 0.05));
                    const targetApproachSpeed = Math.max(desiredClosingSpeed, planetVel.length() * 0.2, 10);

                    // If we're far and well-aligned with the target, allow stronger forward thrust (near full gas)
                    if (distToPark > safeBrakingDistance * 3 && dot > 0.95) {
                        // Strong forward push to close large distances quickly
                        const forwardBurst = 0.28; // stronger tuned burst magnitude
                        this.ship.velocity.addScaledVector(fwd, forwardBurst);
                        this.ship.updateThruster(1.0, t);
                    }

                    // Check whether we're drifting away while coasting; if so, apply a small radial correction toward planet
                    const prevDist = this._lastTargetDist || distToCenterReal;
                    const distDelta = distToCenterReal - prevDist; // positive if moving away
                    if (distDelta > 0.5) {
                        const approachBoost = Math.min(0.12, distDelta * 0.003 + 0.02);
                        // Apply correction TOWARD the planet (toRealT points TOWARD planet)
                        this.ship.velocity.addScaledVector(toRealT, approachBoost);
                        this.ship.updateThruster(Math.min(0.9, approachBoost * 8), t);
                    }

                    if (closingSpeed < targetApproachSpeed) {
                        // Allow controlled acceleration towards targetApproachSpeed (radial component)
                        const needed = targetApproachSpeed - closingSpeed;
                        // Stronger accel when we are far (to cover distance faster)
                        let accelFactor = Math.min(0.4, needed * 0.006 + 0.03);
                        if (distToPark > safeBrakingDistance * 3) {
                            accelFactor = Math.min(0.6, accelFactor * 2.0);
                        }
                        // Prefer changing radial speed directly (clamped)
                        // Add a slight forward component along ship forward as well to help cover distance
                        this.ship.velocity.addScaledVector(toRealT, accelFactor);
                        this.ship.velocity.addScaledVector(fwd, Math.min(0.12, accelFactor * 0.5));
                        this.ship.updateThruster(Math.min(1.0, accelFactor * 6), t);
                    } else {
                        // Maintain or slightly match tangential velocity to follow planet
                        const tangent = planetVel.clone();
                        const tangentLen = tangent.length();
                        if (tangentLen > 0.001) {
                            const tangentDir = tangent.clone().divideScalar(tangentLen);
                            const shipTangComp = tangentDir.clone().multiplyScalar(this.ship.velocity.dot(tangentDir));
                            const tangDiff = tangent.clone().sub(shipTangComp);
                            this.ship.velocity.addScaledVector(tangDiff, 0.001);
                        }
                        this.ship.updateThruster(0, t);
                    }

                } else if (distToPark > 10) {
                    // ACTIVE BRAKING PHASE
                    // Determine target closing speed to match planet tangential motion rather than full stop
                    const planetApproach = planetVel.dot(toRealT);
                    const desiredClosingSpeed = (planetApproach > 0) ? Math.max(planetApproach * 0.5, 5) : Math.max(2, Math.min(50, currentSpeed * 0.05));
                    // Distance needed to reduce from current closingSpeed to desiredClosingSpeed
                    const deltaV = Math.max(0, closingSpeed - desiredClosingSpeed);
                    const brakingDistanceToTarget = (deltaV * deltaV) / (2 * brakeAcc);

                    if (closingSpeed > desiredClosingSpeed + 1) {
                        // Apply radial brakes (most effective) to reduce approach speed smoothly
                        if (radialSpeed > desiredClosingSpeed + 0.5) {
                            const radialBrakeStrength = Math.min(brakeAcc * 1.4, (radialSpeed - desiredClosingSpeed) * 0.02 + brakeAcc * 0.2);
                            this.ship.velocity.addScaledVector(toRealT.clone().negate(), radialBrakeStrength);
                        }

                        // Damp tangential component to prevent lateral drift
                        const tangLen = tangentialVelVec.length();
                        if (tangLen > 0.05) {
                            const tangDamp = Math.min(0.08, tangLen * 0.01 + 0.002);
                            this.ship.velocity.addScaledVector(tangentialVelVec.clone().negate().normalize(), tangDamp);
                        }

                        // Visual feedback - thruster intensity based on braking effort
                        const brakeIntensity = Math.min(1.0, (closingSpeed - desiredClosingSpeed) / 200);
                        this.ship.updateThruster(brakeIntensity, t);

                        // Also start blending tangential velocity toward planet orbital velocity for smoother match
                        this.ship.velocity.lerp(planetVel, 0.002);
                    } else if (closingSpeed < desiredClosingSpeed * 0.8) {
                        // We're going too slow - gentle acceleration to maintain approach
                        this.ship.velocity.addScaledVector(toRealT, 0.02);
                        this.ship.updateThruster(0.2, t);
                    } else {
                        // Speed close to desired: gently align tangential velocity
                        this.ship.velocity.lerp(planetVel, 0.005);
                        this.ship.updateThruster(0, t);
                    }

                } else {
                    // FINAL PARKING STABILIZATION (< 10 units from target)
                    // Very gradual velocity matching for smooth final approach
                    this.ship.velocity.lerp(planetVel, 0.03);
                    this.ship.updateThruster(0, t);

                    // Fine-tune velocity toward planet orbital velocity for docking: stronger blending when very close
                    const blend = Math.min(0.12, 0.03 + (10 - Math.max(0, distToPark)) * 0.01);
                    this.ship.velocity.lerp(planetVel, blend);

                    // Fine position correction to maintain exact parking distance
                    if (Math.abs(distToPark) > 1) {
                        const correctionPower = Math.min(0.005, Math.abs(distToPark) * 0.0003);
                        const correctionDir = distToPark > 0 ? toRealT : toRealT.clone().negate();
                        this.ship.velocity.addScaledVector(correctionDir, correctionPower);
                    }

                    // Ensure the ship maintains the orbital offset around the planet: compute desired orbital position and apply a gentle positional correction
                    if (this.lockedTarget) {
                        const desiredPos = realTargetPos.clone().addScaledVector(shipPos.clone().sub(realTargetPos).normalize(), desiredOrbitRadius);
                        const posError = new THREE.Vector3().subVectors(desiredPos, shipPos);
                        const posErrLen = posError.length();
                        if (posErrLen > 0.1) {
                            // Apply a small velocity correction proportional to positional error (tuned low to avoid oscillation)
                            let correctionVel = posError.clone().multiplyScalar(0.004);
                            // Cap correction magnitude so we don't suddenly reverse at high speed
                            const maxCorr = 0.25;
                            if (correctionVel.length() > maxCorr) correctionVel.setLength(maxCorr);
                            this.ship.velocity.add(correctionVel);
                        }

                        // Continuous distance maintenance: if distance deviates from desired by more than threshold, apply a small capped radial correction
                        const desiredDist = desiredOrbitRadius; // now use desired orbit radius
                        const distError = distToCenterReal - desiredDist; // positive => too far
                        const errThresh = 0.6;
                        if (Math.abs(distError) > errThresh) {
                            const kp = 0.01; // stronger proportional gain for faster correction
                            const maxRadCorr = 0.25;
                            const corr = Math.min(maxRadCorr, Math.abs(distError) * kp);
                            // Apply correction toward or away from planet
                            const corrVec = (distError > 0) ? toRealT.clone().multiplyScalar(-corr) : toRealT.clone().multiplyScalar(corr);
                            this.ship.velocity.add(corrVec);

                            // If we're too far, also add a small forward push to close faster
                            if (distError > errThresh) {
                                const farPush = Math.min(0.3, distError * 0.02);
                                this.ship.velocity.addScaledVector(fwd, farPush);
                            }

                            // Also try to align tangential velocity to match orbital angular speed at the desired radius
                            const parent = this.lockedTarget.parent;
                            if (parent) {
                                const omega = (this.lockedTarget.userData.orbitSpeed || pData.orbitSpeed || 0); // radians/frame
                                const desiredTangentialSpeed = omega * desiredOrbitRadius; // units/frame
                                const shipRadDir = shipPos.clone().sub(realTargetPos).normalize();
                                const tangentDir = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), shipRadDir).normalize();
                                const currentTang = this.ship.velocity.dot(tangentDir);
                                const tangError = desiredTangentialSpeed - currentTang;
                                // Apply a small corrective impulse along tangent
                                this.ship.velocity.addScaledVector(tangentDir, Math.max(-0.2, Math.min(0.2, tangError * 0.08)));
                            }
                        }

                        // If we're within a tight stabilization band, consider arriving — disable autopilot and enter coasting
                        const arrivalThresh = 1.8; // meters from parking radius
                        const velThresh = 1.5; // small residual speed

                        // If we're **deep inside** the desired orbit (negative distToPark), gently back away
                        // This avoids being stuck inside the parking radius without ever entering COASTING
                        if (distToPark < -10) {
                            const backOffMag = Math.min(0.6, Math.abs(distToPark) * 0.005 + 0.02);
                            const awayVec = toRealT.clone().negate(); // toRealT points toward planet; negate -> away
                            this.ship.velocity.addScaledVector(awayVec, backOffMag);
                            this.ship.updateThruster(Math.min(0.8, backOffMag * 1.8), t);
                            console.info('AP: Backing off from inside desired radius', { distToPark: distToPark.toFixed(2), backOffMag: backOffMag.toFixed(3) });
                        }

                        // Diagnostic print of arrival criteria when close enough to observe.
                        // This prints a checklist with ✅/❌ so you can see which criterion fails.
                        if (Math.abs(distToPark) < 50) {
                            const mark = v => v ? '✅' : '❌';
                            console.info(`Arrivo criteri:\ncriterio 1 - Orientamento (dot > 0.95): ${mark(dot > 0.95)}\ncriterio 2 - Distanza (|distToPark| < ${arrivalThresh}): ${mark(Math.abs(distToPark) < arrivalThresh)}\ncriterio 3 - Velocità relativa (relativeSpeed < ${velThresh}): ${mark(relativeSpeed < velThresh)}\ncriterio 4 - Autopilota attivo (isAutopilot): ${mark(!!this.input.isAutopilot)}\n---\nvalori: dot=${dot.toFixed(3)}, distToPark=${distToPark.toFixed(3)}, relativeSpeed=${relativeSpeed.toFixed(3)}, radialSpeed=${radialSpeed.toFixed(3)}, isAutopilot=${!!this.input.isAutopilot}`);
                        }

                        // More permissive arrival: allow entering COASTING when slightly inside the desired radius
                        const arrivalInsideTolerance = 12; // units inside the desired parking radius we'll accept
                        const withinArrival = (Math.abs(distToPark) < arrivalThresh) ||
                                              (distToPark < 0 && Math.abs(distToPark) < arrivalInsideTolerance && Math.abs(radialSpeed) < 0.6 && relativeSpeed < velThresh && dot > 0.95);

                        if (withinArrival && this.input.isAutopilot) {
                            const via = (Math.abs(distToPark) < arrivalThresh) ? 'exact' : 'inside-tolerance';

                            // Disable autopilot and show coasting state
                            this.input.isAutopilot = false;
                            // Ensure tracking stays enabled for coasting behavior
                            this.input.isTracking = true;

                            // Set state and allow landing while in coasting
                            this.shipState = 'coasting';
                            this._canLand = true;
                            // Match planet motion quickly so we coast with the planet instead of drift
                            try {
                                this.ship.velocity.lerp(planetVel, 0.6);
                            } catch (e) {}
                            this.ui.showShipStatus('coasting');
                            this.ui.showLandHint();

                            // Update AP UI immediately (show TRACKING but not FULL AP)
                            this.ui.updateAutopilotStatus(this.input.isTracking, this.input.isAutopilot);

                            console.info('Autopilot disabled: arrived and entered COASTING (via ' + via + ')');
                            console.debug('AP arrival: distToPark=', distToPark.toFixed(3), 'relativeSpeed=', relativeSpeed.toFixed(3), '_canLand=', this._canLand, 'radialSpeed=', radialSpeed.toFixed(3));
                        }
                    }
                }
            } else {
                // Ship not pointing at target - turn first, no thrust
                this.ship.updateThruster(0, t);

                // Emergency brake if we're approaching too fast at wrong angle
                if (distToPark < safeBrakingDistance && closingSpeed > 100) {
                    const relVelLen = relativeVelocity.length();
                    const brakeVec = relVelLen > 0.001 ? relativeVelocity.clone().divideScalar(relVelLen).negate() : new THREE.Vector3();
                    this.ship.velocity.addScaledVector(brakeVec, brakeAcc * 1.5);
                }
            }

            // Store last distance to target for next frame checks (for drift detection)
            this._lastTargetDist = distToCenterReal;

            // Prevent huge per-frame velocity spikes by capping the incremental delta applied this frame
            const maxDelta = 10; // max units change in velocity per frame from AP actions
            const deltaVec = this.ship.velocity.clone().sub(currentVel);
            const deltaLen = deltaVec.length();
            if (deltaLen > maxDelta) {
                deltaVec.setLength(maxDelta);
                this.ship.velocity.copy(currentVel.clone().add(deltaVec));
                console.warn(`AP: capped velocity delta from ${deltaLen.toFixed(2)} to ${maxDelta} for target ${this.lockedTarget ? this.lockedTarget.name : 'UNKNOWN'}`);
            }

            // Global velocity cap adjusted (allow higher speeds but keep a soft cap for stability)
            const maxVel = 20000;
            if (this.ship.velocity.length() > maxVel) this.ship.velocity.setLength(maxVel);
        }
    }

    startLanding() {
        if (!this.lockedTarget) return;
        this._landingActive = true;
        this._landingTarget = this.lockedTarget;
        this.input.isAutopilot = false;
        this.input.isTracking = false;
        this._canLand = false; // consume landing opportunity
        this.shipState = 'landing';
        this.ui.showShipStatus('landing');
        this.ui.hideLandHint();
        // Update AP UI since landing disables autopilot/tracking
        this.ui.updateAutopilotStatus(this.input.isTracking, this.input.isAutopilot);
        console.info(`Landing started on ${this._landingTarget.name}`);
    }

    handleLanding(t) {
        if (!this._landingActive || !this._landingTarget) return;
        const shipPos = this.ship.mesh.position;
        const planetPos = new THREE.Vector3();
        this._landingTarget.getWorldPosition(planetPos);
        const radial = shipPos.clone().sub(planetPos);
        const distCenter = radial.length();
        const planetRadius = this._landingTarget.userData.radius;
        const surfacePos = planetPos.clone().add(radial.clone().setLength(planetRadius + 2));

        const toSurface = new THREE.Vector3().subVectors(surfacePos, shipPos);
        const distToSurface = toSurface.length();

        // Desired landing speed: proportional but capped
        const desiredSpeed = Math.min(12, Math.max(1.5, distToSurface * 0.02));
        if (distToSurface > 1.5) {
            const desiredVel = toSurface.clone().setLength(desiredSpeed);
            // Smoothly adjust velocity toward desiredVel
            this.ship.velocity.lerp(desiredVel, 0.04);

            // Also orient ship so its belly (-Y) points toward planet center
            try {
                const targetDir = planetPos.clone().sub(shipPos).normalize();
                // desired quaternion that maps ship local down (0,-1,0) to targetDir
                const desiredQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), targetDir);
                this.ship.mesh.quaternion.slerp(desiredQuat, 0.06);
            } catch (e) {}

        } else {
            // Landed: snap to surface, orient belly-in, parent to planet, and stop physics
            // Pick final world quaternion aligning belly to center
            const shipWorldQuat = new THREE.Quaternion();
            this.ship.mesh.getWorldQuaternion(shipWorldQuat);
            const targetDir = planetPos.clone().sub(surfacePos).normalize(); // from surface point toward center
            const desiredQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), targetDir);
            // Compose world quaternion with desired to ensure final alignment (preserve yaw minimal)
            shipWorldQuat.slerp(desiredQuat, 0.9);

            // Convert surfacePos/world->local for parenting
            const parent = this._landingTarget;
            const localPos = surfacePos.clone();
            parent.worldToLocal(localPos);

            // Compute local quaternion relative to parent
            const parentWorldQuat = new THREE.Quaternion();
            parent.getWorldQuaternion(parentWorldQuat);
            const localQuat = parentWorldQuat.clone().invert().multiply(shipWorldQuat);

            // Reparent ship to planet
            try {
                // Remove from current parent and add to planet
                parent.add(this.ship.mesh);
                this.ship.mesh.position.copy(localPos);
                this.ship.mesh.quaternion.copy(localQuat);
            } catch (e) {
                // fallback: if parenting fails, just snap world position
                this.ship.mesh.position.copy(surfacePos);
                this.ship.mesh.quaternion.copy(shipWorldQuat);
            }

            // Stop physics and mark as landed
            this.ship.velocity.set(0, 0, 0);
            this._landingActive = false;
            this._landingTarget = null;
            this._shipLanded = true;
            this._landedOn = parent;

            this.shipState = 'manual';
            this.ui.showShipStatus('manual');
            console.info('Landing complete — ship parented to', parent.name || 'PLANET');
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
                this.setLockedTarget(planet);
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
            const shipWorldPos = new THREE.Vector3();
            this.ship.mesh.getWorldPosition(shipWorldPos);
            this.sceneManager.camera.position.copy(shipWorldPos.clone().add(camOffset));
            this.sceneManager.camera.quaternion.slerp(this.ship.mesh.quaternion, 0.25);
        } else {
            // First Person: Positioned in the pilot seat, eyes slightly up
            const camOffset = new THREE.Vector3(0, 0.2, -1.3).applyQuaternion(this.ship.mesh.quaternion);
            const shipWorldPos = new THREE.Vector3();
            this.ship.mesh.getWorldPosition(shipWorldPos);
            this.sceneManager.camera.position.copy(shipWorldPos.clone().add(camOffset));
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
