<script>
    import { destIp } from "$lib/dest";
    import AlertQueue from "./AlertQueue.svelte";
    import "./styles.css";
    import { onMount } from "svelte";

    onMount(() => {
        destIp.subscribe((v) => {
            if (v === "SECRETKEY") {
                destIp.set(window.location.hostname);
            }
        });
    });
</script>

<div id="app">
    <AlertQueue />
    <main>
        <slot />
    </main>
</div>
