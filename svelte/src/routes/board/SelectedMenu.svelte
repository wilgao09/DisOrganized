<script lang="ts">
    import ContextMenu from "$lib/components/ContextMenu.svelte";
    import type DrawingEngine from "./dengine";

    export let id: number;
    export let de: DrawingEngine;
    export let x: number;
    export let y: number;
    export let visible: boolean;

    let options: Readonly<[string, () => void][]>;

    $: options = de.getMenuOptions(id);
    console.log("OPTIONS ARE AS LISTED FOR " + id);
    console.log(options);
</script>

<ContextMenu
    {x}
    {y}
    {options}
    {visible}
    defocuscb={() => {}}
/>
