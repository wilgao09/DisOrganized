import { writable } from "svelte/store";

export const declName = writable(
    "Anon_" + Math.ceil(Math.random() * 10000)
);
export const destIp = writable("SECRETKEY");
export const destPort = writable(11326);
