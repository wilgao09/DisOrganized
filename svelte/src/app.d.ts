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
        /**
         * The window.electronAPI object is provided by preload.js in client/src
         * This object exposes "admin privileges", accessible only to the admin running in the electron app.
         * Under the hood, the entire electronAPI works by sending messages across pipes into the server
         */
        electronAPI: {
            // provided by preload
            /**
             * Fetch the available boards from the server
             * @returns {Promise<string[]>} an array of board names
             */
            getAvailableBoards: () => Promise<string[]>;
            /**
             * Tell the server to open a board
             * @param name The name of the board to open
             * @returns {string} Returns an empty string on success. On error, this returns a string with the error message
             */
            openBoard: (name: string) => Promise<string>;
            /**
             * Ask the server to create a board with the name `name`
             * @param name the name of the board to create
             * @returns true if it was successfully created; false otherwise
             */
            createBoard: (name: string) => Promise<boolean>;
            /**
             * Ask the server to delete a board with the name `name`
             * @param name the name of the board to delete
             * @returns true if it was successfully deleted; false otherwise
             */
            deleteBoard: (name: string) => Promise<boolean>;
            /**
             * Fetch the canvas from the currently open board. If there is no
             * associated canvas, it returns 0s and an empty url.
             * @returns an object providing the necessary details for the appears, size, and lcoation of the canvas
             */
            loadSavedCanvas: () => Promise<{
                negX: number;
                negY: number;
                width: number;
                height: number;
                url: string;
            }>;
            /**
             * Save a canvas to disk; associate it with the currently open board
             * @param param0 the canvas data
             * @returns undefined
             */
            saveCanvas: ({
                negX: number,
                negY: number,
                width: number,
                height: number,
                url: string,
            }) => void;
            /**
             * Set the getter for the local canvas
             * @param cb the callback that returns the canvas the admin currently has loaded
             * @returns undefined
             */
            setGetLocalCanvasURL: (
                cb: () => Promise<{
                    negX: number;
                    negY: number;
                    width: number;
                    height: number;
                    url: string;
                }>
            ) => void;
            /**
             * Kick a user by their id. If the user does not exist, or an error occurs, it fails silently
             * @param uid the uid of the user to kick
             * @returns undefined
             */
            kickUser: (uid: number) => void;
        };
        //
        /**
         * Send a message to the server over the websocket. All users have access to their own websocket
         * that uniquely identifies them.
         * @param {SocketMessage} msg the message to send. SocketMessage is a msg and a msgType
         * @returns undefined
         */
        boardSocket: (msg: SocketMessage) => void;
    }

    interface Point {
        x: number;
        y: number;
    }

    interface PluginFn {
        /**
         * Feed an object into this plugin. A plugin might return anything after
         * an `offer` call. If it returns anything that is not undefined or null,
         * it gets propagated into another plugin.
         * @param {any} d anything
         * @returns anything
         */
        offer: (d: any) => any;
        fnName: string;
        fnPrio: number;
        /**
         * Initializes plugin and allows the function to receive `offer` calls
         * @returns anything
         */
        onActivate: () => any;
        /**
         * Tells the plugin that it will receive no more input, and that it should
         * emit anything it has saved. This can be a promise
         * @returns anything
         */
        onDeactivate: () => Promise<any>;
        /**
         * Preprocess an object a, if applicable. This is done with the intention
         * that the object come from a plugin. The object is modified in place.
         * @param a an object from a plugin
         * @returns nothing
         */
        JSONtoSVG: (a: Object) => void;
        /**
         * Send a pause signal to a plugin. The plugin can emit an object
         * from pausing.
         * @param x the x coordinate of the cursor at the time of pausing
         * @param y the y coordinate at the time of pausing
         * @returns anything
         */
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
