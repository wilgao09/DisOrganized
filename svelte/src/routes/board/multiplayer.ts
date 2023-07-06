import {
    addAlert,
    AlertType,
    UserAlerts,
} from "$lib/alerts";
import { writable, type Writable } from "svelte/store";

const userBrushFieldsStr = ["strokeStyle"] as const;
const userBrushFieldsNum = ["lineWidth"] as const;

export interface UserBrush {
    strokeStyle: string;
    lineWidth: number;
}

interface UserData {
    name: string;
    x: number;
    y: number;
    brush: UserBrush;
}

/**
 * Manages the movement and actions of other users on the board.
 * Note that the current user is expected to be included in this map.
 */
export default class MultiplayerManager {
    private userMappings: Map<number, UserData>;
    private colors: string[];

    public userMappingUpdate: Writable<number>;
    public userListUpdate: Writable<number>;

    private personalData: {
        name: string;
        id: number;
        cookie: string;
    };

    constructor() {
        this.userMappings = new Map<number, UserData>();
        this.userMappingUpdate = writable(0);
        this.userListUpdate = writable(0);
        this.colors = [
            "#000000",
            "#ff0000",
            "#00ff00",
            "#0000ff",
        ];

        this.personalData = {
            name: "UNNAMED",
            id: -1,
            cookie: "",
        };
    }

    private listUpdate() {
        this.userListUpdate.update((x) => x + 1);
        this.anyUpdate();
    }
    private anyUpdate() {
        this.userMappingUpdate.update((x) => x + 1);
    }

    public clearAll() {
        this.userMappings = new Map<number, UserData>();
        this.listUpdate();
    }

    public addSelf(
        id: number,
        cookie: string,
        name: string
    ) {
        this.personalData = {
            id: id,
            cookie: cookie,
            name: name,
        };
        this.userMappings.set(id, {
            name: name,
            x: 0,
            y: 0,
            brush: {
                strokeStyle: "#000000",
                lineWidth: 5,
            },
        });
        this.listUpdate();
    }

    public addUser(id: number, name: string) {
        this.userMappings.set(id, {
            name: name,
            x: 0,
            y: 0,
            brush: {
                strokeStyle: "#000000",
                lineWidth: 5,
            },
        });
        addAlert({
            type: AlertType.INFO,
            msg: `New user: ${name}`,
        });
        this.listUpdate();
    }

    public deleteUser(id: number) {
        this.userMappings.delete(id);
        addAlert({
            type: AlertType.INFO,
            msg: `User with id ${id} has left`,
        });
        this.listUpdate();
    }

    public cursorMoved(id: number, x: number, y: number) {
        let userdata = this.userMappings.get(id);
        if (userdata !== undefined) {
            userdata.x = x;
            userdata.y = y;
        }
        this.anyUpdate();
    }

    public getAllUserData(): ReadonlyMap<number, UserData> {
        return this.userMappings;
    }

    public setColorPalette(colors: string[]) {
        this.colors = colors;
    }

    public getColor(id: number): string {
        return this.colors[id % this.colors.length];
    }

    public setUserBrush(id: number, o: any) {
        if (Number.isNaN(id) || o === undefined) return;
        let ud = this.userMappings.get(id);
        if (ud === undefined) {
            return;
        } else {
            o = JSON.parse(o);
            for (let f of userBrushFieldsNum) {
                if (o[f] !== undefined) {
                    ud.brush[f] = parseFloat(o[f]);
                }
            }
            for (let f of userBrushFieldsStr) {
                if (o[f] !== undefined) {
                    ud.brush[f] = o[f];
                }
            }
        }
    }

    /**
     * THIS SHOULD ONLY BE CALLED WHEN SYNCING DATA
     * FOr new user entries or deltas, use addUser or movePointer
     *
     * The objective function is to sync with the server at regular times
     * Note that race conditions are possible with this
     * @param data an array of ids and names in string form
     *
     */
    // public sync(data: string[]) {
    //     for (let i = 0; i < data.length; i += 2) {
    //         let t = this.userMappings.get(
    //             parseInt(data[i])
    //         );
    //         if (t === undefined || t.name !== data[i + 1]) {
    //             this.userMappings.set(parseInt(data[i]), {
    //                 name: data[i + 1],
    //                 x: 0,
    //                 y: 0,
    //             });
    //         }
    //     }
    // }

    public getUserData(): Readonly<{
        name: string;
        id: number;
        cookie: string;
    }> {
        return this.personalData;
    }
}
