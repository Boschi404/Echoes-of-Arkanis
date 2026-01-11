import { IModule } from '../interfaces/IModule.js';

/**
 * Input Manager handles all input events.
 * Provides a centralized way to manage keyboard, mouse, and other inputs.
 */
export class InputManager implements IModule {
    public keys: { [key: string]: boolean } = {};
    public mouse: { x: number; y: number; clicked: boolean } = { x: 0, y: 0, clicked: false };

    // Game-specific flags
    public isPlaying: boolean = false;
    public isMapOpen: boolean = false;
    public isAutopilot: boolean = false;
    public isTracking: boolean = false;

    init(): void {
        // Keyboard events
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        // Mouse events
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    update(dt: number): void {
        // Reset click state after processing
        this.mouse.clicked = false;
    }

    dispose(): void {
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
        window.removeEventListener('keyup', this.onKeyUp.bind(this));
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));
        window.removeEventListener('mousedown', this.onMouseDown.bind(this));
        window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    }

    private onKeyDown(event: KeyboardEvent): void {
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

    private onKeyUp(event: KeyboardEvent): void {
        this.keys[event.code] = false;
    }

    private onMouseMove(event: MouseEvent): void {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    private onMouseDown(event: MouseEvent): void {
        this.mouse.clicked = true;
    }

    private onMouseUp(event: MouseEvent): void {
        // Click state is reset in update()
    }

    /**
     * Check if a key is currently pressed.
     */
    isKeyPressed(keyCode: string): boolean {
        return !!this.keys[keyCode];
    }

    /**
     * Get mouse position normalized to [-1, 1].
     */
    getMousePosition(): { x: number; y: number } {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    /**
     * Check if mouse was clicked this frame.
     */
    wasMouseClicked(): boolean {
        return this.mouse.clicked;
    }

    // TODO: Add gamepad support
    // TODO: Add touch/mobile input support
    // TODO: Add input binding system for customizable controls
}
