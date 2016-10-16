'use strict';
//const ipc = require('ipc');
const {ipcMain} = require('electron')
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let mainWindow = null;
let playWin = null;

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
app.on('ready', () => {
	mainWindow = new BrowserWindow({width: 1600, height: 1000});
	mainWindow.loadURL(`file://${__dirname}/retest.html`);
	mainWindow.on('closed', () => { mainWindow = null; });
	//console.log(dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']}))
});
app.on('browser-window-created',function(e,window) {
    //window.setMenu(null);
});
ipcMain.on('start',()=>{
	
	//console.log('playWin:'+playWin);
	//playWin.once('ready-to-show', () => {
	playWin = new BrowserWindow({
		width:(1600),height:(1000),x:0,y:0,show: true,parent:'top',frame:false,
		webPreferences: {
    		"allowDisplayingInsecureContent": true,
			"allowRunningInsecureContent":true,
			"webSecurity":false,
			"nodeIntegration": false
  		}
	});
	playWin.on('closed', () => { playWin = null; });
	playWin.setMenu(null);
	//playWin.show();
	
	playWin.loadURL('https://www.bahn.de/p/view/index.shtml',{userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'});
	//})
//	playWin.show();
});

ipcMain.on('resize',(event,w,h)=>{
	//playWin.setBounds({x:0,y:0,width:w,height:w});
});

ipcMain.on('click',(event,xcord,ycord)=>{
	playWin.webContents.sendInputEvent({type:'mouseDown', x:xcord, y: ycord, button:'left', clickCount: 1});
	setTimeout(()=>{
		playWin.webContents.sendInputEvent({type:'mouseUp', x:xcord, y: ycord, button:'left',clickCount: 1});
	},50)
});

ipcMain.on('type',(event,ch)=>{
      //const cc = (ch===100?'d':'ü');//
	  const cd = String.fromCharCode(ch).charAt(0);
	  // keydown
      playWin.webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: cd
      });

      // keypress
      playWin.webContents.sendInputEvent({
        type: 'char',
        keyCode: cd
      });

      // keyup
      playWin.webContents.sendInputEvent({
        type: 'keyUp',
        keyCode: cd
      });
});

ipcMain.on('move',(event,xcord,ycord)=>{
	playWin.webContents.sendInputEvent({type: 'mouseMove', x: xcord, y: ycord});
});

ipcMain.on('wheel',(event,xcord,ycord,delta)=>{
	playWin.webContents.sendInputEvent({type: 'mouseWheel', x: 0, y: 0, deltaX: 0, deltaY: -120,canScroll: true});
});

ipcMain.on('close',()=>{
	playWin.close();
});