<script lang="ts">
    import PluginManger from "./plugins";
    import InputManager from "./inputs";
    import DrawingEngine from "./dengine";
    import * as wsutil from "./wsutil";
    import fetchPlugins from "./pluginfetch";
    import { UserInputs, UserActions } from "./userenums";
    import { declName, destIp, destPort } from "$lib/dest";
    import { get } from "svelte/store";
    import { onMount } from "svelte";
    import Settings from "./Settings.svelte";
    import Toolbar from "./Toolbar.svelte";
    import MultiplayerManager from "./multiplayer";

    let wsurl = `ws://${encodeURIComponent(
        get(destIp)
    )}:${encodeURIComponent(
        get(destPort)
    )}/connectws/${encodeURIComponent(get(declName))}`;
    let ph = new PluginManger();
    let ih = new InputManager();
    let mm = new MultiplayerManager();

    /**
     * @type {SVGSVGElement}
     */
    let svgel: SVGSVGElement;
    /**
     * @type {SVGSVGElement}
     */
    let udisplay: SVGSVGElement;
    /**
     * @type {HTMLCanvasElement}
     */
    let icanvasel: HTMLCanvasElement;
    /**
     * @type {DrawingEngine}
     */
    let de: DrawingEngine;

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
            wsutil.defaultMessageHandler(de, mm),
            () => {
                window.boardSocket({
                    msgType: wsutil.WSMessageCode.FETCH,
                    msg: "",
                });
                window.boardSocket({
                    msgType: wsutil.WSMessageCode.GET_USERS,
                    msg: "",
                });
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

    //  listen to new drawings
    /**
     * @param {PointerEvent | TouchEvent} ev
     */
    function handleEvent(ev: PointerEvent | TouchEvent) {
        let te: TouchEvent;
        let pe: PointerEvent;
        let t: Touch | null;
        // TODO: zoom
        switch (ih.actionType(ev)) {
            case UserActions.PAN:
                te = ev as TouchEvent;

                t = te.changedTouches.item(0);

                if (
                    te.changedTouches.length === 1 &&
                    t !== null
                ) {
                    de.pan(
                        ih.previousPoint()[0],
                        ih.previousPoint()[1],
                        t.clientX,
                        t.clientY
                    );
                }

                break;
            case UserActions.DRAW:
                pe = ev as PointerEvent;
                de.handleCursorInput(pe);
                ph.offer({
                    y: pe.y,
                    x: pe.x,
                });
                break;
            case UserActions.SELECT:
                console.log("select");
                break;
            default:
                break;
        }
    }

    function handlekeydown(ev: KeyboardEvent) {
        console.log("down");
        for (let f of ih.getFns(ev.key)) ph.activateFn(f);
    }

    function handlekeyup(ev: KeyboardEvent) {
        console.log("up");
        for (let f of ih.getFns(ev.key)) {
            ph.deactivateAndCommit(f);
        }
    }

    /**
     * @param {string} fname
     */
</script>

<div class="ccontain">
    <svg
        class="bcanvas"
        width="100%"
        height="100%"
        viewBox="0 0 600 800"
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
        on:touchmove={handleEvent}
        on:touchstart={handleEvent}
        on:touchend={handleEvent}
        bind:this={icanvasel}
        tabindex="0"
    />
    <svg
        class="bcanvas no-interact-canvas"
        width="100%"
        height="100%"
        bind:this={udisplay}
    />
</div>
<Settings {mm} />
<Toolbar pluginManager={ph} />

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

    .no-interact-canvas {
        pointer-events: none;
    }
</style>
