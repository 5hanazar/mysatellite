<img src="https://github.com/5hanazar/mysatellite/blob/master/demo.jpg" width="100%" />

# MySatellite

A desktop application that displays a satellite's position and orbital path on an interactive 3D globe.</br>
This project is built using [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) as the foundation.</br>
It uses the [N2YO API](https://www.n2yo.com/) to fetch TLE data.

## Install

Clone the repo and install dependencies:

```bash
git clone https://github.com/5hanazar/mysatellite.git
npm install
```

Create a .env file in the root directory and provide the credentials:

```bash
n2yo_key = your_n2yo_api_key
norad_id = satellite_norad_id
```

## Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```
