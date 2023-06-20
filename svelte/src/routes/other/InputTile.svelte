<script>
    //storevar is a Readable<string>
    /**
     * @type {import("svelte/store").Readable<string> | import("svelte/store").Readable<number>}
     */
    export let storevar;
    //prompt is a string
    /**
     * @type {string}
     */
    export let prompt;
</script>

<div class="input-area">
    <label>
        {prompt}
        <input type="text" bind:value={$storevar} />
    </label>
</div>

<style>
</style>
