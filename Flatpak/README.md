## Create a CARTA Flatpak

CARTA can be built and run as a [Flatpak](https://flatpak.org/). It could be convenient for developement and testing purposes as third party dependencies can be easily changed. 
For example you could easily switch between using HDF5 1.10 and HDF5 1.12 to test CARTA performance and correctness.

The CARTA Flatpak manifest file is currently configured to use `v3.0.0` of the carta-backend and carta-frontend.

### To build and run the CARTA Flatpak

1. Follow the appropriate intructions [here](https://flatpak.org/setup/) to set up Flatpak on your computer.

2. The CARTA Flatpak will require the Freedesktop 21.08 runtime and SDK to be installed:

```
flatpak install flathub org.freedesktop.Sdk//21.08 org.freedesktop.Platform//21.08
```

3. Build the CARTA Flatpak:

```
flatpak-builder --user --install --force-clean carta org.flatpak.CARTA.yml
```

4. Run the Flatpak version of CARTA:

```
flatpak run org.flatpak.carta
```
