#!/bin/bash

# download the latest appimagetool
wget -c https://github.com/`wget -q https://github.com/probonopd/go-appimage/releases/expanded_assets/continuous -O - | grep "appimagetool-.*-${ARCH}.AppImage" | head -n 1 | awk '{print $2}' | cut -d '"' -f 2`
if [ -f appimagetool-${APPIMAGE_VERSION}-$(arch).AppImage ]; then
    chmod 755 appimagetool-${APPIMAGE_VERSION}-$(arch).AppImage
    APPIMAGE_EXTRACT_AND_RUN=1 ARCH=$(arch) VERSION=${VERSION} ./appimagetool-${APPIMAGE_VERSION}-$(arch).AppImage CARTA
fi

# Extract a unique Embedded Signature
if [ -x carta-${VERSION}-$(arch).AppImage ]; then
    ./carta-${VERSION}-$(arch).AppImage --appimage-signature > Embedded-Signature
fi
