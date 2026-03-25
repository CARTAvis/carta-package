#!/bin/bash
# This script generates a default appimage_config file for the macOS Electron packaging process.

cat > appimage_config <<EOL
#!/bin/bash
EMSDK_PATH=/root/emsdk
EMSDK_VERSION=4.0.3
NODE_VERSION=22
BIN_PATH=/usr/local/bin

IMAGE_NAME="carta-appimage-create"
CONTAINER_NAME="carta-appimage-container"

PACKAGING_PATH=$(pwd)
DOCKER_PACKAGING_PATH=/pack

ARCH=$(arch)
BACKGROUND_FIGURE=""

# Can be branch, tag or commit
FRONTEND_VERSION=v6.0.0-beta.1.0.2
BACKEND_VERSION=v6.0.0-beta.1

RELEASE=TRUE

# Naming the output file if it is a release packaging (RELEASE=TRUE)
RELEASE_VERSION=v6.0.0-beta.1

NPM_FRONTEND=TRUE

# Set to TRUE if it is a beta release
BETA_RELEASE=TRUE

# Set to TRUE to update the measurement data
UPDATE_MEASURES_DATA=TRUE

PREPARE_FRONTEND=TRUE
PREPARE_BACKEND=TRUE

# Set to TRUE if it is a release packaging (RELEASE=TRUE)
CLEAN_FRONTEND=TRUE
CLEAN_BACKEND=TRUE

EOL

echo "Default appimage_config generated."
