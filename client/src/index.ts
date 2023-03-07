import { app, BrowserWindow } from "electron";
import child from "child_process";

import config from "../config.json";

config.resourcePath = __dirname + "/../"+config.resourcePath
process.env.HOST = "localhost";
process.env.PORT = "" + config.sveltePort
import svelteServer from "./svelteWebserver"




app.whenReady().then(() => {
    console.log("ready")
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
			contextIsolation: true,
		},
    });


    

    console.log("???? spawn? at " + `${config.resourcePath}/server.exe`)
    const server = child.spawn(`${config.resourcePath}/server.exe`);
    server.stdout.on("data", (c) => {
        console.log(`server: ${c}`)
    })

    console.log("spawn webserver")
    svelteServer();

    console.log("load page")
    win.loadURL(`http://localhost:${config.sveltePort}`);
    
});