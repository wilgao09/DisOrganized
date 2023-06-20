import { writable, type Writable } from "svelte/store";
import * as wsutil from "./wsutil";

export default class PluginManager {
    private fnorder: Array<PluginFn>;
    private fnnamemap: Map<string, [number, boolean]>; // index and active state

    // some components rely on state changes in plugins
    // whenever a change is made, this number gets incremented
    public newChange: Writable<number> = writable(0);

    public notifyChange() {
        this.newChange.update((x) => x + 1);
    }

    constructor(oldhandler?: PluginManager) {
        if (oldhandler) {
            this.fnorder = oldhandler.fnorder;
            this.fnnamemap = oldhandler.fnnamemap;
        } else {
            this.fnorder = [];
            this.fnnamemap = new Map();
        }
    }

    public addFn(p: PluginFn) {
        if (this.fnorder[p.fnPrio] !== undefined) {
            console.error(
                "panic: function priority collision"
            );
            return;
        }
        if (this.fnnamemap.get(p.fnName) !== undefined) {
            console.error("panic: function name collision");
            return;
        }

        this.fnorder[p.fnPrio] = p;
        this.fnnamemap.set(p.fnName, [p.fnPrio, false]);

        this.notifyChange();
    }

    public activateFn(s: string) {
        let k;
        if ((k = this.fnnamemap.get(s)) === undefined) {
            console.error(
                "panic: function name not found in activate"
            );
            return;
        }
        if (k[1] === true) {
            return;
        }
        k[1] = true;
        this.fnnamemap.set(s, k);
        this.notifyChange();
        return this.offer(
            this.fnorder[k[0]].onActivate(),
            k[0] + 1
        );
    }
    public deactivateFn(s: string): any {
        let k;
        if ((k = this.fnnamemap.get(s)) === undefined) {
            console.error(
                "panic: function name not found in deactivate"
            );
            return;
        }
        k[1] = false;
        this.fnnamemap.set(s, k);
        let j = this.fnorder[k[0]].onDeactivate();
        console.log(k);
        this.notifyChange();
        return this.offer(j, k[0] + 1);
    }

    // go through all active functions and chain data through them until you get an undefined or you reach the end
    // return the end result
    public offer(p: any, start?: number): any {
        let i: any = p;
        let t1, t2;
        for (
            let j = start ?? 0;
            j < this.fnorder.length && i !== undefined;
            j++
        ) {
            t1 = this.fnorder[j];
            // if this plugin is defined
            if (
                t1 === undefined ||
                this.fnnamemap.get(t1.fnName) === undefined
            ) {
                continue;
            }
            // if t1 is not active
            t2 = this.fnnamemap.get(t1.fnName);
            if (t2 === undefined || t2[1] === false) {
                continue;
            }
            //offer to t1
            i = t1.offer(i);
        }
        return i;
    }

    public getFunctionsStatus(): ReadonlyMap<
        string,
        [number, boolean]
    > {
        return this.fnnamemap;
    }

    public deactivateAndCommit(fname: string) {
        let m = this.deactivateFn(fname);
        window.boardSocket({
            msg: JSON.stringify(m),
            msgType: wsutil.WSMessageCode.CREATE,
        });
    }

    // TODO: some function to pass JSON fetched from the websocket
    // through all the plugins in case they need postprocessing
}
