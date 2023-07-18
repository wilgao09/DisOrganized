<script lang="ts">
    import type PluginManager from "./plugins";

    export let pm: PluginManager;
    let displayingSettings:
        | undefined
        | PluginSettings.IPluginSettings = undefined;
</script>

{#if displayingSettings === undefined}
    <!-- display the possible plugins with settings -->
    {#each pm.getPluginsWithOptions() as fnName}
        <button
            on:click={() => {
                displayingSettings =
                    pm.getPluginOptionsByName(fnName);
            }}
        >
            {fnName}
        </button>
    {/each}
{:else}
    <!-- display settings according to displaysettigs-->
    {#each Object.entries(displayingSettings) as [settingName, ps]}
        {#if ps.type === window.PluginSettings.PluginSettingType.SELECT}
            <label
                >{settingName}
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
            </label>
        {:else}
            {#each ps.options as op}
                <label>
                    {op[0]}
                    <input
                        type={ps.type}
                        name={settingName}
                        value={op[1]}
                        on:change={(e) => {
                            ps.onValue(
                                e.currentTarget.value
                            );
                        }}
                    />
                </label>
            {/each}
        {/if}
    {/each}
{/if}
