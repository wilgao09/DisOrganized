<script lang="ts">
    export let options: Readonly<[string, () => void][]>;
    export let x: number;
    export let y: number;
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
