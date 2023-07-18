<script lang="ts">
    import defocus from "$lib/defocus";
    import SettingsMenu from "./SettingsMenu.svelte";
    import type MultiplayerManager from "./multiplayer";
    import type PluginManager from "./plugins";

    export let mm: MultiplayerManager;
    export let pm: PluginManager;
    let menuOpened = false;
</script>

<button
    class="settings-button"
    on:click={() => {
        menuOpened = true;
    }}
>
    Settings
</button>

{#if menuOpened}
    <div
        class="menu-container"
        use:defocus
        on:defocus={() => {
            menuOpened = false;
        }}
    >
        <SettingsMenu
            closeFunction={() => (menuOpened = false)}
            {mm}
            {pm}
        />
    </div>
{/if}

<style>
    .settings-button {
        position: absolute;
        top: 4px;
        left: 4px;
    }
    /* TODO: this needs to be responsive */
    .menu-container {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 27%;
        height: 100%;
        background-color: var(--background-2);
    }
</style>
