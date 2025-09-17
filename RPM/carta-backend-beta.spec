#
# This experimental version will install the beta carta-backend to /opt/carta-backend-beta
# so that the beta and normal release versions can be kept on the same system.
# It also creates a new startup script at /usr/bin/carta-beta that points
# to the executable at /opt/carta-backend-beta/bin/carta_backend.
#
%global _enable_debug_packages 1
%global debug_package %{?_debuginfo_subpackages:%{_debuginfo_subpackages}}%{!?_debuginfo_subpackages:%{nil}}
%global optflags %{optflags} -g

%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build
%define my_prefix  %{_prefix}
%define datadirbeta /opt/carta-backend-beta/share
%define beta_install_path /opt/carta-beta

Name:           carta-backend-beta
Version:        5.0+2025.7.31
Release:        1
Summary:        CARTA - Cube Analysis and Rendering Tool for Astronomy
License:        GPL-3.0-only
URL:            https://github.com/CARTAvis/carta-backend

BuildArch: %{_arch}

BuildRequires: git
BuildRequires: blas-devel
BuildRequires: carta-casacore-nocurl-devel
%if 0%{?suse_version} >= 1500
BuildRequires: cmake
%else
BuildRequires: cmake3
%endif
BuildRequires:  carta-cfitsio-v450-curl-devel
%if 0%{?suse_version} >= 1500
BuildRequires:  gcc9-c++
BuildRequires:  gcc9-fortran
%else
BuildRequires:  gcc-c++
%endif
BuildRequires: hdf5-devel
BuildRequires: libuuid-devel
BuildRequires: libzstd-devel
BuildRequires: protobuf-devel
BuildRequires: wcslib-devel
BuildRequires: zfp-devel >= 1.0.1
BuildRequires: gsl-devel

Requires: blas
Requires: carta-casacore-nocurl
Requires: carta-cfitsio-v450-curl
Requires: hdf5
%if 0%{?suse_version} >= 1500
Requires: libaec0
Requires: libwcs7
%else
Requires: libaec
Requires: wcslib
%endif
Requires: zfp

%define NVdir %{name}-%{version}

%description
CARTA is a next generation image visualization and analysis tool designed for ALMA, VLA, and SKA pathfinders.
.
This package provides the release version of the backend component.

%define _bin /bin

%prep
rm -rf %{NVdir}
git clone %{url}.git %{NVdir}
cd %{NVdir}
git checkout v5.0.3
git submodule update --init

%build
cd %{NVdir}
mkdir build
cd build

cmake3 ..  -DCMAKE_CXX_FLAGS="-I/opt/cfitsio/include" -DCMAKE_CXX_STANDARD_LIBRARIES="-L/opt/cfitsio/lib64" -DCMAKE_PREFIX_PATH=/opt/cfitsio -DCMAKE_INSTALL_PREFIX=%{beta_install_path} -DCMAKE_BUILD_TYPE=RelWithDebInfo -DCartaUserFolderPrefix=".carta-beta"


%if 0%{?suse_version} >= 1500
export CC=gcc-9 CXX=g++-9 FC=gfortran-9
cmake ..  -DCMAKE_CXX_FLAGS="-I/opt/cfitsio/include" -DCMAKE_CXX_STANDARD_LIBRARIES="-L/opt/cfitsio/lib64" -DCMAKE_PREFIX_PATH=/opt/cfitsio -DCMAKE_INSTALL_PREFIX=%{beta_install_path} -DCMAKE_BUILD_TYPE=RelWithDebInfo -DCartaUserFolderPrefix=".carta-beta"
%endif

make -j 2
%install
rm -rf %{buildroot}
cd %{NVdir}/build
%make_install

cd ..

mkdir -p %{buildroot}%{beta_install_path}/share/applications
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/16x16/apps
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/22x22/apps
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/24x24/apps
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/32x32/apps
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/48x48/apps
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/64x64/apps
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/128x128/apps
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/256x256/apps
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/512x512/apps
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/scalable/apps
mkdir -p %{buildroot}%{beta_install_path}/share/icons/hicolor/symbolic/apps

cp static/carta.desktop %{buildroot}%{beta_install_path}/share/applications
cp static/icons/16x16/cartaviewer.png %{buildroot}%{beta_install_path}/share/icons/hicolor/16x16/apps
cp static/icons/22x22/cartaviewer.png %{buildroot}%{beta_install_path}/share/icons/hicolor/22x22/apps
cp static/icons/24x24/cartaviewer.png %{buildroot}%{beta_install_path}/share/icons/hicolor/24x24/apps
cp static/icons/32x32/cartaviewer.png %{buildroot}%{beta_install_path}/share/icons/hicolor/32x32/apps
cp static/icons/48x48/cartaviewer.png %{buildroot}%{beta_install_path}/share/icons/hicolor/48x48/apps
cp static/icons/64x64/cartaviewer.png %{buildroot}%{beta_install_path}/share/icons/hicolor/64x64/apps
cp static/icons/128x128/cartaviewer.png %{buildroot}%{beta_install_path}/share/icons/hicolor/128x128/apps
cp static/icons/256x256/cartaviewer.png %{buildroot}%{beta_install_path}/share/icons/hicolor/256x256/apps
cp static/icons/512x512/cartaviewer.png %{buildroot}%{beta_install_path}/share/icons/hicolor/512x512/apps
cp static/icons/scalable/cartaviewer.svg %{buildroot}%{beta_install_path}/share/icons/hicolor/scalable/apps
cp static/icons/symbolic/cartaviewer.svg %{buildroot}%{beta_install_path}/share/icons/hicolor/symbolic/apps

