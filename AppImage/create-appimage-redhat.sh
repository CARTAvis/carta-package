#!/bin/bash

## Small script that runs the steps to create the universal CARTA AppImage from the Dockerfile
## Remember to set FRONTEND_TAG, BACKEND_TAG, and NAME accordingly

docker build -f Dockerfile-carta-appimage-create-redhat \
             --build-arg FRONTEND_TAG=3.0.0-beta.3 \
             --build-arg BACKEND_TAG=v3.0.0-beta.3 \
             --build-arg NAME=v3.0.0-beta.3 \
             -t carta-appimage-create .
docker run -d --name grabappimage carta-appimage-create
docker cp grabappimage:/root/appimage/. .
docker rm grabappimage
