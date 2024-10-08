#!/bin/bash

# First define which commits/tags to checkout from the carta-backend, carta-frontend, and carta-casacore repositories.
# You can either:
#   1. Set FRONTEND_FROM_NPM_REPO=True
#        To download a pre-packaged carta-frontend from https://www.npmjs.com/package/carta-frontend (fewer tags available)
#   2. Set FRONTEND_FROM_NPM_REPO=False
#        To build any frontend commit/tag from https://github.com/CARTAvis/carta-frontend
# 'VERSION' is the part of the name applied to the final AppImage.

FRONTEND_FROM_NPM=False   # Set to True in order to take prebuilt carta-frontend from the npm repo
CARTA_CASACORE_TAG=master # Set the branch from the carta-casacore repository
BACKEND_TAG=dev           # Set the branch or release version from the backend repository
FRONTEND_TAG=dev          # Set the branch or release version from the frontend repository
VERSION=v5.0.0

# Currently we need to use the continuous build of go-appimage in order to have libfuse-3 support.
# It updates regularly so please check https://github.com/probonopd/go-appimage/releases/tag/continuous 
# first for the current version (e.g. 756) and enter it here:
APPIMAGE_VERSION=851

ARCH=$(arch)

if [ $ARCH = "arm64" ]
then
  ARCH="aarch64"
  IMAGE="arm64v8/almalinux:8.10"
fi

if [ $ARCH = "i386" ]
then
  ARCH="x86_64"
  IMAGE="almalinux:8.10"
fi

if [ $ARCH = "aarch64" ]
then
  IMAGE="arm64v8/almalinux:8.10"
fi

if [ $ARCH = "x86_64" ]
then
  IMAGE="almalinux:8.10"
fi

if [ $FRONTEND_FROM_NPM = "False" ]; then
  echo 'Building a production frontend from Github using Docker.'
  git clone https://github.com/CARTAvis/carta-frontend.git
  cd carta-frontend 
  git checkout $FRONTEND_TAG

  # Modifications (hopefully temporary) so that the carta-frontend can build on arm64/aarch64
  if [ $ARCH = "aarch64" ]; then
    sed -i '30s|-s WASM=1|-s WASM=1 -flto|' wasm_libs/build_zstd.sh # Add the -flto flag to build_zstd.sh
    sed -i 's|2.0.14|3.1.47-arm64|g' build_wasm_wrappers_docker.sh # Use newer native arm64 version of emsdk
    sed -i 's|2.0.14|3.1.47-arm64|g' build_wasm_libs_docker.sh
  fi

  git submodule update --init --recursive
  npm install
  npm run build-libs-docker
  npm run build-docker
  cd ..
else
  echo 'Will use pre-built frontend with tag ' $FRONTEND_TAG ' from the carta-frontend npm repo.'
  mkdir -p carta-frontend/build
fi

docker build -f Dockerfile-carta-appimage-create \
             --build-arg ARCH_TYPE=$ARCH \
             --build-arg BASE_IMAGE=$IMAGE \
             --build-arg CASACORE=$CARTA_CASACORE_TAG \
             --build-arg FRONTEND=$FRONTEND_TAG \
             --build-arg NPM=$FRONTEND_FROM_NPM \
             --build-arg BACKEND=$BACKEND_TAG \
             --build-arg RELEASE_TAG=$VERSION \
             --build-arg APPIMAGE_VER=$APPIMAGE_VERSION \
             -t carta-appimage-create .
docker run -d --name grabappimage carta-appimage-create
docker cp grabappimage:/root/CARTA .
docker rm grabappimage

# Create an AppImage on Linux distributions
wget https://github.com/probonopd/go-appimage/releases/download/continuous/appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage
if [ -f appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage ]; then
    chmod 755 appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage
    APPIMAGE_EXTRACT_AND_RUN=1 ARCH=${ARCH} VERSION=${VERSION} ./appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage CARTA
fi

# Extract a unique Embedded Signature
if [ -x carta-${VERSION}-${ARCH}.AppImage ]; then
    ./carta-${VERSION}-${ARCH}.AppImage --appimage-signature > Embedded-Signature
fi

