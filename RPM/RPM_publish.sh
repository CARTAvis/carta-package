# this script is used to publish the RPM package to the repository

#!/bin/bash

## choose the release type ##
RELEASE=TRUE # set to TRUE to release a new version, or FALSE to publish a dev version
# RELEASE=FALSE # set to TRUE to release a new version, or FALSE to publish a dev version

if [ "$RELEASE" = TRUE ]; then
    echo "You are about to release a new version of the RPM package."
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Release cancelled."
        exit 0
    fi
    echo "Releasing a new version..."
    COPR_REPO=carta
else
    echo "Publishing a development version..."
    COPR_REPO=carta-dev
fi

## check the requirements ##
# check copr-cli is installed
if ! command -v copr-cli &> /dev/null; then
    echo "copr-cli is not installed. Please install copr-cli by running 'pip install copr-cli' to run this script."
    exit 1
fi

# check build_spec-files.txt exists
if [ ! -f build_spec_files.txt ]; then
    echo "build_spec_files.txt not found. Please create a file with the list of spec files to build."
    exit 1
fi

if [ -f ~/.config/copr ]; then
    # check the ~/.config/copr and its expiration date
    EXPIRATION_DATE=$(grep 'expiration date' ~/.config/copr | cut -d ':' -f 2 | xargs)
    if [[ -z "$EXPIRATION_DATE" ]]; then
        echo "No expiration date found in ~/.config/copr. Please check your configuration."
        exit 1
    fi
    CURRENT_DATE=$(date +%Y-%m-%d)
    if [[ "$CURRENT_DATE" > "$EXPIRATION_DATE" ]]; then
        echo "Your COPR token has expired on $EXPIRATION_DATE. Please renew your token from https://copr.fedorainfracloud.org/api/."
        exit 1
    fi
else
    echo "No COPR configuration file found. Please copy the token from https://copr.fedorainfracloud.org/api/ to the file ~/.config/copr."
    exit 1
fi
## check the requirements ##

USERNAME=`copr-cli whoami`
if [ "$USERNAME" != cartavis ]; then
    echo "You are not logged in to cartavis. Please copy the correct token from https://copr.fedorainfracloud.org/api/ to the file ~/.config/copr."
    exit 1
fi

# make a loop for spec files in the list
for SPEC in $(cat build_spec_files.txt); do
    if [ -f "$SPEC" ]; then
        echo "Building $SPEC..."
        copr-cli build --enable-net on $COPR_REPO $SPEC
    else
        echo "Spec file $SPEC not found."
    fi
done

echo "All builds submitted to COPR repository $COPR_REPO."