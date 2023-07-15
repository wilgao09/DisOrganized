/**
 * A collection of functions that all plugins can access
 */

import type InputManager from "./inputs";
import { WSMessageCode } from "./wsutil";

export default function writePluginAPI(ih: InputManager) {
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

        openToEvents: (
            id: number,
            handlers: InputHandling.Handlers
        ) => {
            ih.setHandlers(id, handlers);
        },

        elementOfId: (id: number) => {
            return document.getElementById(
                `${id}-svg-item`
            ) as SVGGraphicsElement | null;
        },
    };
}
