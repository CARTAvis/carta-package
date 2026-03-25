#!/bin/bash
# This script generates a default dmg_config file for the macOS Electron packaging process.

cat > dmg_config <<EOL
#!/bin/bash

EMSDK_PATH=../emsdk
PACKAGING_PATH=$(pwd)

# ARCH=$(arch)
ARCH=arm64
BACKGROUND_FIGURE=""

# Can be branch, tag or commit
FRONTEND_VERSION=v6.0.0-beta.1.0.2
BACKEND_VERSION=v6.0.0-beta.1

RELEASE=TRUE

# Release version, for naming the output
RELEASE_VERSION=v6.0.0-beta.1

NPM_FRONTEND=TRUE

# Set to TRUE if it is a beta release
BETA_RELEASE=TRUE

# for debug purposes
PREPARE_FRONTEND=TRUE
PREPARE_BACKEND=TRUE

CLEAN_FRONTEND=TRUE
CLEAN_BACKEND=TRUE

EOL

echo "Default dmg_config generated."
