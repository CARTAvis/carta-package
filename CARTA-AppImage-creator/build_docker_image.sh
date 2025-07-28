#!/bin/bash

# check if docker domain exists
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

if [ $(arch) = "arm64" ]
then
  IMAGE="arm64v8/almalinux:8.10"
fi

if [ $(arch) = "i386" ]
then
  IMAGE="almalinux:8.10"
fi

if [ $(arch) = "aarch64" ]
then
  IMAGE="arm64v8/almalinux:8.10"
fi

if [ $(arch) = "x86_64" ]
then
  IMAGE="almalinux:8.10"
fi


CARTA_CASACORE_TAG=master

docker build -f Dockerfile-carta-appimage-create \
             --build-arg BASE_IMAGE=$IMAGE \
             --build-arg CASACORE=$CARTA_CASACORE_TAG \
             -t carta-appimage-create .