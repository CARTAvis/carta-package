#!/bin/bash

ARCH=$(arch)
if [ ${ARCH} = "arm64" ]; then
    ARCH="aarch64"
fi

# download the latest appimagetool
echo "Downloading appimagetool for ${ARCH} architecture..."
wget -c https://github.com/`wget -q https://github.com/probonopd/go-appimage/releases/expanded_assets/continuous -O - | grep "appimagetool-.*-${ARCH}.AppImage" | head -n 1 | awk '{print $2}' | cut -d '"' -f 2`
if [ -f appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage ]; then
    chmod 755 appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage
    APPIMAGE_EXTRACT_AND_RUN=1 ARCH=${ARCH} VERSION=${VERSION} ./appimagetool-${APPIMAGE_VERSION}-${ARCH}.AppImage CARTA
fi

# Extract a unique Embedded Signature
if [ -x carta-${VERSION}-${ARCH}.AppImage ]; then
    ./carta-${VERSION}-${ARCH}.AppImage --appimage-signature > Embedded-Signature
fi
