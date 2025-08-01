#!/bin/bash

source ./appimage_config

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

if [[ -f carta-${VERSION}-${ARCH}.AppImage ]]; then
    if [[ $RELEASE = "TRUE" ]]; then
        mv carta-${VERSION}-${ARCH}.AppImage carta-${ARCH}.AppImage
    fi
fi

# Extract a unique Embedded Signature
if [[ -x carta-${VERSION}-${ARCH}.AppImage ]]; then
    ./carta-${VERSION}-${ARCH}.AppImage --appimage-signature > Embedded-Signature
fi
