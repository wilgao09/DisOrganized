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
        <span>
            {windowName}
        </span>
        <span class="draggable-window-x"> ✖ </span>
    </div>
    <div class="draggable-window-content">
        <slot />
    </div>
</div>

<style>
    .draggable-window {
        position: absolute;
        height: 300px;
        width: 400px;
    }
    .draggable-window-heading {
        background-color: magenta;
        display: flex;
        justify-content: space-between;
        user-select: none;
    }
    .draggable-window-x {
        background-color: cyan;
        user-select: none;
    }
    .draggable-window-content {
        background-color: green;
    }
</style>
