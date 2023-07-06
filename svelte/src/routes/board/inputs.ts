import { UserActions, UserInputs } from "./usertypes";

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
    private currMove: UserActions;
    private lastMove: UserActions;

    private prevLocation: {
        x: number;
        y: number;
    };
    private currLocation: {
        x: number;
        y: number;
    };
    constructor() {
        this.fn2key = new Map();
        this.key2fns = new Map();
        this.usermap = new Map();
        // this.inputReady = true;
        this.lastInput = PointerState.NONE;

        //TODO: modularize this out

        this.usermap.set(
            UserInputs.TOUCH_DRAG,
            UserActions.PAN
        );
        this.usermap.set(
            UserInputs.PEN_DRAG,
            UserActions.DRAW
        );
        this.usermap.set(
            UserInputs.MOUSE_DRAG,
            UserActions.DRAW
        );

        this.prevLocation = { x: 0, y: 0 };
        this.currLocation = { x: 0, y: 0 };

        this.lastMove = UserActions.NONE;
        this.currMove = UserActions.NONE;
    }

    private pushNewPoint(x: number, y: number) {
        this.prevLocation = this.currLocation;
        this.currLocation = { x: x, y: y };
    }

    private pushNewAction(a: UserActions) {
        this.lastMove = this.currMove;
        this.currMove = a;
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

    public changePointerBehavior(
        inp: UserInputs,
        act: UserActions
    ) {
        this.usermap.set(inp, act);
    }

    // given a pointer event, determines what the user was trying to do
    // this is based in a running history of pointer movements
    public actionType(ev: PointerEvent): UserActions {
        //obfusccated
        let t = {
            mouse: {
                s: PointerState.MOUSE,
                e: [
                    UserInputs.MOUSE_DRAG,
                    UserInputs.MOUSE_TAP,
                ],
            },
            touch: {
                s: PointerState.TOUCH,
                e: [
                    UserInputs.TOUCH_DRAG,
                    UserInputs.TOUCH_TAP,
                ],
            },
            pen: {
                s: PointerState.PEN,
                e: [
                    UserInputs.PEN_DRAG,
                    UserInputs.PEN_TAP,
                ],
            },
        };
        let tor: UserActions = UserActions.NONE;
        for (const [k, v] of Object.entries(t)) {
            if (ev.pointerType === k) {
                this.pushNewPoint(ev.clientX, ev.clientY);
                //TODO: better critera for "drawing"
                if (
                    ev.type === "pointermove" &&
                    this.lastInput === v.s
                ) {
                    tor =
                        this.usermap.get(v.e[0]) ??
                        UserActions.NONE;
                }
                if (ev.type === "pointerdown") {
                    this.lastInput = v.s;

                    tor =
                        this.usermap.get(v.e[1]) ??
                        UserActions.NONE;
                }
                if (ev.type === "pointerup") {
                    this.lastInput = PointerState.NONE;
                    if (
                        this.currMove === UserActions.NONE
                    ) {
                        tor = UserActions.SELECT;
                    } else {
                        tor = UserActions.NONE;
                    }
                }
            }
        }
        this.pushNewAction(tor);
        return tor;
    }

    public actionMeta(e: PointerEvent): {
        lift: number;
    } {
        let ret = {
            lift: 0,
        };
        if (
            e.type.includes("up") ||
            e.type.includes("cancel")
        ) {
            ret.lift = -1;
        }

        if (
            e.type.includes("start") ||
            e.type.includes("down")
        ) {
            ret.lift = 1;
        }

        return ret;
    }

    public previousPoint(): Readonly<{
        x: number;
        y: number;
    }> {
        return this.prevLocation;
    }

    public currentPoint(): Readonly<{
        x: number;
        y: number;
    }> {
        return this.currLocation;
    }

    public prevAction(): UserActions {
        return this.lastMove;
    }

    public currAction(): UserActions {
        return this.currMove;
    }
}
