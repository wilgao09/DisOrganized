<script lang="js">
    import PluginManger from "./plugins";
    import InputManager from "./inputs";
    import DrawingEngine from "./dengine";
    import * as wsutil from "./wsutil";
    import { UserInputs, UserActions } from "./enums";
    import { declName, destIp, destPort } from "$lib/store";
    import { get } from "svelte/store";
    import { onMount } from "svelte";

    let wsurl = `ws://${encodeURIComponent(
        get(destIp)
    )}:${encodeURIComponent(
        get(destPort)
    )}/connectws/${encodeURIComponent(get(declName))}`;
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
        if (icanvasel !== null && t !== null)
            de = new DrawingEngine(t, svgel);
        else
            alert(
                "panic: drawingengine couldnt be initialized"
            );

        icanvasel.height = window.innerHeight;
        icanvasel.width = window.innerWidth;
        // TODO: replace all instances of window.boardsocket
        // with a state variable
        window.boardSocket = wsutil.opensocket(
            wsurl,
            (m) => {
                switch (m.msgType) {
                    case wsutil.WSMessageCode.MESSAGE:
                        console.log(
                            `New message: ${m.msg}`
                        );
                        break;
                    case wsutil.WSMessageCode.FETCH:
                        de.clearAll();
                        // TODO: needs to be trycaught
                        let arrOfObj = JSON.parse(m.msg);
                        for (let someObj of arrOfObj) {
                            // TODO: postprocessing by plugins
                            de.drawSVGJSON(someObj);
                        }
                        break;
                    case wsutil.WSMessageCode.CREATE:
                        de.drawSVGJSON(JSON.parse(m.msg));
                        break;
                }
            }
        );

        setInterval(() => {
            window.boardSocket({
                msgType: wsutil.WSMessageCode.FETCH,
                msg: "",
            });
        }, 30000);
        window.boardSocket({
            msgType: wsutil.WSMessageCode.FETCH,
            msg: "",
        });
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

    class brush {
        constructor() {
            this.strokeColor = "black";
            this.strokeWidth = "20";
            this.offer = (
                /** @type {{ [x: string]: string; tag: string; }} */ x
            ) => {
                if (x.tag === "changebrush") {
                    this.strokeColor = x["strokeColor"];
                    this.strokeWidth = x["strokeWidth"];
                } else {
                    if (x.style === undefined) x.style = "";
                    x.style += `fill:rgba(0,0,0,0);stroke-width:${this.strokeWidth};stroke:${this.strokeColor}`;
                }
                return x;
            };
            this.fnName = "brush";
            this.fnPrio = 99;
            this.onActivate = () => {};
            this.onDeactivate = () => {};
            this.JSONtoSVG = () => {};
        }
    }

    class rect {
        constructor() {
            this.n = 999;
            this.e = this.s = this.w = 0;
            this.offer = (
                /** @type {{ x: undefined; y: undefined; } | undefined} */ d
            ) => {
                if (
                    d === undefined ||
                    d.x === undefined ||
                    d.y === undefined
                )
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

    class poly {
        constructor() {
            /**
             * @type {number[][]}
             */
            this.buff = [];
            this.offer = (
                /** @type {{ x: undefined; y: undefined; } | undefined} */ x
            ) => {
                if (
                    x === undefined ||
                    x.x === undefined ||
                    x.y === undefined
                )
                    return x;
                this.buff.push([x.x, x.y]);
            };
            this.fnName = "poly";
            this.fnPrio = 3;
            this.onActivate = () => (this.buff = []);
            this.onDeactivate = () => {
                return {
                    tag: "polyline",
                    points: this.buff
                        .map(([x, y]) => `${x},${y}`)
                        .join(" "), //TODO: do not ever use this
                };
            };
            this.JSONtoSVG = () => {};
        }
    }

    ph.addFn(new rect());
    ih.addKeyMapping("b", "rect");
    ph.addFn(new brush());
    ph.activateFn("brush");
    ph.addFn(new poly());
    ih.addKeyMapping("s", "poly");

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
            window.boardSocket({
                msg: JSON.stringify(m),
                msgType: wsutil.WSMessageCode.CREATE,
            });
            // de.drawSVGJSON(m); // THIS IS NOT HOW IT SHOULD BE DONE
        }
    }
</script>

<div class="ccontain">
    <svg
        class="bcanvas"
        width="100%"
        height="100%"
        bind:this={svgel}
    />
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
