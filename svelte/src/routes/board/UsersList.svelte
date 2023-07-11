<script lang="ts">
    import ArrowBackButton from "$lib/components/ArrowBackButton.svelte";
    import ContextMenu from "$lib/components/ContextMenu.svelte";
    import defocus from "$lib/defocus";
    import { isAdmin } from "$lib/isadmin";
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

    let ulistel: HTMLDivElement;
    let menuX = 0;
    let menuY = 0;
    let menuId = 0;
    let showMenu = false;
    function spawnContextMenu(
        x: number,
        y: number,
        uid: number
    ) {
        menuX = x;
        menuY = y;
        menuId = uid;
        showMenu = true;
    }
</script>

<div bind:this={ulistel}>
    <ArrowBackButton {back} />
    <div>
        {#each users as u}
            <div
                class="user-grid"
                on:contextmenu={(e) => {
                    if (isAdmin()) {
                        e.preventDefault();
                        spawnContextMenu(
                            e.clientX,
                            e.clientY,
                            u[0]
                        );
                        return false;
                    }
                    return true;
                }}
            >
                <div>
                    {`${u[0]}`}
                </div>
                <div>
                    <div
                        style={`background-color:${u[1]}`}
                        class="colored-square"
                    />
                </div>
                <div style="overflow-x:auto">
                    {`${u[2]}`}
                </div>
            </div>
        {/each}
    </div>
</div>
<ContextMenu
    x={menuX}
    y={menuY}
    options={[
        [
            "Kick",
            () => {
                window.electronAPI.kickUser(menuId);
            },
        ],
    ]}
    defocuscb={() => {
        showMenu = false;
    }}
    visible={showMenu}
/>

<style>
    .user-grid {
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
