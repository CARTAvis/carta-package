#!/bin/bash

source ./dmg_config

echo "Starting backend build process..."
echo "Backend (branch, tag, or commit): ${BACKEND_VERSION}"


cd ${PACKAGING_PATH}
# prepare backend
echo "Preparing backend..."
FOLDER_PREFIX=".carta"

if [ ! -d /opt/casaroot-carta-casacore ]; then
    echo "CARTA casacore root directory not found. Please install carta-casacore with floating CASAROOT first."
    exit 1
fi

if [ -d ${PACKAGING_PATH}/carta-backend ]; then
    echo "Removing existing carta-backend directory..."
    rm -rf ${PACKAGING_PATH}/carta-backend
fi

git clone https://github.com/CARTAvis/carta-backend.git
cd ${PACKAGING_PATH}/carta-backend
git checkout ${BACKEND_VERSION}
git submodule update --init
mkdir build
cd ${PACKAGING_PATH}/carta-backend/build
cmake .. -DCMAKE_BUILD_TYPE=RelWithDebInfo -DCARTA_CASACORE_ROOT=/opt/casaroot-carta-casacore -DCartaUserFolderPrefix=${FOLDER_PREFIX} -DDEPLOYMENT_TYPE=electron
make -j 4

echo "Copying backend libraries..."
sh ${PACKAGING_PATH}/cp_libs.sh ${PACKAGING_PATH}/carta-backend/build

echo "Backend build complete"