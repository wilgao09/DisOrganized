<script>
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import FileTile from "./FileTile.svelte";
    import SmallColumnBanner from "$lib/components/SmallColumnBanner.svelte";
    import GenericModal from "./GenericModal.svelte";
    import { addAlert, AlertType } from "$lib/alerts";

    /**
     * @type {HTMLDivElement}
     */
    let fileArea;
    /**
     * @type {string[]}
     */
    let boards = [];

    let selectedBoard = "";

    /**
     * @type {GenericModal}
     */
    let nameModal;

    /**
     * @type {string}
     */
    let typedName = "Untitled";

    async function fetchBoards() {
        boards =
            await window.electronAPI.getAvailableBoards();
        if (boards.length == 1 && boards[0] == "") {
            boards = [];
        }
    }

    onMount(async function () {
        fetchBoards();
    });
</script>

<section class="main-column menu">
    <GenericModal
        title="New Board"
        bind:this={nameModal}
        buttonNames={["Create"]}
        buttonActions={[
            async () => {
                let succ =
                    await window.electronAPI.createBoard(
                        typedName
                    );
                if (!succ) {
                    return;
                }
                boards =
                    await window.electronAPI.getAvailableBoards();
            },
        ]}
    >
        <div>
            <label>
                Board Name: <input
                    type="text"
                    placeholder="Untitled"
                    bind:value={typedName}
                />
            </label>
        </div>
    </GenericModal>

    <!-- TODO: error messages for file creation-->
    <div class="heading">
        <div style="width:90%">
            <SmallColumnBanner
                title="Start Local Instance"
            />
        </div>

        <button
            class="do-button"
            style="font-size:24px"
            on:click={() => {
                nameModal.showModal();
            }}
        >
            New Board
        </button>
    </div>
    <div class="file-area" bind:this={fileArea}>
        {#each boards as b}
            <FileTile
                boardName={b}
                selectCb={() => {
                    if (selectedBoard == b) {
                        selectedBoard = "";
                    } else {
                        selectedBoard = b;
                    }
                }}
                isSelected={b == selectedBoard}
            />
        {/each}

        <!-- <FileTile
            boardName={"DUMMY"}
            selectCb={() => {
                if (selectedBoard == "DUMMY") {
                    selectedBoard = "";
                } else {
                    selectedBoard = "DUMMY";
                }
            }}
            isSelected={"DUMMY" == selectedBoard}
        /> -->
    </div>
    <div class="option-bar">
        <!-- //TODO: make neat-->
        {#if selectedBoard != ""}
            <button
                class="do-button do-bgreen"
                on:click={() => {
                    let sboard = selectedBoard;
                    if (sboard != "") {
                        window.electronAPI
                            .openBoard(sboard)
                            .then((v) => {
                                if (v == "") {
                                    goto(`/board`, {
                                        replaceState: false,
                                    });
                                }
                            });
                    }
                }}
            >
                START
            </button>
            <button class="do-button do-bgreen">
                EDIT NAME
            </button>
            <button class="do-button do-bgreen">
                EDIT CONFIG
            </button>
            <button
                class="do-button do-bred"
                on:click={() => {
                    let n = selectedBoard;
                    window.electronAPI
                        .deleteBoard(n)
                        .then((res) => {
                            if (res) {
                                fetchBoards();
                                selectedBoard = "";
                            } else {
                                addAlert({
                                    type: AlertType.ERROR,
                                    msg: `Failed to delete ${n}`,
                                });
                            }
                        });
                }}
            >
                DELETE BOARD
            </button>
        {/if}
    </div>
</section>

<style>
    .menu {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        /* display: grid;
        grid-template-columns: 5% 90% 5%;
        grid-template-rows: 13% 77% 10%; */
        /* grid-template-areas:
            "head" "head" "head"
            "a" "files" "b"
            "c" "options" "d"; */
    }

    .heading {
        /* grid-area: 1/1/2/4; */
        display: flex;
        flex-direction: row;
        margin-bottom: 8px;
    }

    .file-area {
        height: 100%;
        width: 100%;
        /* grid-area: 2/2/3/3; */
        flex-direction: column;
        overflow-y: scroll;

        /* overwrite main-column */
        width: 100%;
    }

    .option-bar {
        /* grid-area: 3/2/4/3;
        height: 100%; */
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-around;
    }
</style>
