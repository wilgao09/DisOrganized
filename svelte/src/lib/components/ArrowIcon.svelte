<script lang="ts">
    export let dir: string;
</script>

<svg
    viewBox="0 0 24 24"
    class={"icon" + (dir == "left" ? " rotated" : "")}
>
    <path
        d="m15 5-1.41 1.41L18.17 11H2v2h16.17l-4.59 4.59L15 19l7-7-7-7z"
    />
</svg>

<style>
    .icon {
        display: block;
    }
    .rotated {
        transform: rotate(0.5turn);
    }
</style>
