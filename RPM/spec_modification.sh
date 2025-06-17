# this script modifies the spec file to include the correct name and version of the package

#!/bin/bash

RELEASE=FALSE # set to TRUE to release a new version, or FALSE to publish a dev version
VERSION=5.0.0
BACKEND_VERSION=5.0.0
FRONTEND_VERSION=5.0.0
OBSOLETE_VERSION=5.0.0


# modify carta.spec
if [ ! -f carta.spec ]; then
    echo "carta.spec not found. Please ensure you are in the correct directory."
    exit 1
fi

OLD_NAME=$(awk '/^Name:/ {print $2}' carta.spec)
if [ -z "$OLD_NAME" ]; then
    echo "Name not found in carta.spec. Please check the spec file."
    exit 1
fi
echo "Modifying carta.spec for $OLD_NAME..."

OLD_VERSION=$(awk '/^Version:/ {print $2}' carta.spec)
if [ -z "$OLD_VERSION" ]; then
    echo "Version not found in carta.spec. Please check the spec file."
    exit 1
fi
echo "Changing old version from $OLD_VERSION to $VERSION."

OLD_BACKEND_VERSION=$(awk '/^Requires: *carta-backend/ {print $4}' carta.spec)
if [ -z "$OLD_BACKEND_VERSION" ]; then
    echo "Backend version not found in carta.spec. Please check the spec file."
    exit 1
fi
echo "Changing backend version from $OLD_BACKEND_VERSION to $BACKEND_VERSION."

OLD_FRONTEND_VERSION=$(awk '/^Requires: *carta-frontend/ {print $4}' carta.spec)
if [ -z "$OLD_FRONTEND_VERSION" ]; then
    echo "Frontend version not found in carta.spec. Please check the spec file."
    exit 1
fi
echo "Changing frontend version from $OLD_FRONTEND_VERSION to $FRONTEND_VERSION."

OLD_OBSOLETE_VERSION=$(awk "/^Obsoletes: *${OLD_NAME}/ {print \$4}" carta.spec)
if [ -z "$OLD_OBSOLETE_VERSION" ]; then
    echo "Obsolete version not found in carta.spec. Please check the spec file."
    exit 1
fi
echo "Changing obsolete version from $OLD_OBSOLETE_VERSION to $OBSOLETE_VERSION."

# if [ "$RELEASE" = TRUE ]; then
#     echo "Releasing a new version in carta..."
    
#     sed -i "s/Name: $OLD_NAME/Name: carta/" carta.spec
    
#     sed -i "s/Version: $OLD_VERSION/Version: $VERSION/" carta.spec
# else
#     echo "Publishing a development version in carta-dev..."
#     sed -i 's/Version: .*/Version: 0.1.0/' carta.spec
# fi