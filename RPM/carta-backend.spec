%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build
%define my_prefix  %{_prefix}
%define debug_package %{nil}

Name:           carta-backend
Version:        3.0.0
Release:        1%{?dist}
Summary:        CARTA - Cube Analysis and Rendering Tool for Astronomy
License:        GPL-3.0-only
URL:            https://github.com/CARTAvis/carta-backend
Source0:        %{name}-%{version}.tgz

BuildArch: %{_arch}

BuildRequires: blas-devel
BuildRequires: carta-casacore-devel
BuildRequires: cmake
BuildRequires: cfitsio-devel
BuildRequires: hdf5-devel
BuildRequires: protobuf-devel
BuildRequires: wcslib-devel
BuildRequires: zfp-devel >= 0.5.5

# Only el7 requires carta-gsl-devel
%{?el7:BuildRequires: carta-gsl-devel}

Requires: blas
Requires: carta-casacore

# Only el7 requires carta-gsl
%{?el7:Requires: carta-gsl}

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

%{?el8:cmake3 ..  -DCMAKE_CXX_FLAGS="-I/usr/include/cfitsio" -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_BUILD_TYPE=Release}

# Only el7 requires carta-gsl
#%{?el7:export LD_LIBRARY_PATH=/opt/carta-gsl/lib:$LD_LIBRARY_PATH}
%{?el7:cmake3 ..  -DCMAKE_CXX_FLAGS="-I/usr/include/cfitsio -I/opt/carta-gsl/include" \
                  -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_BUILD_TYPE=Release \
                  -DGSL_INCLUDE_DIR=/opt/carta-gsl/include \
                  -DGSL_LIBRARY=/opt/carta-gsl/lib \
                  -DGSL_CBLAS_LIBRARY=/opt/carta-gsl/lib \
                  -DCMAKE_CXX_FLAGS="-I/opt/carta-gsl/include" \
                  -DCMAKE_CXX_STANDARD_LIBRARIES="-L/opt/carta-gsl/lib"}
make

%install
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
* Thu Aug 18 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.0
- carta-backend component for the CARTA 3.0 release
