/**
 * A collection of functions that all plugins can access
 */

import { WSMessageCode } from "./wsutil";

export default function writePluginAPI() {
    window.pluginAPI = {
        createDeepCopy: (o) => {
            return JSON.parse(JSON.stringify(o));
        },

        sendDelta: (modified) => {
            window.boardSocket({
                msg: JSON.stringify(modified),
                msgType: WSMessageCode.DELTA,
            });
        },

        sendNew: (n) => {
            window.boardSocket({
                msg: JSON.stringify(n),
                msgType: WSMessageCode.CREATE,
            });
        },
    };
}
