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
        const hullMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3, metalness: 0.8 });
        const darkHullMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.9 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.1 });
        const emissiveCyan = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 5 });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x001122,
            transparent: true,
            opacity: 0.25,
            metalness: 1,
            roughness: 0,
            side: THREE.BackSide
        });

        // --- EXTERIOR HULL (HIGH DETAIL) ---
        const hull = new THREE.Group();
        this.mesh.add(hull);

        // Core Fuselage
        const coreGeo = new THREE.CylinderGeometry(0.5, 0.6, 4, 32);
        const core = new THREE.Mesh(coreGeo, hullMat);
        core.rotation.x = -Math.PI / 2;
        hull.add(core);

        // Sub-systems / Greebles on hull
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const pipeGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.5);
            const pipe = new THREE.Mesh(pipeGeo, darkHullMat);
            pipe.position.set(Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0);
            pipe.rotation.x = -Math.PI / 2;
            hull.add(pipe);
        }

        // Nose (Tapered)
        const noseGeo = new THREE.CylinderGeometry(0.1, 0.5, 1.5, 32);
        const nose = new THREE.Mesh(noseGeo, hullMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.z = -2.75;
        hull.add(nose);

        // --- WINGS (ADVANCED) ---
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(4.5, 2.5);
        wingShape.lineTo(4.3, 3);
        wingShape.lineTo(0.5, 1.5);
        wingShape.lineTo(0, 0);

        const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05 });

        const lWing = new THREE.Mesh(wingGeo, hullMat);
        lWing.rotation.x = -Math.PI / 2;
        lWing.position.set(-0.4, 0, 1.5);
        hull.add(lWing);

        const rWing = new THREE.Mesh(wingGeo, hullMat);
        rWing.rotation.x = Math.PI / 2;
        rWing.position.set(0.4, 0, 1.5);
        hull.add(rWing);

        // Vertical Stabilizers
        const finGeo = new THREE.BoxGeometry(0.08, 1.5, 2);
        const finL = new THREE.Mesh(finGeo, darkHullMat);
        finL.position.set(-1.5, 0.5, 1.5);
        finL.rotation.z = -0.4;
        hull.add(finL);

        const finR = new THREE.Mesh(finGeo, darkHullMat);
        finR.position.set(1.5, 0.5, 1.5);
        finR.rotation.z = 0.4;
        hull.add(finR);

        // --- ENGINES (PRO) ---
        const mainThrusterGeo = new THREE.CylinderGeometry(0.6, 0.7, 1.2, 32);
        const mainThruster = new THREE.Mesh(mainThrusterGeo, darkHullMat);
        mainThruster.rotation.x = Math.PI / 2;
        mainThruster.position.z = 2.5;
        hull.add(mainThruster);

        // Thruster Glow Ring
        const ringGeo = new THREE.TorusGeometry(0.55, 0.05, 16, 100);
        const ring = new THREE.Mesh(ringGeo, emissiveCyan);
        ring.position.z = 3.1;
        hull.add(ring);

        // --- COCKPIT INTERIOR (FULL DETAIL) ---
        this.interior = new THREE.Group();
        this.mesh.add(this.interior);
        this.interior.visible = false;

        // Cockpit Walls & Floor
        const cockpitFloor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 2), darkHullMat);
        cockpitFloor.position.set(0, -0.6, -1.8);
        this.interior.add(cockpitFloor);

        const cockpitBackWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.1), darkHullMat);
        cockpitBackWall.position.set(0, 0.1, -0.8);
        this.interior.add(cockpitBackWall);

        // Pilot Seat
        const seatGeo = new THREE.BoxGeometry(0.6, 0.1, 0.6);
        const seat = new THREE.Mesh(seatGeo, darkHullMat);
        seat.position.set(0, -0.45, -1.3);
        this.interior.add(seat);

        const backrestGeo = new THREE.BoxGeometry(0.6, 0.8, 0.1);
        const backrest = new THREE.Mesh(backrestGeo, darkHullMat);
        backrest.position.set(0, -0.1, -1.0);
        backrest.rotation.x = -0.2;
        this.interior.add(backrest);

        // Dashboard & Controls
        const dashBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.8), darkHullMat);
        dashBase.position.set(0, -0.2, -2.1);
        dashBase.rotation.x = -0.3;
        this.interior.add(dashBase);

        // Instrument Canvas
        this.instrumentCanvas = document.createElement('canvas');
        this.instrumentCanvas.width = 512; this.instrumentCanvas.height = 256;
        this.instrumentCtx = this.instrumentCanvas.getContext('2d');
        this.instrumentTexture = new THREE.CanvasTexture(this.instrumentCanvas);
        const screenMat = new THREE.MeshBasicMaterial({ map: this.instrumentTexture, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });

        // HUD Panels (More detailed)
        const mainHUD = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), screenMat);
        mainHUD.position.set(0, 0.25, -2.05);
        mainHUD.rotation.x = -0.15;
        this.interior.add(mainHUD);

        const radarHUD = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), screenMat);
        radarHUD.position.set(-0.6, 0, -1.9);
        radarHUD.rotation.y = 0.5;
        this.interior.add(radarHUD);

        const commsHUD = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), screenMat);
        commsHUD.position.set(0.6, 0, -1.9);
        commsHUD.rotation.y = -0.5;
        this.interior.add(commsHUD);

        // Joysticks
        const stickBaseGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const stickL_base = new THREE.Mesh(stickBaseGeo, darkHullMat);
        stickL_base.position.set(-0.4, -0.3, -1.6);
        this.interior.add(stickL_base);

        const stickR_base = new THREE.Mesh(stickBaseGeo, darkHullMat);
        stickR_base.position.set(0.4, -0.3, -1.6);
        this.interior.add(stickR_base);

        // Structural Beams
        const beamGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.5);
        const beamL = new THREE.Mesh(beamGeo, darkHullMat);
        beamL.position.set(-0.6, 0.3, -1.5);
        beamL.rotation.z = Math.PI / 4;
        this.interior.add(beamL);

        const beamR = new THREE.Mesh(beamGeo, darkHullMat);
        beamR.position.set(0.6, 0.3, -1.5);
        beamR.rotation.z = -Math.PI / 4;
        this.interior.add(beamR);

        // Exterior Cockpit Canopy
        const canopyGeo = new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        const canopy = new THREE.Mesh(canopyGeo, glassMat);
        canopy.position.set(0, 0, -1.5);
        canopy.rotation.x = -Math.PI / 2;
        canopy.scale.set(0.7, 1.2, 0.6);
        hull.add(canopy);

        // --- THRUSTER FLAME ---
        this.thrusterGroup = new THREE.Group();
        this.thrusterGroup.position.set(0, 0, 3.2);
        this.mesh.add(this.thrusterGroup);

        const flameGeo = new THREE.ConeGeometry(0.5, 5, 24);
        this.flameCore = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
        this.flameCore.rotation.x = -Math.PI / 2;
        this.flameCore.position.z = 2.5;
        this.thrusterGroup.add(this.flameCore);

        const flameGlowGeo = new THREE.ConeGeometry(0.8, 7, 24);
        this.flameGlow = new THREE.Mesh(flameGlowGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 }));
        this.flameGlow.rotation.x = -Math.PI / 2;
        this.flameGlow.position.z = 3.5;
        this.thrusterGroup.add(this.flameGlow);

        this.thrusterGroup.visible = false;

        // RE-ENTRY HEAT EFFECT
        this.heatShield = new THREE.Group();
        this.mesh.add(this.heatShield);
        this.heatMesh = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xff4d00, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
        );
        this.heatMesh.scale.set(1.2, 0.8, 2.8);
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
