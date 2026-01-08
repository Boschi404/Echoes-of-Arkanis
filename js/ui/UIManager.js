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

    updateHUD(currentSpeed, distanceToSun, atmoStatus, shipPos) {
        document.getElementById('speed').innerText = `${(currentSpeed * 10).toFixed(0)} km/s`;
        document.getElementById('speed-bar').style.width = Math.min(100, currentSpeed * 2) + '%';
        document.getElementById('alt').innerText = `RIFERIMENTO SOLARE: ${distanceToSun.toFixed(0)} m`;

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
            // Project a point far ahead in the direction of velocity (Prograde Marker)
            const farPoint = shipPos.clone().add(velocity.clone().normalize().multiplyScalar(5000));
            const p = farPoint.project(camera);

            const x = (p.x + 1) * window.innerWidth / 2;
            const y = (-p.y + 1) * window.innerHeight / 2;

            // Only show if in front of camera (z < 1) and within reasonable screen bounds
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

    updateTargetOverlay(target, shipPos) {
        const display = document.getElementById('target-display');
        const content = document.getElementById('target-overlay-content');

        if (target) {
            display.style.opacity = '1';
            content.style.display = 'block';
            document.getElementById('t-name').innerText = target.name.toUpperCase();
            document.getElementById('t-dist').innerText = `DISTANZA: ${shipPos.distanceTo(target.position).toFixed(0)} m`;
            document.getElementById('t-info').innerText = target.userData.info;
            document.getElementById('t-status').innerText = 'LOCKED';
            document.getElementById('t-status').style.color = 'var(--accent)';
        } else {
            content.style.display = 'none';
            document.getElementById('t-name').innerText = 'SEARCHING...';
            document.getElementById('t-status').innerText = 'SCANNING';
            document.getElementById('t-status').style.color = '#445';
        }
    }

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
    }
}
window.UIManager = UIManager;
