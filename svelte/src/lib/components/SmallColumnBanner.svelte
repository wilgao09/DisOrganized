<script>
    import { goto, afterNavigate } from "$app/navigation";
    import { base } from "$app/paths";

    /**
     * @type {string}
     */
    export let title;

    export let back = () => {
        goto(previousPage);
    };

    //TODO: i dont know what this actually does

    /**
     * @type {string}
     */
    let previousPage = base;

    afterNavigate(({ from }) => {
        previousPage = from?.url.pathname || previousPage;
    });
</script>

<div style="width:100%;">
    <div class="small-logo-banner">{title}</div>
    <button class="do-back-button" on:click={() => back()}
        >Back</button
    >
</div>

<style>
    .small-logo-banner {
        font-size: 36px;
        text-align: left;
        color: var(--primary-1);
        width: 85%;
        display: inline-block;
    }

    .do-back-button {
        background: none;
        background-color: var(--background-1);
        color: var(--text-body-1);
        padding: 0;
        font: inherit;
        font-size: 24px;
        padding: 6px;
        cursor: pointer;
        outline: none;
        margin-top: 8px;
        display: inline-block;
        width: 12%;
        border-style: solid;
        border-color: var(--borders-1);
        border-width: 1px;
    }
</style>
