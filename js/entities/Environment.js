class Environment {
    constructor(scene) {
        this.scene = scene;
        this.stars = null;
        this.speedLines = null;
        this.createStars();
        this.createSpeedLines();
    }

    createStars() {
        const geo = new THREE.BufferGeometry();
        const pos = [];
        for (let i = 0; i < 50000; i++) {
            pos.push((Math.random() - 0.5) * 10000000, (Math.random() - 0.5) * 10000000, (Math.random() - 0.5) * 10000000);
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        this.stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x666666, size: 0.8, sizeAttenuation: false }));
        this.scene.add(this.stars);
    }

    createSpeedLines() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(300); // 50 lines * 2 pts * 3 coords
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.speedLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0 }));
        this.scene.add(this.speedLines);
    }

    updateSpeedLines(ship, currentSpeed) {
        const lines = this.speedLines.geometry.attributes.position;
        const opacity = Math.min(0.4, currentSpeed * 0.01);
        this.speedLines.material.opacity = opacity;

        if (opacity > 0) {
            for (let i = 0; i < 50; i++) {
                const idx = i * 6;
                if (Math.abs(lines.array[idx + 2]) > 200 || lines.array[idx + 2] === 0) {
                    const rx = (Math.random() - 0.5) * 60, ry = (Math.random() - 0.5) * 60, rz = -80 - Math.random() * 50;
                    lines.array[idx] = rx; lines.array[idx + 1] = ry; lines.array[idx + 2] = rz;
                    lines.array[idx + 3] = rx; lines.array[idx + 4] = ry; lines.array[idx + 5] = rz - 30;
                }
                lines.array[idx + 2] += currentSpeed * 2;
                lines.array[idx + 5] += currentSpeed * 2;
            }
            lines.needsUpdate = true;
            this.speedLines.position.copy(ship.position);
            this.speedLines.quaternion.copy(ship.quaternion);
        }
    }
}
window.Environment = Environment;
