<script>
    import Banner from "./Banner.svelte";

    import { browser } from "$app/environment";

    var inElectron = false;

    if (browser && window.electronAPI !== undefined) {
        window.electronAPI.ping();
        inElectron = true;
    }
</script>

<section>
    <Banner />
    <!-- menu -->

    <div class="menu">
        <button class="lbutton" disabled={!inElectron}>
            <a href={inElectron ? "/my" : ""}> My </a>
        </button>
        <!-- <button class = "lbutton"> -->

        <button class="lbutton">
            <a href="/other"> Other </a>
        </button>

        <input
            type="button"
            value="Settings"
            class="sbutton"
        />
        <input type="button" value="Quit" class="sbutton" />
    </div>
    <a href="/board/65"> go to board 65</a>
</section>

<style>
    .menu {
        padding-left: 25%;
        padding-right: 25%;
        text-align: center;

        display: grid;
        row-gap: 8px;
        column-gap: 8px;
        grid-template-columns: 50% 50%;
    }

    .lbutton {
        grid-column: span 2;
    }
</style>
