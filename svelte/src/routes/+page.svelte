<script>
    import Banner from "./Banner.svelte";

    import { goto } from "$app/navigation";
    import { isAdmin } from "$lib/isadmin";

    var inElectron = false;

    if (isAdmin()) {
        inElectron = true;
    }
</script>

<section class="main-column">
    <Banner />
    <!-- menu -->

    <div class="menu">
        <!-- <button class = "lbutton"> -->

        {#if inElectron}
            <button
                class="do-button do-bgreen"
                disabled={!inElectron}
                on:click={() => {
                    goto("/my");
                }}
            >
                Start Local Instance
            </button>
        {/if}
        <button
            class="do-button do-bgreen"
            on:click={() => {
                goto("/other");
            }}
        >
            Join Instance
        </button>

        <button class="do-button do-bgreen">Settings</button
        >
        <button class="do-button do-bgreen">Quit</button>
    </div>
</section>

<style>
    .menu {
        padding-left: 25%;
        padding-right: 25%;
        text-align: center;

        display: flex;
        flex-direction: column;

        /* display: grid;
        row-gap: 8px;
        column-gap: 8px;
        grid-template-columns: 50% 50%; */
    }

    /* .lbutton {
        grid-column: span 2;
    } */
</style>
