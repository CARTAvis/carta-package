## fits2idia AppImage creator

Run `create-fits2idia-appimage.sh` on a computer that has [Docker](https://www.docker.com) to automatically create a universal Linux [fits2idia](https://github.com/CARTAvis/fits2idia) [AppImage](https://appimage.org/) that can run on RHEL7 and newer, plus Ubuntu 18.04 and newer.

Customise the `RELEASE_TAG` in `create-fits2idia-appimage.sh` in order to build different versions of fits2idia.

The script will build an `x86_64` version if run on an `x86_64` computer (or Intel Mac), and an `aarch64` version if run on an `aarch64` computer (or M1 Mac).

### Additional note:

- We are currently using the Continuous build from [probonopd/go-appimage](https://github.com/probonopd/go-appimage) as that is the only version of
Appimagetool that supports running on Ubuntu 22.04 without the need to install the older libfuse-2. The Continuous build regularly changes the version
number, so you many need to adjust the URL/filename in the Dockerfile before running the script e.g. 715, 718, 722 etc.

