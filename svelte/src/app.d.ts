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
            ping: () => void;
            getAvailableBoards: () => Promise<string[]>;
            openBoard: (name: string) => Promise<string>;
            createBoard: (name: string) => Promise<boolean>;
            deleteBoard: (name: string) => Promise<boolean>;
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
        onDeactivate: () => any;
        JSONtoSVG: (a: Object) => void;
    }

    interface SVGJSON {
        tag: string;
        id: number;
    }
}

window.electronAPI = window.electronAPI || {};

export {};
