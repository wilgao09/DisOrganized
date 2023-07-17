<script lang="ts">
    export let windowName: string;

    export let x: number = 0;
    export let y: number = 0;

    let last = {
        clientX: x,
        clientY: y,
    };

    let dragging = false;

    function moveWithCursor(e: PointerEvent) {
        y += e.clientY - last.clientY;
        x += e.clientX - last.clientX;
        last = e;
    }
</script>

<div
    class="draggable-window"
    style={`top:${y}px;left:${x}px`}
>
    <div
        class="draggable-window-heading"
        on:pointerdown={(e) => {
            last = e;
            document.addEventListener(
                "pointermove",
                moveWithCursor
            );
        }}
        on:pointerup={() =>
            document.removeEventListener(
                "pointermove",
                moveWithCursor
            )}
    >
        <div>
            {windowName}
        </div>
        <!-- <div class="draggable-window-x">✖</div> -->
    </div>
    <div class="draggable-window-content">
        <slot />
    </div>
</div>

<style>
    .draggable-window {
        position: absolute;
        padding: 4px;
        /* height: 300px;
        width: 400px; */
    }
    .draggable-window-heading {
        background-color: var(--hover-1);
        display: flex;
        justify-content: space-between;
        user-select: none;
        padding: 2px 8px;
    }
    /* .draggable-window-x {
        background-color: var(--background-err);
        user-select: none;
        width: 1.2em;
        height: 1.2em;
        text-align: center;
        line-height: 1.3em;
    } */
    .draggable-window-content {
        background-color: var(--background-1);
        padding: 8px;
    }
</style>
