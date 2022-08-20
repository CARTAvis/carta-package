## macOS Electron version of CARTA

The macOS Electron version of CARTA uses [Electron](https://www.electronjs.org/) to display the carta-frontend HTML and start up the carta-backend.

The following are instructions on how to package the macOS Electron version for CARTA:

### 1. Build carta-casacore with floating CASAROOT ###

It is essential that carta-casacore is built and installed with a floating root flag: `-DDATA_DIR="%CASAROOT%/data"`. This ensures casacore will be able to look for the measures data that we bundle with the package:
```
cd ~
git clone https://github.com/CARTAvis/carta-casacore.git --recursive
cd carta-casacore
mkdir -p build
cd build
cmake .. -DUSE_FFTW3=ON -DUSE_HDF5=ON -DUSE_THREADS=ON -DUSE_OPENMP=ON -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF -DBUILD_PYTHON=OFF -DUseCcache=1 -DHAS_CXX11=1 -DDATA_DIR="%CASAROOT%/data" -DCMAKE_INSTALL_PREFIX=/opt/carta-casacore
make -j4
sudo make install
```

### 2. Build carta-backend ###

Build the carta-backend with the `-DCartaUserFolderPrefix=` flag. If it is a beta-release, use `.carta-beta`, if it is a normal release, use `.carta`. Also, make sure to ‘checkout’ the correct branch/tag.
```
git clone https://github.com/CARTAvis/carta-backend.git
cd carta-backend
git checkout release/3.0
git submodule update --init --recursive
mkdir build
cd build
cmake .. -DCMAKE_BUILD_TYPE=RelWithDebInfo -DCartaUserFolderPrefix=".carta"
make -j 4
```

### 3. Package carta-backend ###

This step makes the `carta_backend` executable distributable on other systems. 

Run the [dylibbundler](https://github.com/auriamg/macdylibbundler) package on it (easily installed with Homebrew).
```
dylibbundler -od -of -b -x carta_backend -d libs
```
If you see errors like this: 
```
/!\ WARNING : can't get path for '@rpath/libzfp.0.dylib'
Please specify the directory where this library is located (or enter 'quit' to abort):
```
Then type in **`/usr/local/lib`** and press ‘enter’.
(That is the usual location of most library files. Or you can find where it should be with, for example, `locate libzfp.0.dylib`).

The dylibbundler process produces a modified `carta_backend` executable and a `libs` folder. 
The modified carta_backend will look for library files in `../libs`, so the carta_backend executable needs to be relative to that, usually in a `bin` folder.

### 4. Get a production carta-frontend ###

A production carta-frontend can either be built from source (Assuming you have Docker installed):
```
git clone https://github.com/CARTAvis/carta-frontend.git
cd carta-frontend
git submodule update --init --recursive
npm install
npm run build-libs-docker
npm run build-docker
cd build
```
OR
A pre-built package can be download from the NPM repository: e.g.
```
wget https://registry.npmjs.org/carta-frontend/-/carta-frontend-3.0.0.tgz
tar -xvf carta-frontend-3.0.0.tgz
And work in package/build
cd package/build
```

### 5. Prepare the package ###

Copy over all the files contained in this repo to the carta-frontend `build` folder. A description of the files are as follows:

- **main.js**
	- This script controls how Electron starts up and runs.
- **icon.icns**
	- The CARTA logo in MacOS icon format. It is the icon that shows beside the App in the Launchpad etc. 
- **config**
	- This is an important single-line file to enable CARTA to use the user preferences in ~/.carta (or ~./carta-beta) rather than Electron local storage.
- **entitlements.mac.plist**
	- This may be necessary for CARTA to work under Apple's new stricter notarization policies. It seems to “allow-unsigned-executable-memory”.
- **scripts/notarize.js**
	- This is used by the excellent [electron-notarize](https://www.npmjs.com/package/electron-notarize) package that makes the Apple codesign and notarization step a breeze. It needs to be customised with your Apple Developer ID plus an 'app specific password'. 
- **build/background.tiff**
	- The DMG installer background image. It needs to be a two-layer TIFF file with image sizes of 540x380 and 1080x760 pixels. I make it in The GIMP. Check Google on how to make a multi-layer TIFF.
	- If you don't include this file, the DMG installer will use a default blank background image.
- **package.json**
	- Here you can set the name of the final package and the version numbers of various dependencies. Usually, you just need to:
		- Update the package “name”.
		- Change to the latest [Electron stable release](https://www.electronjs.org/releases/stable) version.
		- Other package versions may or may not need version changes.
   
- **carta-backend/**
	- This is the bundled carta-backend. It consists of 3 folders:
		- **etc/data**
			- This should contain the **`geodetic`** and **`ephemerides`** folders required by carta-casacore. Grab the latest version from Astron when making a package: 
			`wget ftp://[ftp.astron.nl/outgoing/Measures/WSRT_Measures.ztar`
			`tar -czvf WSRT_Measures.ztar`
			`rm WSRT_Measures.ztar`
		- **libs/**
			- These are the packaged library files needed by carta-backend from the packaging computer.
	    - **bin/**
		    - **`carta-backend`**
			    - This is the packaged carta-backend executable
			 - **`casa_data_autoupdate`**
				 - This is the casa_data_autoupdate script
		    - **`run.sh`**
			    - This is what the Electron main.js runs to start up the carta-backend. It has some essential lines to properly set “CASAPATH” (so that the it can pick up the measurues data in `etc/data`). The same script is used for Linux Appimages, so that is why the LD_LIBRARY_PATH part only runs for “Linux” as it is not required for Mac.
			- **`carta.sh`**
				- This script allows users to completely bypass the Electron component and run the bundled carta-backend and carta-frontend in their local web-browser instead.

Usually, the only files that would need modification for each release are:

1.  `scripts/notarize.js`: The first time you add your Apple ID credentials.
2. `build/background.tiff`: A custom image in the DMG installer (optional).
3. `package.json`: To update the release "name" and package versions.
4. `carta-backend/etc/data`: To add the `geodetic` and `ephemerides` data.
5.  `carta-backend/libs`: To add the packaged library files created in the "Package carta-backend" Stage 3 above.
6. `carta-backend/bin/carta_backend`: The packaged carta_backend executable created in the "Package carta-backend" Stage 3 above.

### 6. Create the Electron App ###

If not previously set up, get the code-signing certificate on your Mac with a private key etc. e.g. using Xcode > Accounts to “Import Apple ID and Code Signing Assets”. It is difficult to figure out how initially create the certificate and private keys etc., but you can find the information on Google.

1. Generate the `node_modules` folder:
	```
	npm install
	```
2. Double-check that it works:
	```
	npm start
	```
	The electron window with a working CARTA should appear. It might take several seconds for the carta-backend to connect.

3. Make sure `electron-builder` is installed and accessible:
	```
	npm install -g electron-builder
	```
	
4. Currently, the `portscanner` package seems to run something called deasync and that gives errors about "The binary uses an SDK older than the 10.9 SDK." The easy fix is to just delete the problematic folders as they are not used:
	```
	rm -rf node_modules/deasync/bin/darwin-x64-node-0.10
    rm -rf node_modules/deasync/bin/darwin-x64-node-0.11
    rm -rf node_modules/deasync/bin/darwin-x64-node-0.12
    ```
5. Run the electron-builder:
	**Note**: electron-builder can interchangeably build the Electron component (The app window that displays the frontend) on both an Intel or M1 Macs, but the **carta_backend** executable itself first needs to be built on either Intel *or* M1. For example, an M1 Mac can create the Electron component for Intel Macs, but you need to copy over a carta-backend packaged for Intel before issuing the electron-builder command.
	
   When you have a carta-backend built and packaged on Intel x86 computer:
   	``` electron-builder build --mac --x64 ```
    OR
    When you have a carta-backend built and packaged on an M1 Mac:
	``` electron-builder build --mac --arm64 ```

If everything goes well, it will upload the package to Apple servers and after a few minutes, a final signed and notarized dmg will appear in the `dist` folder. It will have an additional number e.g. 3.0.0 (from the “version” line in the package.json, but you can rename the dmg file before uploading it to the carta repo on Github.

If you see obscure errors, it can be hard to figure out what went wrong. A few common failures are:
-   Terms and conditions have been updated, so you need to log in to the Developer Account to accept them.
-   The Apple Developer account has expired.
-   The App specific password has somehow expired or needs to be updated.    
-   A newer version of Electron may require a newer version of Node.js.
-   A newer version of Electron may have introduced breaking changes with other modules so you may need to wait for electron-builder to update their tool.

