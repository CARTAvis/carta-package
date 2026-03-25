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
password=$(/opt/homebrew/bin/openssl enc -aes-256-cbc -d -a -salt -iter 100 -pass pass:
YOUR_PASS -in /Users/USERS/encrypted_password.enc)
security unlock-keychain -p $password ~/Library/Keychains/login.keychain-db

export DEBUG=@electron/notarize*
export APPLE_APP_SPECIFIC_PASSWORD=
export APPLE_ID=
export APPLE_TEAM_ID=
export API_KEY_ID=
export API_KEY_ISSUER_ID=
# notarize setting #

npm install
npm install -g electron-builder

if [ "$ARCH" == "arm64" ]; then
    ${PACKAGING_PATH}/pack/node_modules/.bin/electron-builder build --mac --${ARCH}
else
    ${PACKAGING_PATH}/pack/node_modules/.bin/electron-builder build --mac --x64
fi
