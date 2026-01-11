/**
 * Input Manager handles all input events.
 * Provides a centralized way to manage keyboard, mouse, and other inputs.
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        // Game-specific flags
        this.isPlaying = false;
        this.isMapOpen = false;
        this.isAutopilot = false;
        this.isTracking = false;
        // TODO: Add gamepad support
        // TODO: Add touch/mobile input support
        // TODO: Add input binding system for customizable controls
    }
    init() {
        // Keyboard events
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        // Mouse events
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
    }
    update(dt) {
        // Reset click state after processing
        this.mouse.clicked = false;
    }
    dispose() {
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
        window.removeEventListener('keyup', this.onKeyUp.bind(this));
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));
        window.removeEventListener('mousedown', this.onMouseDown.bind(this));
        window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    }
    onKeyDown(event) {
        this.keys[event.code] = true;
        // Handle special keys
        switch (event.code) {
            case 'KeyM':
                this.isMapOpen = !this.isMapOpen;
                break;
            case 'Escape':
                this.isPlaying = false;
                // TODO: Trigger UI updates or game pause
                break;
        }
    }
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    onMouseDown(event) {
        this.mouse.clicked = true;
    }
    onMouseUp(event) {
        // Click state is reset in update()
    }
    /**
     * Check if a key is currently pressed.
     */
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    /**
     * Get mouse position normalized to [-1, 1].
     */
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    /**
     * Check if mouse was clicked this frame.
     */
    wasMouseClicked() {
        return this.mouse.clicked;
    }
}
//# sourceMappingURL=InputManager.js.map