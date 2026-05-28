#!/bin/bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm use 22

source ./dmg_config

## packaging ##
cd ${PACKAGING_PATH}/pack
rm -rf ${PACKAGING_PATH}/pack/dist

# notarize setting #
password=$(/usr/local/opt/openssl@3/bin/openssl enc -aes-256-cbc -d -a -salt -iter 100 -pass pass:PASS_KEY -in /Users/acdc/encrypted_password.enc)
export CSC_LINK=
export CSC_KEY_PASSWORD=

export DEBUG=@electron/notarize*
export APPLE_APP_SPECIFIC_PASSWORD=
export APPLE_ID_PASSWORD=
export APPLE_ID=
export APPLE_TEAM_ID=
export CSC_PARALLELIZATION=false
# notarize setting #

npm install
npm install -g electron-builder


if [ $ARCH == "arm64" ]; then
    ${PACKAGING_PATH}/pack/node_modules/.bin/electron-builder build --mac --arm64
else
    ${PACKAGING_PATH}/pack/node_modules/.bin/electron-builder build --mac --x64
fi

