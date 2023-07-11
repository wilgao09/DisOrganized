<script lang="ts">
    import defocus from "$lib/defocus";

    export let options: Readonly<[string, () => void][]>;
    export let x: number;
    export let y: number;
    export let defocuscb: () => void;
    export let visible = false;

    let el: HTMLDivElement;
</script>

<div
    bind:this={el}
    class="select-menu"
    style={`top:${y}px;left:${x}px;visibility:${
        visible ? "visible" : "hidden"
    }`}
    use:defocus
    on:defocus={() => {
        defocuscb();
    }}
>
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
