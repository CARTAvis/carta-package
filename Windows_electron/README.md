## Windows Electron version of CARTA

The Windows Electron version of CARTA uses [Electron](https://www.electronjs.org/) to display the carta-frontend HTML and start up the carta-backend via Windows Subsystem for Linux (WSL).

## Prerequisites

Before proceeding, ensure you have the following installed:

### Windows Subsystem for Linux (WSL) - Required

CARTA for Windows requires WSL to run the Linux-based backend. Follow these steps:

1. **Install WSL** (requires Windows 10 version 2004+ or Windows 11):
   ```powershell
   wsl --install
   ```
   
2. **Restart your computer** when prompted

3. **Verify WSL installation**:
   ```powershell
   wsl --version
   ```

4. **Ensure a Linux distribution is installed** (Ubuntu is recommended):
   ```powershell
   wsl --list --verbose
   ```

If you encounter issues, visit the [WSL installation guide](https://learn.microsoft.com/en-us/windows/wsl/install).

## Build Instructions

### 1. Get a Linux AppImage

Download CARTA Linux AppImage from Github repository using PowerShell:

```powershell
# Download the CARTA AppImage
Invoke-WebRequest -Uri "https://github.com/CARTAvis/carta/releases/download/v5.0.3/carta.AppImage.x86_64.tgz" -OutFile "carta.AppImage.x86_64.tgz"

# Extract the archive (requires tar support in Windows 10 1803+)
tar -xvf carta.AppImage.x86_64.tgz

# Unpack the AppImage to extract squashfs-root (requires WSL)
cd carta.AppImage.x86_64
wsl ./carta-x86_64.AppImage --appimage-extract
```

Alternatively, you can download manually from the browser and extract using Windows built-in tools.

### 2. Prepare the package

Create a `build` folder and copy over all the files contained in this repo.

A description of the key files and folders:

- **main.js**
  - Main entry point that initializes the CARTA application
- **src/** - Modular architecture with specialized managers:
  - **src/managers/** - Core application managers:
    - `WindowManager.js` - Handles Electron window creation and lifecycle
    - `BackendManager.js` - Manages CARTA backend process via WSL
    - `WSLManager.js` - WSL integration and availability checking
    - `MenuManager.js` - Application menu setup
  - **src/utils/** - Utility modules:
    - `ArgumentParser.js` - Command line argument processing
    - `NetworkUtils.js` - Port management and backend connection checking
    - `PathUtils.js` - Windows to WSL path conversion utilities
  - **src/config/** - Configuration files:
    - `constants.js` - Application constants and settings
    - `paths.js` - Path resolution for packaged vs development environments
  - **src/dialogs/** - User interface dialogs for WSL setup and errors
- **icon.ico**
  - The CARTA logo in Windows icon format
- **package.json**
  - Package configuration. Update version number and dependencies as needed for new releases

Usually, the only files that would need modification for each release are:

1. `package.json`: To update the release "name" and package versions.
2. `carta\carta_appimage`: The Linux AppImage mentioned in "1. Get a Linux AppImage". Copy `squashfs-root` to `.\carta\`.

### 3. Create the Electron App

1. Generate the `node_modules` folder:
   ```powershell
   npm install
   ```

2. Double-check that it works:
   ```powershell
   npm start
   ```
   The electron window with a working CARTA should appear. It might take several seconds for the carta-backend to connect. Note that the CARTA icon will not render in this stage.

3. Make sure `electron-builder` is installed and accessible:
   ```powershell
   npm install -g electron-builder
   ```

4. Run the electron-builder (run as administrator):
   ```powershell
   npm run build
   ```

## Troubleshooting

### Common Issues

**WSL not found or not working:**
- Ensure WSL is installed: `wsl --install`
- Restart your computer after WSL installation
- Verify WSL status: `wsl --list --verbose`
- Check that a Linux distribution is installed and running

**Backend fails to start:**
- Verify the `squashfs-root` folder exists in `.\carta\` directory
- Ensure the AppImage has execute permissions in WSL
- Check WSL can access Windows filesystem: `wsl ls /mnt/c/`

**Connection timeout:**
- The backend may take 30-60 seconds to start on first run
- Check Windows Firewall isn't blocking the connection
- Try closing and reopening the application

**Build fails:**
- Ensure you're running PowerShell as Administrator for the build step
- Check all dependencies are installed: `npm ls`
- Clear node_modules and reinstall if needed: `Remove-Item -Recurse -Force node_modules; npm install`

For more help, visit:
- [WSL Documentation](https://learn.microsoft.com/en-us/windows/wsl/)
- [WSL Troubleshooting](https://learn.microsoft.com/en-us/windows/wsl/troubleshooting)
