## Create a universal CARTA AppImage using Docker

### Requirements:

[Docker](https://www.docker.com/)

(Optional [Node.js](https://nodejs.org/) and npm)

### Basic usage:

0. If there is no packaging docker image existing, run the `./build_docker_image.sh` script to build the Docker image that will be used to create the CARTA AppImage. This image contains the `carta-casacore` and `emsdk`.

1. Edit the `appimage_config` file to set the `FRONTEND_RELEASE_VERSION` and `BACKEND_RELEASE_VERSION` to the versions of carta-frontend and carta-backend you want to use. Default is to use a pre-built carta-frontend from [carta-frontend NPM repository](https://www.npmjs.com/package/carta-frontend), set `NPM_FRONTEND=True`. If you want to build it from source, set `NPM_FRONTEND=False`.

2. Execute the `./run_docker_package.sh` script. It will open the container, create a CARTA AppImage using the pointed versions of carta-backend and carta-frontend automatically, copy it on to your local computer, and do the final packaging using `appimagetool`.

3. The appimagetool is not allowed to run inside a Docker container, and it runs on your local computer. To package the arm64 AppImage, either run the script on an Apple Silicon Mac, copy folder `CARTA` to an arm64 architecture linux machine and run `./appimagetool.sh` or execute the `./run_docker_package.sh` script on an arm64 architecture linux machine directly.

### Advanced usage:

0. Generate a public/private key with the command `gpg --full-generate-key`, then export the public key `gpg --armor --export YOUR-EMAIL-OR-KEYID > pubkey.asc` to a file. Put this public key file under the folder `carta-package`, i.e., up one level folder.

1. The carta-frontend NPM repository option can save build time, but only a few carta-frontends are available there - only the official releases and beta versions. Set `NPM_FRONTEND=False` in the `appImage_config` file to build the carta-frontend from source.

### Additional notes:

- To run an AppImage inside a Docker container (or a system without FUSE enabled): `APPIMAGE_EXTRACT_AND_RUN=1 ./CARTA.AppImage`

- We are currently using the Continuous build from [probonopd/go-appimage](https://github.com/probonopd/go-appimage) as that is the only version of 
Appimagetool that supports running on Ubuntu 22.04 without the need to install the older libfuse-2. The Continuous build regularly changes the version 
number, the script will automatically download the latest version of appimagetool.
