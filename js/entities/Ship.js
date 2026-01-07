class Ship {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.velocity = new THREE.Vector3();
        this.rotationVelocity = new THREE.Vector2(0, 0);
        this.rollVelocity = 0;
        this.createShip();
        this.scene.add(this.mesh);
    }

    createShip() {
        // --- MATERIALS ---
        const hullMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.3, metalness: 0.7 });
        const darkHullMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.5, metalness: 0.9 });
        const emissiveCyan = new THREE.MeshStandardMaterial({ color: 0x00FFFF, emissive: 0x00FFFF, emissiveIntensity: 2 });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x001122,
            transparent: true,
            opacity: 0.2,
            metalness: 1,
            roughness: 0,
            side: THREE.DoubleSide
        });

        // --- HULL GROUP ---
        const hull = new THREE.Group();
        this.mesh.add(hull);

        // Core Body (Nose at -Z)
        const coreGeo = new THREE.CylinderGeometry(0.5, 0.6, 3, 32);
        const core = new THREE.Mesh(coreGeo, hullMat);
        core.rotation.x = -Math.PI / 2;
        hull.add(core);

        const noseGeo = new THREE.CylinderGeometry(0.1, 0.5, 1.2, 32);
        const nose = new THREE.Mesh(noseGeo, hullMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.z = -2.1;
        hull.add(nose);

        // --- WINGS (SYMMETRY FIX) ---
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(4, 2);
        wingShape.lineTo(3.8, 2.5);
        wingShape.lineTo(0.4, 0.8);
        wingShape.lineTo(0, 0);

        const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05 });

        // Right Wing
        const rWing = new THREE.Mesh(wingGeo, hullMat);
        rWing.rotation.x = Math.PI / 2;
        rWing.position.set(0.4, 0, 1);
        hull.add(rWing);

        // Left Wing (Mirrored)
        const lWingGroup = new THREE.Group();
        const lWing = new THREE.Mesh(wingGeo, hullMat);
        lWing.rotation.x = Math.PI / 2;
        lWingGroup.add(lWing);
        lWingGroup.scale.x = -1;
        lWingGroup.position.set(-0.4, 0, 1);
        hull.add(lWingGroup);

        // Tail Fins
        const finGeo = new THREE.BoxGeometry(0.05, 1, 1.5);
        const finL = new THREE.Mesh(finGeo, darkHullMat);
        finL.position.set(-1.2, 0.4, 1.2);
        finL.rotation.z = -0.4;
        hull.add(finL);

        const finR = new THREE.Mesh(finGeo, darkHullMat);
        finR.position.set(1.2, 0.4, 1.2);
        finR.rotation.z = 0.4;
        hull.add(finR);

        // Engines
        const engineMount = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 0.8, 32), darkHullMat);
        engineMount.rotation.x = Math.PI / 2;
        engineMount.position.z = 1.9;
        hull.add(engineMount);

        // --- COCKPIT INTERIOR (REFINED) ---
        this.interior = new THREE.Group();
        this.mesh.add(this.interior);
        this.interior.visible = false;

        // Floor & Walls
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 2.5), darkHullMat);
        floor.position.set(0, -0.6, -1.3);
        this.interior.add(floor);

        const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 2), darkHullMat);
        wallL.position.set(-0.7, 0, -1.3);
        this.interior.add(wallL);

        const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 2), darkHullMat);
        wallR.position.set(0.7, 0, -1.3);
        this.interior.add(wallR);

        // Dashboard
        const dash = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.6), darkHullMat);
        dash.position.set(0, -0.3, -2.1);
        this.interior.add(dash);

        // Seat
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.6), darkHullMat);
        seat.position.set(0, -0.35, -1.3);
        this.interior.add(seat);

        // HUD Display (Moved slightly further to avoid any future clipping)
        this.instrumentCanvas = document.createElement('canvas');
        this.instrumentCanvas.width = 512; this.instrumentCanvas.height = 256;
        this.instrumentCtx = this.instrumentCanvas.getContext('2d');
        this.instrumentTexture = new THREE.CanvasTexture(this.instrumentCanvas);
        const screenMat = new THREE.MeshBasicMaterial({ map: this.instrumentTexture, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });

        const hud = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), screenMat);
        hud.position.set(0, 0.3, -2.5);
        hud.rotation.x = -0.15;
        this.interior.add(hud);

        // Dedicated Cockpit Light
        this.cockpitLight = new THREE.PointLight(0x00FFFF, 2, 5);
        this.cockpitLight.position.set(0, 1, -1.5);
        this.interior.add(this.cockpitLight);

        // Cockpit Frame / Canopy
        const canopyGeo = new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        const canopy = new THREE.Mesh(canopyGeo, glassMat);
        canopy.rotation.x = -Math.PI / 2;
        canopy.position.set(0, 0, -1.5);
        canopy.scale.set(0.8, 1.5, 0.6);
        hull.add(canopy);

        // --- THRUSTER FLAME ---
        this.thrusterGroup = new THREE.Group();
        this.thrusterGroup.position.set(0, 0, 2.5);
        this.mesh.add(this.thrusterGroup);

        const flameGeo = new THREE.ConeGeometry(0.4, 4, 16);
        this.flameCore = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
        this.flameCore.rotation.x = -Math.PI / 2;
        this.flameCore.position.z = 2;
        this.thrusterGroup.add(this.flameCore);

        const glowGeo = new THREE.ConeGeometry(0.7, 6, 16);
        this.flameGlow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4 }));
        this.flameGlow.rotation.x = -Math.PI / 2;
        this.flameGlow.position.z = 3;
        this.thrusterGroup.add(this.flameGlow);

        this.thrusterGroup.visible = false;

        // RE-ENTRY HEAT EFFECT
        this.heatShield = new THREE.Group();
        this.mesh.add(this.heatShield);
        this.heatMesh = new THREE.Mesh(
            new THREE.SphereGeometry(2.3, 32, 16),
            new THREE.MeshBasicMaterial({ color: 0xFF5500, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
        );
        this.heatShield.add(this.heatMesh);
    }

    updateCockpit(speed, target) {
        if (!this.interior.visible) return;

        const ctx = this.instrumentCtx;
        ctx.clearRect(0, 0, 512, 256);

        // Background glow
        ctx.fillStyle = 'rgba(0, 20, 40, 0.3)';
        ctx.fillRect(0, 0, 512, 256);

        // Speed readout
        ctx.font = 'bold 60px Orbitron, Rajdhani, sans-serif';
        ctx.fillStyle = '#00f3ff';
        ctx.fillText(`SPD: ${(speed * 10).toFixed(1)}`, 40, 80);

        // Target Info
        ctx.font = '35px Orbitron, Rajdhani, sans-serif';
        ctx.fillStyle = target ? '#ff4d00' : '#445566';
        const targetName = target ? target.name.toUpperCase() : 'NO TARGET';
        ctx.fillText(`TGT: ${targetName}`, 40, 140);

        if (target) {
            const dist = this.mesh.position.distanceTo(target.position).toFixed(0);
            ctx.fillText(`DST: ${dist}m`, 40, 190);

            // Artificial Horizon (Simple line)
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(350, 150);
            ctx.lineTo(450, 150);
            ctx.stroke();
        }

        // Warning scanlines 
        ctx.fillStyle = 'rgba(0, 243, 255, 0.05)';
        for (let i = 0; i < 256; i += 4) ctx.fillRect(0, i, 512, 1);

        this.instrumentTexture.needsUpdate = true;
    }

    updateHeatEffect(intensity) {
        this.heatMesh.material.opacity = intensity * 0.5;
        const scale = 1 + intensity * 0.2;
        this.heatMesh.scale.set(1.5 * scale, 1 * scale, 3 * scale);
        if (intensity > 0.1) {
            this.heatMesh.material.color.setHSL(0.05 + (1 - intensity) * 0.1, 1, 0.5);
        }
    }

    updateThruster(intensity, t) {
        if (intensity > 0) {
            this.thrusterGroup.visible = true;
            // Pulsing effect
            const pulse = 1 + Math.sin(t * 0.1) * 0.1;
            const flicker = 1 + (Math.random() - 0.5) * 0.2;

            this.flameCore.scale.set(flicker, pulse, flicker);
            this.flameGlow.scale.set(flicker * 1.2, pulse * 1.1, flicker * 1.2);

            // Color shift based on intensity (Red to Cyan)
            const colorVal = new THREE.Color().setHSL(0.5 + intensity * 0.1, 1, 0.5);
            this.flameGlow.material.color.copy(colorVal);
        } else {
            this.thrusterGroup.visible = false;
        }
    }
}
window.Ship = Ship;
