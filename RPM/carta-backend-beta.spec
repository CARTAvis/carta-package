#
# This experimental version will install the beta carta-backend to /opt/carta-backend-beta
# so that the beta and normal release versions can be kept on the same system.
# It also creates a new startup script at /usr/bin/carta-beta that points
# to the executable at /opt/carta-backend-beta/bin/carta_backend.
#
%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build
%define my_prefix  %{_prefix}
%define debug_package %{nil}
%define datadirbeta /opt/carta-backend-beta/share

Name:           carta-backend-beta
Version:        4.0+2023.5.4
Release:        1
Summary:        CARTA - Cube Analysis and Rendering Tool for Astronomy
License:        GPL-3.0-only
URL:            https://github.com/CARTAvis/carta-backend
Source0:        %{name}-%{version}.tgz

BuildArch: %{_arch}

BuildRequires: blas-devel
BuildRequires: carta-casacore-devel
%if 0%{?suse_version} >= 1500
BuildRequires: cmake
%else
BuildRequires: cmake3
%endif
BuildRequires: cfitsio-devel
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
BuildRequires: zfp-devel >= 0.5.5

# Only el7 requires carta-gsl-devel and newer devtoolset
%if 0%{?rhel} == 7
BuildRequires: carta-gsl-devel
BuildRequires: devtoolset-8-gcc-c++
%else
BuildRequires: gsl-devel
%endif

# Only el7/rhel7 requires carta-gsl
%{?rhel7:Requires: carta-gsl}

Requires: blas
Requires: cfitsio
Requires: carta-casacore
Requires: hdf5
Requires: libaec
Requires: wcslib
Requires: zfp

%description
CARTA is a next generation image visualization and analysis tool designed for ALMA, VLA, and SKA pathfinders.
.
This package provides the release version of the backend component.

%define _bin /bin

%prep
%setup -q

%build
mkdir build
cd build

# Only el7/rhel7 requires carta-gsl and devtoolset
%if 0%{?rhel} == 7
. /opt/rh/devtoolset-8/enable
cmake3 ..  -DCMAKE_CXX_FLAGS="-I/usr/include/cfitsio" -DCMAKE_INSTALL_PREFIX=/opt/carta-backend-beta -DCMAKE_BUILD_TYPE=Release -DCartaUserFolderPrefix=".carta-beta" \
           -DGSL_CONFIG=/opt/carta-gsl/bin/gsl-config \
           -DCMAKE_CXX_FLAGS="-I/opt/carta-gsl/include" \
           -DGSL_INCLUDE_DIR=/opt/carta-gsl/include \
           -DGSL_LIBRARY=/opt/carta-gsl/lib \
           -DGSL_CBLAS_LIBRARY=/opt/carta-gsl/lib \
           -DGSL_CONFIG=/opt/carta-gsl/bin/gsl-config \
           -DCMAKE_CXX_FLAGS="-I/opt/carta-gsl/include" \
           -DCMAKE_CXX_STANDARD_LIBRARIES="-L/opt/carta-gsl/lib"
%endif


%if 0%{?rhel} == 8 || 0%{?rhel} == 9
cmake3 ..  -DCMAKE_CXX_FLAGS="-I/usr/include/cfitsio" -DCMAKE_INSTALL_PREFIX=/opt/carta-backend-beta -DCMAKE_BUILD_TYPE=Release -DCartaUserFolderPrefix=".carta-beta"
%endif

%if 0%{?suse_version} >= 1500
export CC=gcc-9 CXX=g++-9 FC=gfortran-9
cmake ..  -DCMAKE_CXX_FLAGS="-I/usr/include/cfitsio" -DCMAKE_INSTALL_PREFIX=/opt/carta-backend-beta -DCMAKE_BUILD_TYPE=Release -DCartaUserFolderPrefix=".carta-beta"
%endif

make
%install
rm -rf %{buildroot}
cd build
%make_install

cd ..

mkdir -p %{buildroot}%{datadirbeta}/applications
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/16x16/apps
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/22x22/apps
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/24x24/apps
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/32x32/apps
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/48x48/apps
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/64x64/apps
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/128x128/apps
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/256x256/apps
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/512x512/apps
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/scalable/apps
mkdir -p %{buildroot}%{datadirbeta}/icons/hicolor/symbolic/apps

