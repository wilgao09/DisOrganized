<script lang="js">
    import PluginManger from "./plugins";
    import InputManager from "./inputs";
    import DrawingEngine from "./dengine";
    import * as wsutil from "./wsutil";
    import fetchPlugins from "./pluginfetch";
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
            },
            () => {
                setInterval(() => {
                    window.boardSocket({
                        msgType: wsutil.WSMessageCode.FETCH,
                        msg: "",
                    });
                }, 30000);
            }
        );

        fetchPlugins(ph, ih, () => {
            console.log("done fetching");
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

    // ph.addFn(new rect());
    // ih.addKeyMapping("b", "rect");
    // ph.addFn(new brush());
    // ph.activateFn("brush");
    // ph.addFn(new poly());
    // ih.addKeyMapping("s", "poly");

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
