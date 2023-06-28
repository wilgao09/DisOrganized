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
    import SelectedMenu from "./SelectedMenu.svelte";
    // import DrawingEngine from "./dengine";

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
    let dcanvasel: HTMLCanvasElement;
    /**
     * @type {DrawingEngine}
     */
    let de: DrawingEngine;
    let boardFrame: Element;
    let selectData = {
        x: 0,
        y: 0,
        id: NaN,
    };
    onMount(() => {
        let icanvasctx = icanvasel.getContext("2d");
        let dcanvasctx = dcanvasel.getContext("2d");
        if (
            icanvasel !== null &&
            icanvasctx !== null &&
            dcanvasel !== null &&
            dcanvasctx !== null
        )
            de = new DrawingEngine(
                icanvasel,
                dcanvasel,
                svgel,
                mm
            );
        else
            alert(
                "panic: drawingengine couldnt be initialized"
            );

        icanvasel.height = window.innerHeight;
        icanvasel.width = window.innerWidth;

        // board dims
        let ob = new ResizeObserver((entries) => {
            for (const e of entries) {
                if (e.target === boardFrame) {
                    // alert("resized");
                    console.log(e);
                    de.resize();
                }
            }
        });

        ob.observe(boardFrame);

        // TODO: replace all instances of window.boardsocket
        // with a state variable
        window.boardSocket = wsutil.opensocket(
            wsurl,
            wsutil.defaultMessageHandler(ph, de, mm),
            () => {
                window.boardSocket({
                    msgType:
                        wsutil.WSMessageCode.GET_MY_DATA,
                    msg: "",
                });
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

        de.trySendPosition(ev);

        let boardLocation = de.eventToBoardCoords(ev);

        // TODO: convert the event into boardcoords and send
        // over the ws
        // TODO: zoom
        switch (ih.actionType(ev)) {
            case UserActions.PAN:
                de.endDraw();
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
                de.draw(
                    boardLocation[0][0],
                    boardLocation[0][1]
                );
                ph.offer({
                    y: boardLocation[0][1],
                    x: boardLocation[0][0],
                });
                break;
            case UserActions.SELECT:
                de.endDraw();
                console.log("select");
                let newData = {
                    x: 0,
                    y: 0,
                    id: -1,
                };
                let etarg = ev.target;
                if (etarg instanceof Element) {
                    let el = etarg as Element;
                    newData.id = parseInt(el.id);
                    [newData.x, newData.y] =
                        ih.currentPoint();
                    selectData = newData;
                    console.log("setting select data");
                    console.log(selectData);
                }
                break;
            default:
                break;
        }

        // icanvasel.dispatchEvent(ev);
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
</script>

<div class="ccontain" bind:this={boardFrame}>
    <!-- width="100%"
    height="100%" -->
    <svg
        class="bcanvas"
        viewBox="0 0 600 800"
        bind:this={svgel}
        on:pointerdown={handleEvent}
        on:pointermove={handleEvent}
        on:pointerup={handleEvent}
        on:keydown={handlekeydown}
        on:keyup={handlekeyup}
        on:touchmove={handleEvent}
        on:touchstart={handleEvent}
        on:touchend={handleEvent}
        tabindex="-1"
    />

    <canvas
        class="bcanvas no-interact-canvas"
        id="dcanvas"
        bind:this={dcanvasel}
    />
    <canvas
        class="bcanvas no-interact-canvas"
        id="icanvas"
        bind:this={icanvasel}
    />
    <!-- <svg
        class="bcanvas"
        viewBox="0 0 600 800"
        bind:this={udisplay}

    /> -->
</div>
<Settings {mm} />
<Toolbar pluginManager={ph} />
{#if !Number.isNaN(selectData.id) && de !== undefined}
    <SelectedMenu {...selectData} {de} />
{/if}

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
        pointer-events: auto;
        /* top: 0px; */
        /* left: 0px; */
    }

    .no-interact-canvas {
        pointer-events: none;
    }
</style>
