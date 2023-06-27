<script lang="ts">
    import type PluginManager from "./plugins";

    export let id: number;
    export let pm: PluginManager;
    export let x: number;
    export let y: number;
</script>

<div class="select-menu">Lorem</div>

<style>
    .select-menu {
        position: absolute;
        width: 50px;
        height: 50px;
        background-color: lime;
    }
</style>
