<script>
    import { UserAlerts, removeAlert } from "$lib/alerts";
    /**
     * @type {import("$lib/alerts").UserAlert[]}
     */
    let currentDisplay = [];
    UserAlerts.subscribe((q) => (currentDisplay = q));
</script>

<div id="alert-queue">
    <!-- TODO: differnetiate rendering-->
    {#each currentDisplay as a, i}
        <div class="alertable alertable-red">
            {a.msg}
            <!-- TODO: styled button-->
            <button
                on:click={() => {
                    removeAlert(i);
                }}
            >
                X
            </button>
        </div>
    {/each}
</div>

<style>
    #alert-queue {
        position: absolute;
        top: 8vh;

        left: 50%;
        transform: translate(-50%, 0%);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .alertable {
        display: inline;
        border-width: 1px;
        border-style: solid;
        padding: 4px;
        margin: 1.5px;
    }

    .alertable-red {
        border-color: var(--text-err);
        background-color: var(--background-err);
        color: var(--text-err);
    }
</style>