mkdir -p %{buildroot}%{_bindir}
cat > %{buildroot}%{_bindir}/carta-beta << 'EOF'
#!/bin/bash

if [ "$(uname)" == "Darwin" ]; then
    FIRST_IP=$(ipconfig getifaddr en0)
elif [ "$(uname)" == "Linux" ]; then
    FIRST_IP=$(hostname -I | cut -d' ' -f1)
fi

# Only export env variable if it's not empty
if [ ! -z $FIRST_IP ]; then
    export SERVER_IP=$FIRST_IP
fi

if [ -x "$(command -v casa_data_autoupdate)" ]; then
    casa_data_autoupdate
fi

/opt/carta-beta/bin/carta_backend "$@"
EOF
chmod +x %{buildroot}%{_bindir}/carta-beta

%clean
rm -rf $RPM_BUILD_ROOT

%post
echo "/opt/cfitsio/lib64" > /etc/ld.so.conf.d/cfitsio.conf
/sbin/ldconfig

%postun
/sbin/ldconfig
if [ $1 -eq 0 ]; then
    rm -f /etc/ld.so.conf.d/cfitsio.conf
    /sbin/ldconfig
fi

%files
%{beta_install_path}/bin/carta_backend
%{beta_install_path}/bin/carta
%{beta_install_path}/share/carta/default.fits
%{_bindir}/carta-beta

%{beta_install_path}/share/applications/carta.desktop
%{beta_install_path}/share/icons/hicolor/16x16/apps/cartaviewer.png
%{beta_install_path}/share/icons/hicolor/22x22/apps/cartaviewer.png
%{beta_install_path}/share/icons/hicolor/24x24/apps/cartaviewer.png
%{beta_install_path}/share/icons/hicolor/32x32/apps/cartaviewer.png
%{beta_install_path}/share/icons/hicolor/48x48/apps/cartaviewer.png
%{beta_install_path}/share/icons/hicolor/64x64/apps/cartaviewer.png
%{beta_install_path}/share/icons/hicolor/128x128/apps/cartaviewer.png
%{beta_install_path}/share/icons/hicolor/256x256/apps/cartaviewer.png
%{beta_install_path}/share/icons/hicolor/512x512/apps/cartaviewer.png
%{beta_install_path}/share/icons/hicolor/scalable/apps/cartaviewer.svg
%{beta_install_path}/share/icons/hicolor/symbolic/apps/cartaviewer.svg

# Bug found in the carta-backend relating to the pugixml third-party library creating uneeded files.
# It should be addressed in the next release.
%exclude %{beta_install_path}/include/pugiconfig.hpp
%exclude %{beta_install_path}/include/pugixml.hpp
%exclude %{beta_install_path}/lib64/cmake/pugixml/pugixml-config-version.cmake
%exclude %{beta_install_path}/lib64/cmake/pugixml/pugixml-config.cmake
%exclude %{beta_install_path}/lib64/cmake/pugixml/pugixml-targets-release.cmake
%exclude %{beta_install_path}/lib64/cmake/pugixml/pugixml-targets.cmake
%exclude %{beta_install_path}/lib64/libpugixml.a
%exclude %{beta_install_path}/lib64/pkgconfig/pugixml.pc

%changelog
* Thu Jul 31 2025 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 5.0+2025.7.31
  - carta-backend v5.0.3 for CARTA 5.0-beta.2025.7.31 release

* Tue Jul 22 2025 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 5.0+2025.7.22
  - carta-backend v5.0.1 for CARTA 5.0-beta.2025.7.22 release

* Thu Jun 12 2025 Kuan-Chou Hou <kchou@asiaa.sinica.edu.tw> 5.0+2025.2.14
  - Remove rhel7 specific requirements and upgrade zfp to 1.0.1

* Fri Feb 14 2025 Cheng-Chin Chiang <chcchiang@asiaa.sinica.edu.tw> 5.0+2025.2.14
  - carta-backend component for the CARTA 5.0-beta.1 release

* Wed Jul 26 2023 William Davey <wdavey@pawsey.org.au> 4.0+2023.5.4-2
  - Pulls source directly from scm

* Thu May 4 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0+2023.5.4
  - Custom carta-backend-beta component for the CARTA 4.0-beta.1 release
