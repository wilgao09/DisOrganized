<script lang="ts">
    import ArrowIcon from "./ArrowIcon.svelte";

    export let back: () => void;

    // let backtxt;
</script>

<div
    class="button-internal"
    on:click={() => back()}
    on:keydown={() => back()}
>
    <div class="arrow-icon-wrapper">
        <ArrowIcon dir="left" />
    </div>

    <div class="button-internal-text">Back</div>
</div>

<style>
    .button-internal {
        display: flex;
        flex-direction: row;
        font-size: 1.5em;
        padding: 8px;
    }
    .arrow-icon-wrapper {
        /* height: 10%; */
        width: 1.3em;
    }
    .button-internal-text {
        padding-left: 16px;
    }
</style>
