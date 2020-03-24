const {app, BrowserWindow, screen, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

global.hidden = true;
function createWindow() {
  const {width, height} = screen.getPrimaryDisplay().workAreaSize;
  console.log(width, height);
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    frame: true,
    resizeable: false,
    transparent: true,
    // fullscreen: true,
    movable: false,
    minWidth: width,
    minHeight: height,
    hasShadow: false,
    useContentSize: true,
    x: width,
    y: height,
    kiosk: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true
    }
  });
  setTimeout(() => {
    mainWindow.hide();
  }, 300);
  // mainWindow.webContents.openDevTools({mode: 'detach' });
  mainWindow.loadFile("index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleonfullscreen: true });

  const ret = globalShortcut.register("CommandOrControl+Meta+H", () => {
/*if (mainWindow.isFocused() || mainWindow.isVisible()) {
      mainWindow.hide();
      // mainWindow.minimize();
      // mainWindow.blur();
      // mainWindow.setVisibleOnAllWorkspaces(false);
    } else {
      mainWindow.setKiosk(true);
      // mainWindow.setAlwaysOnTop(true);
      mainWindow.show();
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      mainWindow.moveTop();
      mainWindow.focusOnWebView();
      mainWindow.focus();
}
*/

    if (global.hidden) {
      mainWindow.setAlwaysOnTop(true);
      mainWindow.setKiosk(true);
      // mainWindow.setFullScreen(true);
      // mainWindow.setPosition(0, 0, false);
      // mainWindow.setSize(width, height, false);
      {/* mainWindow.setVisibleOnAllWorkspaces(true, { visibleonfullscreen: true }); */}
      // mainWindow.moveTop();
      // mainWindow.setkiosk(true);
      mainWindow.showInactive();
      // mainWindow.focus();
global.hidden = false;
      // mainWindow.setVisibleOnAllWorkspaces(true, { visibleonfullscreen: true });
      // // mainWindow.movetop();
      // mainWindow.focusonwebview();
    } else {
      // mainWindow.hide();
      // mainWindow.blur();
      // mainWindow.setFullScreen(false);
mainWindow.hide();
global.hidden = true;
    mainWindow.webContents.send('repaint');
      // mainWindow.setKiosk(false);
      // mainWindow.setPosition(width, height, false);
      // mainWindow.blur();
      // mainWindow.blur();
      // mainWindow.setvisibleonallworkspaces(false);
    }
  });

  if (!ret) {
    console.log('gloabl shortcut registration failed')
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered("CommandOrControl+Meta+H"))

  // mainWindow.show();
}

const { ipcMain } = require( "electron" );

ipcMain.on("setGlobalVariable", (event, myGlobalVariableValue) => {
// global.myGlobalVariable = myGlobalVariableValue;
  global = {...global, ...myGlobalVariableValue };
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);
app.on("ready", () => setTimeout(createWindow, 500));

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
});
