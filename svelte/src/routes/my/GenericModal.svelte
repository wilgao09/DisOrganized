<script>
    import SmallColumnBanner from "$lib/components/SmallColumnBanner.svelte";
    import { onMount } from "svelte";

    /**
     * @type {HTMLDialogElement}
     */
    let dialogMain;
    /**
     * @type {string}
     */
    export let title;

    /**
     * @type {string[]}
     */
    export let buttonNames;

    /**
     * @type {(() => any)[]}
     */
    export let buttonActions;

    export const showModal = () => {
        dialogMain.showModal();
    };

    export const hideModal = () => {
        dialogMain.close();
    };

    let numButtons = Math.max(
        buttonActions.length,
        buttonNames.length
    );
</script>

<dialog class="dbacking" bind:this={dialogMain}>
    <div class="dinternal">
        <SmallColumnBanner
            {title}
            back={() => {
                dialogMain.close();
            }}
        />
        <slot />
        <div class="buttons-area">
            <!-- TODO: wtf is this scuffed shit-->
            {#each { length: numButtons } as _, i}
                <button
                    class="do-button"
                    on:click={() => {
                        buttonActions[i]();
                    }}
                >
                    {buttonNames[i]}
                </button>
            {/each}
        </div>
    </div>
</dialog>

<style>
    .dbacking {
        background-color: var(--background-2);
        padding: 8px;
        border-style: solid;
        border-color: var(--borders-1);
        border-width: 2px;
        width: 50%;
        height: 50%;
    }

    .dinternal {
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        height: 100%;
        width: 100%;
    }

    .buttons-area {
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
    }
</style>
