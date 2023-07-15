class Rect implements PluginFn {
    n: number;
    e: number;
    s: number;
    w: number;
    fnName: string;
    fnPrio: number;
    constructor() {
        this.n = 999;
        this.e = this.s = this.w = 0;

        this.fnName = "Rect";
        this.fnPrio = 0;
    }
    public onActivate() {
        this.n = 999;
        this.e = this.s = this.w = 0;
    }
    public offer(d: any) {
        if (
            d === undefined ||
            d.x === undefined ||
            d.y === undefined
        )
            return; // this kills the chain so if rect is active, we will only work towards building the rect

        d as {
            x: number;
            y: number;
        };
        d = {
            x: parseFloat(d.x),
            y: parseFloat(d.y),
        };
        if (this.n === 999) {
            this.n = this.s = d.y;
            this.w = this.e = d.x;
        }
        // TODO: this is a test plugin and assumes that the coordinate plane is flipped
        if (d.x < this.w) this.w = d.x;
        if (d.x > this.e) this.e = d.x;
        if (d.y < this.n) this.n = d.y;
        if (d.y > this.s) this.s = d.y;
    }

    public JSONtoSVG(a: SVGJSON, original: Readonly<any>) {
        if (a.tag === "rect") {
            a.menu.push([
                "Move right",
                () => {
                    // deepcopy the original
                    let nobj =
                        window.pluginAPI.createDeepCopy(
                            original
                        );
                    //modify as needed
                    nobj.x += 100;
                    //send back
                    window.pluginAPI.sendDelta(nobj);
                },
            ]);
            a.menu.push([
                "Move",
                () => {
                    let el = window.pluginAPI.elementOfId(
                        a.id
                    );
                    if (el === null) return;
                    let rect = el as SVGRectElement;
                    let origLocation: {
                        x: number;
                        y: number;
                    } = el.getBBox();
                    let cumDelta = { x: 0, y: 0 };
                    let last = { x: 0, y: 0 };
                    let wasUp = true;

                    window.pluginAPI.openToEvents(a.id, {
                        onAny: (ev) => {
                            if (
                                ev.type !==
                                InputHandling.InputEventType
                                    .KEY
                            ) {
                                if (ev.lift > 0 && wasUp) {
                                    last = ev;
                                    wasUp = false;
                                } else if (ev.lift > 0) {
                                    cumDelta.x +=
                                        ev.x - last.x;
                                    cumDelta.y +=
                                        ev.y - last.y;
                                    last = ev;
                                    rect.setAttributeNS(
                                        null,
                                        "x",
                                        `${
                                            origLocation.x +
                                            cumDelta.x
                                        }`
                                    );
                                    rect.setAttributeNS(
                                        null,
                                        "y",
                                        `${
                                            origLocation.y +
                                            cumDelta.y
                                        }`
                                    );
                                } else {
                                    wasUp = true;
                                }
                            }
                        },
                        onEnd: (ev) => {
                            console.log("move end");
                            let nobj =
                                window.pluginAPI.createDeepCopy(
                                    original
                                );
                            //modify as needed
                            nobj.x =
                                origLocation.x + cumDelta.x;
                            nobj.y =
                                origLocation.y + cumDelta.y;
                            //send back
                            window.pluginAPI.sendDelta(
                                nobj
                            );
                        },
                    });
                },
            ]);
        }
    }

    public onDeactivate() {
        return {
            tag: "rect",
            x: this.w,
            y: this.n,
            width: this.e - this.w,
            height: this.s - this.n,
        };
    }
}
