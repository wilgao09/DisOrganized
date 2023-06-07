<script>
    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    if (browser && window.electronAPI !== undefined) {
        window.electronAPI.ping();
    }

    /**
     * @type {HTMLDivElement}
     */
    let fileArea;
    /**
     * @type {string[]}
     */
    let boards = [];

    onMount(async function () {
        boards =
            await window.electronAPI.getAvailableBoards();
    });
</script>

<section class="menu">
    <div class="heading">
        <span> Lorem Ipsum</span>
        <button> Dolor </button>
    </div>
    <div class="file-area" bind:this={fileArea}>
        {#each boards as b}
            <div class="file-tile">{b}</div>
        {/each}
    </div>
    <div class="option-bar">
        <button> START </button>
        <button> EDIT NAME </button>
        <button> EDIT CONFIG </button>
    </div>
</section>

<style>
    .menu {
        height: 100%;
        width: 100%;
        display: grid;
        grid-template-columns: 5% 90% 5%;
        grid-template-rows: 13% 77% 10%;
        /* grid-template-areas:
            "head" "head" "head"
            "a" "files" "b"
            "c" "options" "d"; */
    }

    .heading {
        grid-area: 1/1/2/4;
        display: flex;
        flex-direction: row;
    }

    .file-area {
        height: 100%;
        width: 100%;
        grid-area: 2/2/3/3;
        flex-direction: column;
        overflow-y: scroll;
        background-color: blueviolet;
    }

    .file-tile {
        width: 96%;
        height: 10%;
        margin-left: 2%;
        margin-right: 2%;
        background-color: antiquewhite;
    }

    .option-bar {
        grid-area: 3/2/4/3;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-around;
    }
</style>
