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

    updateHUD(currentSpeed, distanceToSun) {
        document.getElementById('speed').innerText = `${(currentSpeed * 10).toFixed(0)} km/s`;
        document.getElementById('speed-bar').style.width = Math.min(100, currentSpeed * 2) + '%';
        document.getElementById('alt').innerText = `RIFERIMENTO SOLARE: ${distanceToSun.toFixed(0)} m`;
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

    updateMapPointer(shipPos) {
        let pointer = document.getElementById('map-pointer');
        if (!pointer) {
            pointer = document.createElement('div');
            pointer.id = 'map-pointer';
            pointer.innerHTML = '<div style="width:12px; height:12px; border:2px solid var(--cyan); border-radius:50%; box-shadow:0 0 10px var(--cyan); background:rgba(0,0,0,0.5)"></div>';
            pointer.style.position = 'absolute';
            pointer.style.transform = 'translate(-50%, -50%)';
            pointer.style.pointerEvents = 'none';
            pointer.style.zIndex = '500';
            document.body.appendChild(pointer);
        }

        const mapScale = 0.00045;
        const x = window.innerWidth / 2 + shipPos.x * mapScale;
        const y = window.innerHeight / 2 + shipPos.z * mapScale;

        pointer.style.left = `${x}px`;
        pointer.style.top = `${y}px`;
        pointer.style.display = 'block';
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
