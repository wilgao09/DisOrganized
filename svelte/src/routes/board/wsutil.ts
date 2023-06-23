import type DrawingEngine from "./dengine";
import type MultiplayerManager from "./multiplayer";

// CHECK WSHANDLERS.GO
export enum WSMessageCode {
    MESSAGE,
    FETCH,
    CREATE,
    // MOVE = 3,
    DELTA,
    ADD_USER,
    DELETE_USER,
    DELTA_USER,
    GET_USERS,
    GET_USER_COLORS,
    POINTER_MOVED,
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
        // get only the body
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
        ws.send(s);
    };
}

export function defaultMessageHandler(
    de: DrawingEngine,
    mm: MultiplayerManager
) {
    return (m: SocketMessage) => {
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
                    // TODO: postprocessing by plugins
                    de.drawSVGJSON(someObj);
                }
                break;
            case WSMessageCode.CREATE:
                de.drawSVGJSON(JSON.parse(m.msg));
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
                    parseInt(data[1]),
                    parseInt(data[2])
                );
        }
    };
}
