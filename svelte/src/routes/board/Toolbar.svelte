<script>
    import { onMount } from "svelte";
    import Tool from "./Tool.svelte";
    // @ts-ignore
    import PluginManager from "./plugins";

    /**
     * @type {PluginManager}
     */
    export let pluginManager;

    /**
     * @type {(_:PluginProduct)=>void}
     */
    export let deactivateCb;

    /**
     * @type {[string,boolean][]}
     */
    let toolsToRender = Array.from(
        pluginManager.getFunctionsStatus().entries()
    )
        .sort((a, b) => a[1][0] - b[1][0])
        .map((x) => [x[0], x[1][1]]);

    pluginManager.newChange.subscribe((x) => {
        toolsToRender = Array.from(
            pluginManager.getFunctionsStatus().entries()
        )
            .sort((a, b) => a[1][0] - b[1][0])
            .map((x) => [x[0], x[1][1]]);
    });
</script>

<div class="toolbar">
    {#each toolsToRender as tool}
        <Tool
            name={tool[0]}
            active={tool[1]}
            on:click={() => {
                if (tool[1]) {
                    pluginManager.deactivateAndCommit(
                        tool[0],
                        deactivateCb
                    );
                } else {
                    pluginManager.activateFn(tool[0]);
                }
            }}
        />
    {/each}
</div>

<style>
    .toolbar {
        display: flex;
        flex-direction: row;
        position: absolute;
        bottom: 0px;
        left: 50%;
        height: 8%;
        /* width: 50rem;  */
        background-color: teal;
        transform: translate(-50%, 0%);
    }
</style>
