<script>
    import { loadingCompleted } from "$lib/firstload";
    import LoadingScreen from "./LoadingScreen.svelte";
    // import { page } from "$app/stores";
    // export let data;

    import Board from "./board.svelte";

    let ready = false;
    loadingCompleted.subscribe((v) => {
        ready = v;
    });
</script>

<Board />
{#if !ready}
    <LoadingScreen />
{/if}
