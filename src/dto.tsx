export interface InfoDto {
	satname: string;
	satid: number;
	transactionscount: number;
}
export interface TleWrapperDto {
	info: InfoDto;
	tle: string;
}
export interface PositionEntity {
	satlatitude: number;
	satlongitude: number;
	sataltitude: number;
	azimuth: number;
	elevation: number;
	ra: number;
	dec: number;
	velocity: number;
	timestamp: number;
	eclipsed: boolean;
}
export interface SatelliteInfoEntity {
	satname: string;
	satid: number;
	satlatitude: number;
	satlongitude: number;
	velocity: number;
	azimuth: number;
	elevation: number;
	timestamp: number;
}
