import http from "http";
import finalhandler from "finalhandler";
import serveStatic from "serve-static";
import fs from "fs";

import config from "../config.json";

async function bootServer() {
    var serve = serveStatic(
        `${config.resourcePath}/svelte`,
        { index: ["index.html", "index.htm"] }
    );

    // Create server
    var server = http.createServer(function onRequest(
        req,
        res
    ) {
        console.log(req.url);
        serve(req, res, finalhandler(req, res));

        //   () => {
        //     res.statusCode = 200;
        //     res.setHeader("Content-Type", "text/html");

        //     const data = fs.readFileSync(
        //       `${config.resourcePath}/svelte/index.html`,
        //         "utf8"
        //     );
        //     res.end(data);
        // });
    });

    // Listen
    server.listen(config.sveltePort);
}

export default bootServer;
