<script>
    /**
     * @type {string}
     */
    export let name;
    /**
     * @type {boolean}
     */
    export let active;
</script>

<button on:click class={active ? "active-button" : ""}>
    {name}
</button>

<style>
    .active-button {
        background-color: magenta;
    }
</style>
