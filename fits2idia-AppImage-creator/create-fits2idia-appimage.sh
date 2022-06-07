#!/bin/bash

## Small script that runs the steps to create the universal fits2ida AppImage from the Dockerfile

docker build -f Dockerfile-fits2idia-appimage-create \
             --build-arg RELEASE_TAG=v0.1.15 \
             -t fits2idia-appimage-create .
docker run -d --name grabappimage fits2idia-appimage-create
docker cp grabappimage:/root/ready/. .
docker rm grabappimage
