/**
 * Entry file into the electron app
 */

import { app, BrowserWindow, ipcMain } from "electron";
import child from "child_process";

import config from "../config.json";
import path from "path";

config.resourcePath =
    __dirname + "/../" + config.resourcePath;
import svelteServer from "./svelteWebserver";

var goserver: child.ChildProcessWithoutNullStreams;

// allow http connections in the BrowserWindow
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

    goserver = child.spawn(
        `${config.resourcePath}/server.exe`,
        {
            stdio: ["pipe", "pipe", "pipe"],
        }
    );
    // any messages that the electron thread gets should be forwarded
    // either to the server or the admin
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
    win.loadURL(`http://127.0.0.1:11326`);
});
