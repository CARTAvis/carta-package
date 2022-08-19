#!/bin/bash

## Small script that runs the steps to create the universal fits2idia AppImage from the Dockerfile.
## Requires Docker to be installed.
## Run on an x86_64 system to get the x86_64 version.
## Run on an aarch64 system (Or an M1 Mac) to get the aarch64 version.

ARCH=$(arch)

if [ $ARCH = "arm64" ]
then
  ARCH="aarch64"
  IMAGE="arm64v8/centos:7.9.2009"
fi

if [ $ARCH = "i386" ]
then
  ARCH="x86_64"
  IMAGE="centos:7.9.2009"
fi

if [ $ARCH = "aarch64" ]
then
  IMAGE="arm64v8/centos:7.9.2009"
fi

if [ $ARCH = "x86_64" ]
then
  IMAGE="centos:7.9.2009"
fi

docker build -f Dockerfile-fits2idia-appimage-create \
             --build-arg RELEASE_TAG=v0.1.15 \
	     --build-arg ARCH_TYPE=$ARCH \
	     --build-arg BASE_IMAGE=$IMAGE \
             -t fits2idia-appimage-create .
docker run -d --name grabappimage fits2idia-appimage-create
docker cp grabappimage:/root/ready/. .
docker rm grabappimage
