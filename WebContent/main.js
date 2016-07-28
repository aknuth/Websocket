'use strict';
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let mainWindow = null;

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
app.on('ready', () => {
	mainWindow = new BrowserWindow({width: 1000, height: 800});
	mainWindow.loadURL(`file://${__dirname}/index.html`);
	mainWindow.on('closed', () => { mainWindow = null; });
	//console.log(dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']}))
});
app.on('browser-window-created',function(e,window) {
    window.setMenu(null);
});
