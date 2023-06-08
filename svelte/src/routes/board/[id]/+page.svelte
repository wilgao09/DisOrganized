<script>
    // import { page } from "$app/stores";
    // export let data;
    import * as wsutil from "./wsutil";
    import Board from "./board.svelte";
    import { declName, destIp, destPort } from "$lib/store";
    import { get } from "svelte/store";

    let wsurl = `ws://${encodeURIComponent(
        get(destIp)
    )}:${encodeURIComponent(
        get(destPort)
    )}/connectws/${encodeURIComponent(get(declName))}`;

    // TODO: this returns an important callback
    wsutil.opensocket(
        wsurl,
        (m) => {
            // TODO: an actual handler for ws events
            console.log(m);
        }
    );
</script>

<!-- hello world {data.id} -->
<Board />
