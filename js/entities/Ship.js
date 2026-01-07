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
        const hullMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.2,
            metalness: 0.9,
            flatShading: false
        });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.1 });
        const darkPlateMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.4 });
        const emissiveBlue = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 3 });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.2,
            metalness: 1,
            roughness: 0,
            side: THREE.DoubleSide
        });

        // --- EXTERIOR HULL ---
        const hullGroup = new THREE.Group();
        this.mesh.add(hullGroup);

        // Main Fuselage (Multi-segmented for detail)
        const noseGeo = new THREE.CylinderGeometry(0.1, 0.4, 1.5, 32);
        const nose = new THREE.Mesh(noseGeo, hullMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.z = -2;
        hullGroup.add(nose);

        const bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 3, 32);
        const body = new THREE.Mesh(bodyGeo, hullMat);
        body.rotation.x = -Math.PI / 2;
        hullGroup.add(body);

        // Greebles (Detail plates on hull)
        for (let i = 0; i < 6; i++) {
            const plateGeo = new THREE.BoxGeometry(0.2, 0.05, 0.8);
            const plate = new THREE.Mesh(plateGeo, darkPlateMat);
            const angle = (i / 6) * Math.PI * 2;
            plate.position.set(Math.cos(angle) * 0.45, Math.sin(angle) * 0.45, -0.5);
            plate.rotation.z = angle;
            hullGroup.add(plate);
        }

        // --- WINGS ---
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(4, -1); // Swept back
        wingShape.lineTo(3.8, 1.5);
        wingShape.lineTo(0, 1);
        wingShape.lineTo(0, 0);

        const wingExtrude = new THREE.ExtrudeGeometry(wingShape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02 });

        const leftWing = new THREE.Mesh(wingExtrude, hullMat);
        leftWing.rotation.x = -Math.PI / 2;
        leftWing.position.set(-0.35, 0, 0.5);
        hullGroup.add(leftWing);

        const rightWing = new THREE.Mesh(wingExtrude, hullMat);
        rightWing.rotation.x = Math.PI / 2;
        rightWing.position.set(0.35, 0, 0.5);
        hullGroup.add(rightWing);

        // Stabilizers / Vertical Fins
        const finGeo = new THREE.BoxGeometry(0.05, 1.2, 1.5);
        const finL = new THREE.Mesh(finGeo, hullMat);
        finL.position.set(-1.2, 0.4, 1);
        finL.rotation.z = -0.3;
        hullGroup.add(finL);

        const finR = new THREE.Mesh(finGeo, hullMat);
        finR.position.set(1.2, 0.4, 1);
        finR.rotation.z = 0.3;
        hullGroup.add(finR);

        // --- ENGINES ---
        const engineMountGeo = new THREE.CylinderGeometry(0.55, 0.6, 1, 32);
        const engineMount = new THREE.Mesh(engineMountGeo, darkPlateMat);
        engineMount.rotation.x = Math.PI / 2;
        engineMount.position.z = 1.8;
        hullGroup.add(engineMount);

        // Triple Thruster Nozzles
        const nozzleGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.5, 16);
        const nozzles = [
            { x: 0, y: 0.2, z: 2.3 },
            { x: -0.25, y: -0.2, z: 2.3 },
            { x: 0.25, y: -0.2, z: 2.3 }
        ];
        nozzles.forEach(n => {
            const nozzle = new THREE.Mesh(nozzleGeo, chromeMat);
            nozzle.rotation.x = Math.PI / 2;
            nozzle.position.set(n.x, n.y, n.z);
            hullGroup.add(nozzle);

            const ringGeo = new THREE.TorusGeometry(0.25, 0.02, 8, 24);
            const ring = new THREE.Mesh(ringGeo, emissiveBlue);
            ring.position.set(n.x, n.y, n.z + 0.25);
            hullGroup.add(ring);
        });

        // --- COCKPIT INTERIOR (PRO LEVEL) ---
        this.interior = new THREE.Group();
        this.mesh.add(this.interior);
        this.interior.visible = false;

        // Seat
        const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.6), darkPlateMat);
        seatBase.position.set(0, -0.4, -1.2);
        this.interior.add(seatBase);

        const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.1), darkPlateMat);
        seatBack.position.set(0, 0, -0.95);
        seatBack.rotation.x = -0.15;
        this.interior.add(seatBack);

        // Joysticks
        const stickGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3);
        const stickL = new THREE.Mesh(stickGeo, chromeMat);
        stickL.position.set(-0.35, -0.2, -1.4);
        stickL.rotation.x = 0.2;
        this.interior.add(stickL);

        const stickR = new THREE.Mesh(stickGeo, chromeMat);
        stickR.position.set(0.35, -0.2, -1.4);
        stickR.rotation.x = 0.2;
        this.interior.add(stickR);

        // Instrument Layout
        this.instrumentCanvas = document.createElement('canvas');
        this.instrumentCanvas.width = 512; this.instrumentCanvas.height = 256;
        this.instrumentCtx = this.instrumentCanvas.getContext('2d');
        this.instrumentTexture = new THREE.CanvasTexture(this.instrumentCanvas);

        const screenMat = new THREE.MeshBasicMaterial({ map: this.instrumentTexture, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });

        // HUD Panels
        const mainScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), screenMat);
        mainScreen.position.set(0, 0.35, -1.9);
        mainScreen.rotation.x = -0.15;
        this.interior.add(mainScreen);

        const sideScreenL = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), screenMat);
        sideScreenL.position.set(-0.9, 0.2, -1.7);
        sideScreenL.rotation.y = 0.6;
        this.interior.add(sideScreenL);

        const sideScreenR = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), screenMat);
        sideScreenR.position.set(0.9, 0.2, -1.7);
        sideScreenR.rotation.y = -0.6;
        this.interior.add(sideScreenR);

        // --- EXTERIOR COCKPIT GLASS ---
        const canopyGeo = new THREE.SphereGeometry(0.6, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        const canopy = new THREE.Mesh(canopyGeo, glassMat);
        canopy.position.set(0, 0.2, -1.2);
        canopy.rotation.x = -Math.PI / 2;
        canopy.scale.set(1.5, 2.5, 1);
        hullGroup.add(canopy);

        // THRUSTER FLAME
        this.thrusterGroup = new THREE.Group();
        this.thrusterGroup.position.set(0, 0, 2.6);
        this.mesh.add(this.thrusterGroup);

        const coreGeo = new THREE.ConeGeometry(0.4, 4, 16);
        this.flameCore = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
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
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
        );
        this.heatMesh.scale.set(1.4, 1, 2.5);
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
