%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build
%define my_prefix  %{_prefix}
%define debug_package %{nil}

Name:           carta-backend
Version:        3.0.1
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
BuildRequires: pugixml-devel
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
%if 0%{?suse_version} >= 1500
Requires: libaec0
Requires: libpugixml1
Requires: libwcs7
%else
Requires: libaec
Requires: pugixml
Requires: wcslib
%endif
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
cmake3 ..  -DCMAKE_CXX_FLAGS="-I/usr/include/cfitsio" -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_BUILD_TYPE=Release -DCartaUserFolderPrefix=".carta" \
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
cmake3 ..  -DCMAKE_CXX_FLAGS="-I/usr/include/cfitsio" -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_BUILD_TYPE=Release -DCartaUserFolderPrefix=".carta"
%endif

%if 0%{?suse_version} >= 1500
export CC=gcc-9 CXX=g++-9 FC=gfortran-9 
cmake ..  -DCMAKE_CXX_FLAGS="-I/usr/include/cfitsio" -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_BUILD_TYPE=Release -DCartaUserFolderPrefix=".carta"
%endif

make
%install
rm -rf %{buildroot}
cd build
%make_install

cd ..

mkdir -p %{buildroot}%{_datadir}/applications
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/16x16/apps
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/22x22/apps
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/24x24/apps
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/32x32/apps
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/48x48/apps
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/64x64/apps
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/128x128/apps
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/256x256/apps
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/512x512/apps
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/scalable/apps
mkdir -p %{buildroot}%{_datadir}/icons/hicolor/symbolic/apps

cp static/carta.desktop %{buildroot}%{_datadir}/applications
cp static/icons/16x16/cartaviewer.png %{buildroot}%{_datadir}/icons/hicolor/16x16/apps
cp static/icons/22x22/cartaviewer.png %{buildroot}%{_datadir}/icons/hicolor/22x22/apps
cp static/icons/24x24/cartaviewer.png %{buildroot}%{_datadir}/icons/hicolor/24x24/apps
cp static/icons/32x32/cartaviewer.png %{buildroot}%{_datadir}/icons/hicolor/32x32/apps
cp static/icons/48x48/cartaviewer.png %{buildroot}%{_datadir}/icons/hicolor/48x48/apps
cp static/icons/64x64/cartaviewer.png %{buildroot}%{_datadir}/icons/hicolor/64x64/apps
cp static/icons/128x128/cartaviewer.png %{buildroot}%{_datadir}/icons/hicolor/128x128/apps
cp static/icons/256x256/cartaviewer.png %{buildroot}%{_datadir}/icons/hicolor/256x256/apps
cp static/icons/512x512/cartaviewer.png %{buildroot}%{_datadir}/icons/hicolor/512x512/apps
cp static/icons/scalable/cartaviewer.svg %{buildroot}%{_datadir}/icons/hicolor/scalable/apps
cp static/icons/symbolic/cartaviewer.svg %{buildroot}%{_datadir}/icons/hicolor/symbolic/apps

%clean
rm -rf $RPM_BUILD_ROOT

%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

%files
%{_bindir}/carta_backend
%{_bindir}/carta
%{_datadir}/carta/default.fits

%{_datadir}/applications/carta.desktop
%{_datadir}/icons/hicolor/16x16/apps/cartaviewer.png
%{_datadir}/icons/hicolor/22x22/apps/cartaviewer.png
%{_datadir}/icons/hicolor/24x24/apps/cartaviewer.png
%{_datadir}/icons/hicolor/32x32/apps/cartaviewer.png
%{_datadir}/icons/hicolor/48x48/apps/cartaviewer.png
%{_datadir}/icons/hicolor/64x64/apps/cartaviewer.png
%{_datadir}/icons/hicolor/128x128/apps/cartaviewer.png
%{_datadir}/icons/hicolor/256x256/apps/cartaviewer.png
%{_datadir}/icons/hicolor/512x512/apps/cartaviewer.png
%{_datadir}/icons/hicolor/scalable/apps/cartaviewer.svg
%{_datadir}/icons/hicolor/symbolic/apps/cartaviewer.svg

%changelog
* Tue Mar 7 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.1-1
  - Backported security fix

* Tue Feb 7 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.0-2
  - Rebuilt for opensuse 15.4

* Thu Aug 18 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.0
- carta-backend component for the CARTA 3.0 release
