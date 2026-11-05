const { app, BrowserWindow, Tray, Menu, ipcMain, shell, Notification } = require("electron");
const path = require("path");

let mainWindow = null;
let tray = null;
let isQuitting = false;

const TARGET_URL = process.env.ELECTRON_START_URL || "https://deku-workspace.vercel.app";

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#111214",
    title: "Deku Workspace - Doanh Nghiệp & AI",
    icon: path.join(__dirname, "../public/logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    frame: true, // Native Windows title bar
    show: false,
  });

  // Load URL
  mainWindow.loadURL(TARGET_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Handle external links opening in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Minimize to Tray on close instead of exiting
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (Notification.isSupported()) {
        new Notification({
          title: "Deku Workspace đang chạy nền",
          body: "Ứng dụng tiếp tục nhận thông báo và cuộc gọi ở khay hệ thống.",
          icon: path.join(__dirname, "../public/logo.png"),
        }).show();
      }
      return false;
    }
  });

  // Grant WebRTC camera, mic, and screen permissions automatically
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ["media", "camera", "microphone", "notifications", "display-capture"];
    if (allowed.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "../public/logo.png");
  try {
    tray = new Tray(iconPath);
  } catch (err) {
    // If logo not available in suitable format, skip tray creation
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Mở Deku Workspace",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "Hôm nay & AI Trợ lý",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.loadURL(`${TARGET_URL}/base?tab=today`);
        }
      },
    },
    {
      label: "Phòng họp & Hội nghị",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.loadURL(`${TARGET_URL}/meetings`);
        }
      },
    },
    { type: "separator" },
    {
      label: "Thoát hoàn toàn",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Deku Workspace - Doanh Nghiệp & AI");
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Single Instance Lock (only 1 desktop instance running)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createMainWindow();
    createTray();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on("before-quit", () => {
    isQuitting = true;
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

// IPC Handlers
ipcMain.on("window:minimize", () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.on("window:maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.on("window:close", () => {
  if (mainWindow) mainWindow.close();
});
ipcMain.on("notification:send", (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || "Deku Workspace",
      body: body || "",
      icon: path.join(__dirname, "../public/logo.png"),
    }).show();
  }
});

