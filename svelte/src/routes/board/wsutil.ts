import type DrawingEngine from "./dengine";
import type MultiplayerManager from "./multiplayer";
import type PluginManager from "./plugins";

// CHECK WSHANDLERS.GO
export enum WSMessageCode {
    MESSAGE,
    FETCH,
    CREATE,
    DELTA,
    DELETE,
    ADD_USER,
    DELETE_USER,
    DELTA_USER,
    GET_USERS,
    GET_USER_COLORS,
    POINTER_MOVED,
    GET_MY_DATA,
    SET_BRUSH,
    GET_BRUSH,
    BRUSH_DOWN,
    BRUSH_UP,
}

interface SocketMessage {
    msgType: WSMessageCode;
    msg: string;
}

// takes a connection url and a handler for all future connections
// returns a callback that sends messages over the connection
export function opensocket(
    address: string,
    cb: (_: SocketMessage) => void,
    oncomplete: () => void
): (_: SocketMessage) => void {
    if (
        window === undefined ||
        window.WebSocket === undefined
    ) {
        throw new Error(
            "Failed to find WebSocket constructor"
        );
    }
    // TODO: some sort of loading indicator, or a "asking permission" screen here
    var ws = new WebSocket(address); //should be wss
    ws.onmessage = (ev) => {
        let d = String(ev.data);
        if (d.length < 1) {
            throw new Error(
                "Received message of size 0; aborting"
            );
        }
        let m: SocketMessage = {
            msgType: d.charCodeAt(0) - 32,
            msg: d.substring(1),
        };
        cb(m);
    };
    ws.onopen = () => {
        oncomplete();
    };
    return (nmsg: SocketMessage) => {
        let s =
            String.fromCharCode(nmsg.msgType + 32) +
            nmsg.msg;
        // get only the body
        if (ws.readyState !== WebSocket.OPEN) {
            return; // silently discard
        }
        ws.send(s);
    };
}

export function defaultMessageHandler(
    pm: PluginManager,
    de: DrawingEngine,
    mm: MultiplayerManager
) {
    // require that the first message be a GET_MY_DATA message
    let gotData = false;
    // this callback is for handling incoming messages
    return (m: SocketMessage) => {
        if (
            !gotData &&
            m.msgType !== WSMessageCode.GET_MY_DATA
        ) {
            // if you havent gotten your data yet, and this message isnt about
            // your data, ignore it
            return;
        }
        let data;
        switch (m.msgType) {
            case WSMessageCode.MESSAGE:
                console.log(`New message: ${m.msg}`);
                break;
            case WSMessageCode.FETCH:
                de.clearAll();
                // TODO: needs to be trycaught
                let arrOfObj = JSON.parse(m.msg);
                for (let someObj of arrOfObj) {
                    de.drawSVGJSON(pm.JSONToSVG(someObj));
                }
                break;
            case WSMessageCode.CREATE:
                // de.drawSVGJSON(JSON.parse(m.msg));
                de.drawSVGJSON(
                    pm.JSONToSVG(JSON.parse(m.msg))
                );
                break;
            case WSMessageCode.DELETE:
                de.removeById(parseInt(m.msg));
                break;
            case WSMessageCode.ADD_USER:
                data = m.msg.split("\v");
                mm.addUser(parseInt(data[0]), data[1]);
                break;
            case WSMessageCode.DELETE_USER:
                mm.deleteUser(parseInt(m.msg));
                break;
            case WSMessageCode.GET_USERS:
                // clear all users and reload them
                mm.clearAll();
                data = m.msg.split("\v");
                for (let i = 0; i < data.length; i += 2) {
                    mm.addUser(
                        parseInt(data[i]),
                        data[i + 1]
                    );
                }
                break;
            case WSMessageCode.GET_USER_COLORS:
                data = m.msg.split("\v");
                mm.setColorPalette(data);
                break;
            case WSMessageCode.POINTER_MOVED:
                data = m.msg.split("\v");
                mm.cursorMoved(
                    parseInt(data[0]),
                    parseFloat(data[1]),
                    parseFloat(data[2])
                );
                break;
            case WSMessageCode.GET_MY_DATA:
                data = m.msg.split("\v");
                mm.addSelf(
                    parseInt(data[1]),
                    data[0],
                    data[2]
                );
                gotData = true;
                break;
            case WSMessageCode.SET_BRUSH:
                data = m.msg.split("\v");
                mm.setUserBrush(parseInt(data[0]), data[1]);
                break;
            case WSMessageCode.BRUSH_UP:
                mm.setUserDrawingState(
                    parseInt(m.msg),
                    false
                );
                break;
            case WSMessageCode.BRUSH_DOWN:
                mm.setUserDrawingState(
                    parseInt(m.msg),
                    true
                );
                break;
        }
    };
}
