<div class="backing">
    <slot />
</div>

<!-- TODO: FIX HACKY WORKAROUND -->
<style>
    .backing {
        background-color: white;
        margin: 0px;
        padding: 0px;
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        height: 100%;
    }
</style>
