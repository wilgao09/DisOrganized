<script>
    import { declName, destIp, destPort } from "$lib/dest";
    import { get } from "svelte/store";
    import InputTile from "./InputTile.svelte";
    import SmallColumnBanner from "$lib/components/SmallColumnBanner.svelte";
    import { goto } from "$app/navigation";

    /**
     * @type {string}
     */
    let n;
    /**
     * @type {string}
     */
    let ip;
    /**
     * @type {number}
     */
    let port;
    n = get(declName);
    ip = get(destIp);
    port = get(destPort);
    declName.subscribe((nn) => (n = nn));
    destIp.subscribe((v) => {
        ip = v;
    });
    destPort.subscribe((np) => (port = np));
</script>

<section class="main-column">
    <SmallColumnBanner title="Join Instance" />
    <div class="input-fields">
        <InputTile
            prompt="Display Name"
            storevar={declName}
        />
        <InputTile prompt="Server Ip" storevar={destIp} />
        <InputTile
            prompt="Server Port"
            storevar={destPort}
        />
    </div>

    <button
        class="do-button"
        on:click={() => {
            goto("/board");
        }}
    >
        {`Join ${ip}:${port} as ${n}`}
    </button>
</section>

<style>
    .input-fields {
        padding: 8px;
    }
</style>
