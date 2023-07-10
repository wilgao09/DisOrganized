<script lang="ts">
    import ArrowBackButton from "$lib/components/ArrowBackButton.svelte";
    import type MultiplayerManager from "./multiplayer";

    export let mm: MultiplayerManager;

    export let back: () => void;

    let users: [number, string, string][] = [];
    for (let [id, ud] of mm.getAllUserData().entries()) {
        users.push([id, mm.getColor(id), ud.name]);
    }

    mm.userListUpdate.subscribe((_) => {
        let t: [number, string, string][] = [];
        for (let [id, ud] of mm
            .getAllUserData()
            .entries()) {
            t.push([id, mm.getColor(id), ud.name]);
        }
        t.sort((a, b) => {
            return a[0] - b[0];
        });
        users = t;
    });
</script>

<div>
    <ArrowBackButton {back} />
    <div class="users-grid">
        {#each users as u}
            <div>
                {`${u[0]}`}
            </div>
            <div>
                <div
                    style={`background-color:${u[1]}`}
                    class="colored-square"
                />
            </div>
            <div>
                {`${u[2]}`}
            </div>
        {/each}
    </div>
</div>

<style>
    .users-grid {
        display: grid;
        grid-template-columns: 10% 3ch 50%;
        column-gap: 9% 9%;
        font-size: 24pt;
        overflow-x: auto;
    }

    .colored-square {
        padding: 4%;
        border-style: solid;
        border-width: 4%;
        border-color: white;
        width: 2ch;
        height: 2ch;
    }
</style>
