#!/bin/bash

# First define which commits/tags to checkout from the carta-backend, carta-frontend, and carta-casacore repositories.
# You can either:
#   1. Set FRONTEND_FROM_NPM_REPO=True
#        To download a pre-packaged carta-frontend from https://www.npmjs.com/package/carta-frontend (fewer tags available)
#   2. Set FRONTEND_FROM_NPM_REPO=False
#        To build any frontend commit/tag from https://github.com/CARTAvis/carta-frontend
# NAME is the file name to be assigned to the AppImage

BACKEND_TAG=dev
CARTA_CASACORE_TAG=master
FRONTEND_FROM_NPM=False # Set to True in order to take prebuilt carta-frontend from the npm repo
FRONTEND_TAG=dev
#FRONTEND_TAG=3.0.0-beta.3
NAME=CARTA-test

if [ $FRONTEND_FROM_NPM = "False" ]; then
  echo 'Building a production frontend from Github using Docker.'
  git clone https://github.com/CARTAvis/carta-frontend.git
  cd carta-frontend 
  git checkout $FRONTEND_TAG
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
             --build-arg CASACORE=$CARTA_CASACORE_TAG \
             --build-arg FRONTEND=$FRONTEND_TAG \
             --build-arg NPM=$FRONTEND_FROM_NPM \
             --build-arg BACKEND=$BACKEND_TAG \
             --build-arg FILENAME=$NAME \
             -t carta-appimage-create .
docker run -d --name grabappimage carta-appimage-create
docker cp grabappimage:/root/appimage/. .
docker rm grabappimage
