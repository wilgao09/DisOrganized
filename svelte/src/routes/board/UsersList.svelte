<script lang="ts">
    import type MultiplayerManager from "./multiplayer";

    export let mm: MultiplayerManager;

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
        users = t;
    });
</script>

<div>
    {#each users as u}
        <div>
            {`${u[0]} ${u[1]} ${u[2]}`}
        </div>{/each}
</div>

<!-- <style>
    .user-row {
    }
</style> -->
