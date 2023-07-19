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

    function inputOfOption(
        settingName: string,
        type: PluginSettings.PluginSettingType,
        o: PluginSettings.IOption,
        cb: (s: string) => void
    ): HTMLElement {
        let inputel = document.createElement(
            "input"
        ) as HTMLInputElement;
        let lbl = document.createElement(
            "label"
        ) as HTMLLabelElement;
        inputel.type = type;
        inputel.addEventListener("change", (e) => {
            let str = (
                e.currentTarget as EventTarget &
                    HTMLInputElement
            ).value;
            cb(str);
        });

        switch (type) {
            case PluginSettings.PluginSettingType.CHECKBOX:
                inputel.value = o.value;
                inputel.name = settingName;
                inputel.checked = o.value === o.state;
                lbl.appendChild(inputel);
                lbl.appendChild(
                    document.createTextNode(`${o.name}`)
                );
                break;
            case PluginSettings.PluginSettingType.RADIO:
                inputel.value = o.value;
                inputel.name = settingName;
                inputel.checked = o.value === o.state;
                lbl.appendChild(inputel);
                lbl.appendChild(
                    document.createTextNode(`${o.name}`)
                );
                break;
            case PluginSettings.PluginSettingType.TEXT:
                inputel.value = o.state;
                inputel.placeholder = o.name;
                break;
            // WE DONT DO SELECT IN HERE
        }

        return lbl;
    }
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
                console.log(displayingSettings);
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
                        <option
                            value={op.value}
                            selected={op.state === op.value}
                            >{op.name}</option
                        >
                    {/each}
                </select>
            </div>
        {:else}
            <div class="plugin-setting-label">
                {settingName}
                <div>
                    {#each ps.options as op}
                        {inputOfOption(
                            settingName,
                            ps.type,
                            op,
                            ps.onValue
                        )}
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
