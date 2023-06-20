<script>
    import SettingsMenuButton from "./SettingsMenuButton.svelte";

    /**
     * @type {()=>void}
     */
    export let closeFunction;
</script>

<div class="settings-container">
    <SettingsMenuButton
        name="exit"
        on:click={() => {
            closeFunction();
        }}
    />
</div>

<style>
    .settings-container {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        background-color: var(--background-2);
        padding: 8%;
    }
</style>
