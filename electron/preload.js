const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  isElectron: true,
  platform: process.platform,
  version: "1.0.0",
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  sendNotification: (title, body) => ipcRenderer.send("notification:send", { title, body }),
  setBadgeCount: (count) => ipcRenderer.send("badge:set", count),
});

