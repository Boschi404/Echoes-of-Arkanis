import { IModule } from '../core/Module';
/**
 * Manages user input from keyboard, mouse, and gamepad.
 * This replaces Three.js input handling.
 */
export declare class InputManager implements IModule {
    private keyboardState;
    private mouseState;
    private gamepadState;
    constructor();
    init(): void;
    update(dt: number): void;
    dispose(): void;
    /**
     * Check if a key is currently pressed.
     * @param key The key code to check.
     */
    isKeyPressed(key: string): boolean;
    /**
     * Get the current mouse state.
     */
    getMouseState(): MouseState;
    /**
     * Get the current gamepad state.
     */
    getGamepadState(): GamepadState;
    private onKeyDown;
    private onKeyUp;
    private onMouseDown;
    private onMouseUp;
    private onMouseMove;
    private onMouseWheel;
    private onGamepadConnected;
    private onGamepadDisconnected;
}
/**
 * Mouse input state.
 */
export declare class MouseState {
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    wheelDelta: number;
    buttons: boolean[];
    /**
     * Check if a mouse button is pressed.
     * @param button Button index (0=left, 1=middle, 2=right).
     */
    isButtonPressed(button: number): boolean;
}
/**
 * Gamepad input state.
 */
export declare class GamepadState {
    connected: boolean;
    gamepad: Gamepad | null;
    update(): void;
    /**
     * Get the value of an axis.
     * @param axisIndex The axis index.
     */
    getAxis(axisIndex: number): number;
    /**
     * Check if a button is pressed.
     * @param buttonIndex The button index.
     */
    isButtonPressed(buttonIndex: number): boolean;
}
//# sourceMappingURL=InputManager.d.ts.map