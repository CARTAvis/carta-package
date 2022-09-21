## Create a CARTA Snap

CARTA can be built and run as a [Snap](https://snapcraft.io/). It could be convenient for development and testing, or for running CARTA on a non-supported Linux platform.

The CARTA snapcraft file is currently configured to use `v3.0.0` of the carta-backend and carta-frontend.

### To build and run the CARTA Flatpak

1. Follow appropriate intructions to install `snapd` and `snapcraft` on your computer.

2. The snapcraft builder uses 2GB of RAM by default, but the carta-backend build will require more. You can increase the amount of RAM assigned as follows:

```
export SNAPCRAFT_BUILD_ENVIRONMENT_MEMORY=8G
```

3. In the same folder as the CARTA `snapcraft.yaml` file, simply type:

```
snapcraft 
```

4. A snap file will be created. To install it locally in developer mode:

```
sudo snap install --devmode carta_3.0.0_amd64.snap
```

5. To run the installed snap version of CARTA:

```
/snap/bin/carta
```
