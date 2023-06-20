<script>
    // @ts-nocheck

    /**
     * @type {string}
     */
    export let boardName;
    /**
     * @type {MouseEventHandler<Event>}
     */
    export let selectCb;
    export let isSelected;
</script>

<div
    class={"file-tile" +
        (isSelected ? " selected-file-tile" : "")}
    on:click={selectCb}
    on:keypress={selectCb}
>
    <div class="tile-contents">
        {boardName}
    </div>
</div>

<style>
    .file-tile {
        width: 96%;
        height: 15%;
        margin-left: 2%;
        margin-right: 2%;
        margin-top: 5%;
        background-color: antiquewhite;
        font-size: 24px;
        color: var(--text-body-1);

        display: flex;
        flex-direction: column;
        justify-content: center;

        cursor: pointer;
    }

    /* TODO: nicer styling */
    .selected-file-tile {
        background-color: var(--focus-1);
    }

    .tile-contents {
        margin-left: 12px;
    }
</style>
