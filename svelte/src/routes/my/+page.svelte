<script>
    import { browser } from "$app/environment";

    if (browser && window.electronAPI !== undefined) {
        window.electronAPI.ping();
    }
</script>

<section>
    <h2>Select file</h2>
</section>
