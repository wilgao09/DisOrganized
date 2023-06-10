<script>
    import { declName, destIp, destPort } from "$lib/store";

</script>

<section>
    <h3>Connect to other servers</h3>
    <h5>Declared Name</h5>
    <input type="text" bind:value={$declName} />
    <h5>Server Ip</h5>
    <input type="text" bind:value={$destIp} />
    <h5>Server Port</h5>
    <input type="text" bind:value={$destPort} />

    <button>
        <!-- //TODO: board names -->
        <a href={`/board`}> Go </a>
    </button>
</section>
