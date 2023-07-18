import { writable, type Writable } from "svelte/store";
import * as wsutil from "./wsutil";
import { defaultBrush, type UserBrush } from "./usertypes";

export default class PluginManager {
    private fnorder: Array<PluginFn>;
    private fnnamemap: Map<string, [number, boolean]>; // index and active state

    // some components rely on state changes in plugins
    // whenever a change is made, this number gets incremented
    public newChange: Writable<number> = writable(0);
    private svgStyle: UserBrush;
    public notifyChange() {
        this.newChange.update((x) => x + 1);
    }

    constructor(oldhandler?: PluginManager) {
        if (oldhandler) {
            this.fnorder = oldhandler.fnorder;
            this.fnnamemap = oldhandler.fnnamemap;
            this.svgStyle = oldhandler.svgStyle;
        } else {
            this.fnorder = [];
            this.fnnamemap = new Map();
            this.svgStyle = defaultBrush;
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

    public activateFn(s: string): PluginProduct | void {
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
    public async deactivateFn(
        s: string
    ): Promise<PluginProduct | void> {
        let k;
        if ((k = this.fnnamemap.get(s)) === undefined) {
            console.error(
                "panic: function name not found in deactivate"
            );
            return;
        }
        k[1] = false;
        this.fnnamemap.set(s, k);
        let j = await this.fnorder[k[0]].onDeactivate();
        // console.log(k);
        this.notifyChange();
        return this.offer(j, k[0] + 1);
    }

    // go through all active functions and chain data through them until you get an undefined or you reach the end
    // return the end result
    public offer(
        p: any,
        start?: number
    ): PluginProduct | void {
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
        // TODO: a better criterion
        if (i !== undefined) {
            // if (i.style === undefined) i.style = "";
            i["fill"] = "rgba(0,0,0,0)";
            i[
                "stroke-width"
            ] = `${this.svgStyle.lineWidth}`;
            i["stroke"] = `${this.svgStyle.strokeStyle}`;
            // if there is an AABB, expand it so that it reaches brush
            if (i["AABB"] !== undefined) {
                i["AABB"][0] -= this.svgStyle.lineWidth;
                i["AABB"][1] -= this.svgStyle.lineWidth;
                i["AABB"][2] += 2 * this.svgStyle.lineWidth;
                i["AABB"][3] += 2 * this.svgStyle.lineWidth;
            }
        }
        return i;
    }

    public getFunctionsStatus(): ReadonlyMap<
        string,
        [number, boolean]
    > {
        return this.fnnamemap;
    }

    public commitObject(o: any) {
        if (Object.keys(o).length === 0) {
            return;
        }
        window.boardSocket({
            msg: JSON.stringify(o),
            msgType: wsutil.WSMessageCode.CREATE,
        });
    }

    public async deactivateAndCommit(
        fname: string,
        cb: (_: PluginProduct) => void
    ) {
        let m = await this.deactivateFn(fname);
        // deepcopy it, removing unessential data
        let copy = JSON.parse(JSON.stringify(m));
        delete copy.AABB;
        if (m !== undefined && m !== null) {
            this.commitObject(copy);
            cb(m);
        }
    }

    /**
     * Given arbitrary JSON, do some postprocessing
     * It is expected that o originates from teh same set of plugins that are currently loaded
     * @param o some json object
     */
    public JSONToSVG(o: any) {
        let rocopy = window.pluginAPI.createDeepCopy(o);
        if (o === undefined) return; //wtf?
        o.menu = [];
        o.onmount = [];
        for (let i = 0; i < this.fnorder.length; i++) {
            if (
                this.fnorder[i] !== undefined &&
                this.fnorder[i].JSONtoSVG !== undefined
            ) {
                this.fnorder[i].JSONtoSVG(o, rocopy);
            }
        }
        o.menu.push([
            "Delete",
            () => {
                window.boardSocket({
                    msg: `${o.id}`,
                    msgType: wsutil.WSMessageCode.DELETE,
                });
            },
        ]);
        return o;
    }

    // public pauseFn(name: string) {}

    public pauseAll({
        x,
        y,
    }: {
        x: number;
        y: number;
    }): any[] {
        let ans: any[] = [];
        for (let i = 0; i < this.fnorder.length; i++) {
            let n = this.fnorder[i];
            if (
                n !== undefined &&
                n.onPause !== undefined
            ) {
                let i = this.offer(n.onPause(x, y));
                if (i !== undefined) ans.push(i);
            }
        }

        return ans;
    }

    public setSVGStyle(b: UserBrush) {
        this.svgStyle = b;
    }

    public getPluginsWithOptions(): string[] {
        let ans: string[] = [];
        for (let [
            fnName,
            [ind, _],
        ] of this.fnnamemap.entries()) {
            if (this.fnorder[ind].settings !== undefined) {
                ans.push(fnName);
            }
        }
        return ans;
    }

    public getPluginOptionsByName(
        name: string
    ): PluginSettings.IPluginSettings | undefined {
        let ob = this.fnnamemap.get(name);
        if (ob === undefined) {
            return undefined;
        } else {
            return this.fnorder[ob[0]].settings;
        }
    }
}
