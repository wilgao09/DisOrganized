export enum WSMessageCode {
    MESSAGE = 0,
    FETCH = 1,
    CREATE = 2,
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
    oncomplete();
    return (nmsg: SocketMessage) => {
        let s =
            String.fromCharCode(nmsg.msgType + 32) +
            nmsg.msg;
        ws.send(s);
    };
}
