import CanvasManager from "./canvasmanager";
import type MultiplayerManager from "./multiplayer";
import type { UserBrush } from "./usertypes";
import { WSMessageCode } from "./wsutil";

const CURSOR_REFRESH = 10;
const OPACITY = 0.5;

/**
 * Responsible for managing the interactive canvas and the underlying svg
 * Does this by interacting with a ctx
 */
export default class DrawingEngine {
    private svg: SVGSVGElement;
    // TODO: turn this into a svggraphicselement
    private svgElements: Map<number, Element>;
    private svgMenus: Map<number, [string, () => void][]>;

    private userCursorElements: Map<
        number,
        [SVGCircleElement, SVGRectElement, SVGTextElement]
    >;

    private xcenter: number;
    private ycenter: number;
    private zoomFactor: number;
    private viewboxReady = true;
    public static readonly svgns: string =
        "http://www.w3.org/2000/svg";
    private mm: MultiplayerManager;
    private cm: CanvasManager;

    private readySendPos: boolean = true;

    private div1: Element;

    // private centerel: Element;
    constructor(
        interactiveCanvas: HTMLCanvasElement,
        displayCanvas: HTMLCanvasElement,

        svg: SVGSVGElement,
        // usersvg: SVGSVGElement,
        mm: MultiplayerManager
    ) {
        // TODO: negative space preload, dimensions preload
        this.cm = new CanvasManager(
            displayCanvas,
            interactiveCanvas,
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

        this.svg = svg;
        this.svgElements = new Map();
        this.mm = mm;
        this.svgMenus = new Map();

        this.div1 = document.createElementNS(
            DrawingEngine.svgns,
            "g"
        );
        this.svg.appendChild(this.div1);

        this.xcenter = window.innerWidth / 2;
        this.ycenter = window.innerHeight / 2;
        this.zoomFactor = 1;

        setInterval(() => {
            this.viewboxReady = true;
        }, 40);
        setInterval(() => {
            this.readySendPos = true;
        }, CURSOR_REFRESH);

        // this.svg = usersvg;
        this.userCursorElements = new Map();

        // this.centerel = this.buildCursorNode("#e0f125");

        // sizing for svg elements
        this.svg.viewBox.baseVal.width = window.innerWidth;
        this.svg.viewBox.baseVal.height =
            window.innerHeight;
        this.svg.viewBox.baseVal.width = window.innerWidth;
        this.svg.viewBox.baseVal.height =
            window.innerHeight;

        this.mm.userMappingUpdate //TODO: make the cursors disappear after 15s // TODO:
            .subscribe((_) => {
                this.checkCursorBubbleRefresh();
            });
    }

    private checkCursorBubbleRefresh() {
        let checked = new Set<number>();
        for (let [k, v] of this.mm.getAllUserData()) {
            checked.add(k);
            // do nothing if the current user is us
            if (k === this.mm.getUserData().id) {
                continue;
            }
            if (
                this.userCursorElements.get(k) === undefined
            ) {
                //create elements
                let nel = this.buildCursorNode(
                    this.mm.getColor(k),
                    v.name
                );
                this.userCursorElements.set(k, nel);
            }
            let els = this.userCursorElements.get(k);
            if (els === undefined) {
                continue; // this should never happen
            }
            let locx = parseFloat(
                els[0].getAttributeNS(null, "cx") as string
            );
            let locy = parseFloat(
                els[0].getAttributeNS(null, "cy") as string
            );
            if (locy === v.y && locx === v.x) {
                continue;
            }
            if (v.drawing) {
                this.cm.foreignDraw(
                    v.brush,
                    locx,
                    locy,
                    v.x,
                    v.y
                );
            }
            this.animateTriplet(
                ...els,
                locx,
                locy,
                v.x,
                v.y
            );
        }
        for (let [loadedCursorIds, [e1, e2, e3]] of this
            .userCursorElements) {
            if (!checked.has(loadedCursorIds)) {
                e1.parentElement?.removeChild(e1);
                e2.parentElement?.removeChild(e2);
                e3.parentElement?.removeChild(e3);
            }
        }
    }

    // TODO: make this more slick
    private animateTriplet(
        bubble: SVGCircleElement,
        backing: SVGRectElement,
        np: SVGTextElement,
        prevX: number,
        prevY: number,
        postX: number,
        postY: number
    ) {
        bubble.animate(
            [
                {
                    cx: prevX.toString(),
                    cy: prevY.toString(),
                },
                {
                    cx: postX.toString(),
                    cy: postY.toString(),
                },
            ],
            {
                duration: CURSOR_REFRESH,
                easing: "cubic-bezier(0, 0, 0.2, 1)",
            }
        );
        bubble.setAttributeNS(null, "cx", `${postX}`);
        bubble.setAttributeNS(null, "cy", `${postY}`);
        np.animate(
            [
                {
                    x: prevX.toString(),
                    y: (prevY - 40).toString(),
                },
                {
                    x: postX.toString(),
                    y: (postY - 40).toString(),
                },
            ],
            {
                duration: CURSOR_REFRESH,
                easing: "cubic-bezier(0, 0, 0.2, 1)",
            }
        );
        np.setAttributeNS(null, "x", `${postX}`);
        np.setAttributeNS(null, "y", `${postY - 40}`);

        let upperRightY = 42 + 0.5 * np.getBBox().height;
        backing.animate(
            [
                {
                    x: (prevX - 2).toString(),
                    y: (prevY - upperRightY).toString(),
                },
                {
                    x: (postX - 2).toString(),
                    y: (postY - upperRightY).toString(),
                },
            ],
            {
                duration: CURSOR_REFRESH,
                easing: "cubic-bezier(0, 0, 0.2, 1)",
            }
        );
        backing.setAttributeNS(null, "x", `${postX - 2}`);
        backing.setAttributeNS(
            null,
            "y",
            `${postY - upperRightY}`
        );
    }

    private buildCursorNode(
        color: string,
        name: string
    ): [SVGCircleElement, SVGRectElement, SVGTextElement] {
        let showing = false;
        let bubble = document.createElementNS(
            DrawingEngine.svgns,
            "circle"
        ) as SVGCircleElement;
        bubble.setAttributeNS(null, "cx", "0");
        bubble.setAttributeNS(null, "cy", "0");
        bubble.setAttributeNS(null, "r", "16");
        bubble.setAttributeNS(
            null,
            "style",
            `fill: ${color}; stroke: ${color}; stroke-width: 1px;`
        );

        this.svg.appendChild(bubble);

        let np: SVGTextElement = document.createElementNS(
            DrawingEngine.svgns,
            "text"
        ) as SVGTextElement;
        np.setAttributeNS(null, "x", "0");
        np.setAttributeNS(null, "y", "-40");
        np.setAttributeNS(
            null,
            "style",
            `font: 12px sans-serif; color:black; mix-blend-mode: exclusion;`
        );
        np.innerHTML = name;
        this.svg.appendChild(np);

        let textBoxSize = np.getBBox();
        np.setAttributeNS(
            null,
            "transform",
            `translate(${-0.5 * textBoxSize.width}, ${
                -0.5 * textBoxSize.height
            })`
        );

        let backingbox = document.createElementNS(
            DrawingEngine.svgns,
            "rect"
        ) as SVGRectElement;
        backingbox.setAttributeNS(
            null,
            "width",
            `${textBoxSize.width + 4}`
        );
        backingbox.setAttributeNS(
            null,
            "height",
            `${textBoxSize.height + 4}`
        );
        backingbox.setAttributeNS(null, "x", "-2");
        backingbox.setAttributeNS(null, "y", "-42");
        backingbox.setAttributeNS(
            null,
            "style",
            `fill: ${color}; stroke: ${color}; stroke-width: 1px;`
        );
        backingbox.setAttributeNS(
            null,
            "transform",
            `translate(${-0.5 * textBoxSize.width - 2}, ${
                -0.5 * textBoxSize.height - 2
            })`
        );

        this.svg.appendChild(backingbox);

        bubble.addEventListener("pointerdown", () => {
            showing = !showing;
            if (showing) {
                backingbox.setAttribute(
                    "opacity",
                    `${OPACITY}`
                );
                // np.setAttribute("opacity", "0.7");
            } else {
                backingbox.setAttribute("opacity", "0");
                // np.setAttribute("opacity", "0");
            }
        });
        return [bubble, backingbox, np];
    }

    // TODO: take the enxtension functions out

    /**
     * Given an id, delete it from the board and free all relevant resources.
     * This is expecte dto be called in response to receiving a delete message
     * @param id the id to delete
     */
    public removeById(id: number) {
        if (this.svgElements.get(id) === undefined) {
            return;
        }
        let el = this.svgElements.get(id) as Element;
        el.remove();
        this.svgElements.delete(id);
        this.svgMenus.delete(id);
    }

    private addSVG(
        id: number,
        svg: Element,
        cb: ((s: Element) => void)[]
    ) {
        svg.setAttribute("id", `${id}-svg-item`);

        this.svg.insertBefore(svg, this.div1);
        this.svgElements.set(id, svg); //TODO: add warnings

        for (let c of cb) {
            c(svg);
        }
    }

    public drawSVGJSON(o: SVGJSON) {
        // if the id is already taken, delete it
        // TODO: is this dangerous?
        // this used by delta and create
        if (this.svgMenus.get(o.id) !== undefined) {
            this.removeById(o.id);
        }

        let k: Element; // TODO: wtf is this
        k = document.createElementNS(
            DrawingEngine.svgns,
            o.tag
        );
        for (const [key, val] of Object.entries(o)) {
            if (
                key === "id" ||
                key === "tag" ||
                key === "menu" ||
                key === "onmount"
            )
                continue;
            if (key === "textContent") {
                k.textContent = val;
                continue;
            }
            k.setAttribute(key, val);
        }

        this.svgMenus.set(o.id, o.menu);
        this.addSVG(o.id, k, o.onmount);
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

        this.svg.viewBox.baseVal.x =
            this.svg.viewBox.baseVal.x;
        this.svg.viewBox.baseVal.y =
            this.svg.viewBox.baseVal.y;
        this.svg.viewBox.baseVal.width =
            this.svg.viewBox.baseVal.width;
        this.svg.viewBox.baseVal.height =
            this.svg.viewBox.baseVal.height;
        //TODO: redraw canvas items
    }

    /**
     * Pan the screen from x0, y0 to x,y. This function conerns itself
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

        this.cm.panTo(
            -1 * this.svg.viewBox.baseVal.x,
            -1 * this.svg.viewBox.baseVal.y
        );
    }

    /**
     *
     * Try to send the user's current position to all other users over the ws
     * @param ev an event that gives information about the user position
     * @returns a boolean denoting whether or not the position was succesfully sent
     */
    public trySendPosition(x: number, y: number): boolean {
        if (!this.readySendPos) return false;
        window.boardSocket({
            msgType: WSMessageCode.POINTER_MOVED,
            msg: `${x}\v${y}`,
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
    ): {
        x: number;
        y: number;
    } {
        // get the vector from center of screen to dest
        let dx = x - window.innerWidth / 2;
        let dy = y - window.innerHeight / 2;

        dx /= this.zoomFactor;
        dy /= this.zoomFactor;

        return {
            x: this.xcenter + dx,
            y: this.ycenter + dy,
        };
    }

    public resize() {
        this.xcenter +=
            (window.innerWidth -
                this.svg.viewBox.baseVal.width) /
            2;
        this.ycenter +=
            (window.innerHeight -
                this.svg.viewBox.baseVal.height) /
            2;

        this.svg.viewBox.baseVal.width = window.innerWidth;
        this.svg.viewBox.baseVal.height =
            window.innerHeight;

        this.svg.viewBox.baseVal.width = window.innerWidth;
        this.svg.viewBox.baseVal.height =
            window.innerHeight;

        this.cm.resize();
    }

    public getMenuOptions(
        id: number
    ): Readonly<[string, () => void][]> {
        let retrieved = this.svgMenus.get(id);
        if (Number.isNaN(id) || retrieved === undefined) {
            return [];
        } else {
            return retrieved;
        }
    }

    // sync entire board with the server
    public sync(cookie: string) {
        this.cm.syncWithServer(cookie);
    }

    /**
     * Pass through
     */

    public draw(x: number, y: number) {
        this.cm.draw(x, y);
    }
    public endDraw() {
        this.cm.endDraw();
    }

    public setBrush(b: UserBrush) {
        this.cm.setMyBrush(b);
    }

    public clearLocalRect(
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        this.cm.clearLocalRect(x, y, w, h);
    }
}
