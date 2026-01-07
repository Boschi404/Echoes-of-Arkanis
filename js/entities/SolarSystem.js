const PLANET_DATA = [
    { name: "Sole", radius: 15000, color: 0xffcc00, selfRotationSpeed: 0.0001, orbitRadius: 0, orbitSpeed: 0, light: true, emissive: 0xffaa00, info: "Il cuore del sistema. Massa infinita." },
    { name: "Vulcan", radius: 1500, color: 0xaa5533, selfRotationSpeed: 0.002, orbitRadius: 60000, orbitSpeed: 0.00003, info: "Pianeta roccioso estremo. Ricco di minerali rari." },
    { name: "Tatooine", radius: 3500, color: 0xedc9af, selfRotationSpeed: 0.001, orbitRadius: 120000, orbitSpeed: 0.000015, info: "Pianeta desertico con due soli all'orizzonte." },
    { name: "Hoth", radius: 2500, color: 0xe0f2f7, selfRotationSpeed: 0.0005, orbitRadius: 250000, orbitSpeed: 0.000008, info: "Deserto di ghiaccio. Temperatura media -60°C." },
    { name: "Endor", radius: 2200, color: 0x228b22, selfRotationSpeed: 0.003, orbitRadius: 400000, orbitSpeed: 0.000005, info: "Luna boscosa. Biodiversità elevata." }
];

class SolarSystem {
    constructor(scene) {
        this.scene = scene;
        this.planets = [];
        this.sun = null;
        this.createSolarSystem();
    }

    createPlanetTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 800; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
            ctx.beginPath();
            ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 15, 0, Math.PI * 2);
            ctx.fill();
        }
        return new THREE.CanvasTexture(canvas);
    }

    createSolarSystem() {
        const group = new THREE.Group();
        this.scene.add(group);
        PLANET_DATA.forEach(data => {
            const geo = new THREE.SphereGeometry(data.radius, 128, 128);
            let mat;
            if (data.light) {
                mat = new THREE.MeshStandardMaterial({
                    color: data.color,
                    emissive: data.emissive,
                    emissiveIntensity: 5
                });
                this.sun = new THREE.Mesh(geo, mat);
                this.sun.name = data.name;
                this.sun.userData = data;

                // Inner Corona
                const corona1Geo = new THREE.SphereGeometry(data.radius * 1.05, 64, 64);
                const corona1Mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.3, side: THREE.BackSide });
                this.sun.add(new THREE.Mesh(corona1Geo, corona1Mat));

                // Outer Corona
                const corona2Geo = new THREE.SphereGeometry(data.radius * 1.2, 64, 64);
                const corona2Mat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.1, side: THREE.BackSide });
                this.sun.add(new THREE.Mesh(corona2Geo, corona2Mat));

                // Solar Spikes
                const spikeGeo = new THREE.BoxGeometry(data.radius * 0.05, data.radius * 2.8, data.radius * 0.05);
                const spikeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.2 });
                for (let i = 0; i < 12; i++) {
                    const spike = new THREE.Mesh(spikeGeo, spikeMat);
                    spike.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    this.sun.add(spike);
                }

                const pointLight = new THREE.PointLight(0xffffff, 5000000000, 0, 1.5);
                this.sun.add(pointLight);
                group.add(this.sun);
                this.planets.push(this.sun);
            } else {
                // ORBIT LINE
                const orbitPoints = [];
                for (let i = 0; i <= 128; i++) {
                    const angle = (i / 128) * Math.PI * 2;
                    orbitPoints.push(new THREE.Vector3(Math.cos(angle) * data.orbitRadius, 0, Math.sin(angle) * data.orbitRadius));
                }
                const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
                const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
                const orbitLine = new THREE.Line(orbitGeo, orbitMat);
                group.add(orbitLine);

                mat = new THREE.MeshStandardMaterial({
                    map: this.createPlanetTexture(data.color),
                    roughness: 0.8,
                    metalness: 0.1
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.name = data.name;
                mesh.userData = data;
                mesh.position.x = data.orbitRadius;
                group.add(mesh);
                this.planets.push(mesh);
            }
        });
    }

    update(time) {
        this.planets.forEach(p => {
            p.rotation.y += p.userData.selfRotationSpeed;
            if (p.userData.orbitRadius > 0) {
                const a = time * p.userData.orbitSpeed;
                p.position.set(Math.cos(a) * p.userData.orbitRadius, 0, Math.sin(a) * p.userData.orbitRadius);
            }
        });
    }
}
window.SolarSystem = SolarSystem;
window.PLANET_DATA = PLANET_DATA;
