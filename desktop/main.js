const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Gestionale Convert',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    const rendererDevUrl = process.env.ELECTRON_RENDERER_URL;
    if (rendererDevUrl) {
        win.loadURL(rendererDevUrl);
        return;
    }

    win.loadFile(path.join(__dirname, 'renderer', 'dist', 'index.html'));
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('print:page', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
        return { success: false, error: 'Finestra non disponibile.' };
    }

    return new Promise((resolve) => {
        win.webContents.print({ printBackground: true }, (success, failureReason) => {
            resolve({ success, error: failureReason || null });
        });
    });
});

ipcMain.handle('print:save-pdf', async (event, defaultName = 'anagrafica.pdf') => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
        return { success: false, error: 'Finestra non disponibile.' };
    }

    const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Salva anagrafica in PDF',
        defaultPath: defaultName,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) {
        return { success: false, canceled: true };
    }

    const pdf = await win.webContents.printToPDF({ printBackground: true });
    fs.writeFileSync(filePath, pdf);

    return { success: true, filePath };
});
