# This script is run in the docker container to build the CARTA AppImage.
#!/bin/bash

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

# insure folder CARTA does not exist
if [ -d ${DOCKER_PACKAGING_PATH}/CARTA ]; then
    echo "CARTA folder already exists. Removing it."
    rm -rf ${DOCKER_PACKAGING_PATH}/CARTA
fi

# Copy required files to CARTA folder
mkdir -p ${DOCKER_PACKAGING_PATH}/CARTA
cp ${DOCKER_PACKAGING_PATH}/AppRun ${DOCKER_PACKAGING_PATH}/CARTA
cp ${DOCKER_PACKAGING_PATH}/carta.desktop ${DOCKER_PACKAGING_PATH}/CARTA
cp ${DOCKER_PACKAGING_PATH}/carta.png ${DOCKER_PACKAGING_PATH}/CARTA
cp ${DOCKER_PACKAGING_PATH}/org.carta.desktop.appdata.xml ${DOCKER_PACKAGING_PATH}/CARTA/usr/share/metainfo

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
cd ${DOCKER_PACKAGING_PATH}

if [ "${PREPARE_FRONTEND}" = "TRUE" ]; then
    echo "Frontend release version: ${FRONTEND_VERSION}"
    echo "Preparing frontend..."
    
    # clean frontend
    if [ "${CLEAN_FRONTEND}" = "TRUE" ]; then
        echo "Cleaning frontend..."
        rm -rf ${DOCKER_PACKAGING_PATH}/package
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
        if ! command -v emcc &> /dev/null; then
            echo "emcc is not installed. Please install Emscripten SDK."
            # activate emsdk
            echo "Activating emsdk..."
            ${EMSDK_PATH}/emsdk install ${EMSDK_VERSION}
            ${EMSDK_PATH}/emsdk activate ${EMSDK_VERSION}
            source ${EMSDK_PATH}/emsdk_env.sh
        fi

        if [ ! -d /pack/package ]; then
            echo "Cloning carta-frontend repository..."
            git clone https://github.com/CARTAvis/carta-frontend.git package
            cd ${DOCKER_PACKAGING_PATH}/package
            git checkout ${FRONTEND_VERSION}
            git submodule update --init --recursive
            npm install
            npm run build-libs
        else
            cd ${DOCKER_PACKAGING_PATH}/package
            git checkout ${FRONTEND_VERSION}
            git submodule update
            npm install

            if [ -d ${DOCKER_PACKAGING_PATH}/package/build ]; then
                echo "Removing existing build directory..."
                rm -rf ${DOCKER_PACKAGING_PATH}/package/build
                mkdir -p ${DOCKER_PACKAGING_PATH}/package/build
            fi
        fi

        npm run build
    fi
    echo "Finished preparing frontend."
fi
## prepare frontend ##


## prepare backend and libs ##
cd ${DOCKER_PACKAGING_PATH}

if [ "${PREPARE_BACKEND}" = "TRUE" ]; then
    echo "Backend release version: ${BACKEND_VERSION}"
    echo "Preparing backend..."
    FOLDER_PREFIX=".carta"
    if [ "${BETA_RELEASE}" = "TRUE" ]; then
        FOLDER_PREFIX=".carta-beta"
    fi

    if [ ! -d /opt/carta-casacore ]; then
        echo "CARTA casacore root directory not found. Please install carta-casacore with floating CASAROOT first."
        exit 1
    fi

    # clean backend
    if [ "${CLEAN_BACKEND}" = "TRUE" ]; then
        echo "Cleaning backend..."  
        rm -rf ${DOCKER_PACKAGING_PATH}/carta-backend
    fi

    if [ ! -d ${DOCKER_PACKAGING_PATH}/carta-backend ]; then
        echo "Cloning carta-backend repository..."
        git clone https://github.com/CARTAvis/carta-backend.git
        cd ${DOCKER_PACKAGING_PATH}/carta-backend
        git checkout ${BACKEND_VERSION}
        git submodule update --init
    else 
        cd ${DOCKER_PACKAGING_PATH}/carta-backend
        git checkout ${BACKEND_VERSION}
        git submodule update

        if [ -d ${DOCKER_PACKAGING_PATH}/carta-backend/build ]; then
            echo "Removing existing build directory..."
            rm -rf ${DOCKER_PACKAGING_PATH}/carta-backend/build
        fi
    fi

    mkdir -p ${DOCKER_PACKAGING_PATH}/carta-backend/build
    cd ${DOCKER_PACKAGING_PATH}/carta-backend/build
    cmake .. -DCMAKE_BUILD_TYPE=RelWithDebInfo -DCartaUserFolderPrefix=${FOLDER_PREFIX} -DDEPLOYMENT_TYPE=appimage -DCMAKE_PREFIX_PATH=/opt/cfitsio
    make -j 4

    # Copy libraries to ${DOCKER_PACKAGING_PATH}/CARTA/lib and the binary to ${DOCKER_PACKAGING_PATH}/CARTA/bin
    sh ${DOCKER_PACKAGING_PATH}/cp_libs.sh
    echo "Finished preparing backend and libs."
fi
## prepare backend and libs ##

## AppImage packaging ##
cd ${DOCKER_PACKAGING_PATH}

# If it is a release, set the version to the release version, otherwise set it to the combination of backend and frontend versions
if [ "${RELEASE}" = "TRUE" ]; then
    VERSION=${RELEASE_VERSION}
else
    VERSION="${FRONTEND_VERSION}-${BACKEND_VERSION}"
fi

ARCH=$(arch)
if [ ${ARCH} = "arm64" ]; then
    ARCH="aarch64"
fi

APPIMAGE_VERSION=$(wget -q https://github.com/probonopd/go-appimage/releases/expanded_assets/continuous -O - | grep "appimagetool-.*-aarch64.AppImage" | head -n 1 | awk '{print $2}' | grep -o '[[:digit:]]\+' | head -n 1)

if [[ ! -f appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage ]]; then
    rm -f appimagetool-*-${ARCH}.AppImage
    echo "appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage not found. Downloading..."
    wget -c https://github.com/probonopd/go-appimage/releases/download/continuous/appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage
fi

if [[ -f appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage ]]; then
    chmod 755 appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage
    APPIMAGE_EXTRACT_AND_RUN=1 ARCH=${ARCH} VERSION=${VERSION} ./appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage CARTA
fi

# Extract a unique Embedded Signature
if [[ -x carta-${VERSION}-${ARCH}.AppImage ]]; then
    ./carta-${VERSION}-${ARCH}.AppImage --appimage-signature > Embedded-Signature
fi