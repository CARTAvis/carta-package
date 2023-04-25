## CARTA Tauri App

This is an incomplete experimental version of a CARTA Tauri App to explore the possibility of using [Tauri](https://tauri.app/), (a Rust-based framework, to create lightweight, secure, and fast applications with web technologies) as an alternative to the Electron version of CARTA.
Tauri apps claim to be more lightweight due to their reliance on the system's default web rendering service.
On macOS, this is achieved through WebKit, and webkit2gtk on Linux.
For example, the final CARTA Tauri App on macOS is approximately 112MB in size compared to over 300MB for the Electron version.

The layout of the carta-tauri directory is as follows:
```
carta-tauri
├── build.rs
├── Cargo.toml
├── icons
│   ├── icon.icns
│   └── icon.png
├── src
│   └── main.rs
├── tauri.conf.json
├── carta-frontend
│   └── \<production frontend files here\>
└── carta-backend
    ├── bin
    │   ├── run.sh \<remember to modify\>
    │   └── carta_backend
    ├── lib
    │   └── \<lib files required by packaged carta_backend\>
    └── etc
        └── data
            ├── ephemerides \<measures data\>
            └── geodetic \<measures data\>
```
There are four main Tauri related files:

  -  `src/main.rs`: Responsible for initializing the app and its functionality.
  -  `build.rs`: Small file to configure the build environment of the app.
  -  `Cargo.toml`: Specifies the app's dependencies and build settings.
  -  `tauri.conf.json`: Configures the app's settings and behavior.

In addition, it requires a production CARTA frontend to be placed in the `carta-frontend` folder
and a packaged CARTA backend to be placed in the `carta-backend` folder.
In the `icons` folder, `icon.icns` is for macOS and `icon.png` is for Linux. They are used when making a full build of the app.

### Steps to setup and run

1. Install Rust and the Tauri CLI:

The following commands should set up a Rust development environment on your computer:
```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
<enter 1>
source "$HOME/.cargo/env" (and add it to your ~/.zshrc or ~/.bashrc)
cargo install tauri-cli
```

2. Put the carta-backend and carta-frontend files in place:

Copy a packaged CARTA backend into the carta-backend folder, and production CARTA frontend into the carta-frontend folder. They could be copied from an installed Electron version of CARTA if needed. e.g. For the backend:
```
cp -r /Applications/CARTA.app/Contents/Resources/app/carta-backend/* carta-backend
```

Note: The `carta-backend/bin/run.sh` script requires a small modification.
The carta\_backend can freely accept any number of arguments as flags so should use `@$`.
Therefore, open `carta-backend/bin/run.sh` for editing and modify the final line to:
```
$dirname/carta_backend @$ --frontend_folder=$dirname/../../carta-frontend --no_browser
```

For the frontend:
```
cp -r /Applications/CARTA.app/Contents/Resources/app/*.wasm carta-frontend
cp -r /Applications/CARTA.app/Contents/Resources/app/*.json carta-frontend
cp -r /Applications/CARTA.app/Contents/Resources/app/*.png carta-frontend
cp -r /Applications/CARTA.app/Contents/Resources/app/*.html carta-frontend
cp -r /Applications/CARTA.app/Contents/Resources/app/static carta-frontend/static
```
Or, downloaded directly from the NPM repository. e.g.:
```
wget https://registry.npmjs.org/carta-frontend/-/carta-frontend-3.0.0.tgz
tar -xvf carta-frontend-3.0.0.tgz
mv package/build/* carta-frontend/
```

3. Make adjustments to the version names and numbers in `Cargo.toml` and `tauri.conf.json` if needed, and/or further develop the code in `src/main.rs`


4. To run in developement mode: 
```
cargo tauri dev
```
The carta-backend will start up, the Tauri window will open showing the carta-frontend, and it will connect to the carta-backend.

All normal carta-backend flags can be passed in developement mode as follows e.g.:
```
cargo run -- /Users/ajm/CARTA/Images --verbosity=5 --enable_scripting
```

5. To produce a final production app:

```
cargo tauri build
```
On macOS it will proceed to create the carta-tauri app and place it in a non-signed DMG (name and version can be modified in Cargo.toml and tauri.json). 
Note: It is not officially signed or notarized, but it is possible to do. On Linux it should produce a Debian package and an AppImage.

### Caveats

- There is currently a small bug in the current code. You will need to use `ctrl+c` in the terminal window in order to fully exit the application. If you instead only close the Tauri window, it will look like everything has stopped, but the carta\_backend process remains running in the background.

- A potential drawback of using WebKit is its lack of headless mode, which could make it difficult to run our CARTA's end-to-end testing on the app.

- On Linux, Tauri uses WebkitGTK (e.g. Ubuntu 20.04 uses webkit2gtk-4.0 version 2.38.5). It does not seem to support webGL 2.0 by default, which is something the CARTA frontend requires. It results in the following frontend error `"ReferenceError: Can't find variable: WebGLS2RenderingContext"`. It seems that future WebkitGTK versions from 2.40 onward may work by default. I built and installed WebkitGTK version 2.40 from source as an experiment. The `pkg-config --modversion webkit2gtk-4.0` command then reported the system was using 2.40.0 and the Tauri app worked on the Ubuntu computer. This is not an ideal solution for now. Perhaps use on Linux could be investigated again in the future. But for now, the CARTA Tauri version works perfectly on macOS (macOS uses WebKit via WKWebView).

