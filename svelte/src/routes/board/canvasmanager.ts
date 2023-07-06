export default class CanvasManager {
    private globalCanvas: HTMLCanvasElement;
    private localCanvas: HTMLCanvasElement;
    private globalCtx: CanvasRenderingContext2D;
    private localCtx: CanvasRenderingContext2D;

    private localOSCanvas: OffscreenCanvas;
    private localOSCtx: OffscreenCanvasRenderingContext2D;

    private negspace: [number, number];

    private isDrawing: boolean;

    private getElement2DContext(
        c: HTMLCanvasElement
    ): CanvasRenderingContext2D {
        let t = c.getContext("2d");
        if (t === null) {
            throw new Error("Faield to get context");
        } else {
            return t;
        }
    }
    private getOS2DContext(
        c: OffscreenCanvas
    ): OffscreenCanvasRenderingContext2D {
        let t = c.getContext("2d");
        if (t === null) {
            throw new Error("Faield to get context");
        } else {
            return t;
        }
    }
    constructor(
        globalBoard: HTMLCanvasElement,
        localBoard: HTMLCanvasElement,
        negXSpace: number,
        negYSpace: number,
        height: number,
        width: number
    ) {
        this.globalCanvas = globalBoard;
        this.localCanvas = localBoard;
        this.globalCtx = this.getElement2DContext(
            this.globalCanvas
        );
        this.localCtx = this.getElement2DContext(
            this.localCanvas
        );

        this.localOSCanvas = new OffscreenCanvas(
            height,
            width
        );
        this.localOSCtx = this.getOS2DContext(
            this.localOSCanvas
        );

        this.negspace = [negXSpace, negYSpace];
        this.isDrawing = false;

        this.localCtx.strokeStyle = "#ff0000";
        this.localCtx.lineWidth = 50;
    }

    public undo() {}

    public redo() {}

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
        // console.log(negspace);
        return negspace;
    }

    // TODO: determine which canvas we're drawing on
    /**
     * Draws on a canvas, starting a new draw if necessary.
     * Note that ending a draw requires calling the endDraw function
     * @param ev
     * @returns
     */
    public draw(x: number, y: number) {
        let targetContext = this.localCtx;
        let offscreenTargetContext = this.localOSCtx;

        this.negspace = this.resizeToFit(
            this.localOSCanvas,
            ...this.negspace,
            x,
            y
        );
        let xadj = x - this.negspace[0];
        let yadj = y - this.negspace[1];

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

    /**
     * Move the camera by setting the upper left corner coordinates
     * @param x x cooridnate for hte upper left corner
     * @param y y coordinate for the upper left corner
     */
    public panTo(x: number, y: number) {
        // TODO: preserve zoom
        this.localCtx.setTransform(1, 0, 0, 1, x, y);
        //clear the board
        // TODO: more narrow
        this.localCtx.clearRect(
            ...this.negspace,
            this.localOSCanvas.width,
            this.localOSCanvas.height
        );

        //draw the offscreen canvas
        this.localCtx.drawImage(
            this.localOSCanvas,
            ...this.negspace
        );
    }

    public resize() {
        this.localCanvas.width = window.innerWidth;
        this.localCanvas.height = window.innerHeight;

        this.globalCanvas.width = window.innerHeight;
        this.globalCanvas.height = window.innerHeight;

        this.localCtx.clearRect(
            ...this.negspace,
            this.localOSCanvas.width,
            this.localOSCanvas.height
        );

        //draw the offscreen canvas
        this.localCtx.drawImage(
            this.localOSCanvas,
            ...this.negspace
        );
    }
}