cp static/carta.desktop %{buildroot}%{datadirbeta}/applications
cp static/icons/16x16/cartaviewer.png %{buildroot}%{datadirbeta}/icons/hicolor/16x16/apps
cp static/icons/22x22/cartaviewer.png %{buildroot}%{datadirbeta}/icons/hicolor/22x22/apps
cp static/icons/24x24/cartaviewer.png %{buildroot}%{datadirbeta}/icons/hicolor/24x24/apps
cp static/icons/32x32/cartaviewer.png %{buildroot}%{datadirbeta}/icons/hicolor/32x32/apps
cp static/icons/48x48/cartaviewer.png %{buildroot}%{datadirbeta}/icons/hicolor/48x48/apps
cp static/icons/64x64/cartaviewer.png %{buildroot}%{datadirbeta}/icons/hicolor/64x64/apps
cp static/icons/128x128/cartaviewer.png %{buildroot}%{datadirbeta}/icons/hicolor/128x128/apps
cp static/icons/256x256/cartaviewer.png %{buildroot}%{datadirbeta}/icons/hicolor/256x256/apps
cp static/icons/512x512/cartaviewer.png %{buildroot}%{datadirbeta}/icons/hicolor/512x512/apps
cp static/icons/scalable/cartaviewer.svg %{buildroot}%{datadirbeta}/icons/hicolor/scalable/apps
cp static/icons/symbolic/cartaviewer.svg %{buildroot}%{datadirbeta}/icons/hicolor/symbolic/apps

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

/opt/carta-backend-beta/bin/carta_backend "$@"
EOF
chmod +x %{buildroot}%{_bindir}/carta-beta


%clean
rm -rf $RPM_BUILD_ROOT

%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

%files
/opt/carta-backend-beta/bin/carta_backend
/opt/carta-backend-beta/bin/carta
/opt/carta-backend-beta/share/carta/default.fits
%{_bindir}/carta-beta

%{datadirbeta}/applications/carta.desktop
%{datadirbeta}/icons/hicolor/16x16/apps/cartaviewer.png
%{datadirbeta}/icons/hicolor/22x22/apps/cartaviewer.png
%{datadirbeta}/icons/hicolor/24x24/apps/cartaviewer.png
%{datadirbeta}/icons/hicolor/32x32/apps/cartaviewer.png
%{datadirbeta}/icons/hicolor/48x48/apps/cartaviewer.png
%{datadirbeta}/icons/hicolor/64x64/apps/cartaviewer.png
%{datadirbeta}/icons/hicolor/128x128/apps/cartaviewer.png
%{datadirbeta}/icons/hicolor/256x256/apps/cartaviewer.png
%{datadirbeta}/icons/hicolor/512x512/apps/cartaviewer.png
%{datadirbeta}/icons/hicolor/scalable/apps/cartaviewer.svg
%{datadirbeta}/icons/hicolor/symbolic/apps/cartaviewer.svg

# Bug found in the carta-backend relating to the pugixml third-party library creating uneeded files.
# It should be addressed in the next release.
%exclude /opt/carta-backend-beta/include/pugiconfig.hpp
%exclude /opt/carta-backend-beta/include/pugixml.hpp
%exclude /opt/carta-backend-beta/lib64/cmake/pugixml/pugixml-config-version.cmake
%exclude /opt/carta-backend-beta/lib64/cmake/pugixml/pugixml-config.cmake
%exclude /opt/carta-backend-beta/lib64/cmake/pugixml/pugixml-targets-release.cmake
%exclude /opt/carta-backend-beta/lib64/cmake/pugixml/pugixml-targets.cmake
%exclude /opt/carta-backend-beta/lib64/libpugixml.a
%exclude /opt/carta-backend-beta/lib64/pkgconfig/pugixml.pc

%changelog
* Thu May 4 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0+2023.5.4
  - Custom carta-backend-beta component for the CARTA 4.0-beta.1 release

