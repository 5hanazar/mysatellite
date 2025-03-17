import { createRoot } from 'react-dom/client';
import App from './App';
import { PositionEntity } from '../dto';
import { eciToGeodetic, gstime, propagate, twoline2satrec } from 'satellite.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

export const convertTo3DPath = (positionData: PositionEntity[]): number[][] => {
	return positionData.map((pos) => [pos.satlatitude, pos.satlongitude, 0]);
};

const radToDeg = (rad: number): number => rad * (180 / Math.PI);
export const predictNextPosition = (tleString: string, timestamp: number): PositionEntity => {
	const line1 = tleString.split('\n')[0];
	const line2 = tleString.split('\n')[1];
	const satrec = twoline2satrec(line1, line2);

	const date = new Date(timestamp * 1000);
	var gmst = gstime(date);

	var positionAndVelocity = propagate(satrec, date);
	var positionEci = positionAndVelocity.position;
	var positionGd = eciToGeodetic(positionEci, gmst);

	const velocityEci = positionAndVelocity.velocity;
	const velocityMagnitude = Math.sqrt(
		velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2,
	);

	return {
		satlatitude: radToDeg(positionGd.latitude),
		satlongitude: radToDeg(positionGd.longitude),
		sataltitude: 0,
		azimuth: 0,
		elevation: 0,
		ra: 0,
		dec: 0,
		velocity: Math.round(velocityMagnitude * 100) / 100,
		timestamp: timestamp,
		eclipsed: false,
	};
};

export const getTimestampGMT = () => {
	return Math.round(Date.now() / 1000);
};
export const formatTime = (timestampGMT: number): string => {
	if (timestampGMT == 0) return '';
	const today = new Date((timestampGMT + 18000) * 1000);
	const yyyy = today.getUTCFullYear();
	const mm = today.getUTCMonth() + 1;
	const dd = today.getUTCDate();
	const hh = today.getUTCHours();
	const m = today.getUTCMinutes();

	let smm = mm.toString();
	let sdd = dd.toString();
	let shh = hh.toString();
	let sm = m.toString();

	if (mm < 10) smm = '0' + mm;
	if (dd < 10) sdd = '0' + dd;
	if (hh < 10) shh = '0' + hh;
	if (m < 10) sm = '0' + m;
	return sdd + '.' + smm + '.' + yyyy + ' ' + shh + ':' + sm + ' (UTC+5)';
};

export const getRenderer = () => {
	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setClearColor(0x000000);
	return renderer;
};
export const getOrbitControls = (camera: any, domElement: any) => {
	const controls = new OrbitControls(camera, domElement);
	controls.enableZoom = true;
	controls.rotateSpeed = 0.4;
	controls.minDistance = 120;
	controls.maxDistance = 210;
	controls.enablePan = false;
	return controls;
};
export const getCamera = () => {
	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000,
	);
	camera.position.z = 250;
	return camera;
};
