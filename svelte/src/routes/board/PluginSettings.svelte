<script lang="ts">
    import ArrowBackButton from "$lib/components/ArrowBackButton.svelte";
    import SettingsMenuButton from "./SettingsMenuButton.svelte";
    import type PluginManager from "./plugins";

    export let pm: PluginManager;
    export let back: () => void;
    let displaying = "";
    let displayingSettings:
        | undefined
        | PluginSettings.IPluginSettings = undefined;
</script>

<!-- <div> -->
{#if displayingSettings === undefined}
    <ArrowBackButton {back} />
    <!-- display the possible plugins with settings -->
    {#each pm.getPluginsWithOptions() as fnName}
        <SettingsMenuButton
            name={fnName}
            on:click={() => {
                displaying = fnName;
                displayingSettings =
                    pm.getPluginOptionsByName(fnName);
            }}
        />
    {/each}
{:else}
    <!-- <div class="plugin-setting-container"> -->
    <ArrowBackButton
        back={() => {
            displayingSettings = undefined;
        }}
    />
    <div class="plugin-setting-head">
        Settings for {displaying}
        <hr />
    </div>
    <!-- display settings according to displaysettigs-->
    {#each Object.entries(displayingSettings) as [settingName, ps]}
        {#if ps.type === window.PluginSettings.PluginSettingType.SELECT}
            <div class="plugin-setting-label">
                {settingName}
                <select
                    on:change={(e) => {
                        ps.onValue(e.currentTarget.value);
                    }}
                >
                    {#each ps.options as op}
                        <option value={op[1]}
                            >{op[0]}</option
                        >
                    {/each}
                </select>
            </div>
        {:else}
            <div class="plugin-setting-label">
                {settingName}
                <div>
                    {#each ps.options as op}
                        <label class="plugin-setting-input">
                            <input
                                type={ps.type}
                                name={settingName}
                                value={op[1]}
                                on:change={(e) => {
                                    ps.onValue(
                                        e.currentTarget
                                            .value
                                    );
                                }}
                            />
                            {op[0]}
                        </label>
                    {/each}
                </div>
            </div>
        {/if}
    {/each}
    <!-- </div> -->
{/if}

<!-- </div> -->

<style>
    /* .plugin-setting-container {
        overflow-y: auto;
    } */
    .plugin-setting-head {
        font-size: 2em;
    }
    .plugin-setting-label {
        display: grid;
        grid-template-columns: 35% 55%;
        column-gap: 1%;
        font-size: 1.5em;
    }
    .plugin-setting-input {
        display: block;
    }
</style>
