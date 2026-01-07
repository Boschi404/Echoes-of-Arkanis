class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.isMapOpen = false;
        this.isAutopilot = false;
        this.isPlaying = false;

        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'KeyM') this.isMapOpen = !this.isMapOpen;
            if (e.code === 'Escape') {
                this.isPlaying = false;
                document.getElementById('ui-layer').style.display = 'flex';
                document.getElementById('hud-container').style.display = 'none';
                document.getElementById('crosshair').style.display = 'none';
            }
        });

        window.addEventListener('keyup', e => this.keys[e.code] = false);

        window.addEventListener('mousemove', e => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('mousedown', () => {
            this.mouse.clicked = true;
        });
        window.addEventListener('mouseup', () => {
            this.mouse.clicked = false;
        });
    }
}
window.InputHandler = InputHandler;
