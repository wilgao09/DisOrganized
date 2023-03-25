import { app, BrowserWindow, ipcMain } from "electron";
import child from "child_process";

import config from "../config.json";
import path from "path"

config.resourcePath = __dirname + "/../"+config.resourcePath
process.env.HOST = "localhost";
process.env.PORT = "" + config.sveltePort
import svelteServer from "./svelteWebserver"


var goserver : child.ChildProcessWithoutNullStreams;


app.whenReady().then(() => {
    
    ipcMain.on("myelectronping", (e) => {
        console.log("myelectronpong")
    })

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
			contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
		},
    });


    

    console.log("???? spawn? at " + `${config.resourcePath}/server.exe`)
    const server = child.spawn(`${config.resourcePath}/server.exe`);
    server.stdout.on("data", (c) => {
        console.log(`server: ${c}`)
    })
    goserver = server

    console.log("spawn webserver")
    svelteServer();

    console.log("load page")
    win.loadURL(`http://localhost:${config.sveltePort}`);
    
});

