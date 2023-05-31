
interface SocketMessage {
    msgType: number;
    msg : string
}




export function opensocket(address : string, cb : (_:SocketMessage)=>void) : (_:SocketMessage)=>void{
    if (window === undefined || window.WebSocket === undefined) {
        throw new Error("Failed to find WebSocket constructor");
    }
    var ws = new WebSocket(address) //should be wss
    ws.onmessage = (ev) => {
        // get only the body
        let d = String(ev.data);
        if (d.length < 1) {
            throw new Error("Received message of size 0; aborting")
        }
        let m : SocketMessage= {
            msgType : d.charCodeAt(0) - 32,
            msg : d.substring(1)
        }
        cb(m);
    }
    return (nmsg : SocketMessage) => {
        let s = String.fromCharCode(nmsg.msgType + 32) + nmsg.msg;
        ws.send(s);
    }

}