// import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/kit/vite";

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
//     // Consult https://kit.svelte.dev/docs/integrations#preprocessors
//     // for more information about preprocessors
//     preprocess: vitePreprocess(),

//     kit: {
//         adapter: adapter(),
//     },
// };

// import adapter from "@ptkdev/sveltekit-electron-adapter";
import adapter from "@sveltejs/adapter-static";
// import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            strict: false, //TODO: this is suppressing a warning when running with sverdle (not that sverdle even works)
        }),
    },
};

export default config;
