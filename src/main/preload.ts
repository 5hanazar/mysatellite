import { contextBridge, ipcRenderer } from 'electron';
import { TleWrapperDto } from '../dto';

const httpHandler = {
	getStore: (key: string): string => ipcRenderer.sendSync('getStore', key),
	setStore: (key: string, value: string): void => { ipcRenderer.sendSync('setStore', key, value) },
	getAssetsPath: (): string => ipcRenderer.sendSync('getAssetsPath'),
	getSatelliteTle: (): Promise<TleWrapperDto> => ipcRenderer.invoke('getSatelliteTle'),
	readGeo: (): Promise<any> => ipcRenderer.invoke('readGeo'),
	openGit: () => { ipcRenderer.invoke('openGit') }
};
contextBridge.exposeInMainWorld('http', httpHandler);
export type HttpHandler = typeof httpHandler;
