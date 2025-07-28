# This script is to run in the docker and build the CARTA AppImage. It runs outside the docker container.

#!/bin/bash


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

# insure folder CARTA does not exist
if [ -d "CARTA" ]; then
    echo "CARTA folder already exists. Removing it."
    rm -rf CARTA
fi


## Docker ##
# run the docker container
CONTAINER_NAME="carta-appimage-container"
docker run -d -it --name ${CONTAINER_NAME} ${IMAGE_NAME}
echo "Docker container ${CONTAINER_NAME} started."

# wait for the container to be ready
sleep 5

# copy files to the container
echo "Copying files to the container..."
docker cp ./appimage_config ${CONTAINER_NAME}:/root/appimage_config
docker cp ./cp_libs.sh ${CONTAINER_NAME}:/root/cp_libs.sh
docker cp ./run_pack.sh ${CONTAINER_NAME}:/root/run_pack.sh

docker cp  ./AppRun ${CONTAINER_NAME}:/root/CARTA
docker cp  ./carta.desktop ${CONTAINER_NAME}:/root/CARTA
docker cp  ./carta.png ${CONTAINER_NAME}:/root/CARTA
docker cp  ./org.carta.desktop.appdata.xml ${CONTAINER_NAME}:/root/CARTA/usr/share/metainfo

# run the build script inside the container
echo "Running the build script inside the container..."
docker exec -it ${CONTAINER_NAME} /bin/bash -c "sh /root/run_pack.sh"

echo "Copying the built AppImage from the container..."
docker cp ${CONTAINER_NAME}:/root/CARTA .

echo "AppImage build completed. Removing container."
docker rm -f ${CONTAINER_NAME}
## Docker ##

if [ $(arch) = "arm64" ]; then
    echo "Copy folder CARTA to a arm64 machine and run the appimagetool.sh script."
    exit 0
fi

./appimagetool.sh

