import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import style from './App.module.scss';
import { PositionEntity, SatelliteInfoEntity, TleWrapperDto } from '../dto';
import { useEffect, useRef, useState } from 'react';
import Globe from 'three-globe';
import * as THREE from 'three';
import { convertTo3DPath, formatTime, getCamera, getOrbitControls, getRenderer, getTimestampGMT, predictNextPosition } from '.';
import Typewriter from './Typewriter';

const MainPage = () => {
	const globeContainerRef = useRef<HTMLDivElement>(null);
	const [globe, setGlobe] = useState<Globe | null>(null);
	const [satelliteInfo, setSatelliteInfo] = useState<SatelliteInfoEntity | 0 | null>(null);
	let intervalId: NodeJS.Timeout | null = null;

	const initGlobe = async (renderer: any, camera: any) => {
		const scene = new THREE.Scene();
		const controls = getOrbitControls(camera, renderer.domElement)
 		if (globeContainerRef.current) {
			globeContainerRef.current.appendChild(renderer.domElement);
		}
		const geoData = await window.http.readGeo()
		const labelsData = [
			{
				title: 'Turkmenistan',
				lat: 40.1,
				lng: 58.6,
				alt: 0,
				size: 0.6,
				rad: 0,
				color: 'white',
			},
		];
		const globeInstance = new Globe()
			.globeImageUrl(`file:///${window.http.getAssetsPath()}/earth-blue-marble.jpg`)
			.polygonsData([geoData])
			.polygonCapColor(() => '#ffffff50')
			.polygonSideColor(() => '#fff')
			.polygonStrokeColor(() => '#fff')
			.polygonAltitude(0.002)
			.pathColor(() => ['#00FFFF', '#0000FF'])
			.pathStroke(3)
			.pathDashLength(0.02)
			.pathDashGap(0.005)
			.pathDashAnimateTime(64000)
			.pathTransitionDuration(0)
			.pathPointAlt(0.035)
			.pointColor('color')
			.pointAltitude('size')
			.pointRadius(0.4)
			.labelText((d) => d.title)
			.labelAltitude((d) => d.alt)
			.labelSize('size')
			.labelDotRadius((d) => d.rad)
			.labelsTransitionDuration(0)
			.labelColor('color')
			.labelsData(labelsData);
		scene.add(globeInstance);

		const ambientLight = new THREE.AmbientLight(0xffffff, 5);
		scene.add(ambientLight);

		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();

		setGlobe(globeInstance);
	};

	useEffect(() => {
		const renderer = getRenderer()
		const camera = getCamera()

		initGlobe(renderer, camera)

		const onWindowResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener('resize', onWindowResize, false);

		return () => {
			if (intervalId != null) clearInterval(intervalId)
			window.removeEventListener('resize', onWindowResize);
			renderer.dispose();
			if (globeContainerRef.current) {
				globeContainerRef.current.removeChild(renderer.domElement);
			}
		};
	}, []);

	const drawpath = (satelliteTle: TleWrapperDto) => {
		if (globe == null) return;
		const timestamp = getTimestampGMT();
		const gData: number[][][] = [];
		const pointData: any[] = [];
		const labelsData = [globe.labelsData()[0]];

		const predictedPositions: PositionEntity[] = [];
		for (let i = 0; i <= 3600; i++) {
			predictedPositions.push(predictNextPosition(satelliteTle.tle, timestamp + i));
		}

		setSatelliteInfo({
			satid: satelliteTle.info.satid,
			satname: satelliteTle.info.satname,
			satlatitude: predictedPositions[0].satlatitude,
			satlongitude: predictedPositions[0].satlongitude,
			velocity: predictedPositions[0].velocity,
			azimuth: predictedPositions[0].azimuth,
			elevation: predictedPositions[0].elevation,
			timestamp: predictedPositions[0].timestamp })

		gData.push(convertTo3DPath(predictedPositions));
		pointData.push({
			lat: predictedPositions[0].satlatitude,
			lng: predictedPositions[0].satlongitude,
			color: '#00FFFF',
			size: 0.05,
		});
		labelsData.push({
			title: satelliteTle.info.satname,
			lat: predictedPositions[0].satlatitude,
			lng: predictedPositions[0].satlongitude,
			alt: 0.04,
			size: 1.2,
			rad: 0.5,
			color: 'cyan',
		});
		globe.pathsData(gData);
		globe.labelsData(labelsData);
	};

	const init = async () => {
		setSatelliteInfo(null)
		try {
			const satelliteTle = await window.http.getSatelliteTle();
			window.http.setStore('tle', JSON.stringify(satelliteTle));
		} catch (_) {}
		const json = window.http.getStore('tle');
		if (json == '') {
			setSatelliteInfo(0);
			return;
		}
		const satelliteTle = JSON.parse(json);
		drawpath(satelliteTle);
		intervalId = setInterval(() => drawpath(satelliteTle), 5000);
	};

	useEffect(() => {
		init()
	}, [globe]);

	return (
		<div className={style.container}>
			<section>
				{satelliteInfo == null ?
					<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect fill='#00FFFF' stroke='#00FFFF' strokeWidth='10' width='30' height='30' x='25' y='85'><animate attributeName='opacity' calcMode='spline' dur='2' values='1;0;1;' keySplines='.5 0 .5 1;.5 0 .5 1' repeatCount='indefinite' begin='-.4'></animate></rect><rect fill='#00FFFF' stroke='#00FFFF' strokeWidth='10' width='30' height='30' x='85' y='85'><animate attributeName='opacity' calcMode='spline' dur='2' values='1;0;1;' keySplines='.5 0 .5 1;.5 0 .5 1' repeatCount='indefinite' begin='-.2'></animate></rect><rect fill='#00FFFF' stroke='#00FFFF' strokeWidth='10' width='30' height='30' x='145' y='85'><animate attributeName='opacity' calcMode='spline' dur='2' values='1;0;1;' keySplines='.5 0 .5 1;.5 0 .5 1' repeatCount='indefinite' begin='0'></animate></rect></svg>
				: (satelliteInfo == 0 ? <>
					<div>Connection failed.</div>
 					<button onClick={() => init()}>Try again</button>
 				</> : <>
					<div>Name:<br />NORAD ID:<br />Latitude:<br />Longitude:<br />Velocity:<br />Time:</div>
					<Typewriter lines={[satelliteInfo.satname, satelliteInfo.satid.toString(), satelliteInfo.satlatitude.toString(), satelliteInfo.satlongitude.toString(), satelliteInfo.velocity.toString() + ' km/s', formatTime(satelliteInfo.timestamp ?? 0)]}/>
				</>)}
			</section>
			<button onClick={() => window.http.openGit()}>
				{/* prettier-ignore */}
				<svg xmlns="http://www.w3.org/2000/svg" fill='currentColor' viewBox="0 0 48 48"><path d="M32 47c-2 .8-4.3 1.1-6.5 1a14 14 0 0 1-6.6-1c-.6-.6-1-1.3-1-2v-5.2c-8.4 1.9-10.1-4-10.1-4a8 8 0 0 0-3.4-4.4c-2.7-1.9.2-1.9.2-1.9 2 .3 3.7 1.5 4.6 3.2a6.4 6.4 0 0 0 8.8 2.5c.2-1.6.9-3 2-4-6.7-.8-13.8-3.4-13.8-15 0-3 1-6 3.1-8.1-1-2.6-.8-5.5.3-8 0 0 2.5-.8 8.3 3 5-1.3 10.2-1.3 15.1 0 5.8-3.8 8.4-3 8.4-3 1 2.5 1.2 5.4.3 8 2 2.2 3.1 5 3 8 0 11.7-7 14.2-13.7 15a7.2 7.2 0 0 1 2 5.6V45c0 .7-.3 1.5-1 2z"/></svg>
				v1.0.0 | 5hanazar
			</button>
			<div ref={globeContainerRef} className="globe-container"></div>
		</div>
	);
};

export default function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<MainPage />} />
			</Routes>
		</Router>
	);
}
