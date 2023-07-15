declare global {
    interface Window {
        pluginAPI: {
            createDeepCopy: (
                original: Readonly<any>
            ) => any;
            sendDelta: (modified: any) => void;
            sendNew: (newObj: any) => void;
            openToEvents: (
                id: number,
                handlers: InputHandling.Handlers
            ) => void;
            elementOfId: (
                id: number
            ) => SVGGraphicsElement | null;
        };
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
        onDeactivate: () => Promise<any> | any;
        /**
         * Preprocess an object a, if applicable. This is done with the intention
         * that the object come from a plugin. The object is modified in place.
         * @param a an object from a plugin that gets modified
         * @param original the original object produced by the plugins
         * @returns nothing
         */
        JSONtoSVG: (
            a: SVGJSON,
            original: Readonly<any>
        ) => void;
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
        [key: string]: any;
    }
    namespace InputHandling {
        enum InputEventType {
            MOUSE = "mouse",
            PEN = "pen",
            TOUCH = "touch",
            KEY = "key",
        }
        enum UserActions {
            SELECT = "select",
            DRAW = "draw",
            PAN = "pan",
            TYPE = "type", // TODO: ???
            NONE = "none", // NONE is used to represent null
        }
        interface InputEvent {
            type: InputEventType;
            action: UserActions;
            value: string;
            target: Element;
            /**
             * A number denoting how hard the user is pressing.
             * Unlike normal pressure values, this will be -1
             * when the user releases the device
             */
            lift: number;
            x: number;
            y: number;
        }
        interface Handlers {
            // onPointerDown?: (ev: InputEvent) => void;
            // onPointerMove?: (ev: InputEvent) => void;
            // onPointerUp?: (ev: InputEvent) => void;
            // onKeyDown?: (ev: InputEvent) => void;
            // onKeyUp?: (ev: InputEvent) => void;
            onAny?: (ev: InputEvent) => void;
            onEnd?: (ev: InputEvent) => void;
        }
    }
}

// window.pluginAPI = window.pluginAPI || {};
export {};
