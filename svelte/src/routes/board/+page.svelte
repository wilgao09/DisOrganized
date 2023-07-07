<script>
    import { loadingCompleted } from "$lib/firstload";
    import LoadingScreen from "./LoadingScreen.svelte";
    // import { page } from "$app/stores";
    // export let data;

    import Board from "./board.svelte";

    let ready = false;
    loadingCompleted.subscribe((v) => {
        if (v) {
            alert("done loading");
            ready = true;
        } else {
            ready = false;
        }
    });
</script>

<Board />
{#if !ready}
    <LoadingScreen />
{/if}
