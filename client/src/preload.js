const { contextBridge, ipcRenderer } = require("electron");

const chan = "PrivilegedMessage";
// this is ported into the global space, but should be
// hidden from teh svelte stuff
const ea = {
    chan: "PrivilegedMessage",
    commands: {
        CLOSE_SERVER: 0,
        ACCEPT_USER: 1,
        REJECT_USER: 2,
        WORKING_DIRECTORY: 3,
        AVAILABLE_BOARDS: 4,
        CREATE_BOARD: 5,
        OPEN_BOARD: 6,
        CLOSE_BOARD: 7,
        DELETE_BOARD: 8,
        CANVAS_URL: 9,
    },
    fns: {
        encode: (cmd, str = "") =>
            String.fromCharCode(32 + cmd) + str,
        decode: (str) => [
            str.charCodeAt(0) - 32,
            // remove the command byte and the newline
            str.slice(1, str.length - 1),
        ],
    },
    queue: {
        curcmd: -1,
        currcb: () => {},
        q: [],
        send: (cmd, str, sendprom = false) => {
            let cb = () => {};
            let tor = sendprom
                ? new Promise((resolve, reject) => {
                      cb = (data) => {
                          resolve(data);
                      };
                  })
                : undefined;
            ea.queue.q.push([cmd, str, cb]);
            console.log("the curcmd is " + ea.queue.curcmd);
            if (ea.queue.curcmd === -1) {
                console.log("IMMEDIATELY SENDING MESSAGE");
                ea.queue.__sendNext();
            }
            console.log("returning");
            return tor;
        },
        fulfill: (cmd, str) => {
            if (cmd !== ea.queue.curcmd) {
                return false;
            }
            ea.queue.currcb(str);
            ea.queue.__sendNext();
            return true;
        },
        __sendNext: () => {
            if (ea.queue.q.length === 0) {
                ea.queue.curcmd = -1;
                console.log("nothing to do");
                return; // nothing to do
            }

            let b;
            [ea.queue.curcmd, b, ea.queue.currcb] =
                ea.queue.q.shift();
            console.log("sending");
            ipcRenderer.send(
                chan,
                ea.fns.encode(ea.queue.curcmd, b)
            );
            // if theres no need to wait for this to finish
            if (ea.queue.currcb.toString() === "() => {}") {
                // TODO: very dangerous; io streams
                // can easily get flooded
                ea.queue.__sendNext();
            }
        },
    },
};

let getLocalCanvasURL = () => {
    return {
        negX: 0,
        negY: 0,
        width: 0,
        height: 0,
        url: "",
    };
};

contextBridge.exposeInMainWorld("electronAPI", {
    ping: () => ipcRenderer.send("myelectronping"),
    getAvailableBoards: () => {
        return ea.queue
            .send(ea.commands.AVAILABLE_BOARDS, "", true)
            .then((res) => {
                return res.split("\v");
            });
    },
    openBoard: (name) => {
        return ea.queue.send(
            ea.commands.OPEN_BOARD,
            name,
            true
        );
    },
    createBoard: (name) => {
        return ea.queue
            .send(ea.commands.CREATE_BOARD, name, true)
            .then((res) => {
                if (res == "1") {
                    return true;
                } else {
                    return false;
                }
            });
    },
    deleteBoard: (name) => {
        return ea.queue
            .send(ea.commands.DELETE_BOARD, name, true)
            .then((res) => {
                if (res == "1") {
                    return true;
                } else {
                    return false;
                }
            });
    },
    loadSavedCanvas: () => {
        return ea.queue
            .send(ea.commands.CANVAS_URL, "", true)
            .then((d) => {
                let p = d.split("\v");
                if (p.length !== 5) {
                    return {
                        negX: 0,
                        negY: 0,
                        width: 0,
                        height: 0,
                        url: "",
                    };
                }
                return {
                    negX: parseFloat(p[0]),
                    negY: parseFloat(p[1]),
                    width: parseFloat(p[2]),
                    height: parseFloat(p[3]),
                    url: p[4],
                };
            });
    },

    saveCanvas: ({ negX, negY, width, height, url }) => {
        ea.queue.send(
            ea.commands.CANVAS_URL,
            `${negX}\v${negY}\v${width}\v${height}\v${url}`
        );
    },

    setGetLocalCanvasURL: (cb) => {
        getLocalCanvasURL = cb;
    },
});

// filled in by svelte app

// receiving end in the realworld
ipcRenderer.on("myelectronpong", (ev, msg) => {
    console.log(msg);
});

ipcRenderer.on(chan, (ev, msg) => {
    let cmd, bod;
    msg = new TextDecoder().decode(msg);
    console.log(msg);
    [cmd, bod] = ea.fns.decode(msg);
    // if this is a resposne to a question, it gets fulfilled
    if (!ea.queue.fulfill(cmd, bod)) {
        // TODO: these are requests originating from teh server
        console.log(`${cmd}: ${bod}`);
        //THIS IS TEMPORARY; WE MUST MIGRATE THIS TO BE BETTER

        if (cmd == ea.commands.ACCEPT_USER) {
            if (confirm(bod)) {
                ea.queue.send(ea.commands.ACCEPT_USER);
            } else {
                ea.queue.send(ea.commands.REJECT_USER);
            }
        } else if (cmd === ea.commands.CANVAS_URL) {
            // if the server is asking us
            // the server wants a fresh copy
            getLocalCanvasURL()
                .then((dataobj) => {
                    ea.queue.send(
                        ea.commands.CANVAS_URL,
                        `${dataobj.negX}\v${dataobj.negY}\v${dataobj.width}\v${dataobj.height}\v${dataobj.url}`
                    );
                })
                .catch(() => {
                    ea.queue.send(
                        ea.commands.CANVAS_URL,
                        "0\v0\v0\v0\v"
                    );
                });
        }
    }
});
