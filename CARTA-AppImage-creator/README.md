## Create a universal CARTA AppImage using Docker

### Requirements:

[Docker](https://www.docker.com/)

(Optional [Node.js](https://nodejs.org/) and npm)

### Basic usage:

0. If there is no packaging docker image existing, run the `./build_docker_image.sh` script to build the Docker image that will be used to create the CARTA AppImage. This image contains the `carta-casacore` and `emsdk`.

1. Edit the `appimage_config` file to set the `FRONTEND_VERSION` and `BACKEND_VERSION` to the versions of carta-frontend and carta-backend you want to use. For the release version, you can use a pre-built carta-frontend from [carta-frontend NPM repository](https://www.npmjs.com/package/carta-frontend) with `NPM_FRONTEND=True`. If you want to build it from source, set `NPM_FRONTEND=False`. The `RELEASE_DATE` need to be set for the release version as well.

2. Execute the `./run_docker_package.sh` script. It will open the container and run `./run_pack.sh` inside the container, which creates a CARTA AppImage using the pointed versions of carta-backend and carta-frontend, and packages the CARTA using `appimagetool`.

### Advanced usage:

0. Generate a public/private key with the command `gpg --full-generate-key`, then export the public key `gpg --armor --export YOUR-EMAIL-OR-KEYID > pubkey.asc` to a file. Put this public key file under the folder `carta-package`, i.e., up one level folder.

1. The carta-frontend NPM repository option can save build time, but only a few carta-frontends are available there - only the official releases and beta versions. Set `NPM_FRONTEND=False` in the `appImage_config` file to build the carta-frontend from source.

### Additional notes:

- To run an AppImage inside a Docker container (or a system without FUSE enabled): `APPIMAGE_EXTRACT_AND_RUN=1 ./CARTA.AppImage`

- We are currently using the Continuous build from [probonopd/go-appimage](https://github.com/probonopd/go-appimage) as that is the only version of 
Appimagetool that supports running on Ubuntu 22.04 without the need to install the older libfuse-2. The Continuous build regularly changes the version 
number, the script will automatically download the latest version of appimagetool.
