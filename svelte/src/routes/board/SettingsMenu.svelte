<script lang="ts">
    import SettingsMenuButton from "./SettingsMenuButton.svelte";
    import UsersList from "./UsersList.svelte";
    import type MultiplayerManager from "./multiplayer";

    // /**
    //  * @type {()=>void}
    //  */
    export let closeFunction: () => void;

    export let mm: MultiplayerManager;

    // TODO: move this into an external variable
    let currentPage = "settings";
</script>

{#if currentPage == "settings"}
    <div class="settings-container">
        <SettingsMenuButton
            name="Return to board"
            on:click={() => {
                closeFunction();
            }}
        />
        <SettingsMenuButton
            name="Users List"
            on:click={() => {
                currentPage = "users";
            }}
        />
    </div>
{:else if currentPage == "users"}
    <UsersList {mm} />
{:else}
    <div>shit fuck</div>
{/if}

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
