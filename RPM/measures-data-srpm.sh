#!/bin/bash

# check if the required tools are installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker to run this script."
    exit 1
fi

# check if docker is running
if ! docker info &> /dev/null; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

# if no carta-rpmbuild image exists, build it
if ! docker images | grep -q carta-rpmbuild; then
    echo "Building carta-rpmbuild image..."
    # check if Dockerfile-rpmbuild exists
    if [ ! -f Dockerfile-rpmbuild ]; then
        echo "Dockerfile-rpmbuild not found. Please ensure it exists in the current directory."
        exit 1
    fi
    # build the carta-rpmbuild image
    docker build -f Dockerfile-rpmbuild -t carta-rpmbuild .
else
    echo "carta-rpmbuild image already exists."
fi

# if there is no srpm_file container
if ! docker ps -a | grep -q srpm_file; then
    echo "Creating srpm_file container..."
    # create the srpm_file container
    docker create -i -t --name srpm_file -v ~/rpmbuild:/root/rpmbuild carta-rpmbuild
else
    echo "srpm_file container already exists."
fi

SPEC=measures-data.spec
if [ $SPEC = "measures-data.spec" ]; then
    SOURCE_FILE=WSRT_Measures.ztar
    if [ ! -f $SOURCE_FILE ]; then
        echo "$SOURCE_FILE not found. Downloading..."
        wget ftp://ftp.astron.nl/outgoing/Measures/WSRT_Measures.ztar
        if [ $? -ne 0 ]; then
            echo "Failed to download $SOURCE_FILE. Please check your internet connection."
            exit 1
        fi
    else
        echo "$SOURCE_FILE already exists."
    fi
fi

echo "Building SRPM for $SPEC..."
docker start srpm_file

docker cp $SPEC srpm_file:/root/rpmbuild/SPECS/
docker cp $SOURCE_FILE srpm_file:/root/rpmbuild/SOURCES/
docker exec -it srpm_file /bin/bash -c "rpmbuild -bs /root/rpmbuild/SPECS/$SPEC"
srpm_output=$(docker exec srpm_file ls /root/rpmbuild/SRPMS)
docker cp srpm_file:/root/rpmbuild/SRPMS/${srpm_output} .
docker stop srpm_file
docker rm -f srpm_file

if [ -f "${srpm_output}" ]; then
    echo "SRPM file ${srpm_output} created successfully."
else
    echo "Failed to create SRPM file."
    exit 1
fi

