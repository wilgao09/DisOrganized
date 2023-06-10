<script>
    import { destIp } from "$lib/store";
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
    <main>
        <slot />
    </main>
</div>
