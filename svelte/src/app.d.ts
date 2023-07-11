// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface Platform {}
    }
    interface Window {
        electronAPI: {
            // provided by preload
            ping: () => void;
            getAvailableBoards: () => Promise<string[]>;
            openBoard: (name: string) => Promise<string>;
            createBoard: (name: string) => Promise<boolean>;
            deleteBoard: (name: string) => Promise<boolean>;
            loadSavedCanvas: () => Promise<{
                negX: number;
                negY: number;
                width: number;
                height: number;
                url: string;
            }>;
            saveCanvas: ({
                negX: number,
                negY: number,
                width: number,
                height: number,
                url: string,
            }) => void;
            setGetLocalCanvasURL: (
                cb: () => Promise<{
                    negX: number;
                    negY: number;
                    width: number;
                    height: number;
                    url: string;
                }>
            ) => void;
            kickUser: (uid: number) => void;
        };
        boardSocket: (msg: SocketMessage) => void;
    }

    interface Point {
        x: number;
        y: number;
    }

    interface PluginFn {
        offer: (d: any) => any;
        fnName: string;
        fnPrio: number;
        onActivate: () => any;
        onDeactivate: () => Promise<any>;
        JSONtoSVG: (a: Object) => void;
        onPause?: (x: number, y: number) => any;
    }

    interface SVGJSON {
        tag: string;
        id: number;
        menu: [string, () => void][];
        onmount: (() => void)[];
    }

    declare namespace svelte.JSX {
        interface HTMLAttributes<T> {
            ondefocus: () => void;
        }
    }
}

window.electronAPI = window.electronAPI || {};

export {};
