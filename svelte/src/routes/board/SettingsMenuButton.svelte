<script>
    import RightArrowIcon from "$lib/components/RightArrowIcon.svelte";

    /**
     * @type {string}
     */
    export let name;
</script>

<button class="settings-tile" on:click>
    <div class="name-container">
        {name}
    </div>

    <div class="arrow-container">
        <RightArrowIcon />
    </div>
</button>

<style>
    /** im imagining roboto here*/
    .settings-tile {
        width: 100%;
        height: 10%;
        background: none;

        border: none;
        padding-top: 2px;
        padding-left: 6px;
        font: inherit;
        font-size: 24px;
        cursor: pointer;
        outline: none;
        text-align: left;

        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .arrow-container {
        display: block;
        /* height: 100%; */
        width: 30%;
    }

    .name-container {
        margin-top: auto;
        margin-bottom: auto;
        font-size: 1.5em;
    }
</style>
