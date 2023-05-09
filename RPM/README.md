## RPM spec files for CARTA

We host our CARTA RPMS on [Fedora Copr](https://copr.fedorainfracloud.org/). Copr (Cool Other Package Repo) is a convenient service to build and host third-party RPM package repositories, similar to [Ubuntu's Launchpad PPAs](https://launchpad.net/ubuntu/+ppas). Although it is provided by Fedora, we can build packages only for EPEL7, EPEL8, and EPEL9 (Extra Packages for Enterprise Linux).

Most of our RPM SPEC files can be built interchangeably on `el7, el8`,`el9`, and `x86_64` and `aarch64`.
| Package name | Version | Platform | Copr build status |
|--------------|---------|----------|-------------------|
| carta | 3.0.1 | el7 / el8 / el9| [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta/) |
| carta-backend | 3.0.1 | el7 / el8 / el9| [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-backend/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-backend/) |
| carta-frontend | 3.0.0 | el7 / el8 / el9| [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-frontend/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-frontend/) |
| | | |
| carta-casacore| 3.4.0+6.5.0+2022.5.11 | el7 / el8 / el9| [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-casacore/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-casacore/) | 
| measures-data | 2022.8.21-1 | el7 / el8 / el9| [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/measures-data/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/measures-data/) |
| fits2idia | 0.5.5 | el7 / el8 / el9| [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/fits2idia/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/fits2idia/) |
| | | |
| carta-cfitsio | 3.47 | el7 | [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-cfitsio/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-cfitsio/) |
| carta-gsl | 2.5 | el7 | [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-gsl/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-gsl/) |
| protobuf | 3.6.0 | el7 | [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/protobuf/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/protobuf/) |
| gtest | 1.10 | el7 / el8 | [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/gtest/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/gtest/) |
| | | |
| carta-beta | 4.0.0 | el7 / el8 / el9| [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-beta/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-beta/) |
| carta-backend-beta | 4.0.0 | el7 / el8 / el9| [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-backend-beta/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-backend-beta/) |
| carta-frontend-beta | 4.0.0 | el7 / el8 / el9| [![Copr build status](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-frontend-beta/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/cartavis/carta/package/carta-frontend-beta/) |

The **carta**, **carta-backend**, and **carta-frontend** packages are updated regularly for each mainline CARTA release.
The **carta-beta**, **carta-backend-beta**, and **carta-frontend-beta** packages are experimental and may be updated for each CARTA 'beta' release (The beta release installs independently to /opt/carta-beta and can be run with `carta-beta`).
The **carta-casacore**, **measures-data**, and **fits2idia** packages are updated occasionally.
The other packages do not require updates.

 **Note**: Copr does not support el7 aarch64

## Installation:

Copr and the `cartavis/carta` repo can be added via yum/dnf. The epel repo is also required.

### CentOS 7 / RedHat 7 (el7, x86_64)
```
yum -y install yum-plugin-copr
yum -y copr enable cartavis/carta
yum -y install epel-release
yum -y install carta
```
### AlmaLinux 8 / AlmaLinux 9 / RedHat 8 / RedHat 9 (el8, el9, x86_64 + aarch64)
```
dnf -y install 'dnf-command(copr)'
dnf -y copr enable cartavis/carta
dnf -y install epel-release
dnf -y install carta
```

Alternatively, a repository file can be written to `/etc/yum/repos.d/carta.repo`, for example, containing the following:
```
[copr:copr.fedorainfracloud.org:cartavis:carta]
name=Copr repo for carta owned by cartavis
baseurl=https://download.copr.fedorainfracloud.org/results/cartavis/carta/epel-$releasever-$basearch/
type=rpm-md
skip_if_unavailable=True
gpgcheck=1
gpgkey=https://download.copr.fedorainfracloud.org/results/cartavis/carta/pubkey.gpg
repo_gpgcheck=0
enabled=1
enabled_metadata=1
```

## Additional RPMS:

Our Copr `carta/cartvis` repo holds some additional custom RPMs:

-  **carta-cfitsio-3.47** - el7-only
	- This is needed only if building the carta-backend with unit-tests because the default el7 cfitsio-3.37 is too old. It installs to the custom location `/opt/carta-cfitsio` so as not to interfere with the default cfitsio.
- **carta-gsl-2.5** - el7-only
	- This is needed to build the carta-backend because the default el7 gsl-1.15 is too old. It installs to the custom location `/opt/carta-gsl` so as not to interfere with the default gsl.
- **gtest-1.10** - el7 and el8
	- This is needed only if building the carta-backend with unit-tests because the default el7 gtest-1.6 and default el8 gtest-1.8 are too old.
- **libaec 1.0.4** - el8-x86_64-only
	- This saves the need to add the 'powertools' repo for el8 x86_64 only as we were trying to unify the installation instructions.
- **protobuf-3.6** - el7-only
	- This is needed to build the carta-backend because the default el7 protobuf-2.5 is too old.
- **wcslib-7.2** - el9-only
	- This is needed to build the carta-backend on el9 because wcslib is not currently available in the el9 epel repository. It is a rebuild of the el8 version.
- **zfp-0.5.5** - el9-only
	- This is needed to build the carta-backend on el9 because zfp is not currently available in the el9 epel repository. It is a rebuild of the el8 version.
