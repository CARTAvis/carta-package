# This script is to run in the docker and build the CARTA AppImage. It runs outside the docker container.

#!/bin/bash

source ./appimage_config

# check if docker domain exists
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi  
# check if the docker image exists
IMAGE_NAME="carta-appimage-create"
if ! docker image inspect ${IMAGE_NAME} > /dev/null 2>&1; then
    echo "Docker image ${IMAGE_NAME} does not exist. Build it."
    sh build_docker_image.sh
fi

## Docker ##
# run the docker container
CONTAINER_NAME="carta-appimage-container"
docker run -d -it --env-file ./appimage_config -v ${PACKAGING_PATH}:${DOCKER_PACKAGING_PATH} --name ${CONTAINER_NAME} ${IMAGE_NAME}
echo "Docker container ${CONTAINER_NAME} starting..."

# wait for the container to be ready
sleep 5

# run the build script inside the container
echo "Running the build script inside the container..."
docker exec -it ${CONTAINER_NAME} /bin/bash -c "sh ${DOCKER_PACKAGING_PATH}/run_pack.sh"

echo "Copying the built AppImage from the container..."
docker cp ${CONTAINER_NAME}:${DOCKER_PACKAGING_PATH}/CARTA/carta-${FRONTEND_VERSION}-${BACKEND_VERSION}-${ARCH}.AppImage ./

echo "AppImage build completed. Removing container."
docker rm -f ${CONTAINER_NAME}
## Docker ##

ARCH=$(arch)
if [ ${ARCH} = "arm64" ]; then
    ARCH="aarch64"
fi

docker cp ${CONTAINER_NAME}:/root/carta-${VERSION}-${ARCH}.AppImage ./

## rename AppImage ##
if [ $RELEASE == "TRUE" ]; then
    mv carta-${VERSION}-${ARCH}.AppImage carta-${ARCH}.AppImage
else
    mv carta-${VERSION}-${ARCH}.AppImage carta-${FRONTEND_VERSION}-${BACKEND_VERSION}-${ARCH}.AppImage
fi