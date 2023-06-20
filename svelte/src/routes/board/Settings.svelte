<script>
    import SettingsMenu from "./SettingsMenu.svelte";

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
    <div class="menu-container">
        <SettingsMenu
            closeFunction={() => (menuOpened = false)}
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
