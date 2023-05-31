/**
 * Responsible for managing the interactive canvas and the underlying svg
 * Does this by interacting with a ctx
 */
export default class DrawingEngine {
    private ctx: CanvasRenderingContext2D;
    private svg: SVGSVGElement;
    private isDrawing: boolean;
    private svgElements: Map<number, Element>;

    public static readonly svgns: string = "http://www.w3.org/2000/svg";
    constructor(ctx: CanvasRenderingContext2D, svg: SVGSVGElement) {
        this.ctx = ctx;
        this.svg = svg;
        this.isDrawing = false;
        this.svgElements = new Map();
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
                console.log("line to " + ev.clientX + " " + ev.clientY);
                this.ctx.lineTo(ev.clientX, ev.clientY);
                this.ctx.stroke();
            }
        }
    }

    public clearRect(x0: number, y0: number, w: number, h: number) {
        this.ctx.clearRect(x0, y0, w, h);
    }

    private addSVG(id: number, svg: Element) {
        this.svg.appendChild(svg);
        this.svgElements.set(id, svg); //TODO: add warnings
    }

    public drawSVGJSON(o: SVGJSON) {
        let k: Element; // TODO: wtf is this
        k = document.createElementNS(DrawingEngine.svgns, o.tag);
        for (const [key, val] of Object.entries(o)) {
            if (key === "id" || key === "tag") continue;
            k.setAttribute(key, val);
        }
        console.log(k);
        this.addSVG(o.id, k);
    }
}
