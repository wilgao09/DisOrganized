const { app, BrowserWindow } = require("electron");
const child = require("child_process");
const path = require("node:path");

const serverPath = path.join(__dirname, "server.exe");

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
    });

    win.loadFile("index.html");

    child.spawn(serverPath);
});
