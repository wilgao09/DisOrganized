<script lang="js">
    import PluginManger from "./plugins";
    import InputManager from "./inputs";
    import DrawingEngine from "./dengine";
    import { UserInputs, UserActions } from "./enums";
    import { onMount } from "svelte";
    let ph = new PluginManger();
    let ih = new InputManager();

    /**
     * @type {SVGSVGElement}
     */
    let svgel;
    /**
     * @type {HTMLCanvasElement}
     */
    let icanvasel;
    /**
     * @type {DrawingEngine}
     */
    let de;

    onMount(() => {
        let t = icanvasel.getContext("2d");
        if (icanvasel !== null && t !== null) de = new DrawingEngine(t, svgel);
        else alert("panic: drawingengine couldnt be initialized");

        icanvasel.height = window.innerHeight;
        icanvasel.width = window.innerWidth;
    });

    // class strokep {
    //     constructor() {
    //         /**
    //          * @type {any[]}
    //          */
    //         this.buffer = [];
    //         this.offer = (/** @type {any} */ d) => {
    //             this.buffer.push(d);
    //         };
    //         this.fnName = "stroke";
    //         this.fnPrio = 0;
    //         this.onActivate = () => {
    //             this.buffer = [];
    //         };
    //         this.onDeactivate = () => {
    //             return {
    //                 path: this.buffer,
    //             };
    //         };
    //     }
    // }

    class rect {
        constructor() {
            this.n = 999;
            this.e = this.s = this.w = 0;
            this.offer = (
                /** @type {{ x: undefined; y: undefined; } | undefined} */ d
            ) => {
                if (d === undefined || d.x === undefined || d.y === undefined)
                    return; // this kills the chain so if rect is active, we will only work towards building the rect
                if (this.n === 999) {
                    this.n = this.s = d.y;
                    this.w = this.e = d.x;
                }
                // TODO: this is a test plugin and assumes that the coordinate plane is flipped
                if (d.x < this.w) this.w = d.x;
                if (d.x > this.e) this.e = d.x;
                if (d.y < this.n) this.n = d.y;
                if (d.y > this.s) this.s = d.y;
            };

            this.fnName = "rect";
            this.fnPrio = 0;
            this.onActivate = () => {
                this.n = 999;
                this.e = this.s = this.w = 0;
            };
            this.onDeactivate = () => {
                return {
                    tag: "rect",
                    x: this.w,
                    y: this.n,
                    width: this.e - this.w,
                    height: this.s - this.n,
                };
            };
            this.JSONtoSVG = () => {
                // o must be modified in place; this should never return anything
                // since onDeactivate returns parsable JSON, we dont have to do anything further
            };
        }
    }

    ph.addFn(new rect());
    ih.addKeyMapping("b", "rect");

    //  listen to new drawings
    /**
     * @param {PointerEvent} ev
     */
    function handleEvent(ev) {
        de.handleCursorInput(ev);
        switch (ih.actionType(ev)) {
            case UserActions.PAN:
                console.log("pan");
                break;
            case UserActions.DRAW:
                ph.offer({
                    x: ev.x,
                    y: ev.y,
                });
                break;
            case UserActions.SELECT:
                console.log("select");
                break;
            default:
                break;
        }
    }

    /**
     * @param {{ key: string; }} ev
     */
    function handlekeydown(ev) {
        console.log("down");
        for (let f of ih.getFns(ev.key)) ph.activateFn(f);
    }

    /**
     * @param {{ key: string; }} ev
     */
    function handlekeyup(ev) {
        console.log("up");
        for (let f of ih.getFns(ev.key)) {
            let m = ph.deactivateFn(f);
            console.log("deactivated");
            console.log(m);
            de.drawSVGJSON(m); // THIS IS NOT HOW IT SHOULD BE DONE
        }
    }
</script>

<div class="ccontain">
    <svg class="bcanvas" width="600" height="400" bind:this={svgel} />
    <canvas class="bcanvas" id="dcanvas" />
    <canvas
        class="bcanvas"
        id="icanvas"
        on:pointerdown={handleEvent}
        on:pointermove={handleEvent}
        on:pointerup={handleEvent}
        on:keydown={handlekeydown}
        on:keyup={handlekeyup}
        bind:this={icanvasel}
        tabindex="0"
    />
</div>

<!--  -->

<style>
    .ccontain {
        display: block;
    }
    .bcanvas {
        /* height: 50%;
        width: 50%; */
        /* background-color: green; */
        position: absolute;
        /* top: 0px; */
        /* left: 0px; */
    }
</style>
