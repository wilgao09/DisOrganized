<script lang="ts">
    import PluginManger from "./plugins";
    import InputManager from "./inputs";
    import DrawingEngine from "./dengine";
    import * as wsutil from "./wsutil";
    import fetchPlugins from "./pluginfetch";
    import { UserInputs, UserActions } from "./usertypes";
    import { declName, destIp, destPort } from "$lib/dest";
    import { get } from "svelte/store";
    import { onMount } from "svelte";
    import Settings from "./Settings.svelte";
    import Toolbar from "./Toolbar.svelte";
    import MultiplayerManager from "./multiplayer";
    import SelectedMenu from "./SelectedMenu.svelte";
    import { loadingCompleted } from "$lib/firstload";
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
        if (icanvasel !== null && dcanvasel !== null)
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

        // board dims
        let ob = new ResizeObserver((entries) => {
            for (const e of entries) {
                if (e.target === boardFrame) {
                    de.resize();
                }
            }
        });

        ob.observe(boardFrame);

        // TODO: replace all instances of window.boardsocket
        // with a state variable
        window.boardSocket = wsutil.opensocket(
            wsurl,
            wsutil.defaultMessageHandler(ph, de, mm, () => {
                de.sync(mm.getUserData().cookie);
                loadingCompleted.set(true);
            }),
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
    function handleEvent(ev: PointerEvent) {
        let boardLocation = de.mapScreenPointToBoardPoint(
            ev.clientX,
            ev.clientY
        );
        de.trySendPosition(
            boardLocation.x,
            boardLocation.y
        );
        let metadata = ih.actionMeta(ev);
        // console.log("metadata");
        // console.log(metadata);
        if (
            ih.currAction() === UserActions.DRAW &&
            metadata.lift === -1
        ) {
            // pause drawing
            let objs = ph.pauseAll({
                ...boardLocation,
            });
            for (let k of objs) {
                ph.commitObject(k);
            }
        }
        // TODO: zoom
        switch (ih.actionType(ev)) {
            case UserActions.PAN:
                de.endDraw();
                de.pan(
                    ih.previousPoint().x,
                    ih.previousPoint().y,
                    ev.clientX,
                    ev.clientY
                );
                break;
            case UserActions.DRAW:
                de.draw(boardLocation.x, boardLocation.y);
                ph.offer({
                    x: boardLocation.x,
                    y: boardLocation.y,
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
                    newData.x = ih.currentPoint().x;
                    newData.y = ih.currentPoint().y;
                    selectData = newData;
                }
                break;
            default:
                de.endDraw();
                break;
        }
        // icanvasel.dispatchEvent(ev);
    }

    function handlekeydown(ev: KeyboardEvent) {
        console.log("down");
        // TODO: here
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
        id="main-svg"
        class="bcanvas"
        viewBox="0 0 600 800"
        bind:this={svgel}
        on:pointerdown={handleEvent}
        on:pointermove={handleEvent}
        on:pointerup={handleEvent}
        on:keydown={handlekeydown}
        on:keyup={handlekeyup}
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
        touch-action: none;
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

    #main-svg {
        pointer-events: stroke;
    }
</style>
