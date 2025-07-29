# This script is run in the docker container to build the CARTA AppImage.
#!/bin/bash

source /root/appimage_config
echo "Starting AppImage build process..."
echo "Backend release version: ${BACKEND_VERSION}"
echo "Frontend release version: ${FRONTEND_VERSION}"
read -p "Are versions correct? (y/n): " confirm
if [[ "$confirm" != "y" ]]; then
    echo "Exiting build process."
    exit 1
fi

# Parameters check 
if [ "${NPM_FRONTEND}" = "TRUE" && "${RELEASE}" = "FALSE" ]; then
    echo "NPM pre-build frontend is only for release version."
    echo "Set NPM_FRONTEND to FALSE if it is Auto App Assembler or test build."
    exit 1
fi

cd /root

if [ "$UPDATE_MEASURES_DATA" = "TRUE" ]; then
    echo "Updating Measures data..."
    if [ -d /usr/local/share/casacore/data ]; then
        echo "Removing existing Measures data..."
        rm -rf /usr/local/share/casacore/data
    fi
    mkdir -p /usr/local/share/casacore/data
    wget ftp://ftp.astron.nl/outgoing/Measures/WSRT_Measures.ztar
    tar -xzf WSRT_Measures.ztar
    cp -r geodetic /usr/local/share/casacore/data
    cp -r ephemerides /usr/local/share/casacore/data
    rm -rf WSRT_Measures.ztar geodetic ephemerides
fi

## prepare frontend ##
if [ "${PREPARE_FRONTEND}" = "TRUE" ]; then
    echo "Frontend release version: ${FRONTEND_VERSION}"
    echo "Preparing frontend..."
    
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
        # activate emsdk
        echo "Activating emsdk..."
        ./emsdk/emsdk install latest
        ./emsdk/emsdk activate latest
        source ./emsdk/emsdk_env.sh

        echo "Cloning carta-frontend repository..."
        git clone https://github.com/CARTAvis/carta-frontend.git package
        cd package
        git checkout ${FRONTEND_VERSION}
        git submodule update --init --recursive
        npm install
        npm run build-libs
        npm run build
    fi
    echo "Finished preparing frontend."
fi
## prepare frontend ##


## prepare backend and libs ##
if [ "${PREPARE_BACKEND}" = "TRUE" ]; then
    echo "Backend release version: ${BACKEND_VERSION}"
    echo "Preparing backend..."
    FOLDER_PREFIX=".carta"
    if [ "${BETA_RELEASE}" = "TRUE" ]; then
        FOLDER_PREFIX=".carta-beta"
    fi

    if [ -d carta-backend ]; then
        echo "Removing existing carta-backend directory..."
        rm -rf carta-backend
    fi

    git clone https://github.com/CARTAvis/carta-backend.git
    cd /root/carta-backend
    git checkout ${BACKEND_VERSION}
    git submodule update --init
    mkdir build
    cd /root/carta-backend/build
    cmake .. -DCMAKE_BUILD_TYPE=RelWithDebInfo -DCartaUserFolderPrefix=${FOLDER_PREFIX} -DDEPLOYMENT_TYPE=appimage -DCMAKE_PREFIX_PATH=/opt/cfitsio
    make -j 2

    # Copy libraries to /root/CARTA/lib and the binary to /root/CARTA/bin
    sh /root/cp_libs.sh
    echo "Finished preparing backend and libs."
fi
## prepare backend and libs ##
