import { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } from "electron";
import path from "path";
import fs from "fs";

const isDev = process.env.NODE_ENV === "development";
const SERVER_PORT = 4310;

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// ---------------------------------------------------------------------------
// Database location: always inside the OS "userData" folder so it survives
// app updates and is never bundled read-only inside the installed app.
// ---------------------------------------------------------------------------
function getDatabasePath(): string {
  const userDataDir = app.getPath("userData");
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
  return path.join(userDataDir, "dajessi.db");
}

function getBackupsDir(): string {
  const dir = path.join(app.getPath("userData"), "backups");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function startEmbeddedServer(): Promise<void> {
  const dbPath = getDatabasePath();
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.JWT_SECRET = process.env.JWT_SECRET || "dajessi-local-desktop-secret-change-me";
  process.env.PORT = String(SERVER_PORT);
  process.env.DAJESSI_PACKAGED = app.isPackaged ? "1" : "0";

  // The compiled Express server exports a `startServer()` bootstrap function
  // that runs pending Prisma migrations, seeds defaults on first run, then
  // starts listening. Running it in-process (instead of a child process)
  // keeps packaging simple: everything ships as a single Node/Electron app.
  const serverEntry = isDev
    ? path.join(__dirname, "..", "dist-server", "index.js")
    : path.join(process.resourcesPath, "dist-server", "index.js");

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { startServer } = require(serverEntry);
  await startServer();
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    webPreferences: { contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, "splash.html"));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: "DaJEssI Business",
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    splashWindow?.close();
    splashWindow = null;
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open external links in the OS browser, never inside the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Fichier",
      submenu: [
        {
          label: "Sauvegarder la base de données",
          accelerator: "CmdOrCtrl+B",
          click: () => mainWindow?.webContents.send("shortcut:backup"),
        },
        { type: "separator" },
        { label: "Quitter", accelerator: "CmdOrCtrl+Q", click: () => app.quit() },
      ],
    },
    {
      label: "Affichage",
      submenu: [
        { label: "Plein écran", accelerator: "F11", click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) },
        { role: "reload", label: "Actualiser" },
        { type: "separator" },
        { role: "zoomIn", label: "Zoom +" },
        { role: "zoomOut", label: "Zoom -" },
        { role: "resetZoom", label: "Zoom réinitialisé" },
      ],
    },
    {
      label: "Aide",
      submenu: [
        {
          label: "À propos de DaJEssI Business",
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: "info",
              title: "À propos",
              message: "DaJEssI Business",
              detail: `Version ${app.getVersion()}\nLogiciel de gestion de collecte de riz\n100% hors-ligne — DaJEssy'Varotra`,
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createTray() {
  try {
    tray = new Tray(path.join(__dirname, "..", "build", "icon.ico"));
    tray.setToolTip("DaJEssI Business");
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: "Ouvrir", click: () => mainWindow?.show() },
        { label: "Quitter", click: () => app.quit() },
      ])
    );
    tray.on("click", () => mainWindow?.show());
  } catch {
    // Tray icon is optional — do not crash the app if the platform/icon is unavailable.
  }
}

// ---------------------------------------------------------------------------
// IPC: backup / restore, save dialogs used by the renderer for DB management.
// ---------------------------------------------------------------------------
ipcMain.handle("db:backup", async () => {
  const dbPath = getDatabasePath();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(getBackupsDir(), `dajessi-backup-${stamp}.db`);
  fs.copyFileSync(dbPath, dest);
  return dest;
});

ipcMain.handle("db:backup-to", async () => {
  const dbPath = getDatabasePath();
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, {
    title: "Enregistrer la sauvegarde",
    defaultPath: `dajessi-backup-${Date.now()}.db`,
    filters: [{ name: "Base de données", extensions: ["db"] }],
  });
  if (canceled || !filePath) return null;
  fs.copyFileSync(dbPath, filePath);
  return filePath;
});

ipcMain.handle("db:restore", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
    title: "Restaurer une sauvegarde",
    filters: [{ name: "Base de données", extensions: ["db"] }],
    properties: ["openFile"],
  });
  if (canceled || filePaths.length === 0) return null;
  const dbPath = getDatabasePath();
  fs.copyFileSync(filePaths[0], dbPath);
  return filePaths[0];
});

ipcMain.handle("app:version", () => app.getVersion());

app.whenReady().then(async () => {
  createSplashWindow();
  buildMenu();
  createTray();
  try {
    await startEmbeddedServer();
  } catch (err) {
    console.error("Échec du démarrage du serveur local :", err);
    dialog.showErrorBox("Erreur de démarrage", "Impossible de démarrer la base de données locale. Voir les journaux pour plus de détails.");
  }
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
