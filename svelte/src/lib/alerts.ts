import { writable, type Writable } from "svelte/store";

export enum AlertType {
    SUCCESS,
    INFO,
    WARNING,
    ERROR,
}

// TODO: rewrite this so that it can support dialog options

export interface UserAlert {
    type: AlertType;
    msg: string;
    // TODO: clickable buttons; for now, it will jsut be an x
}

export const UserAlerts: Writable<UserAlert[]> = writable(
    []
);

export function addAlert(x: UserAlert) {
    UserAlerts.update((currqueue) => {
        currqueue.push(x);
        return currqueue;
    });
}

export function removeAlert(index: number) {
    UserAlerts.update((currqueue) => {
        currqueue.splice(index, 1);
        return currqueue;
    });
}
