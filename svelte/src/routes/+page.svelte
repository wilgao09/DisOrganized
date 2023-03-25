<script>
    import Banner from "./Banner.svelte";
</script>

<section>
    <Banner />
    <!-- menu -->

    <div class="menu">
        <a href="/my">
            <input type="button" value="My" class="lbutton" />
        </a>
        <!-- <a href="/other"> -->
        <input type="button" value="Other" class="lbutton" />
        <!-- </a> -->

        <input type="button" value="Settings" class="sbutton" />
        <input type="button" value="Quit" class="sbutton" />
    </div>
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
