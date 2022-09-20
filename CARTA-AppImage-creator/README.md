## Create a universal CARTA AppImage using Docker

### Requirements:

[Docker](https://www.docker.com/)

(Optional [Node.js](https://nodejs.org/) and npm)

### Basic usage:

Execute the `./create-carta-appimage.sh` script. It will build a CentOS 7.9 (RHEL7) Docker container, create a CARTA AppImage using the latest carta-backend and carta-frontend 'dev' commits (and carta-casacore 'master' branch) automatically, and copy it on to your local computer.

### Advanced usage:

1. Open the script `./create-carta-appimage.sh` script for editing.

2. Modify the `BACKEND_TAG`, `FRONTEND_TAG`, `VERSION`, (and optionally the `CARTA_CASACORE_TAG`) with the branch/commit/tag that you would like to use.

 The pre-built production carta-frontends can be directly downloaded from the 
[carta-frontend NPM repository](https://www.npmjs.com/package/carta-frontend) by setting `FRONTEND_FROM_NPM=True`, or built from source by 
setting `FRONTEND_FROM_NPM=False`. 

 In both cases, the appropriate `FRONTEND_TAG` will also need to be set.

 The carta-frontend NPM repository option can save build time, but only a few carta-frontends are available there - only the official releases and beta versions. 

 If using the option to build carta-frontend from source (`FRONTEND_FROM_NPM=False`), note that it is built separately in the first section of `./create-carta-appimage.sh` script. 
 This is because one way to build the carta-frontend is using Emscripten, but Emscripten appears to no longer work in RHEL7. Therefore, we need to use the Docker method to build the carta-frontend. However, we can not run Docker commands inside a Dockerfile. So that is why it must be first built separately outside of the main Docker container. In this case, the `npm install` command is necessary, so `node` and `npm` also need to be installed on your local computer.

### Additional notes:

- This will only work with carta-backends from June 14th 2022 and onward because the curl dependency was removed at that point. The presence of curl made it difficult to have universal AppImage that would work on both RedHat and Ubuntu due to the different ways SSL certificates were handled on the different OSs.

- To run an AppImage inside a Docker container (or a system without FUSE enabled): `APPIMAGE_EXTRACT_AND_RUN=1 ./CARTA.AppImage`

- The `./create-carta-appimage.sh` script will build an `x86_64` version if run on an `x86_64` computer (or Intel Mac), and an `aarch64` version if run on an `aarch64` computer (or M1 Mac).

- We are currently using the Continuous build from [probonopd/go-appimage](https://github.com/probonopd/go-appimage) as that is the only version of 
Appimagetool that supports running on Ubuntu 22.04 without the need to install the older libfuse-2. The Continuous build regularly changes the version 
number, so you many need to adjust the URL/filename in the Dockerfile before running the script e.g. 715, 718, 722 etc.
