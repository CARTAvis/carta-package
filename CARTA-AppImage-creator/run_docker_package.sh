# This script is to run in the docker and build the CARTA AppImage. It runs outside the docker container.

#!/bin/bash


. ./appimage_config
export PATH=$BIN_PATH:$PATH

# clean carta appimage 
rm -rf ${PACKAGING_PATH}/carta-*.AppImage

# check if docker domain exists
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi  
# check if the docker image exists
if ! docker image inspect ${IMAGE_NAME} > /dev/null 2>&1; then
    echo "Docker image ${IMAGE_NAME} does not exist. Build it."
    sh build_docker_image.sh
fi

## Docker ##
# check if container started
if [ ! "$( docker container inspect -f '{{.State.Running}}' ${CONTAINER_NAME} )" = "true" ]; then
    echo "Docker container ${CONTAINER_NAME} is not running. Starting it..."
    docker run -d -it --env-file ./appimage_config -v ${PACKAGING_PATH}:${DOCKER_PACKAGING_PATH} --name ${CONTAINER_NAME} ${IMAGE_NAME}
    echo "Docker container ${CONTAINER_NAME} starting..."
fi

# wait for the container to be ready
sleep 5

# run the build script inside the container
echo "Running the build script inside the container..."
docker exec -it ${CONTAINER_NAME} /bin/bash -c "sh ${DOCKER_PACKAGING_PATH}/run_pack.sh"
## Docker ##