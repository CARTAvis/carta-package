## this script is used to publish the carta-frontend package to npm
## it requires a ~/.npmrc file with the npm token set
## it also requires jq to parse JSON files
## since we use docker to wrap the package, it requires Docker to be installed and running
## the npm token will determine where the package is published to


#!/bin/bash

## Read the npm_config file to set variables
if [[ -f ./npm_config ]]; then
    source ./npm_config
    NPM_TAG=dev # default npm tag to publish under
    # if BRANCH contains "rc", set NPM_TAG=rc
    if [[ "$BRANCH" == *"rc"* ]]; then
        NPM_TAG=rc
    fi
else
    echo "NPM/npm_config file not found. Please create it with the required configurations."
    exit 1
fi

if [[ "$DEV_RELEASE" = TRUE && "$BRANCH" != *"dev"* ]]; then
    echo "Publishing a development version but not on a dev branch. Please check your npm_config file."
    exit 1
fi

## set the temporary directory for carta-frontend ##
TEMP_FRONTEND_DIR=carta-frontend-temp

DATE=$(date +%Y%m%d)

if [[ "$DEBUG_MODE" = FALSE ]]; then
    echo "Removing temporary directory if it exists..."
    if [[ -d $TEMP_FRONTEND_DIR ]]; then
        rm -rf $TEMP_FRONTEND_DIR
    fi
fi

if [[ "$DEV_RELEASE" = FALSE ]]; then
    echo "You are about to release a new version of carta-frontend."
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Release cancelled."
        exit 0
    fi
    echo "Releasing a new version..."
else
    echo "You are about to publish a dev version of carta-frontend-dev."
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Dev version publishing cancelled."
        exit 0
    fi
    echo "Publishing a development version..."
fi

#### don't modify the any variables below this line ####

## check required tools ##
## check if jq is installed ##
if ! command -v jq &> /dev/null; then
    echo "jq is not installed. Please install jq to run this script."
    exit 1
fi

## check if Docker daemon is on ##
if ! docker info > /dev/null 2>&1; then
    echo "Docker daemon is not running. Please start Docker and try again."
    exit 1
fi

## check if the npm token is set in ~/.npmrc ##
if [ ! -f ~/.npmrc ]; then
    echo "No ~/.npmrc file found. Please create one with your npm configuration."
    exit 1
fi
## check required tools ##

# clone the carta-frontend repository if it doesn't exist
if [[ ! -d $TEMP_FRONTEND_DIR ]]; then
    echo "Cloning the carta-frontend repository..."
    git clone https://github.com/CARTAvis/carta-frontend.git $TEMP_FRONTEND_DIR
    if [ $? -ne 0 ]; then
        echo "Failed to clone the repository. Please check your internet connection or repository URL."
        exit 1
    fi
fi
cd $TEMP_FRONTEND_DIR
git checkout $BRANCH
git submodule update --init --recursive

## find and check the version in package.json ##
VERSION=$(jq -r '.version' package.json) # version to publish
if [[ -z "$VERSION" ]]; then
    echo "Version not found in package.json. Please set the version before publishing."
    exit 1
else 
    # check version pattern
    if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ || "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+\-[a-z]+\.[0-9]+$ || "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+\-[a-z]+\.[0-9][a-z]+$ || "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+\-[a-z]+$ ]]; then
        echo "Version format is incorrect. Please use semantic versioning (e.g., 1.0.0, 1.0.0-beta.1, 1.0.0-beta.1b, 1.0.0-dev)."
        exit 1
    fi
fi

if [[ $DEV_RELEASE = FALSE ]]; then
    ## check if name in package.json is consistent with carta-frontend ##
    PACKAGE_NAME=$(jq -r '.name' package.json)
    if [[ "$PACKAGE_NAME" != "carta-frontend" ]]; then
        echo "Package name in package.json is not 'carta-frontend'. Please check the package.json file."
        exit 1
    fi
else 
    PACKAGE_NAME=carta-frontend-dev # package name to publish
    # modify name in package.json for development version
    jq --arg name "$PACKAGE_NAME" '.name = "\($name)"' package.json > temp.json && mv temp.json package.json
    jq --arg version "$VERSION-$DATE" '.version = "\($version)"' package.json > temp.json && mv temp.json package.json
    VERSION="$VERSION-$DATE" # version to publish
fi

echo "Package name: $PACKAGE_NAME"
echo "Version to publish: $VERSION"
echo "Branch or tag: $BRANCH"
echo "NPM tag: $NPM_TAG"
read -p "Are you sure you want to continue? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
    echo "Publishing cancelled."
    exit 0
fi

if [[ "$DEBUG_MODE" = FALSE ]]; then
    ## install dependencies ##
    npm install 
    ## npm publish ##
    echo "Publishing $PACKAGE_NAME version $VERSION with tag $NPM_TAG..."
    npm publish --tag $NPM_TAG
fi


if [[ "$DEBUG_MODE" = FALSE ]]; then
    echo "Removing temporary directory if it exists..."
    if [[ -d $TEMP_FRONTEND_DIR ]]; then
        rm -rf $TEMP_FRONTEND_DIR
    fi
fi

exit 0