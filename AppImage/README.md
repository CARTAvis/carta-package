## Use Docker to create a universal AppImage for CARTA

### Basic usage:

Execute the `./create-appimage.sh` script. It will create **carta-beta-x86_64.AppImage**.

### Advanced usage:

1. Open the script `create-appimage.sh` for editing.

2. Modify the `BACKEND_TAG`, `FRONTEND_TAG`, and `NAME` variables. 

 Available backend tags can be found here: https://github.com/CARTAvis/carta-backend/releases 
 (carta-backend Github branch names could also be used).

 Available frontend tags can be found here: https://www.npmjs.com/package/carta-frontend?activeTab=explore
 (In this version of the Dockerfile, a pre-built production frontend is simply taken from the npm packages, so the carta-frontend Github 
 branch names can not be used. But it could if the carta-frontend were to be built from source in the Dockerfile. This could be easily added in the 
 next update).

 Another update could be made to use different carta-casacore branches with the addition of another `--build-arg`and a `git checkout` 
 line in the carta-casacore build stage if needed.

 The `NAME` variable allows you to provide a custom name to the resulting AppImage `<NAME>-x86_64.AppImage`

3. Make sure Docker is available and running on your system.

4. Execute the script `./create-appimage.sh`. 

 Docker will build the container, run the container to copy out the AppImage, and then stop the container.

5. The end result is a universal AppImage in this folder that should be able to run on any x86_64 based Linux system that uses GLIBC greater than 2.14. That should be all current and future Linux versions.

(Tested on CentOS7, Ubuntu 20.04, Ubuntu 18.04, Fedora 32, Debian 10, AlmaLinux) 

### Notes:

To run an AppImage inside a Docker container (or a system without FUSE enabled): `APPIMAGE_EXTRACT_AND_RUN=1 ./CARTA-x86_64.AppImage`
(Tested in bare centos:7/8, ubuntu:16.04/18.04/20.04, fedora, debian, opensuse/leap, and almalinux/almalinux Docker containers)
