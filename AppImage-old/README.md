## Use Docker to create a universal AppImage for CARTA

## Note: Old method for v3.0.0-beta.3 and earlier.

### Basic usage:

Execute the `./create-appimage-redhat.sh` or `./create-appimage-ubuntu.sh` scripts. They will create the v3.0.0-beta.3 AppImages automatically.

### Advanced usage:

1. Open the script `create-appimage-redhat.sh` or `create-appimage-ubuntu.sh` scripts for editing.

2. Modify the `BACKEND_TAG`, `FRONTEND_TAG`, and `NAME` variables. 

 Available backend tags can be found here: https://github.com/CARTAvis/carta-backend/releases 
 (carta-backend Github branch names could also be used).

 Available frontend tags can be found here: https://www.npmjs.com/package/carta-frontend?activeTab=explore
 (In this version of the Dockerfile, a pre-built production frontend is simply taken from the npm packages, so the carta-frontend Github 
 branch names can not be used. But it could if the carta-frontend were to be built from source in the Dockerfile. This could be easily added in the 
 next update).

 The current carta-casacore `master` branch will be used, but that can easily be adjusted in the Dockerfiles if needed.

 The `NAME` variable allows you to provide a custom name to the resulting AppImage e.g. `<NAME>-redhat.AppImage`

3. Make sure Docker is available and running on your system.

4. Execute the script `./create-appimage-redhat.sh` or `./create-appimage-ubuntu.sh` 

 Docker will build the container, run the container to copy out the AppImage, and then stop the container.

5. The end result will be an AppImage in this folder. The `ubuntu` version should be able to run on 18.04 to 20.04. The `redhat` version should be able to run on any RHEL 7 and 8 derivatives, such as CentOS7 or AlmaLinux.

### Notes:

To run an AppImage inside a Docker container (or a system without FUSE enabled): `APPIMAGE_EXTRACT_AND_RUN=1 ./CARTA-v3.0.0-beta.3-ubuntu.AppImage`
