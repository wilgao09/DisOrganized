import {
    addAlert,
    AlertType,
    UserAlerts,
} from "$lib/alerts";
import { writable, type Writable } from "svelte/store";

interface UserData {
    name: string;
    x: number;
    y: number;
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

    public addUser(id: number, name: string) {
        this.userMappings.set(id, {
            name: name,
            x: 0,
            y: 0,
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

    /**
     * THIS SHOULD ONLY BE CALLED WHEN SYNCING DATA
     * FOr new user entries or deltas, use addUser or movePointer
     *
     * The objective function is to sync with the server at regular times
     * Note that race conditions are possible with this
     * @param data an array of ids and names in string form
     *
     */
    public sync(data: string[]) {
        for (let i = 0; i < data.length; i += 2) {
            let t = this.userMappings.get(
                parseInt(data[i])
            );
            if (t === undefined || t.name !== data[i + 1]) {
                this.userMappings.set(parseInt(data[i]), {
                    name: data[i + 1],
                    x: 0,
                    y: 0,
                });
            }
        }
    }
}
