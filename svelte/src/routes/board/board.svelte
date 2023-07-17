<script lang="ts">
    import writePluginAPI from "./pluginapi";
    import PluginManger from "./plugins";
    import InputManager from "./inputs";
    import DrawingEngine from "./dengine";
    import * as wsutil from "./wsutil";
    import fetchPlugins from "./pluginfetch";
    import { defaultBrush, loadEnums } from "./usertypes";
    import { declName, destIp, destPort } from "$lib/dest";
    import { get } from "svelte/store";
    import { onMount } from "svelte";
    import Settings from "./Settings.svelte";
    import Toolbar from "./Toolbar.svelte";
    import MultiplayerManager from "./multiplayer";
    import SelectedMenu from "./SelectedMenu.svelte";
    import { loadingCompleted } from "$lib/firstload";
    import DraggableWindow from "$lib/components/DraggableWindow.svelte";
    import ColorPicker from "svelte-awesome-color-picker";
    // import DrawingEngine from "./dengine";
    let wsurl = `ws://${encodeURIComponent(
        get(destIp)
    )}:${encodeURIComponent(
        get(destPort)
    )}/connectws/${encodeURIComponent(get(declName))}`;
    let de: DrawingEngine;
    let ph: PluginManger = new PluginManger();
    let ih: InputManager;
    let mm: MultiplayerManager = new MultiplayerManager();

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

    let boardFrame: Element;

    let selectedColor = "#000000ff";
    let selectedSize = 5;
    function anyHandler(ev: InputHandling.InputEvent) {
        if (ev.type === InputHandling.InputEventType.KEY) {
            if (ev.lift < 0) {
                console.log("up");
                for (let f of ih.getFns(ev.value)) {
                    ph.deactivateAndCommit(f, (i) => {
                        let aabb = i.AABB;
                        if (aabb !== undefined)
                            de.clearLocalRect(...aabb);
                    });
                }
            }
            if (ev.lift > 0) {
                console.log("down");
                // TODO: here
                for (let f of ih.getFns(ev.value))
                    ph.activateFn(f);
            }
        } else {
            de.trySendPosition(ev.x, ev.y);
            if (
                // ih.currAction() ==
                //     InputHandling.UserActions.DRAW &&
                ev.lift === -1
            ) {
                console.log("PAUSE");
                // pause drawing
                de.endDraw();
                let objs = ph.pauseAll(ev);
                for (let k of objs) {
                    ph.commitObject(k);
                }
            }
            switch (ev.action) {
                case InputHandling.UserActions.PAN:
                    de.endDraw();
                    de.pan(
                        ih.previousPoint().x,
                        ih.previousPoint().y,
                        ih.currentPoint().x,
                        ih.currentPoint().y
                    );
                    break;
                case InputHandling.UserActions.DRAW:
                    de.draw(ev.x, ev.y);
                    ph.offer(ev);
                    break;
                case InputHandling.UserActions.SELECT:
                    de.endDraw();
                    let newData = {
                        x: 0,
                        y: 0,
                        id: -1,
                    };

                    newData.id = parseInt(ev.target.id);
                    newData.x = ih.currentPoint().x;
                    newData.y = ih.currentPoint().y;
                    selectData = newData;

                    break;
            }
        }
    }

    let selectData = {
        x: 0,
        y: 0,
        id: NaN,
    };
    onMount(() => {
        loadEnums();
        ih = new InputManager({ onAny: anyHandler });

        writePluginAPI(ih);
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
                fetchPlugins(ph, ih, () => {
                    console.log("done fetching");
                    window.boardSocket({
                        msgType:
                            wsutil.WSMessageCode
                                .GET_MY_DATA,
                        msg: "",
                    });
                    window.boardSocket({
                        msgType: wsutil.WSMessageCode.FETCH,
                        msg: "",
                    });
                    window.boardSocket({
                        msgType:
                            wsutil.WSMessageCode.GET_USERS,
                        msg: "",
                    });
                    ph.setSVGStyle(defaultBrush);
                    de.setBrush(defaultBrush);

                    setInterval(() => {
                        window.boardSocket({
                            msgType:
                                wsutil.WSMessageCode.FETCH,
                            msg: "",
                        });
                    }, 30000);
                });
            }
        );
    });

    let pointerCoords = { x: 0, y: 0 };
    function handleInputs(
        ev: KeyboardEvent | PointerEvent
    ) {
        if (!("key" in ev)) {
            ev as PointerEvent;
            pointerCoords = de.mapScreenPointToBoardPoint(
                ev.clientX,
                ev.clientY
            );
        }

        ih.handleNewEvent(
            ev,
            pointerCoords.x,
            pointerCoords.y
        );
    }

    function changeBrush() {
        let b = {
            strokeStyle: selectedColor,
            lineWidth: selectedSize,
        };
        ph.setSVGStyle(b);
        de.setBrush(b);
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
        on:pointerdown={handleInputs}
        on:pointermove={handleInputs}
        on:pointerup={handleInputs}
        on:keydown={handleInputs}
        on:keyup={handleInputs}
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
<Toolbar
    pluginManager={ph}
    deactivateCb={(i) => {
        let aabb = i.AABB;
        if (aabb !== undefined) de.clearLocalRect(...aabb);
    }}
/>
<!-- TODO: fix this -->
{#if de !== undefined}
    <SelectedMenu
        {...selectData}
        {de}
        visible={!Number.isNaN(selectData.id)}
    />
{/if}
<DraggableWindow windowName="Brush Selector">
    <ColorPicker
        isOpen={true}
        isPopup={false}
        disableCloseClickOutside={true}
        isInput={false}
        label=""
        isA11y={false}
        bind:hex={selectedColor}
        on:input={changeBrush}
    />
    <div style="display:flex;">
        <div>Size:</div>
        <input
            type="range"
            min="1"
            max="99"
            bind:value={selectedSize}
            on:input={changeBrush}
            list="brush-size-tickmarks"
        />
        <input
            type="number"
            bind:value={selectedSize}
            on:input={changeBrush}
            min="1"
            max="99"
        />
    </div>
    <datalist id="brush-size-tickmarks">
        <option value="10" />
        <option value="20" />
        <option value="30" />
        <option value="40" />
        <option value="50" />
        <option value="60" />
        <option value="70" />
        <option value="80" />
        <option value="90" />
    </datalist>
</DraggableWindow>

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
