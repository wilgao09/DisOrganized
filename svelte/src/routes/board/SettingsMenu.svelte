<script lang="ts">
    import ArrowBackButton from "$lib/components/ArrowBackButton.svelte";
    import PluginSettings from "./PluginSettings.svelte";
    import SettingsMenuButton from "./SettingsMenuButton.svelte";
    import UsersList from "./UsersList.svelte";
    import type MultiplayerManager from "./multiplayer";
    import type PluginManager from "./plugins";

    // /**
    //  * @type {()=>void}
    //  */
    export let closeFunction: () => void;

    export let mm: MultiplayerManager;
    export let pm: PluginManager;

    // TODO: move this into an external variable
    let currentPage = "settings";
</script>

{#if currentPage == "settings"}
    <div class="settings-container">
        <ArrowBackButton back={closeFunction} />

        <div class="settings">
            <SettingsMenuButton
                name="Users List"
                dir="right"
                on:click={() => {
                    currentPage = "users";
                }}
            />
        </div>
        <div class="settings">
            <SettingsMenuButton
                name="Plugin Settings"
                dir="right"
                on:click={() => {
                    currentPage = "plugin-settings";
                }}
            />
        </div>
    </div>
{:else if currentPage == "users"}
    <UsersList
        {mm}
        back={() => {
            currentPage = "settings";
        }}
    />
{:else if currentPage == "plugin-settings"}
    <PluginSettings {pm} />
{:else}
    <div>shit fuck</div>
{/if}

<style>
    .settings-container {
        height: 100%;
        width: 100%;
        /* padding: 8%; */
    }
    .settings {
        padding: 8%;
        display: flex;
        flex-direction: column;
        background-color: var(--background-2);
    }
</style>
