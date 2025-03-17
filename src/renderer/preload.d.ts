import { HttpHandler } from '../main/preload';

declare global {
	interface Window {
		http: HttpHandler;
	}
}

export {};
