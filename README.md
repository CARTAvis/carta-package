## Files required to create the Electron Desktop versions of CARTA

The desktop versions of CARTA use [Electron](https://www.electronjs.org/) to display the carta-frontend HTML and start up the carta-backend.
On MacOS we package it as a normal signed Mac application. 
On Linux (Ubuntu and RHEL) we package it into an [AppImage](https://appimage.org/).

## MacOS

Brief instructions on how to package the MacOS Desktop version for CARTA:


1. Build the [carta-backend[(https://github.com/cartavis/carta-backend) and package it with dylibbundler to make it distributable.
```
dylibbundler -od -of -b -x carta_backend -d lib
```

	Note: carta-casacore needs to have been previously built with a floating CASAROOT i.e. `-DDATA_DIR="%CASAROOT%/data"` so that it can find the 
packaged ephemerides and geodetic data that we place in the packaged `carta-backend/etc/data` directory.

	The final layout of the packaged backend should be:

		carta_backend    
    	|-- bin  
    	|   |--carta-backend
    	|   |-- run.sh
    	|   |-- remote.sh
    	|
    	|-- libs (all packaged .dylib files)
    	|
    	|-- etc
       		|-- data
           		|-- ephemerides
               	|-- geodetic


	`run.sh` is used to start up the carta-backend when using Electon to display the carta-frontend.

	`remote.sh` is used to start up the carta-backend in remote mode (Opening of the Electron window is bypassed and a URL simply is provided to view the carta-frontend in your local web-browser.


2. Build the [carta-frontend](https://github.com/CARTAvis/carta-frontend) in production mode (`npm run build`) with a file called `.env.local` containing the following lines:

	```
	REACT_APP_TARGET=darwin
	REACT_APP_DEFAULT_ADDRESS_PROD=ws://localhost:55150
	```
The port number chosen here e.g. 55150, must match the one used in `main.js` mentioned in the next step.

3. In the generated carta-frontend/build folder, place the files and folder from this repository:

- **main.js** - The main Electron startup script that handles everything.
- **package.json** - Manages the installation where you can change Electron version etc. It also has some important settings for the codesign and notarization stage.
- **scripts/notarize.js** - This is used by the excellent [electron-notarize](https://www.npmjs.com/package/electron-notarize) package that makes the Apple codesign and notarization step a breeze. It needs to be customised with your Apple Developer ID plus an 'app specfic password'.
- **entitlements.mac.plist** - This seems to be necessary to work under Apple's new stricter notarization policies.
- **build/background.tiff** - This is the DMG installer background image. It needs to be a two layer TIFF file with image sizes of 540x380 and 1080x760 pixels.
- **icon.icns** - The is the CARTA logo in MacOS icon format.
- **carta-backend** - This is the packaged carta-backend bundle from step 1.

4. Type `meteor npm install`.

5. Check that everything works with `meteor npm start`.

6. Type `electron-builder build --mac --x64` to start the automated electron-notarize process.

7. After some time, a `dist` folder should be produced with the final signed .dmg file inside.

# Linux


