import { UserActions, UserInputs } from "./enums";

enum PointerState {
    PEN,
    TOUCH,
    MOUSE,
    NONE,
}

// im gonna say that behavior is undefuined if multiple cursors are moving

export default class InputManager {
    private fn2key: Map<string, string>;
    private key2fns: Map<string, string[]>;
    private usermap: Map<UserInputs, UserActions>;
    // private inputReady : boolean;
    private lastInput: PointerState;

    constructor() {
        this.fn2key = new Map();
        this.key2fns = new Map();
        this.usermap = new Map();
        // this.inputReady = true;
        this.lastInput = PointerState.NONE;

        //TODO: modularize this out

        this.usermap.set(UserInputs.TOUCH_DRAG, UserActions.PAN);
        this.usermap.set(UserInputs.MOUSE_DRAG, UserActions.DRAW);
    }

    //TODO: warnings

    public addKeyMapping(key: string, fn: string) {
        let t;
        if ((t = this.key2fns.get(key)) !== undefined) {
            t.push(fn); //TODO: verify that this works
        } else {
            this.key2fns.set(key, [fn]);
        }
        this.fn2key.set(fn, key);
    }

    public getFns(key: string): string[] {
        return this.key2fns.get(key) ?? [];
    }

    public changePointerBehavior(inp: UserInputs, act: UserActions) {
        this.usermap.set(inp, act);
    }

    public actionType(ev: PointerEvent): UserActions {
        // if (!this.inputReady) {
        //     return UserActions.NONE;
        // }

        //obfusccated
        let t = {
            mouse: {
                s: PointerState.MOUSE,
                e: [UserInputs.MOUSE_DRAG, UserInputs.MOUSE_TAP],
            },
            touch: {
                s: PointerState.TOUCH,
                e: [UserInputs.TOUCH_DRAG, UserInputs.TOUCH_TAP],
            },
            pen: {
                s: PointerState.PEN,
                e: [UserInputs.PEN_DRAG, UserInputs.PEN_TAP],
            },
        };

        for (const [k, v] of Object.entries(t)) {
            if (ev.pointerType === k) {
                //TODO: better critera for "drawing"
                if (ev.type === "pointermove" && this.lastInput === v.s) {
                    return this.usermap.get(v.e[0]) ?? UserActions.NONE;
                }
                if (ev.type === "pointerdown") {
                    this.lastInput = v.s;
                    return this.usermap.get(v.e[1]) ?? UserActions.NONE;
                }
                if (ev.type === "pointerup") {
                    this.lastInput = PointerState.NONE;
                    return UserActions.SELECT;
                }
            }
        }

        return UserActions.NONE;
    }
}
