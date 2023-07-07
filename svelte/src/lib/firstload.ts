import { writable } from "svelte/store";

export const loadingCompleted = writable(false);
// export const loadingProgress = writable(0);

// let eps = 0.001;

// loadingProgress.subscribe((v) => {
//     if (eps >= Math.abs(v - 1)) {
//         loadingCompleted.set(true);
//     }
// });
