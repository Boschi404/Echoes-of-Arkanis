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
        const mat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.2, metalness: 0.9 });
        const accentMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

        // MAIN BODY - Nose points towards -Z
        const bodyGeo = new THREE.CylinderGeometry(0.1, 0.4, 5, 12);
        const body = new THREE.Mesh(bodyGeo, mat);
        body.rotation.x = -Math.PI / 2; // PUNTA VERSO -Z
        this.mesh.add(body);

        // COCKPIT
        const cockpitGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x001122, transparent: true, opacity: 0.6, metalness: 1, roughness: 0 });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0, 0.25, -1.2);
        cockpit.scale.set(1, 0.6, 2.2);
        this.mesh.add(cockpit);

        // WINGS
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(3.5, 2.5);
        wingShape.lineTo(0, 1.5);
        wingShape.lineTo(0, 0);
        const wingExtrude = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: false });

        const rightWing = new THREE.Mesh(wingExtrude, mat);
        rightWing.rotation.x = Math.PI / 2;
        rightWing.position.set(0.2, 0, -0.8);
        this.mesh.add(rightWing);

        const leftWing = new THREE.Mesh(wingExtrude, mat);
        leftWing.rotation.x = Math.PI / 2;
        leftWing.rotation.y = Math.PI;
        leftWing.position.set(-0.2, 0, -0.8);
        this.mesh.add(leftWing);

        // REAR ENGINE
        const engineGeo = new THREE.CylinderGeometry(0.3, 0.4, 1, 16);
        const engine = new THREE.Mesh(engineGeo, darkMat);
        engine.rotation.x = Math.PI / 2;
        engine.position.set(0, 0, 2);
        this.mesh.add(engine);

        // THRUSTER FLAME - Realistic Multi-layered
        this.thrusterGroup = new THREE.Group();
        this.thrusterGroup.position.set(0, 0, 2.5);
        this.mesh.add(this.thrusterGroup);

        // Inner Core (White-Blue)
        const coreGeo = new THREE.ConeGeometry(0.25, 3, 12);
        this.flameCore = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
        this.flameCore.rotation.x = -Math.PI / 2;
        this.flameCore.position.z = 1.5;
        this.thrusterGroup.add(this.flameCore);

        // Outer Glow (Blue-Cyan)
        const glowGeo = new THREE.ConeGeometry(0.4, 4.5, 12);
        this.flameGlow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4 }));
        this.flameGlow.rotation.x = -Math.PI / 2;
        this.flameGlow.position.z = 2.25;
        this.thrusterGroup.add(this.flameGlow);

        this.thrusterGroup.visible = false;
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
