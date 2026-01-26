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

# Remove existing container if it exists
if docker ps -a | grep -q srpm_file; then
    echo "Removing existing srpm_file container..."
    docker rm -f srpm_file
fi

echo "Creating srpm_file container..."
# create the srpm_file container
docker run -d --name srpm_file -v ~/rpmbuild:/root/rpmbuild carta-rpmbuild /bin/bash -c "while true; do sleep 3600; done"

# Wait for container to be fully running
sleep 2

SPEC=measures-data.spec
if [ $SPEC = "measures-data.spec" ]; then
    SOURCE_FILE=WSRT_Measures.ztar
    echo "Downloading latest $SOURCE_FILE from ftp.astron.nl..."
    rm -f $SOURCE_FILE
    wget ftp://ftp.astron.nl/outgoing/Measures/WSRT_Measures.ztar
    if [ $? -ne 0 ]; then
        echo "Failed to download $SOURCE_FILE. Please check your internet connection."
        exit 1
    fi

    # Wait for file to be fully written to disk
    echo "Sleeping 60 seconds to ensure $SOURCE_FILE is fully written..."
    sleep 60

    # Verify file exists and has content
    if [ ! -s $SOURCE_FILE ]; then
        echo "Error: Downloaded file is empty or missing"
        exit 1
    fi

    echo "Successfully downloaded $SOURCE_FILE ($(du -h $SOURCE_FILE | cut -f1))"
fi

echo "Building SRPM for $SPEC..."

# Ensure directories exist in container
docker exec srpm_file /bin/bash -c "mkdir -p /root/rpmbuild/SPECS /root/rpmbuild/SOURCES /root/rpmbuild/SRPMS"

docker cp $SPEC srpm_file:/root/rpmbuild/SPECS/
docker cp $SOURCE_FILE srpm_file:/root/rpmbuild/SOURCES/
docker exec srpm_file /bin/bash -c "rpmbuild -bs /root/rpmbuild/SPECS/$SPEC"

# Get the most recently created SRPM file
srpm_output=$(docker exec srpm_file bash -c 'ls -t /root/rpmbuild/SRPMS/measures*.rpm 2>/dev/null | head -1 | xargs -n 1 basename')

if [ -z "$srpm_output" ]; then
    echo "Failed to build SRPM."
    docker rm -f srpm_file
    exit 1
fi

docker cp srpm_file:/root/rpmbuild/SRPMS/${srpm_output} .
docker rm -f srpm_file

if [ -f "${srpm_output}" ]; then
    echo "SRPM file SRPM file ${srpm_output}  created successfully."
else
    echo "Failed to create SRPM file."
    exit 1
fi
