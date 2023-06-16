import type InputManager from "./inputs";
import type PluginManager from "./plugins";
import { destIp, destPort } from "$lib/store";
import { get } from "svelte/store";

interface BoardConfigInternal {
    Plugins: string[];
    Keybinds: string[];
}

export default async function (
    p: PluginManager,
    kb: InputManager,
    cb: () => void
) {
    // fetch config first
    let config: BoardConfigInternal =
        // note that this is a replica of the internal struct used in Go
        // so the field names are in pascalcase and not in camel
        await (
            await fetch(
                `http://${get(destIp)}:${get(
                    destPort
                )}/config`
            )
        ).json();
    console.log(config);

    for (let i = 0; i < config.Plugins.length; i++) {
        let plugin = config.Plugins[i];
        loadPlugin(plugin, () => {
            // add it to the plugin handler and the input handler
            // TODO: UNSAFE-EVAL! think of a better way of doing this
            let t: PluginFn;
            t = eval(`new ${plugin}()`);
            console.log("new plugin made");
            console.log(t);
            p.addFn(t);
            if (config.Keybinds[i].length === 1) {
                kb.addKeyMapping(
                    config.Keybinds[i],
                    t.fnName
                );
            } else {
                p.activateFn(t.fnName);
            }
        });
    }
    cb();
}

function loadPlugin(name: string, cb: () => void) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `http://${get(destIp)}:${get(
        destPort
    )}/plugins/${name}.js`;
    script.onload = () => {
        cb();
    };
    script.onerror = () => {
        console.log("failed to get " + name);
    };
    document.head.appendChild(script);
}
