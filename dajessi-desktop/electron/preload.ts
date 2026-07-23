import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  backup: () => ipcRenderer.invoke("db:backup"),
  backupTo: () => ipcRenderer.invoke("db:backup-to"),
  restore: () => ipcRenderer.invoke("db:restore"),
  getVersion: () => ipcRenderer.invoke("app:version"),
  onShortcutBackup: (callback: () => void) => {
    ipcRenderer.on("shortcut:backup", callback);
    return () => ipcRenderer.removeListener("shortcut:backup", callback);
  },
});
