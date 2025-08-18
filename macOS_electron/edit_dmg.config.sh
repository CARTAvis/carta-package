#!/bin/bash

CONFIG_FILE="dmg_config"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: $CONFIG_FILE not found."
    exit 1
fi

ARCH=$(arch)

# Parse keyword arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --frontend)
            FRONTEND_TAG="$2"
            shift; shift
            ;;
        --backend)
            BACKEND_TAG="$2"
            shift; shift
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

# if not FRONTEND_TAG or BACKEND_TAG set, exist program
if [ -z "$FRONTEND_TAG" ] || [ -z "$BACKEND_TAG" ]; then
    echo "Error: FRONTEND_TAG and BACKEND_TAG must be set."
    exit 1
fi

# replace the ARCH line
sed "s/^ARCH=.*/ARCH=${ARCH}/" "$CONFIG_FILE"
echo "ARCH set to ${ARCH}."

sed "s/^FRONTEND_VERSION=.*/FRONTEND_VERSION=${FRONTEND_TAG}/" "$CONFIG_FILE"
echo "FRONTEND_VERSION set to ${FRONTEND_TAG}."

sed "s/^BACKEND_VERSION=.*/BACKEND_VERSION=${BACKEND_TAG}/" "$CONFIG_FILE"
echo "BACKEND_VERSION set to ${BACKEND_TAG}."

sed "s/^RELEASE=.*/RELEASE=FALSE/" "$CONFIG_FILE"
echo "RELEASE set to FALSE."

sed "s/^NPM_FRONTEND=.*/NPM_FRONTEND=FALSE/" "$CONFIG_FILE"
echo "NPM_FRONTEND set to FALSE."

