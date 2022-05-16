#!/bin/bash

## Small script that runs the steps to create the universal CARTA AppImage from the Dockerfile
## Remember to set FRONTEND_TAG, BACKEND_TAG, and NAME accordingly

docker build -f Dockerfile-carta-appimage-create \
             --build-arg FRONTEND_TAG=2.0.0-dev.21.4.13 \
             --build-arg BACKEND_TAG=v2.0.0-dev.21.04.13 \
             --build-arg NAME=carta-beta \
             -t carta-appimage-create .
docker run -d --name grabappimage carta-appimage-create
docker cp grabappimage:/root/appimage/. .
docker rm grabappimage
