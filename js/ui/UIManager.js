class UIManager {
    constructor() {
        this.settings = {
            gfx: 'mid',
            volume: 70,
            controlMode: 'steer'
        };

        this.initListeners();
    }

    initListeners() {
        document.getElementById('gfx-quality').addEventListener('change', (e) => {
            this.settings.gfx = e.target.value;
        });

        document.getElementById('control-mode').addEventListener('change', (e) => {
            this.settings.controlMode = e.target.value;
        });

        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.settings.volume = e.target.value;
            });
        });
    }

    updateHUD(currentSpeed, lockedTarget, atmoStatus, shipPos) {
        document.getElementById('speed').innerText = `${(currentSpeed * 10).toFixed(0)} km/s`;
        document.getElementById('speed-bar').style.width = Math.min(100, currentSpeed * 2) + '%';
        // Show a generic reference: if a target is locked, show its name and distance from the ship; otherwise clear the reference label
        if (lockedTarget && shipPos && lockedTarget.position) {
            const d = shipPos.distanceTo(lockedTarget.position).toFixed(0);
            document.getElementById('alt').innerText = `RIFERIMENTO: ${lockedTarget.name.toUpperCase()} - ${d} m`;
        } else {
            document.getElementById('alt').innerText = `RIFERIMENTO: ---`;
        }

        // Coords
        if (shipPos) {
            const coordsDiv = document.getElementById('coords-display');
            if (!coordsDiv) {
                const d = document.createElement('div');
                d.id = 'coords-display';
                d.style.position = 'absolute';
                d.style.bottom = '10px';
                d.style.left = '10px';
                d.style.color = '#445';
                d.style.fontSize = '0.7rem';
                d.style.fontFamily = 'monospace';
                document.body.appendChild(d);
            }
            document.getElementById('coords-display').innerText = `X:${shipPos.x.toFixed(0)} Y:${shipPos.y.toFixed(0)} Z:${shipPos.z.toFixed(0)}`;
        }

        const atmoDiv = document.getElementById('atmo-status');
        if (atmoStatus) {
            atmoDiv.style.display = 'block';
            atmoDiv.innerHTML = `<span style="color:var(--accent)">ATTENZIONE:</span> ATMOSFERA DI ${atmoStatus.toUpperCase()}`;
            atmoDiv.style.background = 'rgba(255, 50, 0, 0.1)';
        } else {
            atmoDiv.style.display = 'none';
        }
    }

    updateDirectionIndicator(velocity, camera, shipPos) {
        let ind = document.getElementById('dir-indicator');
        if (!ind) {
            ind = document.createElement('div');
            ind.id = 'dir-indicator';
            ind.style.position = 'absolute';
            ind.style.width = '20px';
            ind.style.height = '20px';
            ind.style.border = '2px solid rgba(0, 255, 0, 0.5)';
            ind.style.borderRadius = '50%';
            ind.style.pointerEvents = 'none';
            ind.style.display = 'none';
            // Crosshair inside
            const cross = document.createElement('div');
            cross.style.position = 'absolute';
            cross.style.top = '50%';
            cross.style.left = '50%';
            cross.style.width = '10px';
            cross.style.height = '2px';
            cross.style.background = 'rgba(0, 255, 0, 0.5)';
            cross.style.transform = 'translate(-50%, -50%)';
            ind.appendChild(cross);
            const crossV = document.createElement('div');
            crossV.style.position = 'absolute';
            crossV.style.top = '50%';
            crossV.style.left = '50%';
            crossV.style.width = '2px';
            crossV.style.height = '10px';
            crossV.style.background = 'rgba(0, 255, 0, 0.5)';
            crossV.style.transform = 'translate(-50%, -50%)';
            ind.appendChild(crossV);
            document.body.appendChild(ind);
        }

        if (velocity.length() < 1) {
            ind.style.display = 'none';
            return;
        }

        // Project velocity vector direction (relative to camera forward? No, screen space)
        // We want to show where the ship is GOING on screen.
        // Ship is typically center screen in 3rd person, so velocity vector starts at center.
        // But in 3rd person, ship might rotate while velocity continues elsewhere (drift).
        // Let's project a point "in front" of ship along velocity vector.

        // Get camera position, add velocity vector * scalar
        // Actually, we want to project the vector (Velocity) relative to Camera View.

        // Project velocity vector direction
        if (shipPos) {
            // Project a point ahead in the direction of velocity (simpler, smaller range)
            const farPoint = shipPos.clone().add(velocity.clone().normalize().multiplyScalar(3000));
            const p = farPoint.project(camera);

            const x = (p.x + 1) * window.innerWidth / 2;
            const y = (-p.y + 1) * window.innerHeight / 2;

            if (p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1) {
                ind.style.display = 'block';
                ind.style.left = `${x}px`;
                ind.style.top = `${y}px`;
                ind.style.transform = 'translate(-50%, -50%)';
            } else {
                ind.style.display = 'none';
            }
        }
    }

    updateTargetOverlay(target, shipPos, camera) {
        const display = document.getElementById('target-display');
        const content = document.getElementById('target-overlay-content');

        // Show full top-right panel when a target is LOCKED (passed here from main.js)
        if (target && shipPos) {
            display.style.opacity = '1';
            content.style.display = 'block';
            document.getElementById('t-name').innerText = target.name.toUpperCase();

            const sysName = (target.userData.parentSystem && target.userData.parentSystem.name) ? target.userData.parentSystem.name : '---';
            document.getElementById('t-system').innerText = `SISTEMA: ${sysName}`;

            document.getElementById('t-size').innerText = `DIMENSIONE: ${Math.round(target.userData.radius)} m`;
            const targWorld = new THREE.Vector3();
            target.getWorldPosition(targWorld);
            document.getElementById('t-dist').innerText = `DISTANZA: ${shipPos.distanceTo(targWorld).toFixed(0)} m`;

            const pVel = target.userData.velocity ? target.userData.velocity.length() : 0;
            document.getElementById('t-speed').innerText = `VEL. PIANETA: ${pVel.toFixed(3)} u/frame`;

            document.getElementById('t-info').innerText = target.userData.info || '';
            document.getElementById('t-status').innerText = 'LOCKED';
            document.getElementById('t-status').style.color = 'var(--accent)';

            // Hide aim label when showing the locked panel (overlay removed)
            this.hideAimLabel();
            // Add a holographic highlight to the panel when locked
            display.classList.add('holo-active');
        } else {
            content.style.display = 'none';
            display.style.opacity = '0';
            document.getElementById('t-name').innerText = 'SEARCHING...';
            document.getElementById('t-status').innerText = 'SCANNING';
            document.getElementById('t-status').style.color = '#445';
            // Overlay removed; aim label is controlled via angular auto-targeting (showAimLabel / hideAimLabel)
            display.classList.remove('holo-active');
        }
    }

    showAimLabel(targetOrName, camera) {
        if (!this.aimLabel) this.aimLabel = document.getElementById('aim-label');
        if (!this.aimLabel) return;

        // Support either string name or target object
        const name = (typeof targetOrName === 'string') ? targetOrName : (targetOrName && targetOrName.name) ? targetOrName.name : '---';
        this.aimLabel.innerText = name;

        // Position above the planet if object provided, otherwise keep center-up
        if (targetOrName && typeof targetOrName !== 'string' && camera) {
            const worldPos = new THREE.Vector3();
            targetOrName.getWorldPosition(worldPos);
            const upOffset = (targetOrName.userData && targetOrName.userData.radius) ? Math.max(50, targetOrName.userData.radius * 1.1) : 200;
            worldPos.add(new THREE.Vector3(0, upOffset, 0));
            const proj = worldPos.project(camera);

            // If the point projects offscreen or behind camera, don't show the label
            if (proj.z >= 1 || Math.abs(proj.x) > 1.2 || Math.abs(proj.y) > 1.2) {
                this.hideAimLabel();
                return;
            }

            const x = (proj.x + 1) * window.innerWidth / 2;
            const y = (-proj.y + 1) * window.innerHeight / 2;
            this.aimLabel.style.left = `${x}px`;
            this.aimLabel.style.top = `${y}px`;
        } else {
            // fallback: place just above center of screen
            this.aimLabel.style.left = `${window.innerWidth / 2}px`;
            this.aimLabel.style.top = `${window.innerHeight / 2 - 80}px`;
        }

        // If aiming target changed, restart timer and allow showing
        if (this._currentAimedTarget !== targetOrName) {
            this._currentAimedTarget = targetOrName;
            this._aimingSince = Date.now();
            this._aimSuppress = false;
        }

        // If suppress flag set (we already hid after 5s of continuous aim), don't show
        if (this._aimSuppress) return;

        // Show with fade-in
        this.aimLabel.classList.add('visible');

        // If we've been aiming for more than 5 seconds, auto-hide and suppress further shows until aim breaks
        if (this._aimingSince && (Date.now() - this._aimingSince) >= 5000) {
            this._aimSuppress = true;
            this.aimLabel.classList.remove('visible');
        }
    }

    hideAimLabel() {
        // Clear aiming state (stop suppression)
        this._aimingSince = null;
        this._aimSuppress = false;
        this._currentAimedTarget = null;

        if (!this.aimLabel) this.aimLabel = document.getElementById('aim-label');
        if (!this.aimLabel) return;
        this.aimLabel.classList.remove('visible');
    }

    // Planet overlay removed — aim label will be shown using angular auto-targeting only


    updateMapPointer(shipPos, camera, targetPivot) {
        let pointer = document.getElementById('map-pointer');

        if (!pointer) {
            pointer = document.createElement('div');
            pointer.id = 'map-pointer';
            pointer.innerHTML = `
                <div style="width:20px; height:20px; border:2px solid var(--cyan); border-radius:50%; box-shadow:0 0 15px var(--cyan); display:flex; align-items:center; justify-content:center;">
                    <div style="width:4px; height:4px; background:white; border-radius:50%"></div>
                </div>
                <div style="color:var(--cyan); font-size:0.6rem; margin-top:5px; text-align:center; letter-spacing:1px; font-weight:bold; text-shadow:0 0 5px black">NAVE</div>
            `;
            pointer.style.position = 'absolute';
            pointer.style.transform = 'translate(-50%, -50%)';
            pointer.style.pointerEvents = 'none';
            pointer.style.zIndex = '500';
            document.body.appendChild(pointer);
        }

        // Project 3D position to 2D
        const p = shipPos.clone().project(camera);
        const x = (p.x + 1) * window.innerWidth / 2;
        const y = (-p.y + 1) * window.innerHeight / 2;

        const isVisible = p.z < 1 && p.x >= -1.1 && p.x <= 1.1 && p.y >= -1.1 && p.y <= 1.1;

        pointer.style.left = `${x}px`;
        pointer.style.top = `${y}px`;
        pointer.style.display = isVisible ? 'block' : 'none';

        // Keep proximity shadow hidden by default when map pointer updates
        const shadow = document.getElementById('proximity-shadow');
        if (shadow) shadow.classList.remove('visible');
    }

    // Update screen-space proximity shadow for the given planet (target may be null to hide)
    updateProximity(target, shipPos, camera) {
        const shadow = document.getElementById('proximity-shadow');
        if (!shadow) return;

        if (!target || !shipPos || !camera) {
            shadow.classList.remove('visible');
            return;
        }

        const worldPos = new THREE.Vector3();
        target.getWorldPosition(worldPos);
        const toShip = new THREE.Vector3().subVectors(worldPos, shipPos);
        const dist = toShip.length();
        const planetRadius = target.userData && target.userData.radius ? target.userData.radius : 200;
        const distToSurface = dist - planetRadius;

        // Compute angular radius approximation
        const angRadius = Math.atan2(planetRadius, Math.max(1, dist)); // radians
        const screenRadius = Math.abs(angRadius / (camera.fov * Math.PI / 180)) * window.innerHeight; // px
        const sizePx = Math.max(40, Math.min(window.innerHeight * 1.5, screenRadius * 2));

        // Position on screen (project a point above planet center a bit)
        const projPos = worldPos.clone().add(new THREE.Vector3(0, planetRadius * 0.5, 0)).project(camera);
        if (projPos.z >= 1 || Math.abs(projPos.x) > 1.5 || Math.abs(projPos.y) > 1.5) {
            shadow.classList.remove('visible');
            return;
        }
        const x = (projPos.x + 1) * window.innerWidth / 2;
        const y = (-projPos.y + 1) * window.innerHeight / 2;

        // Map distance to opacity & scale (closer -> larger and darker)
        const maxRange = planetRadius * 6; // within 6 radii influence
        const norm = Math.max(0, Math.min(1, 1 - (distToSurface / maxRange)));
        const opacity = Math.max(0.06, Math.min(0.95, norm * 0.95));
        const scale = 0.6 + norm * 1.8;

        shadow.style.left = `${x}px`;
        shadow.style.top = `${y}px`;
        shadow.style.width = `${sizePx}px`;
        shadow.style.height = `${sizePx}px`;
        shadow.style.transform = `translate(-50%, -50%) scale(${scale})`;
        shadow.style.opacity = `${opacity}`;
        shadow.classList.add('visible');
    }

    hideProximity() {
        const shadow = document.getElementById('proximity-shadow');
        if (shadow) shadow.classList.remove('visible');
    }

    showPlanetTooltip(planet, mouse) {
        let tooltip = document.getElementById('map-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'map-tooltip';
            tooltip.className = 'glass-panel';
            tooltip.style.position = 'absolute';
            tooltip.style.padding = '15px';
            tooltip.style.fontSize = '0.8rem';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.zIndex = '1000';
            tooltip.innerHTML = '<div class="scanlines"></div><div id="tooltip-content"></div>';
            document.body.appendChild(tooltip);
        }

        if (planet && planet.userData) {
            tooltip.style.display = 'block';
            tooltip.style.left = `${(mouse.x + 1) * window.innerWidth / 2 + 30}px`;
            tooltip.style.top = `${(-mouse.y + 1) * window.innerHeight / 2 - 50}px`;
            document.getElementById('tooltip-content').innerHTML = `
                <div style="color:var(--cyan); font-family:'Orbitron'; font-weight:bold; letter-spacing:2px; margin-bottom:5px;">${planet.name.toUpperCase()}</div>
                <div style="font-size:0.7rem; color:#889; line-height:1.4;">${planet.userData.info}</div>
                <div style="font-size:0.6rem; color:var(--accent); margin-top:10px; font-weight:700;">[CLICK] MANOVRA DI AGGANCIO</div>
            `;
        } else {
            tooltip.style.display = 'none';
        }
    }

    hidePlanetTooltip() {
        const t = document.getElementById('map-tooltip');
        if (t) t.style.display = 'none';
    }

    updateAutopilotStatus(isTracking, isFullAP) {
        console.debug('UI: updateAutopilotStatus', { isTracking, isFullAP });
        const apStatus = document.getElementById('ap-status');
        const apMini = document.getElementById('ap-state-mini');

        if (isFullAP) {
            apStatus.style.display = 'flex';
            apStatus.innerText = 'PILOTA AUTOMATICO ATTIVO';
            apStatus.style.color = 'var(--cyan)';
            apMini.innerText = 'AUTO: FULL';
            apMini.style.color = 'var(--cyan)';
        } else if (isTracking) {
            apStatus.style.display = 'flex';
            apStatus.innerText = 'TRACKING ATTIVO';
            apStatus.style.color = 'var(--accent)';
            apMini.innerText = 'AUTO: TRK';
            apMini.style.color = 'var(--accent)';
        } else {
            apStatus.style.display = 'none';
            apMini.innerText = 'AUTO: OFF';
            apMini.style.color = '#445';
        }

        // Visual highlight on speed module when full AP engaged
        try {
            const speedModule = document.getElementById('speed').closest('.hud-module');
            if (speedModule) speedModule.classList.toggle('holo-active', !!isFullAP);
        } catch (e) {}
    }

    showShipStatus(state) {
        if (!this.shipStateEl) this.shipStateEl = document.getElementById('ship-state');
        if (!this.shipStateEl) return;
        console.debug('UI: showShipStatus', state);
        this.shipStateEl.innerText = `STATUS: ${state.toUpperCase()}`;
        this.shipStateEl.style.display = 'block';
        // Force reflow so transition works from hidden -> visible
        void this.shipStateEl.offsetWidth;
        this.shipStateEl.classList.add('visible');
    }

    hideShipStatus() {
        if (!this.shipStateEl) this.shipStateEl = document.getElementById('ship-state');
        if (!this.shipStateEl) return;
        this.shipStateEl.classList.remove('visible');
        // Hide after transition completes
        setTimeout(() => {
            if (this.shipStateEl) this.shipStateEl.style.display = 'none';
        }, 420);
    }

    showLandHint() {
        if (!this.landHintEl) this.landHintEl = document.getElementById('land-hint');
        if (!this.landHintEl) return;
        console.debug('UI: showLandHint');
        this.landHintEl.style.display = 'block';
        // small pulse
        this.landHintEl.style.opacity = '1';
        this.landHintEl.style.transform = 'translateX(-50%) translateY(-2px)';
        setTimeout(() => {
            if (this.landHintEl) {
                this.landHintEl.style.opacity = '0.95';
                this.landHintEl.style.transform = 'translateX(-50%) translateY(0)';
            }
        }, 10);
    }

    hideLandHint() {
        if (!this.landHintEl) this.landHintEl = document.getElementById('land-hint');
        if (!this.landHintEl) return;
        this.landHintEl.style.opacity = '0';
        this.landHintEl.style.transform = 'translateX(-50%) translateY(-6px)';
        setTimeout(() => {
            if (this.landHintEl) this.landHintEl.style.display = 'none';
        }, 280);
    } 
}
window.UIManager = UIManager;
