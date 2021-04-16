### Use Docker to create a universal AppImage of CARTA

1. Open the script `create-appimage.sh` for editing.

2. Modify the `FRONTEND_TAG`, `BACKEND_TAG`, and `NAME` variables. 

Available backend tags can be found here: https://github.com/CARTAvis/carta-backend/releases 
(carta-backend github branch names could also be used).

Available frontend tags can be found here: https://www.npmjs.com/package/carta-frontend?activeTab=explore
(In this version of the Dockerfile, a pre-built production frontend is simply taken from the npm packages, so the carta-frontend github 
branch names can not be used, but the Dockerfile could modified to build the carta-frontend from source and then allow carta-frontend branch names to be used).

Another small modification could be made to use different carta-casacore branches with the addition of another `--build-arg`
and a `git checkout` line in the carta-casacore build stage if needed.

3. Make sure Docker is available and running on your system.

4. Execute the script `./create-appimage.sh`. 
Docker will build the container, run the container to copy out the AppImage, and then stop the container.

5. The end result should be a universal AppImage in this folder that should be able to run on any x86_64 based Liunx system.

(It has currently been tested on CentOS7, Ubuntu 20.04, Ubuntu 18.04, Fedora 32, Debian 10, AlmaLinux)

###Notes:

To run an AppImage inside a Docker container: `APPIMAGE_EXTRACT_AND_RUN=1 ./CARTA-x86_64.AppImage`
