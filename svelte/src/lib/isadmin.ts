import { browser } from "$app/environment";

export function isAdmin() {
    return browser && window.electronAPI !== undefined;
}
