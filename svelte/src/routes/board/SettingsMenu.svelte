<script lang="ts">
    import ArrowBackButton from "$lib/components/ArrowBackButton.svelte";
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
    </div>
{:else if currentPage == "users"}
    <UsersList
        {mm}
        back={() => {
            currentPage = "settings";
        }}
    />
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
