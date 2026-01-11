/**
 * Input modes for different control schemes.
 */
export var InputMode;
(function (InputMode) {
    InputMode[InputMode["FPS"] = 0] = "FPS";
    InputMode[InputMode["Spaceship"] = 1] = "Spaceship";
})(InputMode || (InputMode = {}));
/**
 * Manages user input from keyboard, mouse, and gamepad.
 * This replaces Three.js input handling.
 */
export class InputManager {
    constructor() {
        this.keyboardState = new Map();
        this.currentMode = InputMode.FPS;
        // Action mappings: action name -> array of key codes
        this.actionMappings = new Map([
            [InputMode.FPS, new Map([
                    ['moveForward', ['KeyW']],
                    ['moveBackward', ['KeyS']],
                    ['moveLeft', ['KeyA']],
                    ['moveRight', ['KeyD']],
                    ['jump', ['Space']],
                    ['crouch', ['KeyC']],
                ])],
            [InputMode.Spaceship, new Map([
                    ['thrust', ['KeyW']],
                    ['reverse', ['KeyS']],
                    ['strafeLeft', ['KeyA']],
                    ['strafeRight', ['KeyD']],
                    ['ascend', ['ShiftLeft']],
                    ['descend', ['ControlLeft']],
                ])]
        ]);
        // Axis mappings: axis name -> source (e.g., 'mouseDeltaX', 'gamepadAxis0')
        this.axisMappings = new Map([
            [InputMode.FPS, new Map([
                    ['lookX', 'mouseDeltaX'],
                    ['lookY', 'mouseDeltaY'],
                ])],
            [InputMode.Spaceship, new Map([
                    ['lookX', 'mouseDeltaX'],
                    ['lookY', 'mouseDeltaY'],
                ])]
        ]);
        this.mouseState = new MouseState();
        this.gamepadState = new GamepadState();
    }
    init() {
        console.log('Initializing Input Manager...');
        this.mouseState = new MouseState();
        this.gamepadState = new GamepadState();
        // Keyboard event listeners
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        // Mouse event listeners
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('wheel', this.onMouseWheel.bind(this));
        // Gamepad event listeners
        window.addEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
        window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));
        console.log('Input Manager initialized');
    }
    update(dt) {
        // Update gamepad state
        this.gamepadState.update();
    }
    dispose() {
        console.log('Disposing Input Manager...');
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
        window.removeEventListener('keyup', this.onKeyUp.bind(this));
        window.removeEventListener('mousedown', this.onMouseDown.bind(this));
        window.removeEventListener('mouseup', this.onMouseUp.bind(this));
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));
        window.removeEventListener('wheel', this.onMouseWheel.bind(this));
        window.removeEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
        window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));
        console.log('Input Manager disposed');
    }
    /**
     * Check if a key is currently pressed.
     * @param key The key code to check.
     */
    isKeyPressed(key) {
        return this.keyboardState.get(key) || false;
    }
    /**
     * Get the current mouse state.
     */
    getMouseState() {
        return this.mouseState;
    }
    /**
     * Get the current gamepad state.
     */
    getGamepadState() {
        return this.gamepadState;
    }
    /**
     * Set the current input mode.
     * @param mode The input mode to set.
     */
    setInputMode(mode) {
        this.currentMode = mode;
    }
    /**
     * Check if an action is currently pressed.
     * @param action The action name to check.
     */
    isActionPressed(action) {
        const modeMappings = this.actionMappings.get(this.currentMode);
        if (!modeMappings)
            return false;
        const keys = modeMappings.get(action);
        if (!keys)
            return false;
        return keys.some(key => this.isKeyPressed(key));
    }
    /**
     * Get the value of an axis.
     * @param axis The axis name to get.
     */
    getAxis(axis) {
        const modeMappings = this.axisMappings.get(this.currentMode);
        if (!modeMappings)
            return 0;
        const source = modeMappings.get(axis);
        if (!source)
            return 0;
        if (source === 'mouseDeltaX') {
            return this.mouseState.deltaX;
        }
        else if (source === 'mouseDeltaY') {
            return this.mouseState.deltaY;
        }
        else if (source.startsWith('gamepadAxis')) {
            const axisIndex = parseInt(source.replace('gamepadAxis', ''));
            return this.gamepadState.getAxis(axisIndex);
        }
        return 0;
    }
    onKeyDown(event) {
        this.keyboardState.set(event.code, true);
    }
    onKeyUp(event) {
        this.keyboardState.set(event.code, false);
    }
    onMouseDown(event) {
        this.mouseState.buttons[event.button] = true;
    }
    onMouseUp(event) {
        this.mouseState.buttons[event.button] = false;
    }
    onMouseMove(event) {
        this.mouseState.x = event.clientX;
        this.mouseState.y = event.clientY;
        this.mouseState.deltaX = event.movementX;
        this.mouseState.deltaY = event.movementY;
    }
    onMouseWheel(event) {
        this.mouseState.wheelDelta = event.deltaY;
    }
    onGamepadConnected(event) {
        console.log('Gamepad connected:', event.gamepad.id);
        this.gamepadState.connected = true;
        this.gamepadState.gamepad = event.gamepad;
    }
    onGamepadDisconnected(event) {
        console.log('Gamepad disconnected:', event.gamepad.id);
        this.gamepadState.connected = false;
        this.gamepadState.gamepad = null;
    }
}
/**
 * Mouse input state.
 */
export class MouseState {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.wheelDelta = 0;
        this.buttons = [false, false, false]; // Left, middle, right
    }
    /**
     * Check if a mouse button is pressed.
     * @param button Button index (0=left, 1=middle, 2=right).
     */
    isButtonPressed(button) {
        return this.buttons[button] || false;
    }
}
/**
 * Gamepad input state.
 */
export class GamepadState {
    constructor() {
        this.connected = false;
        this.gamepad = null;
    }
    update() {
        if (this.connected && this.gamepad) {
            // Refresh gamepad state
            const gamepads = navigator.getGamepads();
            this.gamepad = gamepads[this.gamepad.index] || null;
        }
    }
    /**
     * Get the value of an axis.
     * @param axisIndex The axis index.
     */
    getAxis(axisIndex) {
        if (!this.gamepad || axisIndex >= this.gamepad.axes.length) {
            return 0;
        }
        return this.gamepad.axes[axisIndex];
    }
    /**
     * Check if a button is pressed.
     * @param buttonIndex The button index.
     */
    isButtonPressed(buttonIndex) {
        if (!this.gamepad || buttonIndex >= this.gamepad.buttons.length) {
            return false;
        }
        return this.gamepad.buttons[buttonIndex].pressed;
    }
}
//# sourceMappingURL=InputManager.js.map