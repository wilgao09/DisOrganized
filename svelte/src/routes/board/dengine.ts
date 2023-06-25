import type MultiplayerManager from "./multiplayer";
import { WSMessageCode } from "./wsutil";

const CURSOR_REFRESH = 66;

/**
 * Responsible for managing the interactive canvas and the underlying svg
 * Does this by interacting with a ctx
 */
export default class DrawingEngine {
    private displayCanvas: HTMLCanvasElement;
    private drawCanvas: HTMLCanvasElement;
    private displayCtx: CanvasRenderingContext2D;
    private drawCtx: CanvasRenderingContext2D;

    private offScreenDrawCanvas: OffscreenCanvas;
    private offScreenDrawCtx: OffscreenCanvasRenderingContext2D;
    private offScreenDrawCanvasOriginDiff: [number, number];

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
        interactiveCanvas: HTMLCanvasElement,
        displayCanvas: HTMLCanvasElement,

        svg: SVGSVGElement,
        usersvg: SVGSVGElement,
        mm: MultiplayerManager
    ) {
        // try to get contexts
        let icctx = interactiveCanvas.getContext("2d");
        if (icctx === null) {
            throw "Failed to get 2d context for interactive canvas";
        }
        let dcctx = interactiveCanvas.getContext("2d");
        if (dcctx === null) {
            throw "Failed to get 2d context for display canvas";
        }
        this.displayCanvas = displayCanvas;
        this.drawCanvas = interactiveCanvas;
        this.displayCtx = dcctx;
        this.drawCtx = icctx;

        this.offScreenDrawCanvas = new OffscreenCanvas(
            window.innerWidth,
            window.innerHeight
        );
        let osdcctx =
            this.offScreenDrawCanvas.getContext("2d");
        if (osdcctx === null) {
            throw "Failed to get 2d context for offscreen draw canvas";
        }
        this.offScreenDrawCtx = osdcctx;
        // TODO: this needs to be overriden
        this.offScreenDrawCanvasOriginDiff = [0, 0];

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

        // sizing for svg elements
        this.svg.viewBox.baseVal.width = window.innerWidth;
        this.svg.viewBox.baseVal.height =
            window.innerHeight;
        this.userCursors.viewBox.baseVal.width =
            window.innerWidth;
        this.userCursors.viewBox.baseVal.height =
            window.innerHeight;

        // sizing for canvas elements
        this.displayCanvas.width = window.innerWidth;
        this.displayCanvas.height = window.innerHeight;
        this.drawCanvas.width = window.innerWidth;
        this.drawCanvas.height = window.innerHeight;

        this.drawCtx.strokeStyle = "#ff0000";
        this.drawCtx.lineWidth = 50;

        this.mm.userMappingUpdate //TODO: make the cursors disappear after 15s // TODO:
            .subscribe((_) => {
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
                        // let lastx: string;
                        // let lasty: string;
                        // if (storedx === null) {
                        //     lastx = "" + v.x;
                        // } else {
                        //     lastx = storedx;
                        // }
                        storedel.animate(
                            [
                                {
                                    cx: storedx,
                                    cy: storedy,
                                },
                                { cx: v.x, cy: v.y },
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

    /**
     * Given a canvas and a pair of coordinates, resize its 2d context so that
     * the point is included. The canvas has nothing erased. This function returns
     * the canvas's context
     * @param c A canvas object
     * @param negx how much space has been allocated for negtive x coordinates (this value is not positive)
     * @param negy how much space has been allocated for negative y coordinates (this value is not positive)
     * @param x x coordiante to resize to
     * @param y y coordiante to resize to
     */
    private resizeToFit(
        c: HTMLCanvasElement | OffscreenCanvas,
        negx: number,
        negy: number,
        x: number,
        y: number
    ): [number, number] {
        let negspace: [number, number] = [negx, negy];

        if (y > c.height + negspace[1]) {
            // lies outside canvas on y pos
            this.extendYPos(c, negspace[1], y);
        }
        if (y < negspace[1]) {
            this.extendYNeg(c, negspace[1], y);
            negspace[1] = y;
        }
        if (x > c.width + negspace[0]) {
            // lies outside canvas on y pos
            this.extendXPos(c, negspace[0], x);
        }
        if (x < negspace[0]) {
            this.extendXNeg(c, negspace[0], x);
            negspace[0] = x;
        }
        console.log(negspace);
        return negspace;
    }

    // TODO: take the enxtension functions out

    /**
     * Extends a canvas c in the negative x direction. This function assumes that the x
     * coordinate lies outside of the current space. The new x negative space is equal to
     * the x value passed into this function
     * @param c a canvas
     * @param negx the current amount of space allocated for negative x values
     * @param x the negative valiue we want to include
     */
    private extendXNeg(
        c: HTMLCanvasElement | OffscreenCanvas,
        negx: number,
        x: number
    ) {
        let t = new OffscreenCanvas(c.width, c.height);
        let tctx = t.getContext("2d");
        if (tctx === null) {
            throw new Error(
                "failed to get context in resizing"
            );
        }
        tctx.drawImage(c, 0, 0);
        let d = negx - x;
        c.width += d;
        let ctx:
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | null = c.getContext("2d") as
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | null;
        if (ctx === null) {
            throw new Error(
                "failed to get context in resizing"
            );
        }
        ctx.drawImage(t, d, 0);
    }

    /**
     * Extends a canvas c in the negative y direction. This function assumes that the y
     * coordinate lies outside of the current space. The new y negative space is equal to
     * the y value passed into this function
     * @param c a canvas
     * @param negy the current amount of space allocated for negative y values
     * @param y the negative value we want to include
     */
    private extendYNeg(
        c: HTMLCanvasElement | OffscreenCanvas,
        negy: number,
        y: number
    ) {
        let t = new OffscreenCanvas(c.width, c.height);
        let tctx = t.getContext("2d");
        if (tctx === null) {
            throw new Error(
                "failed to get context in resizing"
            );
        }
        tctx.drawImage(c, 0, 0);
        let d = negy - y;
        c.height += d;
        let ctx:
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | null = c.getContext("2d") as
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | null;
        if (ctx === null) {
            throw new Error(
                "failed to get context in resizing"
            );
        }
        ctx.drawImage(t, 0, y);
    }

    /**
     * Extends a canvas c in the positive x direction. This function assumes that the x
     * coordinate lies outside of the current space.
     * @param c a canvas
     * @param negx the current amount of space allocated for negative x values
     * @param x the negative valiue we want to include
     */
    private extendXPos(
        c: HTMLCanvasElement | OffscreenCanvas,
        negx: number,
        x: number
    ) {
        let t = new OffscreenCanvas(c.width, c.height);
        let tctx = t.getContext("2d");
        if (tctx === null) {
            throw new Error(
                "failed to get context in resizing"
            );
        }
        tctx.drawImage(c, 0, 0);
        let d = x - (c.width + negx);
        c.width += d;
        let ctx:
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | null = c.getContext("2d") as
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | null;
        if (ctx === null) {
            throw new Error(
                "failed to get context in resizing"
            );
        }
        ctx.drawImage(t, 0, 0);
    }
    /**
     * Extends a canvas c in the positive y direction. This function assumes that the y
     * coordinate lies outside of the current space.
     * @param c a canvas
     * @param negy the current amount of space allocated for negative y values
     * @param y the negative value we want to include
     */
    private extendYPos(
        c: HTMLCanvasElement | OffscreenCanvas,
        negy: number,
        y: number
    ) {
        let t = new OffscreenCanvas(c.width, c.height);
        let tctx = t.getContext("2d");
        if (tctx === null) {
            throw new Error(
                "failed to get context in resizing"
            );
        }
        tctx.drawImage(c, 0, 0);
        let d = y - (c.height + negy);

        c.height += d;
        let ctx:
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | null = c.getContext("2d") as
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | null;
        if (ctx === null) {
            throw new Error(
                "failed to get context in resizing"
            );
        }
        ctx.drawImage(t, 0, 0);
    }
    // TODO: determine which canvas we're drawing on
    /**
     * Draws on a canvas, starting a new draw if necessary.
     * Note that ending a draw requires calling the endDraw function
     * @param ev
     * @returns
     */
    public draw(x: number, y: number) {
        let targetContext = this.drawCtx;
        let offscreenTargetContext = this.offScreenDrawCtx;

        this.offScreenDrawCanvasOriginDiff =
            this.resizeToFit(
                this.offScreenDrawCanvas,
                ...this.offScreenDrawCanvasOriginDiff,
                x,
                y
            );
        let xadj =
            x - this.offScreenDrawCanvasOriginDiff[0];
        let yadj =
            y - this.offScreenDrawCanvasOriginDiff[1];

        if (!this.isDrawing) {
            this.isDrawing = true;
            offscreenTargetContext.moveTo(xadj, yadj);
            offscreenTargetContext.beginPath();
            targetContext.moveTo(x, y);
            targetContext.beginPath();
        } else {
            offscreenTargetContext.lineTo(xadj, yadj);
            offscreenTargetContext.stroke();
            targetContext.lineTo(x, y);
            targetContext.stroke();
        }
    }

    public endDraw() {
        this.isDrawing = false;
    }

    public clearRect(
        x0: number,
        y0: number,
        w: number,
        h: number
    ) {
        // this.drawCtx.clearRect(x0, y0, w, h);
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

        let dx = (-1 * (x - x0)) / this.zoomFactor;
        let dy = (-1 * (y - y0)) / this.zoomFactor;
        this.xcenter += dx;
        this.ycenter += dy;

        //redraw all svg elements
        this.svg.viewBox.baseVal.x += dx;
        this.svg.viewBox.baseVal.y += dy;

        this.userCursors.viewBox.baseVal.x += dx;
        this.userCursors.viewBox.baseVal.y += dy;
        //TODO: redraw display canvas
        //move coordinate system
        // this.displayCtx.transform(
        //     1,
        //     0,
        //     0,
        //     1,
        //     -1 * this.userCursors.viewBox.baseVal.x,
        //     -1 * this.userCursors.viewBox.baseVal.y
        // );
        this.drawCtx.setTransform(
            1,
            0,
            0,
            1,
            -1 * this.userCursors.viewBox.baseVal.x,
            -1 * this.userCursors.viewBox.baseVal.y
        );
        //clear the board
        // TODO: more narrow
        this.drawCtx.clearRect(
            this.offScreenDrawCanvasOriginDiff[0],
            this.offScreenDrawCanvasOriginDiff[1],
            this.offScreenDrawCanvas.width,
            this.offScreenDrawCanvas.height
        );

        //draw the offscreen canvas
        this.drawCtx.drawImage(
            this.offScreenDrawCanvas,
            this.offScreenDrawCanvasOriginDiff[0],
            this.offScreenDrawCanvasOriginDiff[1]
        );

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

        this.displayCanvas.width = window.innerWidth;
        this.displayCanvas.height = window.innerHeight;
        this.drawCanvas.width = window.innerWidth;
        this.drawCanvas.height = window.innerHeight;
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
