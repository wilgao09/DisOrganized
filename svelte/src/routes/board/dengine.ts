import type MultiplayerManager from "./multiplayer";
import { WSMessageCode } from "./wsutil";

const CURSOR_REFRESH = 66;

/**
 * Responsible for managing the interactive canvas and the underlying svg
 * Does this by interacting with a ctx
 */
export default class DrawingEngine {
    private ctx: CanvasRenderingContext2D;
    private svg: SVGSVGElement;
    private isDrawing: boolean;
    private svgElements: Map<number, Element>;

    private userCursors: SVGSVGElement;
    private userCursorElements: Map<number, Element>;

    private xcenter: number;
    private ycenter: number;
    private zoomFactor: number;
    private viewboxReady = true;
    public static readonly svgns: string =
        "http://www.w3.org/2000/svg";
    private mm: MultiplayerManager;

    private readySendPos: boolean = true;

    // private centerel: Element;
    constructor(
        ctx: CanvasRenderingContext2D,
        svg: SVGSVGElement,
        usersvg: SVGSVGElement,
        mm: MultiplayerManager
    ) {
        this.ctx = ctx;
        this.svg = svg;
        this.isDrawing = false;
        this.svgElements = new Map();
        this.mm = mm;

        this.xcenter = window.innerWidth / 2;
        this.ycenter = window.innerHeight / 2;
        this.zoomFactor = 1;

        setInterval(() => {
            this.viewboxReady = true;
        }, 40);
        setInterval(() => {
            this.readySendPos = true;
        }, CURSOR_REFRESH);

        this.userCursors = usersvg;
        this.userCursorElements = new Map();

        // this.centerel = this.buildCursorNode("#e0f125");

        this.svg.viewBox.baseVal.width = window.innerWidth;
        this.svg.viewBox.baseVal.height =
            window.innerHeight;
        this.userCursors.viewBox.baseVal.width =
            window.innerWidth;
        this.userCursors.viewBox.baseVal.height =
            window.innerHeight;

        // TODO:
        //TODO: make the cursors disappear after 15s
        mm.userMappingUpdate.subscribe((_) => {
            for (let [k, v] of mm.getAllUserData()) {
                if (
                    this.userCursorElements.get(k) ===
                    undefined
                ) {
                    //create elements
                    let nel = this.buildCursorNode(
                        mm.getColor(k)
                    );
                    this.userCursorElements.set(k, nel);
                }
                let storedel =
                    this.userCursorElements.get(k);
                if (storedel === undefined) {
                    continue; // this should never happen
                }
                // diff the stored version and the new version
                let storedx = storedel?.getAttributeNS(
                    null,
                    "cx"
                );
                let storedy = storedel?.getAttributeNS(
                    null,
                    "cy"
                );
                if (
                    storedx === null ||
                    storedy === null ||
                    v.x !== parseFloat(storedx) ||
                    v.y !== parseFloat(storedy)
                ) {
                    let lastx: string;
                    let lasty: string;
                    if (storedx === null) {
                        lastx = "" + v.x;
                    } else {
                        lastx = storedx;
                    }
                    storedel.animate(
                        [
                            { cx: lastx, cy: storedy },
                            { cx: ctx.save, cy: v.y },
                        ],
                        {
                            duration: CURSOR_REFRESH,
                            easing: "cubic-bezier(0, 0, 0.2, 1)",
                        }
                    );
                    storedel.setAttributeNS(
                        null,
                        "cx",
                        `${v.x}`
                    );
                    storedel.setAttributeNS(
                        null,
                        "cy",
                        `${v.y}`
                    );
                }
            }
        });
    }

    private buildCursorNode(color: string): Element {
        let retel = document.createElementNS(
            DrawingEngine.svgns,
            "circle"
        );
        retel.setAttributeNS(null, "cx", "0");
        retel.setAttributeNS(null, "cy", "0");
        retel.setAttributeNS(null, "r", "50");
        retel.setAttributeNS(
            null,
            "style",
            `fill: ${color}; stroke: ${color}; stroke-width: 1px;`
        );

        this.userCursors.appendChild(retel);
        return retel;
    }

    public handleCursorInput(ev: PointerEvent) {
        // console.log(ev.type);
        if (ev.type === "pointerdown") {
            if (!this.isDrawing) {
                this.isDrawing = true;
                this.ctx.moveTo(ev.clientX, ev.clientY);
                this.ctx.beginPath();
                // console.log("beginpath");
            } else {
                this.ctx.lineTo(ev.clientX, ev.clientY);
            }
        } else if (ev.type === "pointerup") {
            if (!this.isDrawing) {
                //defensive programming?
                return;
            } else {
                // console.log("endpath");
                this.isDrawing = false;
            }
        } else if (ev.type === "pointermove") {
            if (this.isDrawing) {
                // console.log(
                //     "line to " +
                //         ev.clientX +
                //         " " +
                //         ev.clientY
                // );
                this.ctx.lineTo(ev.clientX, ev.clientY);
                this.ctx.stroke();
            }
        }
    }

    public clearRect(
        x0: number,
        y0: number,
        w: number,
        h: number
    ) {
        this.ctx.clearRect(x0, y0, w, h);
    }

    private addSVG(id: number, svg: Element) {
        this.svg.appendChild(svg);
        this.svgElements.set(id, svg); //TODO: add warnings
    }

