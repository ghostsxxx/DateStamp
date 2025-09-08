/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell } from 'electron';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import SettingsHandler from './ipc/settings-handler';
import PrinterHandler from './ipc/printer-handler';
import LoggerHandler from './ipc/logger-handler';
import { registerUpdaterHandlers } from './ipc/updater-handler';
import { registerAppHandlers } from './ipc/app-handler';
import logger from './services/logger';
import updaterService from './services/updater';

let mainWindow: BrowserWindow | null = null;
let settingsHandler: SettingsHandler | null = null;
let printerHandler: PrinterHandler | null = null;
let loggerHandler: LoggerHandler | null = null;

// Initialize IPC handlers
const initializeIpcHandlers = () => {
  settingsHandler = new SettingsHandler();
  printerHandler = new PrinterHandler();
  loggerHandler = new LoggerHandler();
  registerUpdaterHandlers();
  registerAppHandlers();
  logger.info('IPC handlers initialized');
};

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 480,
    fullscreen: true,
    autoHideMenuBar: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
    logger.info('Main window ready');
    
    // Initialize updater service
    if (process.env.NODE_ENV === 'production') {
      updaterService.initialize(mainWindow);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    logger.info('Main window closed');
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    // Log system info on startup
    logger.logSystemInfo();
    initializeIpcHandlers();
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch((error) => {
    logger.error('Application failed to start', error);
    console.log(error);
  });

app.on('before-quit', () => {
  logger.info('Application shutting down');
  // Cleanup IPC handlers
  if (settingsHandler) {
    settingsHandler.cleanup();
  }
  if (printerHandler) {
    printerHandler.cleanup();
  }
  if (loggerHandler) {
    loggerHandler.cleanup();
  }
  // Cleanup updater service
  updaterService.cleanup();
});
