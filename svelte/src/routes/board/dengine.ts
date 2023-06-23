/**
 * Responsible for managing the interactive canvas and the underlying svg
 * Does this by interacting with a ctx
 */
export default class DrawingEngine {
    private ctx: CanvasRenderingContext2D;
    private svg: SVGSVGElement;
    private isDrawing: boolean;
    private svgElements: Map<number, Element>;

    // private userCursors: SVGSVGElement;
    // private userCursorElements: Map<number, Element>;

    private xcenter: number;
    private ycenter: number;
    private zoomFactor: number;
    private viewboxReady = true;
    public static readonly svgns: string =
        "http://www.w3.org/2000/svg";
    constructor(
        ctx: CanvasRenderingContext2D,
        svg: SVGSVGElement
        // usersvg: SVGSVGElement
    ) {
        this.ctx = ctx;
        this.svg = svg;
        this.isDrawing = false;
        this.svgElements = new Map();

        this.xcenter = window.innerWidth / 2;
        this.ycenter = window.innerHeight / 2;
        this.zoomFactor = 1;

        setInterval(() => {
            this.viewboxReady = true;
        }, 40);

        // this.userCursors = usersvg;
        // this.userCursorElements = new Map();
    }

    public handleCursorInput(ev: PointerEvent) {
        // console.log(ev.type);
        if (ev.type === "pointerdown") {
            if (!this.isDrawing) {
                this.isDrawing = true;
                this.ctx.moveTo(ev.clientX, ev.clientY);
                this.ctx.beginPath();
                console.log("beginpath");
            } else {
                this.ctx.lineTo(ev.clientX, ev.clientY);
            }
        } else if (ev.type === "pointerup") {
            if (!this.isDrawing) {
                //defensive programming?
                return;
            } else {
                console.log("endpath");
                this.isDrawing = false;
            }
        } else if (ev.type === "pointermove") {
            if (this.isDrawing) {
                console.log(
                    "line to " +
                        ev.clientX +
                        " " +
                        ev.clientY
                );
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
        console.log(k);
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

        console.log(
            `SVG VB CHANGE: ${n.x} ${n.y} to ${this.svg.viewBox.baseVal.x} ${this.svg.viewBox.baseVal.y}`
        );
        //TODO: redraw canvas
    }
}
