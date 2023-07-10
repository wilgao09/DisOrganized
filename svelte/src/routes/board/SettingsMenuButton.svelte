<script lang="ts">
    import ArrowIcon from "$lib/components/ArrowIcon.svelte";

    export let name: string;

    export let dir: string;
</script>

<button class="settings-tile" on:click>
    <div class="name-container">
        {name}
    </div>

    <div class="arrow-container">
        <ArrowIcon {dir} />
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

        display: grid;
        grid-template-columns: 80% 20%;
        /* column-gap: 10%; */
        /* flex-direction: row;
        justify-content: space-between; */
    }

    .arrow-container {
        display: block;
        margin-top: auto;
        margin-bottom: auto;
        /* margin-right: auto; */
        /* height: 10%; */
        /* width: 10%; */
    }

    .name-container {
        margin-top: auto;
        margin-bottom: auto;
        font-size: 1.5em;
    }
</style>
