import { UserInputs } from "./usertypes";

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
    private usermap: Map<
        UserInputs,
        InputHandling.UserActions
    >;
    // private inputReady : boolean;
    private lastInput: PointerState;
    private currMove: InputHandling.UserActions;
    private lastMove: InputHandling.UserActions;

    private prevLocation: {
        x: number;
        y: number;
    };
    private currLocation: {
        x: number;
        y: number;
    };
    private handlingNode: SVGGraphicsElement | null;
    private defaultHandlers: InputHandling.Handlers;
    private currentHandlers: InputHandling.Handlers;
    constructor(defaultHandler: InputHandling.Handlers) {
        this.fn2key = new Map();
        this.key2fns = new Map();
        this.usermap = new Map();
        // this.inputReady = true;
        this.lastInput = PointerState.NONE;

        //TODO: modularize this out

        this.usermap.set(
            UserInputs.TOUCH_DRAG,
            InputHandling.UserActions.PAN
        );
        this.usermap.set(
            UserInputs.PEN_DRAG,
            InputHandling.UserActions.DRAW
        );
        this.usermap.set(
            UserInputs.MOUSE_DRAG,
            InputHandling.UserActions.DRAW
        );

        this.prevLocation = { x: 0, y: 0 };
        this.currLocation = { x: 0, y: 0 };

        this.lastMove = InputHandling.UserActions.NONE;
        this.currMove = InputHandling.UserActions.NONE;

        this.defaultHandlers = this.currentHandlers =
            defaultHandler;
        this.handlingNode = null;
    }

    private pushNewPoint(x: number, y: number) {
        this.prevLocation = this.currLocation;
        this.currLocation = { x: x, y: y };
    }

    private pushNewAction(a: InputHandling.UserActions) {
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
        act: InputHandling.UserActions
    ) {
        this.usermap.set(inp, act);
    }

    // given a pointer event, determines what the user was trying to do
    // this is based in a running history of pointer movements
    public actionType(
        ev: PointerEvent
    ): InputHandling.UserActions {
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
        let tor: InputHandling.UserActions =
            InputHandling.UserActions.NONE;
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
                        InputHandling.UserActions.NONE;
                }
                if (ev.type === "pointerdown") {
                    this.lastInput = v.s;

                    tor =
                        this.usermap.get(v.e[1]) ??
                        InputHandling.UserActions.NONE;
                }
                if (ev.type === "pointerup") {
                    this.lastInput = PointerState.NONE;
                    if (
                        this.currMove ===
                        InputHandling.UserActions.NONE
                    ) {
                        tor =
                            InputHandling.UserActions
                                .SELECT;
                    } else {
                        tor =
                            InputHandling.UserActions.NONE;
                    }
                }
            }
        }
        this.pushNewAction(tor);
        return tor;
    }

    public actionMeta(e: PointerEvent | KeyboardEvent): {
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

    public prevAction(): InputHandling.UserActions {
        return this.lastMove;
    }

    public currAction(): InputHandling.UserActions {
        return this.currMove;
    }

    /**
     * Set the handlers for a particular id. If the id cannot be found,
     * this falls back to -1 and returns control to the board
     * @param id the id of the object to attribute these handlers to
     * @param handlers the set of handlers to use
     */
    public setHandlers(
        id: number,
        handlers: InputHandling.Handlers
    ) {
        let el = document.getElementById(
            `${id}-svg-item`
        ) as SVGGraphicsElement | null;
        if (id < 0 || el === null) {
            this.currentHandlers = this.defaultHandlers;
        } else {
            this.handlingNode = el;
            this.currentHandlers = handlers;
        }
    }

    /**
     * Reformats pointer and key events so that only necessary information is exposed.
     * Note that if the x and y coordinate arenot given, the client coordinates
     * will be sent back
     * @param ev an HTML event
     * @param x the x coordinate of the event in board coordinates
     * @param t the y coordinate of the event in board coordinates
     * @returns a reformatted InputHandling.InputEvent
     */
    public HTMLEventToInputHandlingEvent(
        ev: PointerEvent | KeyboardEvent,
        x?: number,
        y?: number
    ): InputHandling.InputEvent {
        let meta = this.actionMeta(ev);
        let t = ev.target;
        let target: Element = document.body;
        if (t instanceof Element) {
            target = t as Element;
        }
        // TODO: maybe give details about whether or not
        // the action is a select, pan, or a draw?
        if ("key" in ev) {
            ev as KeyboardEvent;
            return {
                type: InputHandling.InputEventType.KEY,
                action: InputHandling.UserActions.TYPE,
                value: ev.key, // TODO: alt, shift, crtl
                target: target,
                lift: meta.lift,
                x: x ?? this.currLocation.x,
                y: y ?? this.currLocation.y,
            };
        } else {
            ev as PointerEvent;
            return {
                type: this.pointerEventTypeToInputEventType(
                    ev
                ),
                action: this.actionType(ev),
                value: `${ev.pointerId}`, // TODO: lmg, rmb, etc etc? compositions?
                target: target,
                lift: meta.lift === -1 ? -1 : ev.pressure,
                x: x ?? ev.clientX,
                y: y ?? ev.clientY,
            };
        }
    }

    private pointerEventTypeToInputEventType(
        ev: PointerEvent
    ): InputHandling.InputEventType {
        switch (ev.pointerType) {
            case "pen":
                return InputHandling.InputEventType.PEN;
            case "touch":
                return InputHandling.InputEventType.TOUCH;
            default:
                return InputHandling.InputEventType.MOUSE;
        }
    }

    public handleNewEvent(
        ev: PointerEvent | KeyboardEvent,
        x: number,
        y: number
    ) {
        // convert to InputEvent
        let inputEv = this.HTMLEventToInputHandlingEvent(
            ev,
            x,
            y
        );
        // if the user is selecting something outside of the select, call the end
        if (
            this.handlingNode !== null &&
            inputEv.action ===
                InputHandling.UserActions.SELECT &&
            !this.pointIsInEl(this.handlingNode, inputEv)
        ) {
            if (this.currentHandlers.onEnd) {
                this.currentHandlers.onEnd(inputEv);
            }
            this.currentHandlers = this.defaultHandlers;
            this.handlingNode = null;
        }
        // shove the event into the applicable functions
        if (this.currentHandlers.onAny) {
            this.currentHandlers.onAny(inputEv);
        }
    }

    public returnControlToBoard(
        ev: PointerEvent | KeyboardEvent,
        x: number,
        y: number
    ) {
        if (this.currentHandlers.onEnd) {
            this.currentHandlers.onEnd(
                this.HTMLEventToInputHandlingEvent(ev, x, y)
            );
        }
        this.setHandlers(-1, this.defaultHandlers);
    }

    // TODO: this only exists because i cant figure out how to
    // get a default loader to work correctly in constructor;
    // figure that out
    public setDefaultHandler(
        handlers: InputHandling.Handlers
    ) {
        this.defaultHandlers = handlers;
        this.currentHandlers = handlers;
    }

    private pointIsInEl(
        el: SVGGraphicsElement,
        point: { x: number; y: number }
    ): boolean {
        let r = el.getBBox();
        // if out of bounds
        if (
            point.x < r.x ||
            point.y < r.y ||
            point.x > r.x + r.width ||
            point.y > r.y + r.height
        ) {
            return false;
        }
        return true;
    }
}
