import { IModule } from '../interfaces/IModule.js';
/**
 * Input Manager handles all input events.
 * Provides a centralized way to manage keyboard, mouse, and other inputs.
 */
export declare class InputManager implements IModule {
    keys: {
        [key: string]: boolean;
    };
    mouse: {
        x: number;
        y: number;
        clicked: boolean;
    };
    isPlaying: boolean;
    isMapOpen: boolean;
    isAutopilot: boolean;
    isTracking: boolean;
    init(): void;
    update(dt: number): void;
    dispose(): void;
    private onKeyDown;
    private onKeyUp;
    private onMouseMove;
    private onMouseDown;
    private onMouseUp;
    /**
     * Check if a key is currently pressed.
     */
    isKeyPressed(keyCode: string): boolean;
    /**
     * Get mouse position normalized to [-1, 1].
     */
    getMousePosition(): {
        x: number;
        y: number;
    };
    /**
     * Check if mouse was clicked this frame.
     */
    wasMouseClicked(): boolean;
}
//# sourceMappingURL=InputManager.d.ts.map