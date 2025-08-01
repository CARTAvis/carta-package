#!/bin/bash

source ./dmg_config
echo "Starting AppImage build process..."
echo "Backend release version: ${BACKEND_VERSION}"
echo "Frontend release version: ${FRONTEND_VERSION}"
read -p "Are versions correct? (y/n): " confirm
if [[ "$confirm" != "y" ]]; then
    echo "Exiting build process."
    exit 1
fi

NAME=CARTA
YEAR=$(date +%Y)

# Parameters check 
if [[ "${NPM_FRONTEND}" = "TRUE" && "${RELEASE}" = "FALSE" ]]; then
    echo "NPM pre-build frontend is only for release version."
    echo "Set NPM_FRONTEND to FALSE if it is Auto App Assembler or test build."
    exit 1
fi

cd ${PACKAGING_PATH}

# modify name and version in files/pack/package.json
jq --arg name "$NAME" --arg version "$RELEASE_VERSION" '.name = $name | .version = $version' files/pack/package.json > files/pack/package.json.tmp && mv files/pack/package.json.tmp files/pack/package.json
jq --arg year "$YEAR" '.description = "\($year) CARTA Desktop"' files/pack/package.json > files/pack/package.json.tmp && mv files/pack/package.json.tmp files/pack/package.json


## prepare some necessary files
if [ -d pack ]; then
    echo "Removing existing pack directory..."
    rm -rf pack
fi
mkdir pack
cp -r ${PACKAGING_PATH}/files/pack/* ${PACKAGING_PATH}/pack


# if there no ephemerides and geodetic in ${PACKAGING_PATH}/files/etc/data
if [ ! -d ${PACKAGING_PATH}/files/etc/data/ephemerides ] || [ ! -d ${PACKAGING_PATH}/files/etc/data/geodetic ] || [ "${UPDATE_MEASURES_DATA}" = "TRUE" ]; then
    echo "Downloading ephemerides and geodetic data..."
    mkdir -p ${PACKAGING_PATH}/files/etc/data
    cd ${PACKAGING_PATH}/files/etc/data
    wget ftp://ftp.astron.nl/outgoing/Measures/WSRT_Measures.ztar
    tar -xvf WSRT_Measures.ztar*
    rm -f WSRT_Measures.ztar*
fi

cd ${PACKAGING_PATH}
cp -r ./files/etc ./pack/carta-backend/

# prepare frontend
if [ "${PREPARE_FRONTEND}" = "TRUE" ]; then
    
    if [ -d package ]; then
        echo "Removing existing package directory..."
        rm -rf package
    fi

    if [ "${NPM_FRONTEND}" = "TRUE" ]; then
        ## see frontend version: https://www.npmjs.com/package/carta-frontend?activeTab=versions
        echo "Downloading carta-frontend version ${FRONTEND_VERSION}..."
        NPM_FRONTEND_VERSION=${FRONTEND_VERSION#v}
        wget https://registry.npmjs.org/carta-frontend/-/carta-frontend-${NPM_FRONTEND_VERSION}.tgz
        if [ $? -ne 0 ]; then
            echo "Failed to download carta-frontend version ${FRONTEND_VERSION}."
            exit 1
        fi

        if [ ! -f carta-frontend-${NPM_FRONTEND_VERSION}.tgz ]; then
            echo "Downloaded file not found. Please check the version."
            exit 1
        fi
        tar -xvf carta-frontend-${NPM_FRONTEND_VERSION}.tgz
        rm carta-frontend-${NPM_FRONTEND_VERSION}.tgz
    else
        # check if emcc is installed
        if ! command -v emcc &> /dev/null; then
            echo "emcc is not installed. Please install Emscripten SDK."
            exit 1
        fi
        # activate emsdk
        echo "Activating emsdk..."
        ${EMSDK_PATH}/emsdk install latest
        ${EMSDK_PATH}/emsdk activate latest
        source ${EMSDK_PATH}/emsdk_env.sh

        git clone https://github.com/CARTAvis/carta-frontend.git package
        cd package
        git checkout ${FRONTEND_VERSION}
        git submodule update --init --recursive
        npm install
        npm run build-libs
        npm run build
    fi

    cp -r ${PACKAGING_PATH}/package/build/* ./pack
fi


# prepare backend
if [ "${PREPARE_BACKEND}" = "TRUE" ]; then
    echo "Backend release version: ${BACKEND_VERSION}"
    echo "Preparing backend..."
    FOLDER_PREFIX=".carta"
    if [ "${BETA_RELEASE}" = "TRUE" ]; then
        FOLDER_PREFIX=".carta-beta"
    fi

    if [! -d /opt/casaroot-carta-casacore ]; then
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
    cp -r ${PACKAGING_PATH}/carta-backend/build/libs ${PACKAGING_PATH}/pack/carta-backend/
    cp -r ${PACKAGING_PATH}/carta-backend/build/carta_backend ${PACKAGING_PATH}/pack/carta-backend/bin

fi

echo "Running Apple notarization..."
cd ${PACKAGING_PATH}
sh ./pack_n_notarize.sh


# clean frontend
if [ "${CLEAN_FRONTEND}" = "TRUE" ]; then
    echo "Cleaning frontend..."
    rm -rf ${PACKAGING_PATH}/package
fi
# clean backend
if [ "${CLEAN_BACKEND}" = "TRUE" ]; then
    echo "Cleaning backend..."  
    rm -rf ${PACKAGING_PATH}/carta-backend
fi


# rename dmg file
cd ${PACKAGING_PATH}/pack/dist
if [ -f ./CARTA-${RELEASE_VERSION}-$ARCH.dmg ]; then
    if [ $RELEASE = "TRUE" ]; then
        echo "Renaming dmg to CARTA-$ARCH.dmg..."
        mv ./CARTA-${RELEASE_VERSION}-$ARCH.dmg ./CARTA-$ARCH.dmg
    else
        echo "Renaming dmg to CARTA-$FRONTEND_VERSION-$BACKEND_VERSION-$ARCH.dmg..."
        mv ./CARTA-${RELEASE_VERSION}-$ARCH.dmg ./CARTA-$FRONTEND_VERSION-$BACKEND_VERSION-$ARCH.dmg
    fi
else
    echo "CARTA dmg not found. Please check the build process."
fi 