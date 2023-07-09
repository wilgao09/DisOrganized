import { app, BrowserWindow, ipcMain } from "electron";
import child from "child_process";

import config from "../config.json";
import path from "path";

config.resourcePath =
    __dirname + "/../" + config.resourcePath;
process.env.HOST = "localhost";
process.env.PORT = "" + config.sveltePort;
import svelteServer from "./svelteWebserver";

var goserver: child.ChildProcessWithoutNullStreams;

app.commandLine.appendSwitch("ignore-certificate-errors");

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    ipcMain.on("myelectronping", (e) => {
        console.log("myelectronpong");
        win.webContents.send("myelectronpong", "UWU OWO");
    });

    goserver = child.spawn(
        `${config.resourcePath}/server.exe`,
        {
            stdio: ["pipe", "pipe", "pipe"],
        }
    );
    goserver.stdout.on("data", (c) => {
        // forward it to admin
        console.log("pass to admin");
        win.webContents.send("PrivilegedMessage", c);
    });

    ipcMain.on("PrivilegedMessage", (e, msg) => {
        //pass it to the server
        console.log("pass to server: " + msg);
        goserver.stdin.write(msg + "\n");
    });

    console.log("spawn webserver");
    svelteServer();

    console.log("load page");
    win.loadURL(`https://127.0.0.1:11326`);
});
