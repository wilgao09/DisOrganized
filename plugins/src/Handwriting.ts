// pull tesseract js

//<script src=''></script>
class Handwriting implements PluginFn {
    x0: null | number;
    y0: null | number;
    xf: null | number;
    yf: null | number;
    points: [number[], number[]][];
    fnName: string;
    fnPrio: number;
    constructor() {
        this.x0 = null;
        this.y0 = null;
        this.xf = null;
        this.yf = null;

        this.points = [[[], []]];
        this.fnName = "Handwriting";
        this.fnPrio = 5;
        console.log("initialized handwriting");
        console.log(this.points);
    }

    public offer(o: any) {
        if (
            o.x !== undefined &&
            o.y !== undefined &&
            o.x !== null &&
            o.y != null &&
            !Number.isNaN(parseFloat(o.x)) &&
            !Number.isNaN(parseFloat(o.y))
        ) {
            o as {
                x: number;
                y: number;
            };
            o.x = parseFloat(o.x);
            o.y = parseFloat(o.y);
            this.points[this.points.length - 1][0].push(
                o.x
            );
            this.points[this.points.length - 1][1].push(
                o.y
            );

            if (this.x0 === null) {
                this.x0 = this.xf = o.x;
                this.y0 = this.yf = o.y;

                return;
            }
            if (o.x < this.x0) this.x0 = o.x;
            if (o.y < this.y0) this.y0 = o.y;
            if (o.x > this.xf) this.xf = o.x;
            if (o.y > this.yf) this.yf = o.y;
        }
    }

    public onActivate() {
        this.x0 = null;
        this.y0 = null;
        this.xf = null;
        this.yf = null;
        this.points = [[[], []]];
    }
    public async onDeactivate() {
        if (this.x0 === null) return;

        let dx = this.x0 - (this.xf - this.x0);
        let dy = this.y0 - (this.yf - this.y0);

        let w = this.xf - this.x0;
        let h = this.yf - this.y0;

        for (let i = 0; i < this.points.length; i++) {
            //for all strokes
            let s = this.points[i];
            // for all x coords
            for (let xi = 0; xi < s[0].length; xi++) {
                this.points[i][0][xi] -= dx;
            }
            //for all y coords
            for (let yi = 0; yi < s[1].length; yi++) {
                this.points[i][1][yi] -= dy;
            }
        }

        return this.send(
            this.x0,
            this.y0,
            w,
            h,
            this.points
        );
    }
    public onPause() {
        this.points.push([[], []]);
    }
    public JSONtoSVG(o: any) {
        if (
            o.tag === "text" &&
            o.height !== undefined &&
            o.width !== undefined
        ) {
            let w = o.width;
            let h = o.height;
            o.onmount.push((e: SVGElement) => {
                let el = e as SVGGraphicsElement;
                var bb = el.getBBox();
                var widthTransform = w / bb.width;
                var heightTransform = h / bb.height;
                // var value =
                //     widthTransform < heightTransform
                //         ? widthTransform
                //         : heightTransform;
                // el.setAttribute("y", `${y}`);
                el.setAttribute(
                    "transform-origin",
                    `${o.x} ${o.y}`
                );
                el.setAttribute(
                    "transform",
                    `matrix(${widthTransform}, 0, 0, ${
                        1.5 * heightTransform
                    }, 0, ${h})`
                );
                el.setAttribute(
                    "fill",
                    el.getAttribute("stroke")
                );
                el.setAttribute("stroke-width", "0");
                // if (el.getAttribute("style") !== "") {
                //     el.setAttribute(
                //         "style",
                //         el.getAttribute("style") +
                //             ";" +
                //             "font: sans-serif;"
                //     );
                // } else {
                //     el.setAttribute(
                //         "style",
                //         "font:  sans-serif;"
                //     );
                // }
            });

            delete o.width;
            delete o.height;
        }
    }

    // credit to ChenYuHo's handwriting.js
    private send(
        x: number,
        y: number,
        width: number,
        height: number,
        points: [number[], number[]][]
    ) {
        var data = JSON.stringify({
            options: "enable_pre_space",
            requests: [
                {
                    writing_guide: {
                        writing_area_width: width,
                        writing_area_height: height,
                    },
                    ink: points,
                    language: "en",
                },
            ],
        });
        var xhr = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhr.addEventListener(
                "readystatechange",
                function () {
                    if (this.readyState === 4) {
                        switch (this.status) {
                            case 200:
                                var response = JSON.parse(
                                    this.responseText
                                );
                                resolve({
                                    tag: "text",
                                    x: `${x}`,
                                    y: `${y}`,
                                    textContent:
                                        response[1][0][1][0],
                                    width: width,
                                    height: height,
                                });
                                break;
                            case 403:
                                //access denied
                                break;
                            case 503:
                                //cannot connect to recognition server
                                break;
                        }
                    }
                }
            );
            xhr.open(
                "POST",
                "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8"
            );
            xhr.setRequestHeader(
                "content-type",
                "application/json"
            );
            xhr.send(data);
        });
    }
}
