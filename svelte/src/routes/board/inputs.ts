import { UserActions, UserInputs } from "./userenums";

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

    private prevLocation: [number, number];
    private currLocation: [number, number];

    constructor() {
        this.fn2key = new Map();
        this.key2fns = new Map();
        this.usermap = new Map();
        // this.inputReady = true;
        this.lastInput = PointerState.NONE;

        //TODO: modularize this out

        this.usermap.set(
            UserInputs.TOUCH_DRAG,
            UserActions.DRAW
        );
        this.usermap.set(
            UserInputs.MOUSE_DRAG,
            UserActions.DRAW
        );

        this.prevLocation = [0, 0];
        this.currLocation = [0, 0];
    }

    private pushNewPoint(x: number, y: number) {
        this.prevLocation = this.currLocation;
        this.currLocation = [x, y];
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
    public actionType(
        e: PointerEvent | TouchEvent
    ): UserActions {
        console.log(e);
        if (
            e.type === "touchstart" ||
            e.type == "touchend" ||
            e.type === " touchcancel" ||
            e.type === "touchmove"
        ) {
            let ev = e as TouchEvent;
            if (ev.touches.length !== 1) {
                return UserActions.NONE;
            }
            this.pushNewPoint(
                ev.changedTouches[0].clientX,
                ev.changedTouches[0].clientY
            );
            if (
                ev.type === "touchmove" &&
                this.lastInput === PointerState.TOUCH
            ) {
                return (
                    this.usermap.get(
                        UserInputs.TOUCH_DRAG
                    ) ?? UserActions.NONE
                );
            }
            if (ev.type === "touchstart") {
                this.lastInput = PointerState.TOUCH;

                return (
                    this.usermap.get(
                        UserInputs.TOUCH_TAP
                    ) ?? UserActions.NONE
                );
            }
            if (ev.type === "touchend") {
                this.lastInput = PointerState.NONE;
                return UserActions.SELECT;
            }
        }

        let ev = e as PointerEvent;
        //obfusccated
        let t = {
            mouse: {
                s: PointerState.MOUSE,
                e: [
                    UserInputs.MOUSE_DRAG,
                    UserInputs.MOUSE_TAP,
                ],
            },
            // touch: {
            //     s: PointerState.TOUCH,
            //     e: [
            //         UserInputs.TOUCH_DRAG,
            //         UserInputs.TOUCH_TAP,
            //     ],
            // },
            pen: {
                s: PointerState.PEN,
                e: [
                    UserInputs.PEN_DRAG,
                    UserInputs.PEN_TAP,
                ],
            },
        };

        for (const [k, v] of Object.entries(t)) {
            if (ev.pointerType === k) {
                this.pushNewPoint(ev.clientX, ev.clientY);
                //TODO: better critera for "drawing"
                if (
                    ev.type === "pointermove" &&
                    this.lastInput === v.s
                ) {
                    return (
                        this.usermap.get(v.e[0]) ??
                        UserActions.NONE
                    );
                }
                if (ev.type === "pointerdown") {
                    this.lastInput = v.s;

                    return (
                        this.usermap.get(v.e[1]) ??
                        UserActions.NONE
                    );
                }
                if (ev.type === "pointerup") {
                    this.lastInput = PointerState.NONE;
                    return UserActions.SELECT;
                }
            }
        }

        return UserActions.NONE;
    }

    public actionMeta(e: PointerEvent | TouchEvent): {
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

    public previousPoint(): Readonly<[number, number]> {
        return this.prevLocation;
    }

    public currentPoint(): Readonly<[number, number]> {
        return this.currLocation;
    }
}