    public drawSVGJSON(o: SVGJSON) {
        let k: Element; // TODO: wtf is this
        k = document.createElementNS(
            DrawingEngine.svgns,
            o.tag
        );
        for (const [key, val] of Object.entries(o)) {
            if (key === "id" || key === "tag") continue;
            k.setAttribute(key, val);
        }
        // console.log(k);
        this.addSVG(o.id, k);
    }

    public clearAll() {
        for (let k of this.svgElements.keys()) {
            this.svgElements.get(k)?.remove();
            this.svgElements.delete(k);
        }
    }

    public zoom(x: number, y: number, factor: number) {
        if (!this.viewboxReady) {
            return;
        }
        this.zoomFactor *= factor;
        let [dx, dy] = [x - this.xcenter, y - this.ycenter];
        this.xcenter += (factor - 1) * dx;
        this.ycenter += (factor - 1) * dy;

        // redraw all svg items
        let [ox, oy] = [
            this.svg.viewBox.baseVal.x,
            this.svg.viewBox.baseVal.y,
        ];
        this.svg.viewBox.baseVal.x +=
            (factor - 1) * (ox - this.xcenter);
        this.svg.viewBox.baseVal.y +=
            (factor - 1) * (oy - this.ycenter);
        this.svg.viewBox.baseVal.width *= factor;
        this.svg.viewBox.baseVal.height *= factor;

        this.userCursors.viewBox.baseVal.x =
            this.svg.viewBox.baseVal.x;
        this.userCursors.viewBox.baseVal.y =
            this.svg.viewBox.baseVal.y;
        this.userCursors.viewBox.baseVal.width =
            this.svg.viewBox.baseVal.width;
        this.userCursors.viewBox.baseVal.height =
            this.svg.viewBox.baseVal.height;
        //TODO: redraw canvas items
    }

    /**
     * Pan the screen from x0, y0 to x,y. All parameters are in
     * screen pixels
     * @param x0
     * @param y0
     * @param x
     * @param y
     */
    public pan(
        x0: number,
        y0: number,
        x: number,
        y: number
    ) {
        if (!this.viewboxReady) {
            return;
        }
        let n = this.svg.viewBox.baseVal;
        let dx = (-1 * (x - x0)) / this.zoomFactor;
        let dy = (-1 * (y - y0)) / this.zoomFactor;
        this.xcenter += dx;
        this.ycenter += dy;

        //redraw all svg elements
        this.svg.viewBox.baseVal.x += dx;
        this.svg.viewBox.baseVal.y += dy;

        this.userCursors.viewBox.baseVal.x += dx;
        this.userCursors.viewBox.baseVal.y += dy;
        //TODO: redraw canvas

        // this.centerel.setAttributeNS(
        //     null,
        //     "cx",
        //     `${this.xcenter}`
        // );
        // this.centerel.setAttributeNS(
        //     null,
        //     "cy",
        //     `${this.ycenter}`
        // );
    }

    /**
     *
     * Try to send the user's current position to all other users over the ws
     * @param ev an event that gives information about the user position
     * @returns a boolean denoting whether or not the position was succesfully sent
     */
    public trySendPosition(
        e: PointerEvent | TouchEvent
    ): boolean {
        if (!this.readySendPos) return false;
        let bc = this.eventToBoardCoords(e);
        if (bc.length === 0) return false;
        window.boardSocket({
            msgType: WSMessageCode.POINTER_MOVED,
            msg: `${bc[0][0]}\v${bc[0][1]}`,
        });
        this.readySendPos = false;
        return true;
    }

    /**
     * Convert a point on the screen to a point on the board
     * This performs a constant time linear transformation
     * @param x clientX value
     * @param y clientY value
     * @returns an array denoting the x and y coordinate on the board
     */
    public mapScreenPointToBoardPoint(
        x: number,
        y: number
    ): [number, number] {
        // get the vector from center of screen to dest
        let dx = x - window.innerWidth / 2;
        let dy = y - window.innerHeight / 2;

        dx /= this.zoomFactor;
        dy /= this.zoomFactor;

        return [this.xcenter + dx, this.ycenter + dy];
    }

    public eventToBoardCoords(
        e: TouchEvent | PointerEvent
    ): [number, number][] {
        if (
            e.type === "touchstart" ||
            e.type == "touchend" ||
            e.type === " touchcancel" ||
            e.type === "touchmove"
        ) {
            let ev = e as TouchEvent;
            let ans = [];
            for (let tp of ev.changedTouches) {
                ans.push(
                    this.mapScreenPointToBoardPoint(
                        tp.clientX,
                        tp.clientY
                    )
                );
            }
            return ans;
        } else {
            let ev = e as PointerEvent;
            return [
                this.mapScreenPointToBoardPoint(
                    ev.clientX,
                    ev.clientY
                ),
            ];
        }
    }

    public resize() {
        this.xcenter +=
            (window.innerWidth -
                this.userCursors.viewBox.baseVal.width) /
            2;
        this.ycenter +=
            (window.innerHeight -
                this.userCursors.viewBox.baseVal.height) /
            2;

        this.svg.viewBox.baseVal.width = window.innerWidth;
        this.svg.viewBox.baseVal.height =
            window.innerHeight;

        this.userCursors.viewBox.baseVal.width =
            window.innerWidth;
        this.userCursors.viewBox.baseVal.height =
            window.innerHeight;
        // this.centerel.setAttributeNS(
        //     null,
        //     "cx",
        //     `${this.xcenter}`
        // );
        // this.centerel.setAttributeNS(
        //     null,
        //     "cy",
        //     `${this.ycenter}`
        // );
    }
}
