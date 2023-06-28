<script lang="ts">
    import {
        UserAlerts,
        removeAlert,
        type UserAlert,
        AlertType,
    } from "$lib/alerts";

    let currentDisplay: UserAlert[] = [];
    UserAlerts.subscribe((q) => (currentDisplay = q));

    function classesOfAlert(a: UserAlert): string {
        let classList = ["alertable"];
        switch (a.type) {
            case AlertType.SUCCESS:
                classList.push("alertable-green");
                break;
            case AlertType.INFO:
                classList.push("alertable-blue");
                break;
            case AlertType.WARNING:
                classList.push("alertable-yellow");
                break;
            case AlertType.ERROR:
                classList.push("alertable-red");
                break;
        }
        return classList.join(" ");
    }
</script>

<div id="alert-queue">
    <!-- TODO: differnetiate rendering-->
    {#each currentDisplay as a, i}
        <div class={classesOfAlert(a)}>
            {a.msg}
            <!-- TODO: styled button-->
            <div
                class="alertable-x-button"
                on:click={() => {
                    removeAlert(i);
                }}
                on:keypress={() => {
                    removeAlert(i);
                }}
                tabindex="-1"
            >
                ✖
            </div>
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
    .alertable-blue {
        border-color: var(--text-info);
        background-color: var(--background-info);
        color: var(--text-info);
    }

    .alertable-yellow {
        border-color: var(--text-warn);
        background-color: var(--background-warn);
        color: var(--text-warn);
    }

    .alertable-green {
        border-color: var(--text-succ);
        background-color: var(--background-succ);
        color: var(--text-succ);
    }

    .alertable-x-button {
        cursor: pointer;
        display: inline-block;
        /* border-style: solid;
        border-width: 1px; */
        padding: 2px;
        /* margin-left: 4px; */
    }
</style>
