# This script is run in the docker container to build the CARTA AppImage.
#!/bin/bash

source /root/appimage_config
echo "Starting AppImage build process..."
echo "Backend release version: ${BACKEND_RELEASE_VERSION}"
echo "Frontend release version: ${FRONTEND_RELEASE_VERSION}"
read -p "Are versions correct? (y/n): " confirm
if [[ "$confirm" != "y" ]]; then
    echo "Exiting build process."
    exit 1
fi

cd /root

## prepare frontend ##
if [ "${PREPARE_FRONTEND}" = "TRUE" ]; then
    echo "Frontend release version: ${FRONTEND_RELEASE_VERSION}"
    echo "Preparing frontend..."
    rm -rf package

    if [ "${NPM_FRONTEND}" = "TRUE" ]; then
        ## see frontend version: https://www.npmjs.com/package/carta-frontend?activeTab=versions
        echo "Downloading carta-frontend version ${FRONTEND_RELEASE_VERSION}..."
        wget https://registry.npmjs.org/carta-frontend/-/carta-frontend-${FRONTEND_RELEASE_VERSION}.tgz
        if [ $? -ne 0 ]; then
            echo "Failed to download carta-frontend version ${FRONTEND_RELEASE_VERSION}."
            exit 1
        fi
        tar -xvf carta-frontend-${FRONTEND_RELEASE_VERSION}.tgz
        rm carta-frontend-${FRONTEND_RELEASE_VERSION}.tgz
    else
        # activate emsdk
        echo "Activating emsdk..."
        ./emsdk install latest
        ./emsdk/emsdk activate latest
        source ./emsdk/emsdk_env.sh

        echo "Cloning carta-frontend repository..."
        git clone https://github.com/CARTAvis/carta-frontend.git package
        cd package
        git checkout v${FRONTEND_RELEASE_VERSION}
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
    echo "Backend release version: ${BACKEND_RELEASE_VERSION}"
    echo "Preparing backend..."
    FOLDER_PREFIX=".carta"
    if [ "${BETA_RELEASE}" = "TRUE" ]; then
        FOLDER_PREFIX=".carta-beta"
    fi

    rm -rf carta-backend

    git clone https://github.com/CARTAvis/carta-backend.git
    cd /root/carta-backend
    git checkout ${BACKEND_RELEASE_VERSION}
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
