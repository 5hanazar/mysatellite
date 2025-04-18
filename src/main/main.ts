import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { TleWrapperDto } from '../dto';
import dotenv from 'dotenv';
dotenv.config()
const fs = require('fs');
import Store from 'electron-store';
const store = new Store();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../../assets');
const getAssetPath = (...paths: string[]): string => { return path.join(RESOURCES_PATH, ...paths); };

if (isDebug) {
  require('electron-debug')();
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      webSecurity: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });
  mainWindow.setMenuBarVisibility(isDebug);

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
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

const getFetch = async (url: string, cookie: string) => {
	return new Promise<string>((resolve, reject) => {
		const { net } = require('electron');
		const request = net.request({
			method: 'GET',
			url: `${url}`,
		});
		request.setHeader('Accept', 'application/json');
		request.setHeader('Cookie', cookie);
		request.on('error', (err) => {
			reject(err);
			return;
		});
		request.on('response', (response) => {
			if (response.statusCode != 200) {
				reject(response.statusCode);
				return;
			}
			const data: any = [];
			response.on('data', (chunk) => {
				data.push(chunk);
			});
			response.on('end', () => {
				const result = Buffer.concat(data).toString();
				resolve(result);
			});
		});
		request.end();
	});
};

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
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
	ipcMain.on('getStore', (event, key: string) => {
		const v = store.get(key, '');
		event.returnValue = v
	});
	ipcMain.on('setStore', (event, key: string, value: string) => {
		store.set(key, value);
		event.returnValue = '';
	});
	ipcMain.on('getAssetsPath', (event) => {
		event.returnValue = RESOURCES_PATH;
	});
	ipcMain.handle('getSatelliteTle', async () => {
		const json = await getFetch(`https://api.n2yo.com/rest/v1/satellite/tle/${process.env.norad_id}&apiKey=${process.env.n2yo_key}`, '')
		if (json.includes('error')) throw new Error();
		const result: TleWrapperDto = JSON.parse(json);
		return result;
	});
	ipcMain.handle('readGeo', () => {
		const data = fs.readFileSync(getAssetPath('turkmenistan.geojson'));
		return JSON.parse(data);
	});
	ipcMain.handle('openGit', (_) => {
		shell.openExternal("https://github.com/5hanazar")
	});
  })
  .catch(console.log);
