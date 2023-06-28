<script lang="ts">
    import type DrawingEngine from "./dengine";

    export let id: number;
    export let de: DrawingEngine;
    export let x: number;
    export let y: number;

    let options: Readonly<[string, () => void][]>;

    $: options = de.getMenuOptions(id);
    console.log("OPTIONS ARE AS LISTED FOR " + id);
    console.log(options);
</script>

<div class="select-menu" style={`top:${y}px;left:${x}px`}>
    {#each options as option}
        <button
            class="do-button do-bwhite"
            on:click={() => {
                option[1]();
            }}>{option[0]}</button
        >
    {/each}
</div>

<style>
    .select-menu {
        position: absolute;
        display: flex;
        flex-direction: column;
        /* background-color: lime; */
    }
</style>
