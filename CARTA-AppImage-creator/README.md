## Create a universal CARTA AppImage using Docker

### Requirements:

[Docker](https://www.docker.com/)

(Optional [Node.js](https://nodejs.org/) and npm)

### Basic usage:

Execute the `./create-carta-appimage.sh` script. It will build a CentOS 7.9 (RHEL7) Docker container, create a CARTA AppImage using the latest carta-backend and carta-frontend 'dev' commits (and carta-casacore 'master' branch) automatically, and copy it on to your local computer.

### Advanced usage:

1. Open the script `./create-carta-appimage.sh` script for editing.

2. Modify the `BACKEND_TAG`, `FRONTEND_TAG`, and `CARTA_CASACORE_TAG` variables with the branch/commit/tag that you would like to use.

 The `NAME` variable allows you to provide a custom name to the resulting AppImage: `<NAME>.AppImage`.

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

- AppImages currently do not run on Ubuntu 22.04 because it uses libfuse3 by default and AppImages currently require libfuse2. A workaround is to install libfuse2: `sudo apt-get install libfuse2` or prefix with `APPIMAGE_EXTRACT_AND_RUN=1` as above.
