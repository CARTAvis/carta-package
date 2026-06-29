#!/bin/bash

# Check if docker is on
if ! command -v docker &> /dev/null
then
    echo "docker could not be found"
    exit
fi

# clean up docker builder cache
docker builder prune -a

docker login

docker buildx build -f Dockerfile --platform linux/amd64,linux/arm64 --push -t cartavis/carta:x.0.0 .

exit 0


## manually add latest tag to dockerhub
## docker buildx imagetools create --tag cartavis/carta:latest cartavis/carta:x.0.0